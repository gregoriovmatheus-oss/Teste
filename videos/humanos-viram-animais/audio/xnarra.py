import os,re,json,sys,numpy as np,soundfile as sf,torch
os.environ["COQUI_TOS_AGREED"]="1"
from TTS.api import TTS
torch.set_num_threads(4)
P=sys.argv[1]; only=len(sys.argv)>2
tts=TTS("tts_models/multilingual/multi-dataset/xtts_v2")
txt=open(P+"/SCRIPT.md").read().split("\n---\n",1)[1]
fr=[l.strip() for l in txt.splitlines() if l.strip() and not l.startswith("#")]
if only: fr=fr[:1]
sr=24000;out=[];t=0.0;pal=[];cen=[]
for i,f in enumerate(fr):
    ini=t
    for j,pt in enumerate(re.split(r"(?<=[.?!…])\s+",f)):
        s=np.array(tts.tts(text=pt,speaker_wav="ref.wav",language="pt",temperature=0.65,speed=1.05),dtype=np.float32)
        nz=np.where(np.abs(s)>0.01)[0]; s=s[max(0,nz[0]-240):nz[-1]+480]
        d=len(s)/sr; ws=pt.split(); pe=np.array([len(re.sub(r"\W","",w))+1.5 for w in ws]); cs=np.concatenate([[0],np.cumsum(pe)])/pe.sum()
        for n,w in enumerate(ws): pal.append({"id":f"w{len(pal)}","text":w,"start":round(t+cs[n]*d,3),"end":round(t+cs[n+1]*d,3)})
        pa=0.3; 
        if i==len(fr)-1: pa=1.5
        out+=[s,np.zeros(int(sr*pa),np.float32)]; t+=d+pa
        print(i,round(t,1),flush=True)
    cen.append([round(ini,2),round(t,2)])
sf.write("xnarr.wav" if not only else "xteste.wav",np.concatenate(out),sr)
if not only:
    json.dump(pal,open(P+"/audio/palavras.json","w"),ensure_ascii=False)
print("total",round(t,1))
