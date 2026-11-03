import numpy as np, wave, os, sys
root = sys.argv[1]
SR=44100
def w(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    x = np.clip(x,-1,1); d=(x*32767).astype('<i2')
    with wave.open(path,'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(d.tobytes())
t=lambda d: np.arange(int(d*SR))/SR
def kick(): tt=t(.4); return np.sin(2*np.pi*(50*tt+80*(1-np.exp(-tt*30))/30))*np.exp(-tt*8)
def noise(d,dec): tt=t(d); return np.random.randn(len(tt))*np.exp(-tt*dec)*.5
def tone(f,d): tt=t(d); return np.sin(2*np.pi*f*tt)*np.exp(-tt*1.5)*.8
def loop(bpm,bars=4): d=bars*4*60/bpm; tt=t(d); return .3*np.sin(2*np.pi*261.6*tt)*(0.5+0.5*np.sin(2*np.pi*tt*bpm/60))
P1=f"{root}/Library/Cartel Trap Kit Vol 1"
for i in range(1,4): w(f"{P1}/Kicks/CTK_Kick_{i:02d}.wav", kick())
for i in range(1,3): w(f"{P1}/Snares/CTK Snare {i}.wav", noise(.2,20))
w(f"{P1}/Claps/CTK_Clap_Hard.wav", noise(.2,25))
for i in range(1,4): w(f"{P1}/Hi Hats/CTK_HH_{i:02d}.wav", noise(.05,90))
w(f"{P1}/Open Hats/CTK_OH_01.wav", noise(.3,10))
w(f"{P1}/808s/CTK_808_Boom (F#).wav", tone(46.2,1.5))
w(f"{P1}/Percs/CTK_Rim_01.wav", noise(.05,60))
w(f"{P1}/FX/CTK_Riser.wav", noise(1,2))
P2=f"{root}/Library/Midnight Melodies"
w(f"{P2}/Midnight_Piano_140bpm_Cmin.wav", loop(140))
w(f"{P2}/Midnight Guitar 70 BPM A Minor.wav", loop(70,2))
w(f"{P2}/Midnight_Keys_90_Ebmaj_Loop.wav", loop(90))
w(f"{P2}/Drum Loops/Midnight_Drum_Loop_140bpm.wav", loop(140))
w(f"{P2}/random_thing.wav", tone(440,.5))
w(f"{P2}/Midnight_Pad_136bpm_Cmin.wav", loop(136))
