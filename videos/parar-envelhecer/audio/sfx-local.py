"""sfx-local.py: efeitos sintetizados localmente (sem API) para "parar de envelhecer aos 25".
Whoosh em cada corte; vela e brilho (f01/f13), riscos (f02), bipes do monitor (f03), tique do ponto (f04), séculos acendendo (f05), água e bolhas (f06), células e erros (f07), subida (f08), cortes de profissão (f09), sino (f10), passos da criança (f11), vento (f12). Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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
r = np.random.default_rng(3)
# f01 / f13: chama da vela (ar suave) + brilho em "nunca mais envelheceria"
add(C['f01'], env(agua(5.0, 0.05), 0.4, 0.8), 0.06); add(C['f01'] + 3.4, shimmer(1.6, True), 0.2)
add(C['f13'], env(agua(7.6, 0.05), 0.6, 1.0), 0.06); add(C['f13'] + 5.1, shimmer(1.8, True), 0.2)
# f02: itens surgindo e sendo riscados
for dt in [0.1, 0.47, 1.32]: add(C['f02'] + dt, clique(0.08, 900), 0.2)
for dt in [2.25, 2.4, 2.55]: add(C['f02'] + dt, env(agua(0.25, 0.5), 0.02, 0.15), 0.18)
# f03: monitor do hospital + itens
for i in range(7): add(C['f03'] + 0.3 + i * 0.85, tique(1000), 0.18)
for dt in [2.07, 2.67, 3.82]: add(C['f03'] + dt, thud(80, 0.4), 0.25)
# f04: pontos surgindo, o ponto laranja
for i in range(12): add(C['f04'] + 0.45 + i * 0.07, tique(1600 + i * 60), 0.05)
add(C['f04'] + 3.69, ping(990), 0.35)
# f05: séculos acendendo em escada
for i in range(10): add(C['f05'] + 1.73 + i * 0.186, tique(900 + i * 110), 0.14)
add(C['f05'] + 3.6, thud(60, 0.6), 0.3)
# f06: água do aquário e bolhas, depois terra
add(C['f06'], env(agua(2.9, 0.03), 0.3, 0.5), 0.2)
for dt in np.sort(r.uniform(0.2, 2.8, 10)): add(C['f06'] + dt, bolha(380 + r.uniform(0, 400)), 0.1)
for i in range(5): add(C['f06'] + 3.1 + i * 0.22, clique(0.05, 300), 0.1)
# f07: células se dividindo, erros no DNA
for i in range(4): add(C['f07'] + 1.2 + i * 0.25, bolha(300), 0.15)
for n in range(7): add(C['f07'] + 3.31 + n * 0.22, tique(3000 - n * 150), 0.15)
# f08: curva subindo (brilho), ramo que achata (grave)
add(C['f08'] + 0.3, shimmer(2.0, True), 0.16); add(C['f08'] + 2.9, shimmer(1.4, False), 0.14)
# f09: cortes secos de profissão + contador até 10
for dt in [2.0, 3.3, 3.95]: add(C['f09'] + dt, thud(110, 0.3), 0.3)
for i in range(6): add(C['f09'] + 3.95 + i * 0.06, tique(2000 + i * 100), 0.12)
# f10: sino do casamento + "mil anos"
add(C['f10'] + 1.9, sino(880), 0.25); add(C['f10'] + 4.74, thud(55, 0.7), 0.3)
# f11: passos da criança + ping em "tataranetos"
for i in range(7): add(C['f11'] + 2.3 + i * 0.2, clique(0.06, 220), 0.15)
add(C['f11'] + 4.06, ping(1320), 0.25)
# f12: vento suave no espaço e brilho do planeta esverdeando
add(C['f12'], env(agua(5.6, 0.02), 0.6, 0.8), 0.15); add(C['f12'] + 2.75, shimmer(2.2, True), 0.16)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
