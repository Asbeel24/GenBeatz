import json, mido, os, collections
d=json.load(open('clean.json')); P=d['pats']; R={r['file'].replace('.mid',''):r for r in d['reps']}
def group(pid): return 'trapsoul' if pid.startswith('TRAPSOUL') or (R[pid+'']['conv']=='quarter' if pid+'' in R else False) else ('trap' if pid.startswith('TRAP') else 'vintage')
for p in P:
    p['group']= 'trapsoul' if (p['id'].startswith('TRAPSOUL') or p['conv']=='quarter') else ('trap' if p['id'].startswith('TRAP') else 'vintage')
    p['scale']= 0.5 if (p['conv']=='quarter' or p['group']=='vintage') else 1
# families by kick+snare skeleton similarity on 2-bar segments
def segs(p,u=32):
    return [frozenset((i,round(pos-b0,2)) for i in 'ks' for pos,v in p['ev'].get(i,[]) if b0<=pos<b0+u) for b0 in range(0,p['len'],u)]
def jac(a,b): return len(a&b)/max(1,len(a|b))
par={p['id']:p['id'] for p in P}
def f(x):
    while par[x]!=x: x=par[x]
    return x
for i,a in enumerate(P):
    for b in P[i+1:]:
        if a['group']!=b['group']: continue
        if max(jac(x,y) for x in segs(a) for y in segs(b))>=0.85: par[f(a['id'])]=f(b['id'])
fam=collections.defaultdict(list)
for p in P: fam[f(p['id'])].append(p['id'])
names={}
for n,(k,v) in enumerate(sorted(fam.items(), key=lambda kv: sorted(kv[1])[0])):
    for pid in v: names[pid]=chr(65+n)
for p in P: p['family']=names[p['id']]
# write cleaned midi (original grid, detected swing re-applied, 36/38/42)
os.makedirs('out/cleaned',exist_ok=True)
NOTE={'k':36,'s':38,'h':42}
for p in P:
    mf=mido.MidiFile(ticks_per_beat=96); tr=mido.MidiTrack(); mf.tracks.append(tr)
    tr.append(mido.MetaMessage('track_name',name=p['id']+' cleaned')); tr.append(mido.MetaMessage('time_signature',numerator=4,denominator=4))
    evs=[]
    for i,lst in p['ev'].items():
        for pos,v in lst:
            t=pos*24
            if abs(pos-round(pos))<1e-6 and int(round(pos))%2==1: t+= (p['swing']-0.5)*48
            t=int(round(t)); evs.append((t,1,NOTE[i],v)); evs.append((t+12,0,NOTE[i],0))
    evs.sort(key=lambda e:(e[0],e[1]))
    last=0
    for t,on,n,v in evs:
        tr.append(mido.Message('note_on' if on else 'note_off',note=n,velocity=v if on else 0,time=t-last)); last=t
    end=p['len']*24
    tr.append(mido.MetaMessage('end_of_track',time=max(0,end-last)))
    mf.save(f"out/cleaned/{p['id']}.mid")
# app data
app=[{'id':p['id'],'group':p['group'],'family':p['family'],'len':p['len'],'scale':p['scale'],'swing':p['swing'],
      'ev':{i:[[round(pos,3),v] for pos,v in lst] for i,lst in p['ev'].items() if lst}} for p in P]
json.dump(app,open('out/patterns.json','w'),separators=(',',':'))
print(os.path.getsize('out/patterns.json'))
for k,v in sorted(collections.Counter((p['group'],p['family']) for p in P).items()): print(k,v,[p['id'] for p in P if p['family']==k[1]])
json.dump({'P':[{k:p[k] for k in ('id','group','family','len','scale','swing','conv')} for p in P]},open('meta.json','w'))
