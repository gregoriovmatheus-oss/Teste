"""sfx-local.py: efeitos sintetizados localmente (sem API) para "sem dor".
Whoosh em cada corte; faca na tábua (f01/f13), brilho do gene (f02), sensores (f03), chiado da panela e puxão (f04),
chiado contínuo (f05), passos e varredura do raio-X (f06), rangido (f07), estouro (f08), grave (f09),
cliques do painel (f10), íons e encaixe (f11), bipe do detector (f12), grito/impacto (f13). Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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

# cortes
for c in v['cenas'][1:]:
    add(c['inicio'] - 0.38, whoosh(), 0.5)
def chuva(d, a=0.35):  # chiado de chuva (ruído rosado claro)
    n = int(SR * d); x = lp(rng.standard_normal(n), a) - lp(rng.standard_normal(n), 0.02) * 0.5
    return x / (np.abs(x).max() + 1e-9)
def estalar():  # estalo de dedos: clique seco + corpo curto
    n = int(SR * 0.09); k = np.arange(n) / SR
    return rng.standard_normal(n) * np.exp(-k * 160) + np.sin(2 * np.pi * 1900 * k) * np.exp(-k * 90) * 0.6
def batida():  # tum-tum do coração
    return np.concatenate([thud(55, 0.18), np.zeros(int(SR * 0.05)), thud(48, 0.25) * 0.7])
def tique(f=2400):
    n = int(SR * 0.03); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.exp(-k * 220)
def chiado(d, a=0.55):  # frigideira: ruído agudo com estalinhos
    n = int(SR * d); x = rng.standard_normal(n) - lp(rng.standard_normal(n), a)
    x *= 0.7 + 0.3 * (rng.random(n) > 0.995) * 4
    return x / (np.abs(x).max() + 1e-9)
def bipe(f=3100, d=0.12):
    n = int(SR * d); k = np.arange(n) / SR
    return np.sign(np.sin(2 * np.pi * f * k)) * 0.5 * np.minimum(1, (d - k) * 60) * np.minimum(1, k * 400)
def faca(n_ch, t0, freq=2.2, g=0.3):
    for i in range(n_ch):
        add(t0 + i / freq, clique(0.06, 260), g)
# f01: faca picando (2,2/s) e o corte seco, sem reação
for i in range(13):
    add(C['f01'] + 0.33 + i / 2.2, clique(0.06, 260), 0.28)
add(C['f01'] + 2.1, estalo(), 0.18)
add(C['f01'] + 2.15, env(thud(48, 1.2), 0.02, 0.8), 0.25)
# f02: voo pela hélice e o gene acendendo
add(C['f02'] + 0.0, whoosh(1.4), 0.35)
add(C['f02'] + 4.5, shimmer(1.5, True), 0.35)
add(C['f02'] + 5.35, tique(1500), 0.25)
# f03: sensores acendendo e os três estímulos
for i in range(8):
    add(C['f03'] + 1.8 + i * 0.08, tique(2600 + i * 120), 0.06)
for dt, f in [(4.99, 900), (5.34, 1300), (5.81, 700)]:
    add(C['f03'] + dt, tique(f), 0.3); add(C['f03'] + dt, shimmer(0.6, False), 0.12)
# f04: panela chiando, sinal sobe, mão puxada
add(C['f04'] + 0.2, env(chiado(5.2), 0.5, 0.6), 0.1)
add(C['f04'] + 1.95, shimmer(0.5, True), 0.2)
add(C['f04'] + 2.88, whoosh(0.35), 0.5)
add(C['f04'] + 2.9, thud(80, 0.3), 0.35)
add(C['f04'] + 4.48, tique(1100), 0.2)
# f05: chiado contínuo crescendo; o sinal que morre
add(C['f05'] + 0.2, env(chiado(4.6), 1.2, 0.3), 0.16)
add(C['f05'] + 0.7, shimmer(0.8, False), 0.15)
# f06: passos de criança, varredura do raio-X, estalo do osso
for i in range(9):
    add(C['f06'] + 0.2 + i * 0.33, clique(0.05, 140), 0.16)
add(C['f06'] + 3.85, env(zumbido_cai(0.8), 0.05, 0.3), 0.3)
add(C['f06'] + 3.85, shimmer(0.7, True), 0.2)
add(C['f06'] + 4.99, estalo(), 0.25)
for i in range(4):
    add(C['f06'] + 4.28 + i * 0.38, tique(1800), 0.12)
# f07: rangido da junta a cada passo
for i in range(4):
    add(C['f07'] + 0.3 + i * 0.98, env(lp(rng.standard_normal(int(SR * 0.25)), 0.25), 0.05, 0.15), 0.12)
add(C['f07'] + 2.7, thud(60, 0.4), 0.3)
# f08: pulsação crescendo e o estouro
for i in range(6):
    add(C['f08'] + 2.3 + i * 0.45, batida(), 0.15 + i * 0.04)
add(C['f08'] + 5.07, thud(40, 1.2), 0.6)
add(C['f08'] + 5.07, estalo(), 0.4)
# f09: grave sério
add(C['f09'] + 0.2, env(thud(34, 3.0), 0.5, 2.0), 0.35)
# f10: cliques do painel nos três itens e a varredura diária
for dt in [2.69, 2.99, 3.66]:
    add(C['f10'] + dt, clique(0.08, 900), 0.25); add(C['f10'] + dt + 0.05, tique(2200), 0.15)
add(C['f10'] + 4.12, shimmer(0.9, True), 0.2)
# f11: íons correndo, encaixe do remédio, silêncio
add(C['f11'] + 0.2, env(agua(3.3, 0.4), 0.4, 0.3), 0.1)
add(C['f11'] + 3.55, clique(0.14, 520), 0.4)
add(C['f11'] + 3.56, shimmer(0.8, False), 0.2)
# f12: bipe do detector de fumaça
for i in range(4):
    add(C['f12'] + 2.72 + i * 0.2, bipe(), 0.18)
# f13: faca, o corte que dói, impacto do grito
for i in range(4):
    add(C['f13'] + 0.4 + i / 2.2, clique(0.06, 260), 0.28)
add(C['f13'] + 1.75, estalo(), 0.3)
add(C['f13'] + 2.05, thud(55, 0.9), 0.55)
add(C['f13'] + 2.05, whoosh(0.5), 0.4)
add(C['f13'] + 3.5, env(shimmer(3.0, True), 0.8, 1.5), 0.2)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
