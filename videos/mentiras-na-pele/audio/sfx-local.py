"""sfx-local.py: efeitos sintetizados localmente (sem API) para "mentiras na pele".
Whoosh em cada corte; chiado + brilho quando cada marca nasce na pele (f01, f02, f05, f10, f11); carimbos do calendário (f03);
anéis e fichas empilhando (f04); varredura e moeda (f06); papel e agulhas do polígrafo (f07); coração e sangue (f08);
mar e virada de cor da lula (f09); vento e casacos (f12); respiro grave no fim (f13). Saída: assets/audio/sfx.wav (mono 48 kHz)."""
import json, numpy as np, wave
SR = 48000
v = json.load(open('video.json')); DUR = v['duracao']
out = np.zeros(int(SR * (DUR + 2)))
rng = np.random.default_rng(7)
C = {c['id']: c['inicio'] for c in v['cenas']}
def lp(x, a):  # passa-baixa de 1 polo
    y = np.empty_like(x); acc = 0.0
    for i, s in enumerate(x): acc += a * (s - acc); y[i] = acc
    return y
def add(t, sig, g):
    i = int(t * SR); j = min(len(out), i + len(sig)); out[i:j] += sig[:j - i] * g
def whoosh(d=0.55):
    n = int(SR * d); x = rng.standard_normal(n); k = np.linspace(0, 1, n)
    a = 0.02 + 0.25 * np.sin(np.pi * k) ** 2
    y = np.empty(n); acc = 0.0; b2 = 0.0
    for i in range(n): acc += a[i] * (x[i] - acc); b2 += a[i] * (acc - b2); y[i] = acc - b2 * 0.6
    return y * np.sin(np.pi * k) ** 1.5 / (np.abs(y).max() + 1e-9)
def thud(f0=70, d=0.6):
    n = int(SR * d); k = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(f0 * np.exp(-k * 5) + f0 * 0.55) / SR) * np.exp(-k * 7)
    nz = lp(rng.standard_normal(n), 0.06) * np.exp(-k * 12)
    return (tone + nz * 1.5) / 2
def shimmer(d=1.6, sobe=True):  # brilho: parciais agudas subindo + ar
    n = int(SR * d); k = np.linspace(0, 1, n); s = np.zeros(n)
    for f in [880, 1320, 1760, 2640, 3520]:
        fr = f * (1 + (0.35 * k if sobe else 0.35 * (1 - k)))
        s += np.sin(2 * np.pi * np.cumsum(fr) / SR + f) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * k + f))
    env = np.sin(np.pi * k) ** 1.2
    air = lp(rng.standard_normal(n), 0.4) * 0.6
    return (s / 5 + air) * env
def clique(d=0.12, f=180):
    n = int(SR * d); k = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * k) * np.exp(-k * 45) + lp(rng.standard_normal(n), 0.5) * np.exp(-k * 80) * 0.5)
def zumbido_cai(d=2.8):  # hum de 60 Hz descendo e morrendo
    n = int(SR * d); k = np.linspace(0, 1, n)
    f = 60 * (1 - 0.6 * k ** 2)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return s * (1 - k) ** 1.5 * 0.7
def agua(d, a=0.12):  # chiado de água correndo
    n = int(SR * d); x = lp(rng.standard_normal(n), a)
    return x / (np.abs(x).max() + 1e-9)
def estalo():
    n = int(SR * 0.07); k = np.arange(n) / SR
    return rng.standard_normal(n) * np.exp(-k * 120)
def uivo(d=1.6):
    n = int(SR * d); k = np.linspace(0, 1, n)
    f = 420 + 260 * np.sin(np.pi * np.clip(k * 1.3, 0, 1)) - 120 * k
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return s * np.sin(np.pi * k) ** 0.8 * 0.6
def env(sig, a=0.3, r=0.6):
    n = len(sig); e = np.ones(n); na, nr = int(SR * a), int(SR * r)
    e[:na] = np.linspace(0, 1, na); e[n - nr:] = np.linspace(1, 0, nr); return sig * e

def chiado(d=0.9):  # marca nascendo: ruído agudo que acende e esfria
    n = int(SR * d); k = np.linspace(0, 1, n)
    x = rng.standard_normal(n); x = x - lp(x, 0.2)
    return x * np.sin(np.pi * k) ** 0.6 * (1 - k) * 0.6
def moeda(d=2.5):  # anel metálico
    n = int(SR * d); k = np.arange(n) / SR; s = np.zeros(n)
    for f, a in [(2093, 1), (3520, 0.6), (5274, 0.4), (6645, 0.25)]:
        s += a * np.sin(2 * np.pi * f * k) * np.exp(-k * (1.2 + f / 4000))
    return s / 2.2
def bip(f=1200, d=0.08):
    n = int(SR * d); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.sin(np.pi * k / d)
def coracao():
    return thud(55, 0.35) + np.concatenate([np.zeros(int(SR * 0.16)), thud(48, 0.35)])[: int(SR * 0.35)] * 0.8

# cortes
for c in v['cenas'][1:]:
    add(c['inicio'] - 0.38, whoosh(), 0.5)
# f01: a mancha nasce no pulso (câmera lenta)
add(C['f01'] + 2.5, chiado(1.6), 0.45)
add(C['f01'] + 2.55, shimmer(1.8, True), 0.3)
add(C['f01'] + 2.6, thud(50, 1.2), 0.4)
# f02: marcas pequenas (3 estalinhos) e a grande tomando o corpo
for dt in [3.59, 4.16, 4.62]:
    add(C['f02'] + dt, chiado(0.4), 0.3); add(C['f02'] + dt, clique(0.08, 1600), 0.12)
add(C['f02'] + 5.4, env(chiado(2.0), 0.6, 0.6), 0.45)
add(C['f02'] + 5.45, env(thud(42, 2.0), 0.4, 1.0), 0.45)
# f03: carimbos das marcas no calendário
r = np.random.default_rng(3)
for i in range(30):
    add(C['f03'] + 2.0 + 4.2 * i / 30 + r.uniform(0, 0.03), clique(0.09, 220 + r.uniform(0, 80)), 0.22)
# f04: anéis azuis (60%), 5% cobertos, fichas empilhando
add(C['f04'] + 2.45, shimmer(1.2, True), 0.25)
add(C['f04'] + 6.0, thud(50, 0.9), 0.45); add(C['f04'] + 6.0, chiado(1.0), 0.35)
for i in range(24):
    add(C['f04'] + 7.55 + i * 0.06, clique(0.05, 2200 + r.uniform(0, 600)), 0.1)
# f05: três mentiras sociais, três marcas
for dt in [1.76, 2.37, 3.02]:
    add(C['f05'] + dt + 0.15, chiado(0.5), 0.3)
# f06: varredura que não acha nada e a moeda girando
for i in range(8):
    add(C['f06'] + 2.0 + i * 0.2, bip(1400, 0.06), 0.08)
add(C['f06'] + 4.35, moeda(3.5), 0.3)
add(C['f06'] + 7.55, bip(900, 0.15), 0.12)
# f07: papel correndo e agulhas; "não mede a mentira"
add(C['f07'], env(agua(4.5, 0.5), 0.2, 0.3), 0.05)
for dt in np.arange(0.2, 4.4, 0.21):
    add(C['f07'] + dt, clique(0.03, 3000), 0.04)
add(C['f07'] + 3.48, thud(45, 0.9), 0.45)
# f08: coração batendo e os vasos se dilatando
for dt in np.arange(0.2, 4.3, 0.75):
    add(C['f08'] + dt, coracao(), 0.3)
add(C['f08'] + 3.6, env(agua(0.9, 0.08), 0.3, 0.4), 0.3)
# f09: fundo do mar, a lula muda de cor (0,65 s) e o corte para o braço
add(C['f09'], env(agua(3.1, 0.015), 0.3, 0.5), 0.35)
add(C['f09'] + 0.65, shimmer(0.6, False), 0.3)
# f10: rua; marcas acendendo e a letra miúda
add(C['f10'], env(agua(5.1, 0.03), 0.4, 0.4), 0.18)
for dt in [0.1, 0.69, 1.34]:
    add(C['f10'] + dt, chiado(0.6), 0.3)
add(C['f10'] + 3.06, shimmer(1.0, True), 0.25)
# f11: duas mentirinhas, duas marcas
for dt in [1.74, 2.8]:
    add(C['f11'] + dt, chiado(0.5), 0.35); add(C['f11'] + dt, clique(0.08, 1600), 0.12)
# f12: vento na praça e casacos fechando
add(C['f12'], env(agua(4.5, 0.02), 0.6, 0.6), 0.2)
add(C['f12'] + 3.9, env(agua(0.5, 0.3), 0.05, 0.3), 0.25)
# f13: corte para a pessoa e respiro grave no fim
add(C['f13'] + 2.9, whoosh(0.6), 0.4)
add(C['f13'] + 3.48, env(thud(40, 3.0), 0.05, 2.0), 0.4)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
