import mido, glob, collections, sys
NAME={36:'K',38:'S',42:'H'}
def load(f):
    m=mido.MidiFile(f); t=0; out=[]
    for msg in m.tracks[0]:
        t+=msg.time
        if msg.type=='note_on' and msg.velocity>0: out.append((t,msg.note,msg.velocity))
    return m.ticks_per_beat, t, out
for f in sorted(glob.glob('*.mid')):
    tpb,end,notes=load(f)
    bars=round(end/(tpb*4))
    print(f"== {f} end={end} bars~{end/(tpb*4):.2f} notes={len(notes)}")
    # residue analysis vs 16th grid(24) 32nd(12) triplet16(16)
    for p in (36,38,42):
        ns=[n for n in notes if n[1]==p]
        steps=bars*16
        line=['.']*steps
        offs=[]
        for t,_,v in ns:
            s=round(t/24); r=t-s*24
            if s>=steps: continue
            if abs(r)<=3: ch='x' if v>=60 else ('g' if v>=15 else '_')
            else:
                # 32nd or triplet?
                ch='r' if abs(t-round(t/12)*12)<=2 else ('t' if abs(t-round(t/16)*16)<=2 else '?')
                offs.append((t,r,v))
            if line[s] in 'rt?' : pass
            elif line[s]=='.' or ch in 'rt?': line[s]=ch
        txt='|'.join(''.join(line[i:i+16]) for i in range(0,steps,16))
        print(f"  {NAME[p]} {txt}" + (f"   off:{offs[:6]}" if offs else ''))
