import sys, numpy as np, soundfile as sf, pyworld as pw, scipy.signal as ss, librosa
def lf0(y,sr):
    f,t=pw.harvest(y,sr,f0_floor=60,f0_ceil=300); v=f>0; return f,t,np.log(f[v])
w,srw=librosa.load("will.mp3",sr=24000); w=w.astype(np.float64)
_,_,lw=lf0(w,srw)
y,sr=sf.read(sys.argv[1]); y=y.astype(np.float64)
f0,t,la=lf0(y,sr); sp=pw.cheaptrick(y,f0,t,sr); ap=pw.d4c(y,f0,t,sr)
# entonação: mesma média e mesma variação do Will (menos monótono = menos robô)
k=min(lw.std()/la.std(),1.25); v=f0>0
f0[v]=np.exp(lw.mean()+(np.log(f0[v])-la.mean())*k)
f0=ss.medfilt(f0,5)
# timbre mais encorpado + aperiodicidade suavizada (tira o zumbido metálico)
fq=np.linspace(0,1,sp.shape[1]); sp=np.array([np.interp(fq*0.95,fq,r) for r in sp])
ap=ss.uniform_filter1d(ap,15,axis=0) if hasattr(ss,"uniform_filter1d") else np.apply_along_axis(lambda c:np.convolve(c,np.ones(9)/9,"same"),0,ap)
z=pw.synthesize(*(np.ascontiguousarray(a) for a in (f0,sp,ap)),sr)
# EQ idêntica ao Will (curva medida, sem limite)
def L(x):
    S=np.abs(librosa.stft(x,n_fft=2048))**2; e=librosa.feature.rms(y=x)[0]; S=S[:,e>np.percentile(e,40)]
    return 10*np.log10(S.mean(1)+1e-12)
d=L(w)-L(z); d-=d[(np.arange(len(d))>40)&(np.arange(len(d))<300)].mean()
d=np.convolve(d,np.ones(9)/9,"same"); d=np.clip(d,-15,12)
h=np.roll(np.fft.irfft(10**(d/20)),1024)*np.hanning(2048)
z=ss.fftconvolve(z,h,"same"); sf.write(sys.argv[2],z/np.abs(z).max()*0.9,sr)
print("k entonação %.2f"%k)
