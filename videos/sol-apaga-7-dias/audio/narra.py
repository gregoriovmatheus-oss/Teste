import numpy as np, soundfile as sf, json, re, sys
from kokoro_onnx import Kokoro
from ptfix import fon
P=sys.argv[1]; k=Kokoro("kokoro-v1.0.onnx","voices-v1.0.bin")
txt=open(P+"/SCRIPT.md").read().split("\n---\n",1)[1]
fr=[l.strip() for l in txt.splitlines() if l.strip() and not l.startswith("#")]
out=[];t=0.0;pal=[];cen=[];sr=24000
for i,f in enumerate(fr):
    parts=re.split(r"(?<=[.?!…])\s+",f)
    ini=t
    for j,pt in enumerate(parts):
        s,sr=k.create(fon(pt),voice="pm_alex",speed=float(sys.argv[2]) if len(sys.argv)>2 else 1.3,is_phonemes=True)
        # apara silêncio das pontas
        a=np.abs(s); nz=np.where(a>0.01)[0]; s=s[max(0,nz[0]-240):nz[-1]+480]
        d=len(s)/sr; ws=pt.split(); pesos=np.array([len(re.sub(r"\W","",w))+1.5 for w in ws]); cs=np.concatenate([[0],np.cumsum(pesos)])/pesos.sum()
        for n,w in enumerate(ws): pal.append({"id":f"w{len(pal)}","text":w,"start":round(t+cs[n]*d,3),"end":round(t+cs[n+1]*d,3)})
        pausa=0.35 if j==len(parts)-1 else 0.22
        if i==len(fr)-1 and j==len(parts)-1: pausa=1.5
        out+=[s,np.zeros(int(sr*pausa),s.dtype)]; t+=d+pausa
    cen.append([round(ini,2),round(t,2)])
sf.write(P+"/audio/narr_raw.wav",np.concatenate(out),sr)
json.dump(pal,open(P+"/audio/palavras.json","w"),ensure_ascii=False)
json.dump(cen,open(P+"/audio/cenas-tempo.json","w"))
print("total %.1fs"%t)
