"""sfx-local.py: efeitos sintetizados localmente (sem API) para "cópia de você".
Whoosh em cada corte; lençol e pulso grave no despertar (f01); bipes da senha (f02); brilho das células (f03);
bipes de "ORIGINAL?" (f04); batidas de madeira das tábuas (f05); coração no vaso e passagem para a pele (f06);
tique dos anos (f07); peças se espalhando e voltando (f08); marcas surgindo (f09); açúcar na xícara (f10);
estalos das rachaduras (f11); zumbido do fio (f12); e o pulso grave quando a cópia abre os olhos (f13).
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
def bipe(f=1200, d=0.09):
    n = int(SR * d); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.exp(-k * 30) * np.minimum(1, k * 400)
r = np.random.default_rng(3)
# f01: lençol (chiado), virar a cabeça e pulso grave ao ver a cópia
add(C['f01'] + 0.6, env(agua(0.8, 0.08), 0.2, 0.4), 0.2)
add(C['f01'] + 1.83, thud(45, 1.4), 0.55)
add(C['f01'] + 1.9, shimmer(1.4, False), 0.15)
# f02: fios subindo e os 4 dígitos da senha + desbloqueio
add(C['f02'] + 0.6, shimmer(1.4, True), 0.22)
for k in range(4):
    add(C['f02'] + 1.92 + k * 0.18, bipe(1500, 0.07), 0.18)
add(C['f02'] + 2.85, bipe(880, 0.12), 0.2); add(C['f02'] + 2.95, bipe(1320, 0.16), 0.2)
# f03: mergulho no corpo e brilho das células
add(C['f03'] + 0.4, whoosh(2.6), 0.35)
add(C['f03'] + 1.63, shimmer(1.6, True), 0.3)
for k in range(14):
    add(C['f03'] + 3.45 + k * 0.11, bipe(2000 + k * 40, 0.05), 0.06)
# f04: "ORIGINAL?" pulando de um para o outro
for k in range(10):
    add(C['f04'] + 0.99 + k * 0.32, bipe(660 if k % 2 else 520, 0.1), 0.14)
# f05: mar e tábuas trocadas (batidas de madeira)
add(C['f05'], env(agua(4.4, 0.03), 0.5, 0.6), 0.15)
for dt in np.sort(r.uniform(0.9, 3.6, 26)):
    add(C['f05'] + dt, clique(0.1, 160 + r.uniform(0, 90)), 0.28)
# f06: coração no vaso e passagem para a pele
for dt in np.arange(0.2, 4.8, 0.85):
    add(C['f06'] + dt, thud(55, 0.35), 0.35); add(C['f06'] + dt + 0.2, thud(50, 0.3), 0.22)
add(C['f06'] + 4.45, shimmer(0.6, False), 0.2)
add(C['f06'] + 4.75, whoosh(0.6), 0.5)
# f07: neurônios (brilho dourado) e tique dos anos
add(C['f07'] + 0.5, shimmer(1.8, True), 0.2)
for dt in np.arange(2.6, 4.6, 0.12):
    add(C['f07'] + dt, clique(0.04, 2400), 0.07)
# f08: a lembrança se espalha e volta
add(C['f08'] + 2.37, shimmer(0.9, False), 0.3); add(C['f08'] + 2.37, whoosh(0.7), 0.35)
add(C['f08'] + 3.36, shimmer(1.2, True), 0.3)
add(C['f08'] + 5.28, bipe(740, 0.25), 0.12)
# f09: marcas surgindo
for dt in np.sort(r.uniform(2.6, 4.9, 16)):
    add(C['f09'] + dt, bipe(1800 + r.uniform(0, 600), 0.05), 0.08)
# f10: açúcar caindo na xícara + colher
for k in range(2):
    add(C['f10'] + 2.93 + k * 0.28, clique(0.08, 2600), 0.25)
    add(C['f10'] + 2.95 + k * 0.28, env(agua(0.25, 0.3), 0.01, 0.2), 0.1)
add(C['f10'] + 3.6, bipe(3100, 0.2), 0.08)
# f11: cada objeto racha ao meio
for dt in [1.23, 1.63, 2.18]:
    add(C['f11'] + dt, thud(80, 0.4), 0.45)
    for k in range(4): add(C['f11'] + dt + k * 0.03, estalo(), 0.18)
# f12: zumbido do fio contínuo
add(C['f12'] + 0.2, env(shimmer(6.8, True), 1.0, 1.5), 0.14)
add(C['f12'] + 4.98, thud(42, 1.6), 0.35)
# f13: fios se apagam; a cópia abre os olhos (pulso grave) e respiro final
add(C['f13'] + 0.3, shimmer(1.6, True), 0.15)
add(C['f13'] + 4.8, thud(38, 2.4), 0.6)
add(C['f13'] + 4.85, env(shimmer(2.0, False), 0.05, 1.5), 0.12)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
