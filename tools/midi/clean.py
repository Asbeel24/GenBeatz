import mido, glob, json, statistics as st, collections
INST={36:'k',38:'s',42:'h'}
TPB=96; S16=24
def load(f):
    m=mido.MidiFile(f); t=0; out=[]
    assert m.ticks_per_beat==TPB
    for msg in m.tracks[0]:
        t+=msg.time
        if msg.type=='note_on' and msg.velocity>0: out.append([t,msg.note,msg.velocity])
    return t,out
def process(f):
    end,notes=load(f)
    rep={'file':f,'issues':[]}
    bad=[n for n in notes if n[1] not in INST]
    if len(bad)>len(notes)/2: rep['issues'].append('音高不是标准鼓映射（36/38/42），无法识别，已跳过'); rep['skip']=True; return rep,None
    notes=[n for n in notes if n[1] in INST]
    n0=len(notes)
    notes=[n for n in notes if n[2]>=12]
    if n0-len(notes): rep['issues'].append(f'删除 {n0-len(notes)} 个力度极低的误识别音符')
    bars=max(1,round(end/(TPB*4))); 
    if bars not in (2,4,8): bars=4 if bars<6 else 8
    # global alignment: median offset of on-beat (quarter) notes
    offs=[t-round(t/TPB)*TPB for t,_,_ in notes if abs(t-round(t/TPB)*TPB)<=8]
    shift=round(st.median(offs)) if offs else 0
    if abs(shift)>=2: rep['issues'].append(f'整体时值偏移 {shift} tick，已对齐')
    notes=[[t-shift,p,v] for t,p,v in notes]
    # swing from odd 16ths
    odd=[]
    for t,p,v in notes:
        s=round(t/S16); r=t-s*S16
        if s%2==1 and -3<=r<=11: odd.append(r)
    # odd offsets measured relative to nearest 16th; if swing large notes may round to next step, handle by measuring relative to straight odd position
    odd2=[]
    for t,p,v in notes:
        e=t%48  # position within 8th
        if 18<=e<=36: odd2.append(e-24)
    sw=st.median(odd2) if len(odd2)>=4 else 0
    sw=max(0,sw)
    swing=round(0.5+sw/48,3)
    ev=collections.defaultdict(list); fixes=0
    for t,p,v in notes:
        ins=INST[p]
        e=t%48; base=t-e
        # straight positions within an 8th: 0 (on), 24+sw (swung odd 16th), 12/36 (32nds), 16/32 (triplets)
        cands=[(0,0.0),(48,2.0),(24+sw,1.0)]
        if ins=='h' or ins=='s': cands+= [(12,0.5),(36+sw/2,1.5),(16,2/3),(32,4/3)]
        best=min(cands,key=lambda c:abs(e-c[0]))
        if abs(e-best[0])>3: fixes+=1
        pos=round(base/S16+best[1],3)
        ev[ins].append([pos,v])
    if fixes: rep['issues'].append(f'修正 {fixes} 个量化偏差较大的音符')
    length=bars*16
    for ins in ev:
        # merge duplicates at same pos (keep max vel), drop beyond length
        d={}
        for pos,v in ev[ins]:
            if pos>=length-1e-6: continue
            d[pos]=max(v,d.get(pos,0))
        ev[ins]=sorted([[p,v] for p,v in d.items()])
    # snare bleed: snare at non-backbeat coinciding with kick, vel<100
    kpos={p for p,_ in ev['k']}
    keep=[];drop=0
    for p,v in ev['s']:
        if p in kpos and (p%16)!=8 and v<100 and (p%16)<12: drop+=1; continue
        keep.append([p,v])
    if drop: rep['issues'].append(f'删除 {drop} 个和 kick 重叠的疑似误识别 snare')
    ev['s']=keep
    # snare convention: halftime if most strong snares at pos%16==8
    strong=[p for p,v in ev['s'] if v>=90] or [p for p,v in ev['s']]
    if strong and sum(1 for p in strong if p%32==16)/len(strong)>0.6 and not any(p%16==8 for p in strong if p%32!=16) :
        conv='quarter'  # snare once every 2 bars -> written at 2x grid
    elif strong and sum(1 for p in strong if p%16==8)/len(strong)>0.5: conv='half'
    elif strong and sum(1 for p in strong if p%8==4)/len(strong)>0.5: conv='normal'
    else: conv='half'
    pat={'id':f.replace('.mid',''),'len':length,'swing':swing,'conv':conv,'ev':{k:v for k,v in ev.items()}}
    rep.update(bars=bars,swing=swing,conv=conv,shift=shift)
    return rep,pat
reps=[];pats=[]
for f in sorted(glob.glob('*.mid')):
    r,p=process(f); reps.append(r)
    if p: pats.append(p)
# reduce to minimal repeating unit and dedupe
def key(p, ins='ks'):
    return {(i,round(pos,2)) for i in ins for pos,v in p['ev'].get(i,[])}
def unit(p):
    L=p['len']
    for u in (16,32):
        if u<L and L%u==0:
            ok=True
            for i in 'ksh':
                a={round(pos%u,2) for pos,v in p['ev'].get(i,[]) if pos<u}
                for b0 in range(u,L,u):
                    b={round(pos-b0,2) for pos,v in p['ev'].get(i,[]) if b0<=pos<b0+u}
                    if a!=b: ok=False
            if ok: return u
    return L
for p in pats:
    u=unit(p)
    if u<p['len']:
        p['ev']={i:[e for e in v if e[0]<u] for i,v in p['ev'].items()}; p['note_unit']=f"{p['len']//16} 小节里完全重复，压缩成 {u//16} 小节"; p['len']=u
def jac(a,b): return len(a&b)/max(1,len(a|b))
def tile(p,L):
    s=set()
    for i in 'ksh':
        for pos,v in p['ev'].get(i,[]):
            for b0 in range(0,L,p['len']): s.add((i,round(pos+b0,2)))
    return s
dups=[]
for i,a in enumerate(pats):
    for b in pats[i+1:]:
        L=max(a['len'],b['len'])
        if L%a['len'] or L%b['len']: continue
        ks=jac({x for x in tile(a,L) if x[0]!='h'},{x for x in tile(b,L) if x[0]!='h'})
        al=jac(tile(a,L),tile(b,L))
        if ks>=0.85 and al>=0.7: dups.append((a['id'],b['id'],round(ks,2),round(al,2)))
json.dump({'reps':reps,'pats':pats,'dups':dups},open('clean.json','w'),ensure_ascii=False,indent=1)
for r in reps: print(r['file'], r.get('bars'), r.get('conv'), r.get('swing'), r['issues'])
print('DUPS'); [print(d) for d in dups]
for p in pats: print(p['id'],p['len'],p.get('note_unit',''))
