"""sfx-local.py: efeitos sintetizados localmente (sem API) para "pausar o tempo".
Whoosh em cada corte; chuva e estalo de dedos (f01/f13), passos (f02), lâmpada (f03), ar (f04),
tom que corta (f05), batidas do coração (f07), tiques dos dias (f08), areia (f09), bipes do GPS (f11). Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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
# f01: chuva caindo até o estalo; estalo + anel (whoosh reverso) e a chuva some em câmera lenta
add(C['f01'], env(chuva(1.25), 0.05, 0.4), 0.35)
add(C['f01'] + 0.83, estalar(), 0.9)
add(C['f01'] + 0.85, shimmer(1.6, False), 0.35)
add(C['f01'] + 0.86, thud(42, 1.4), 0.5)
add(C['f01'] + 0.9, whoosh(0.9), 0.4)
# f02: passos do protagonista no asfalto molhado (o único som)
for i in range(7):
    add(C['f02'] + 0.3 + i * 0.69, clique(0.08, 160), 0.22)
for i in range(3):
    add(C['f02'] + 2.95 + i * 1.0, tique(), 0.18)
# f03: zumbido da lâmpada que para; escurecer com grave
add(C['f03'] + 0.2, env(zumbido_cai(3.2), 0.3, 0.2), 0.35)
add(C['f03'] + 3.1, shimmer(0.9, False), 0.25)
add(C['f03'] + 4.2, env(thud(38, 2.0), 0.4, 1.4), 0.4)
# f04: ar sibilando (moléculas) até travar; inspiração bloqueada
add(C['f04'] + 0.2, env(agua(4.2, 0.5), 0.6, 0.3), 0.12)
add(C['f04'] + 4.4, thud(60, 0.4), 0.4)
add(C['f04'] + 5.6, env(agua(1.0, 0.08), 0.6, 0.2), 0.25)
add(C['f04'] + 6.6, estalo(), 0.25)
# f05: tom do alto-falante que corta seco em 2,2 s (silêncio)
n = int(SR * 2.2); k = np.arange(n) / SR
add(C['f05'] + 0.1, np.sin(2 * np.pi * 220 * k) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * k)) * np.minimum(1, k * 8), 0.22)
# f06: luz voltando (brilho subindo) e respiração
add(C['f06'] + 0.5, shimmer(2.2, True), 0.35)
add(C['f06'] + 1.9, env(agua(1.3, 0.1), 0.5, 0.6), 0.22)
# f07: batidas do coração (1,16/s) e células estalando
for i in range(9):
    add(C['f07'] + 0.05 + i / 1.16, batida(), 0.5)
r = np.random.default_rng(3)
for dt in np.sort(r.uniform(3.0, 7.8, 30)):
    add(C['f07'] + dt, tique(3000 + r.uniform(0, 1500)), 0.05)
# f08: dias acendendo (tiques acelerando)
for dt in 0.25 + 5.3 * np.sqrt(np.linspace(0, 1, 40)):
    add(C['f08'] + dt, tique(1800), 0.09)
# f09: areia escorrendo, rajada de 1 ano
add(C['f09'] + 0.1, env(agua(5.8, 0.3), 0.4, 0.6), 0.1)
add(C['f09'] + 2.4, env(agua(1.0, 0.45), 0.1, 0.6), 0.3)
# f10: grave ao envelhecer
add(C['f10'] + 1.8, env(thud(36, 2.6), 0.6, 1.8), 0.35)
# f11: bipes do satélite e correção
for i in range(9):
    add(C['f11'] + 0.8 + i * 0.9, tique(1200), 0.12)
add(C['f11'] + 4.6, clique(0.12, 700), 0.25)
add(C['f11'] + 7.4, shimmer(0.8, False), 0.25)
# f12: o segundo luminoso
add(C['f12'] + 0.2, shimmer(2.4, True), 0.3)
add(C['f12'] + 1.4, tique(2200), 0.25)
# f13: estalo, a chuva volta a cair
add(C['f13'] + 0.98, estalar(), 0.9)
add(C['f13'] + 1.0, whoosh(0.9), 0.45)
add(C['f13'] + 1.0, thud(42, 1.2), 0.4)
add(C['f13'] + 1.2, env(chuva(6.4), 0.8, 1.5), 0.4)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
