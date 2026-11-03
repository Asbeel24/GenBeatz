# extra fixtures for t13 (tempo guess from length) and t14 (load one file from the computer)
import numpy as np, wave, os
def w(p, dur, f=220):
    os.makedirs(os.path.dirname(p) or '.', exist_ok=True)
    x = (np.sin(2*np.pi*f*np.arange(int(44100*dur))/44100)*0.3*32767).astype(np.int16)
    with wave.open(p, 'wb') as o: o.setnchannels(1); o.setsampwidth(2); o.setframerate(44100); o.writeframes(x.tobytes())
w('L2/Lib/Soul Pack/Loops/Untitled Keys Cmin.wav', 8*240/140)
w('L2/Lib/Soul Pack/Loops/Warm Rhodes Am.wav', 4*240/92)
w('L2/Lib/Soul Pack/Kicks/Kick A.wav', 0.4)
w('ext_layer.wav', 8*240/140, 330)
