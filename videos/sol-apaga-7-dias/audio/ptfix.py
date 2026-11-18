import re
from kokoro_onnx.tokenizer import Tokenizer
T=Tokenizer()
def fon(txt):
    p=T.phonemize(txt,'pt-br')
    for a,b in [("æ","ɐ"),("ə",""),("eɪŋ","ẽj"),("ɐ̃ʊ̃","ɐ̃w̃"),("ũŋ","ũ"),("ɐ̃ŋ","ɐ̃"),("ẽŋ","ẽ"),("ĩŋ","ĩ"),("õŋ","õ"),("aɪ","aj"),("eɪ","ej"),("ɔɪ","ɔj"),("oɪ","oj"),("ʊ","u")]:
        p=p.replace(a,b)
    p=re.sub(r"y",  "i", p)
    return p
