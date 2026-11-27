"""sfx-local.py: efeitos sintetizados localmente (sem API) para "e se você pudesse controlar seus sonhos?".
Whoosh em cada corte; brilho ao acordar no sonho (f01/f13), portais e lugares (f02), peças do anel (f03), gráfico e cérebro (f04),
orbes em anel e relógio (f05), vento/mar, abraço e conversa (f06), caixinha de música e passos (f07), coro subindo (f08), despertador (f09),
ondulação (f10), glitch do texto e sexto dedo (f11), tiques da contagem (f12). Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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

def tique(f=2400):
    n = int(SR * 0.03); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.exp(-k * 220)
def bolha(f=500):
    n = int(SR * 0.08); k = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 3 * k * 10)) / SR) * np.exp(-k * 50)
def ping(f=1320):
    n = int(SR * 0.35); k = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * k) + 0.5 * np.sin(2 * np.pi * f * 1.5 * k)) * np.exp(-k * 9) * 0.5
def sino(f=880, d=2.0):
    n = int(SR * d); k = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * m * k) * np.exp(-k * (2 + m)) / m for m in [1, 2.76, 5.4]) * 0.5
# cortes
for c in v['cenas'][1:]:
    add(c['inicio'] - 0.38, whoosh(), 0.5)
PENTA = [523, 587, 659, 784, 880, 1047]
# f01: ar de sonho + brilho ao "acordar dentro de um sonho"
add(C['f01'], env(agua(3.8, 0.04), 0.1, 0.6), 0.05); add(C['f01'] + 0.9, shimmer(1.6, True), 0.22)
# f02: 3 portais acendem; cortes internos; mar em Marte; vento nas nuvens; caixinha na infância
for j, dt in enumerate([0.3, 0.45, 0.6]): add(C['f02'] + dt, ping(PENTA[j * 2]), 0.18)
for dt in [1.62, 2.48, 3.72]: add(C['f02'] + dt - 0.25, whoosh(0.4), 0.3)
add(C['f02'] + 1.62, env(agua(0.9, 0.1), 0.1, 0.3), 0.12); add(C['f02'] + 2.48, env(agua(1.2, 0.3), 0.2, 0.4), 0.08)
for k, f in enumerate([1047, 880, 784, 659]): add(C['f02'] + 3.8 + k * 0.32, ping(f), 0.12)
# f03: peças do anel surgindo; acendem em "metade"
for i in range(0, 100, 5): add(C['f03'] + 0.2 + i * 0.012, tique(1800 + i * 8), 0.06)
add(C['f03'] + 3.3, shimmer(1.2, True), 0.2)
# f04: gráfico se desenhando; REM acende; cérebro liga
for i in range(10): add(C['f04'] + 0.3 + i * 0.13, tique(1200), 0.07)
add(C['f04'] + 1.38, ping(1320), 0.18); add(C['f04'] + 2.18, thud(55, 0.8), 0.35); add(C['f04'] + 2.96, shimmer(1.6, True), 0.16)
# f05: orbes entram em ordem; relógio das 2 h
add(C['f05'] + 1.05, shimmer(1.0, True), 0.18); add(C['f05'] + 3.3, sino(660, 1.8), 0.16)
# f06: vento e mar no voo; abraço quente; conversa
add(C['f06'], env(agua(1.6, 0.25), 0.2, 0.4), 0.16); add(C['f06'] + 1.7, sino(523, 1.8), 0.14); add(C['f06'] + 3.3, ping(660), 0.12)
# f07: melodia da musicista; passos do atleta do sonho
for k, f in enumerate([659, 784, 880, 784, 1047, 880]): add(C['f07'] + 0.25 + k * 0.26, ping(f), 0.13)
for k in range(10): add(C['f07'] + 2.0 + k * 0.28, thud(90, 0.18), 0.12)
# f08: coro/brilho subindo até a cama gigante
add(C['f08'] + 1.4, shimmer(2.0, True), 0.24); add(C['f08'] + 0.9, thud(48, 0.9), 0.25)
# f09: despertador (bipes) e depois o brilho quente da cama
for k in range(8): add(C['f09'] + 0.05 + k * 0.3, tique(2600), 0.22); add(C['f09'] + 0.15 + k * 0.3, tique(2600), 0.22)
add(C['f09'] + 2.65, shimmer(1.8, False), 0.18)
# f10: o quarto ondula
add(C['f10'] + 1.7, uivo(2.4), 0.12)
# f11: texto embaralha (2ª leitura e no sonho) + sexto dedo
for k in range(6): add(C['f11'] + 4.02 + k * 0.05, estalo(), 0.08)
for k in range(12): add(C['f11'] + 4.85 + k * 0.06, estalo(), 0.1)
add(C['f11'] + 5.45, ping(1568), 0.2)
# f12: tique a cada dedo contado
for k in range(5): add(C['f12'] + 0.4 + k * 0.64, tique(1500 + k * 120), 0.2)
add(C['f12'], env(agua(4.4, 0.06), 0.3, 0.6), 0.04)
# f13: mãos, sexto dedo e pergunta final
add(C['f13'] + 1.5, ping(1568), 0.16); add(C['f13'] + 2.6, shimmer(2.0, False), 0.18); add(C['f13'] + 3.7, sino(440, 2.0), 0.12)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
