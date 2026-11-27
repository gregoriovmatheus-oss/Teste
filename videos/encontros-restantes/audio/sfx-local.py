"""sfx-local.py: efeitos sintetizados localmente (sem API) para "encontros restantes".
Whoosh em cada corte; brilho do número (f01/f13), tiques do contador (f02/f03/f09/f10), contas caindo (f04),
barras subindo (f05), pedras e o brilho raro (f06), xícara (f07), coração no abraço (f08), queda 1→0 (f11), números somindo (f12).
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
# f01: o número brilha e "pula" em "número"
add(C['f01'] + 0.05, shimmer(1.4, True), 0.25)
for k in range(8): add(C['f01'] + 0.1 + k * 0.28, tique(2600 - k * 80), 0.08)
add(C['f01'] + 1.89, tique(1800), 0.3); add(C['f01'] + 1.9, shimmer(0.8, True), 0.3)
# f02: números acendendo sobre cada desconhecido
for k in range(6): add(C['f02'] + 0.15 + k * 0.2, tique(1500 + k * 180), 0.2)
add(C['f02'] + 2.18, shimmer(1.0, True), 0.2)
# f03: contadores (3.000, 27) e o número borrado da mãe (ruído trêmulo)
for k in range(10): add(C['f03'] + 0.9 + k * 0.07, tique(2200), 0.1)
add(C['f03'] + 1.6, clique(0.1, 900), 0.25)
for k in range(8): add(C['f03'] + 2.8 + k * 0.08, tique(1900), 0.1)
add(C['f03'] + 3.4, clique(0.1, 900), 0.25)
add(C['f03'] + 4.6, env(agua(2.0, 0.6), 0.3, 0.8), 0.08); add(C['f03'] + 4.7, env(thud(45, 1.6), 0.2, 1.0), 0.3)
# f04: 10 contas caem; depois as 190 em onda; o 200
for k in range(10): add(C['f04'] + 1.95 + k * 0.05, tique(2400 + k * 60), 0.12)
for k in range(40): add(C['f04'] + 3.6 + k * 0.035, tique(2000 + (k % 7) * 150), 0.05)
add(C['f04'] + 5.36, thud(60, 0.5), 0.4); add(C['f04'] + 5.38, shimmer(1.2, True), 0.25)
# f05: barras subindo; o passado apaga
add(C['f05'] + 0.2, shimmer(1.8, True), 0.18)
add(C['f05'] + 2.6, whoosh(0.8), 0.25); add(C['f05'] + 3.82, tique(1400), 0.2)
# f06: pedras afundando e a única que sobe e brilha
add(C['f06'] + 3.6, env(agua(1.2, 0.2), 0.2, 0.6), 0.2); add(C['f06'] + 3.95, shimmer(1.4, True), 0.4)
# f07: xícara no pires; risco do "cancelar"
add(C['f07'] + 0.6, clique(0.08, 2600), 0.25); add(C['f07'] + 2.65, whoosh(0.3), 0.3)
# f08: coração calmo durante o abraço; toque de chamada
for k in range(3): add(C['f08'] + 0.6 + k * 1.0, batida(), 0.35)
for k in range(2): add(C['f08'] + 4.0 + k * 0.9, np.sin(2 * np.pi * 880 * np.arange(int(SR * 0.35)) / SR) * np.exp(-np.arange(int(SR * 0.35)) / SR * 6), 0.12)
# f09: grave frio; contagem regressiva até 1
add(C['f09'] + 0.3, env(thud(38, 2.4), 0.6, 1.5), 0.3)
for k in range(11): add(C['f09'] + 2.6 + k * 0.135, tique(1600 - k * 40), 0.12)
add(C['f09'] + 4.09, thud(50, 0.8), 0.45)
# f10: cada encontro marcado na agenda
for dt in [1.95, 2.79, 3.67, 4.0, 4.2, 4.4, 4.6]: add(C['f10'] + dt, clique(0.1, 1200), 0.3); add(C['f10'] + dt + 0.02, tique(2400), 0.12)
# f11: 1 vira 0 sem alarde (um tique seco) e silêncio
add(C['f11'] + 1.29, tique(900), 0.25)
# f12: números aparecem e depois apagam
add(C['f12'] + 1.3, shimmer(1.2, True), 0.25); add(C['f12'] + 3.25, shimmer(1.2, False), 0.25)
# f13: o número volta; abraço quente
add(C['f13'] + 2.4, shimmer(1.0, True), 0.28)
add(C['f13'] + 4.3, env(thud(48, 1.8), 0.3, 1.2), 0.35); add(C['f13'] + 4.4, shimmer(2.0, True), 0.3)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
