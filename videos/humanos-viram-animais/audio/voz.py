import sys, numpy as np, soundfile as sf, pyworld as pw, scipy.signal as ss
y,sr=sf.read(sys.argv[1]); y=y.astype(np.float64); semi=float(sys.argv[3])
f0,t=pw.harvest(y,sr,f0_floor=60,f0_ceil=300); sp=pw.cheaptrick(y,f0,t,sr); ap=pw.d4c(y,f0,t,sr)
# leve abaixamento de formantes (timbre mais encorpado)
fq=np.linspace(0,1,sp.shape[1]); w=0.97
sp=np.array([np.interp(fq*w,fq,r) for r in sp])
z=pw.synthesize(f0*2**(semi/12),sp,ap,sr)
# EQ casando com a do Will (suavizada, limitada a +-6 dB, agudos no máx +2)
fr,d=np.load("diff.npy").T
d=np.convolve(d,np.ones(25)/25,"same"); d=np.clip(d,-6,6); d[fr>7000]=np.minimum(d[fr>7000],2)
g=10**(d/20); h=np.fft.irfft(g); h=np.roll(h,len(h)//2)*np.hanning(len(h))
z=ss.fftconvolve(z,h,"same"); sf.write(sys.argv[2],z/np.abs(z).max()*0.9,sr)
