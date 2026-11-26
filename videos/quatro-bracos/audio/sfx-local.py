"""sfx-local.py: efeitos sintetizados localmente (sem API) para "quatro braços".
Whoosh em cada corte; espreguiçar (f01/f13), barras (f02), ossos (f03), coração (f04), mapa (f05), dedo (f06),
bolhas (f07), cozinha/teclado/celular (f08), monitor e baterias (f09), cadeira e cama (f10), holofote (f11), passos (f12).
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
def batida():  # tum-tum do coração
    return np.concatenate([thud(55, 0.18), np.zeros(int(SR * 0.05)), thud(48, 0.25) * 0.7])
def tique(f=2400):
    n = int(SR * 0.03); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.exp(-k * 220)
def bolha(f=500):
    n = int(SR * 0.08); k = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 3 * k * 10)) / SR) * np.exp(-k * 50)
def tambor(f=180, d=0.25):
    n = int(SR * d); k = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f * (1 + np.exp(-k * 30))) / SR) * np.exp(-k * 14) + lp(rng.standard_normal(n), 0.3) * np.exp(-k * 40) * 0.6
def prato(d=0.6):
    n = int(SR * d); k = np.arange(n) / SR; x = rng.standard_normal(n)
    return (x - lp(x, 0.2)) * np.exp(-k * 6) * 0.6
def ping():
    n = int(SR * 0.35); k = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1320 * k) + 0.5 * np.sin(2 * np.pi * 1980 * k)) * np.exp(-k * 9) * 0.5
# f01 / f13: espreguiçar (ar subindo) + brilho quando os 4 braços abrem
add(C['f01'] + 1.0, shimmer(1.6, True), 0.2)
add(C['f01'] + 2.9, whoosh(0.7), 0.35); add(C['f01'] + 3.0, thud(60, 0.5), 0.3)
add(C['f13'] + 1.4, shimmer(1.4, True), 0.18)
add(C['f13'] + 3.35, whoosh(0.7), 0.3); add(C['f13'] + 4.4, env(thud(40, 1.4), 0.1, 1.0), 0.3)
# f02: barras subindo (2 tiques) + par novo (2 graves) + pulso do +10%
for i in range(2): add(C['f02'] + 0.47 + i * 0.12, clique(0.1, 520), 0.25)
for i in range(2): add(C['f02'] + 3.6 + i * 0.18, thud(90, 0.4), 0.35)
add(C['f02'] + 5.3, shimmer(1.0, True), 0.2)
# f03: ossos encaixando
for dt in [1.3, 2.05, 3.15, 3.3]: add(C['f03'] + dt, clique(0.08, 900), 0.25)
add(C['f03'] + 4.75, env(agua(0.9, 0.25), 0.2, 0.5), 0.12)
# f04: coração acelerando
tb = 0.3
while tb < 4.6:
    add(C['f04'] + tb, batida(), 0.45); tb += 1 / (1.2 + 0.7 * min(1, max(0, (tb - 0.3) / 1.7)))
add(C['f04'] + 3.1, clique(0.12, 300), 0.2); add(C['f04'] + 3.32, clique(0.12, 280), 0.2); add(C['f04'] + 3.54, clique(0.12, 260), 0.2)
# f05: mapa acendendo + pedaço novo
add(C['f05'] + 2.1, shimmer(1.2, True), 0.2)
for i in range(6): add(C['f05'] + 2.2 + i * 0.09, tique(1800 + i * 150), 0.08)
add(C['f05'] + 3.6, whoosh(0.8), 0.25); add(C['f05'] + 4.0, tique(2600), 0.2)
# f06: o 6º dedo mexendo
for i in range(4): add(C['f06'] + 3.8 + i * 0.7, clique(0.06, 1200), 0.15)
add(C['f06'] + 2.7, shimmer(0.8, True), 0.15)
# f07: fundo do mar (grave + bolhas) e neurônios acendendo
add(C['f07'], env(agua(4.6, 0.03), 0.4, 0.6), 0.25)
r = np.random.default_rng(3)
for dt in np.sort(r.uniform(0.2, 4.4, 14)): add(C['f07'] + dt, bolha(380 + r.uniform(0, 400)), 0.12)
for dt in np.sort(r.uniform(1.1, 2.2, 16)): add(C['f07'] + dt, tique(2800 + r.uniform(0, 1200)), 0.05)
# f08: panela chiando, teclado e notificação do celular
add(C['f08'] + 0.2, env(agua(4.7, 0.6), 0.3, 0.5), 0.07)
for dt in np.sort(r.uniform(1.95, 4.8, 22)): add(C['f08'] + dt, clique(0.03, 2200), 0.08)
add(C['f08'] + 2.75, ping(), 0.3)
# f09: bipes do monitor, depois as duas baterias (2,2 Hz em 4 mãos)
for i in range(3): add(C['f09'] + 0.2 + i * 0.8, tique(1000), 0.15)
for j in range(28):
    dt = 2.4 + j / (2.2 * 4)
    if dt > 5.55: break
    add(C['f09'] + dt, tambor(150 + 60 * (j % 4)) if j % 4 < 2 else prato(0.4), 0.22)
# f10: cadeira apertando, cama
add(C['f10'] + 1.9, clique(0.15, 140), 0.3); add(C['f10'] + 2.1, clique(0.15, 120), 0.25)
add(C['f10'] + 3.1, env(thud(50, 0.8), 0.05, 0.5), 0.3)
# f11: tarefas piscando (zumbido) e holofote pulando
add(C['f11'] + 0.6, env(zumbido_cai(2.2), 0.2, 0.3), 0.2)
for i in range(4): add(C['f11'] + 3.0 + i * 0.75, clique(0.1, 600), 0.3)
# f12: passos na calçada
for i in range(8): add(C['f12'] + 0.25 + i * 0.62, clique(0.08, 160), 0.2)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
