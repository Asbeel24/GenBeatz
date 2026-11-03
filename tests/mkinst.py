# fixtures for the Instrument track: chord MIDI files + melodic one-shots inside the fake library
import numpy as np, wave, os, struct, sys
root = sys.argv[1] if len(sys.argv) > 1 else '.'
P = f"{root}/Library/Midnight Melodies"
def vlq(n):
    b = [n & 127]; n >>= 7
    while n: b.insert(0, (n & 127) | 128); n >>= 7
    return bytes(b)
def midi(path, notes, ppq=96, ch=0):
    ev = []
    for p, s, e, v in notes: ev += [(int(s*ppq), 0x90|ch, p, v), (int(e*ppq), 0x80|ch, p, 0)]
    ev.sort(key=lambda x: (x[0], x[1] & 0xf0 == 0x90))
    trk = b''; t = 0
    trk += vlq(0) + b'\xff\x51\x03' + (500000).to_bytes(3, 'big')
    for tk, st, a, b in ev: trk += vlq(tk - t) + bytes([st, a, b]); t = tk
    trk += vlq(0) + b'\xff\x2f\x00'
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f: f.write(b'MThd' + struct.pack('>IHHH', 6, 0, 1, ppq) + b'MTrk' + struct.pack('>I', len(trk)) + trk)
chords = []
for b, ch in enumerate([[60,63,67],[56,60,63],[55,58,63],[58,62,65]]):
    for p in ch: chords.append((p, b*4, b*4+3.9, 90))
midi(f"{P}/MIDI/Dark Chords Cmin.mid", chords)
midi(f"{P}/MIDI/Sunny Keys Fmaj.mid", [(65+i%3*4, i, i+0.9, 80) for i in range(8)])
midi(f"{P}/MIDI/Drum Groove 140.mid", [(36, i, i+0.2, 100) for i in range(8)], ch=9)
SR = 44100
def w(path, f, dur=1.0):
    t = np.arange(int(SR*dur))/SR; x = 0.5*np.sin(2*np.pi*f*t)*np.exp(-t*3)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as o: o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes((x*32767).astype('<i2').tobytes())
w(f"{P}/One Shots/Bell C.wav", 261.63)
w(f"{P}/One Shots/Pluck F#.wav", 369.99)
