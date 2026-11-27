"""sfx-local.py: efeitos sintetizados localmente (sem API) para "relógio da vida".
Whoosh em cada corte; tique-taque dos relógios (f01/f13), contadores (f02/f04), motor da moto (f02), impacto do grito (f03),
faíscas no planeta (f04), curva (f05), holofote (f06), glitch do paradoxo (f07/f13), passos correndo (f08), chuva (f09),
câmeras girando (f10), coração no espelho (f11), TV e brilho quente (f12), nascer do sol (f13).
Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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

def glitch(d=0.6):  # rajadas de ruído digital picotado
    n = int(SR * d); k = np.arange(n) / SR; x = rng.standard_normal(n)
    gate = (np.sin(2 * np.pi * 23 * k) * np.sin(2 * np.pi * 7.3 * k + 1) > 0.15).astype(float)
    sq = np.sign(np.sin(2 * np.pi * (300 + 900 * (np.floor(k * 30) % 5)) * k)) * 0.4
    return (x * 0.5 + sq) * gate * np.sin(np.pi * k / d)
def motor(d=2.8, f0=58):  # moto passando: dente de serra grave com doppler e volume em arco
    n = int(SR * d); k = np.linspace(0, 1, n)
    f = f0 * (1.15 - 0.3 * k) * (1 + 0.04 * np.sin(2 * np.pi * 9 * k))
    ph = np.cumsum(f) / SR; s = 2 * (ph % 1) - 1
    s = lp(s, 0.08) + 0.3 * lp(rng.standard_normal(n), 0.05)
    return s / (np.abs(s).max() + 1e-9) * np.sin(np.pi * k) ** 1.2
def passo():
    n = int(SR * 0.09); k = np.arange(n) / SR
    return lp(rng.standard_normal(n), 0.15) * np.exp(-k * 60) + np.sin(2 * np.pi * 90 * k) * np.exp(-k * 50) * 0.6
def servo(d=0.5):
    n = int(SR * d); k = np.linspace(0, 1, n); f = 700 + 500 * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 40 * k))) * np.sin(np.pi * k) * 0.5
def bip(f=1600, d=0.09):
    n = int(SR * d); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.minimum(1, (d - k) * 60) * np.minimum(1, k * 400)

# f01: tique-taque do relógio da moça; brilho em "relógio"
for k in range(6): add(C['f01'] + 0.3 + k, tique(2600 if k % 2 else 2000), 0.12)
add(C['f01'] + 0.05, shimmer(1.4, True), 0.2)
for k in range(4): add(C['f01'] + 1.0 + k * 0.15, tique(1500 + k * 200), 0.1)
add(C['f01'] + 2.37, shimmer(0.9, True), 0.28)
# f02: contador do bebê (84) e do senhor (6); moto passando; o "3 horas" se acende
for k in range(14): add(C['f02'] + 1.0 + k * 0.07, tique(2200 + k * 40), 0.09)
add(C['f02'] + 1.97, clique(0.1, 900), 0.3); add(C['f02'] + 1.98, shimmer(0.8, True), 0.2)
for k in range(8): add(C['f02'] + 3.4 + k * 0.075, tique(1900), 0.09)
add(C['f02'] + 3.99, clique(0.1, 800), 0.3)
add(C['f02'] + 4.4, motor(2.9), 0.32)
add(C['f02'] + 4.66, env(glitch(1.5), 0.2, 0.4), 0.06)
add(C['f02'] + 6.33, thud(60, 0.5), 0.35); add(C['f02'] + 6.35, shimmer(0.9, False), 0.2)
# f03: rua; o grito vira um impacto seco
add(C['f03'] + 0.0, env(agua(5.0, 0.04), 0.5, 1.0), 0.05)
add(C['f03'] + 4.11, thud(70, 0.7), 0.5); add(C['f03'] + 4.12, whoosh(0.4), 0.3)
# f04: o contador sobe; faíscas pelo planeta; os relógios quase zerados
for k in range(20): add(C['f04'] + 1.11 + k * 0.044, tique(1800 + (k % 5) * 160), 0.07)
add(C['f04'] + 1.99, thud(55, 0.8), 0.4)
r = np.random.default_rng(3)
for k in range(26): add(C['f04'] + 0.4 + r.random() * 5.8, tique(2400 + r.random() * 1600), 0.04)
for i in range(4): add(C['f04'] + 4.88 + i * 0.12, bip(1300 - i * 90), 0.12)
# f05: barras crescem; marcador dos 76
add(C['f05'] + 0.3, shimmer(2.0, True), 0.16)
add(C['f05'] + 5.35, thud(58, 0.6), 0.4); add(C['f05'] + 5.4, shimmer(1.0, True), 0.22)
# f06: holofote acende numa pessoa; o relógio dela fica exato
add(C['f06'] + 2.2, thud(45, 1.2), 0.4)
add(C['f06'] + 3.3, env(glitch(0.35), 0.05, 0.1), 0.12); add(C['f06'] + 3.62, shimmer(1.0, True), 0.28)
# f07: o relógio pisca entre 3 horas e uma vida (glitch)
for k in range(3): add(C['f07'] + 0.6 + k * 1.0, tique(1800), 0.1)
add(C['f07'] + 3.3, env(glitch(1.1), 0.05, 0.3), 0.18)
# f08: passos correndo; o estranho é salvo
for k in range(14): add(C['f08'] + 0.1 + k * 0.345, passo(), 0.28)
add(C['f08'] + 3.82, env(glitch(0.25), 0.02, 0.1), 0.12); add(C['f08'] + 4.05, shimmer(1.2, True), 0.32)
# f09: chuva e grave frio
add(C['f09'] + 0.0, env(chuva(3.9, 0.35), 0.3, 0.6), 0.14)
add(C['f09'] + 0.2, env(thud(36, 3.0), 0.8, 1.5), 0.25)
# f10: câmeras girando para você; alerta grave
for i in range(9): add(C['f10'] + 2.1 + i * 0.08, servo(0.6), 0.05)
for t0 in [0.1, 0.65, 1.53]: add(C['f10'] + t0, bip(1100), 0.12)
add(C['f10'] + 4.12, thud(48, 1.0), 0.45)
# f11: coração diante do espelho
for k in range(3): add(C['f11'] + 1.2 + k * 0.95, batida(), 0.35)
add(C['f11'] + 1.09, env(glitch(0.5), 0.1, 0.3), 0.05)
# f12: TV de um lado, brilho quente do outro
add(C['f12'] + 0.0, env(np.sin(2 * np.pi * 120 * np.arange(int(SR * 3.6)) / SR) * 0.3 + agua(3.6, 0.5) * 0.3, 0.3, 0.6), 0.06)
add(C['f12'] + 3.89, shimmer(1.4, True), 0.28); add(C['f12'] + 4.6, whoosh(0.5), 0.25)
# f13: os relógios tremem e somem; o sol nasce
for k in range(2): add(C['f13'] + 0.3 + k, tique(2600 if k % 2 else 2000), 0.1)
add(C['f13'] + 1.9, env(glitch(0.6), 0.05, 0.3), 0.14); add(C['f13'] + 2.14, shimmer(1.2, False), 0.3)
add(C['f13'] + 3.0, env(shimmer(4.0, True), 1.2, 1.5), 0.25); add(C['f13'] + 4.27, env(thud(50, 1.8), 0.3, 1.2), 0.3)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
