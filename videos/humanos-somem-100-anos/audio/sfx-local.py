"""sfx-local.py: efeitos sintetizados localmente (sem API) para "humanos somem 100 anos".
Whoosh em cada corte; brilho subindo quando as pessoas somem (f01) e reaparecem (f11); estalos da rede caindo (f03);
água correndo no metrô (f04); asfalto rachando (f05); uivo (f06); concreto trincando (f07); telhado e ponte caindo (f08);
rumor da represa (f09); cortina (f13) e respiro grave no fim (f14). Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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
# f01: mergulho da órbita (whoosh longo), piscar e pessoas virando poeira de luz em câmera lenta
add(C['f01'] + 1.2, whoosh(1.0), 0.45)
add(C['f01'] + 3.05, shimmer(1.8, True), 0.35)
add(C['f01'] + 3.1, thud(55, 1.0), 0.35)
# f02: semáforo trocando (clique seco) no silêncio
for dt in [1.3, 3.3, 4.0]:
    add(C['f02'] + dt, clique(0.1, 900), 0.15)
# f03: rede caindo: zumbido morrendo + estalos de cada prédio apagando
add(C['f03'] + 3.2, zumbido_cai(3.0), 0.5)
r = np.random.default_rng(3)
for dt in np.sort(r.uniform(3.3, 6.1, 14)):
    add(C['f03'] + dt, clique(0.12, 120 + r.uniform(0, 80)), 0.35)
# f04: goteiras e, sem as bombas, a água correndo forte
for dt in np.arange(0.3, 7.4, 0.37):
    add(C['f04'] + dt + r.uniform(0, 0.15), clique(0.05, 1400 + r.uniform(0, 900)), 0.08)
add(C['f04'] + 0.5, env(agua(5.6, 0.05), 1.0, 0.4), 0.12)
add(C['f04'] + 6.1, env(agua(1.5, 0.2), 0.3, 0.4), 0.4)
for i in range(5):
    add(C['f04'] + 6.12 + i * 0.12, clique(0.1, 300), 0.2)
# f05: asfalto rachando (estalos em rajada)
for dt in np.sort(r.uniform(1.6, 3.0, 22)):
    add(C['f05'] + dt, estalo(), 0.25)
# f06: uivo distante quando chegam os outros lobos
add(C['f06'] + 3.2, uivo(1.8), 0.22)
# f07: concreto trincando
add(C['f07'] + 4.6, thud(90, 0.5), 0.4)
for dt in np.sort(r.uniform(4.6, 5.5, 14)):
    add(C['f07'] + dt, estalo(), 0.22)
# f08: telhado cai, ponte desaba e respingo
add(C['f08'] + 1.25, thud(60, 0.8), 0.7)
add(C['f08'] + 2.6, estalo(), 0.3)
add(C['f08'] + 3.15, thud(50, 0.8), 0.7)
add(C['f08'] + 3.15, env(agua(0.7, 0.3), 0.02, 0.5), 0.35)
# f09: rumor da represa (vertedouro)
add(C['f09'], env(agua(4.4, 0.04), 0.4, 0.6), 0.25)
# f11: flash do retorno
add(C['f11'] + 0.55, whoosh(0.5), 0.5)
add(C['f11'] + 0.7, shimmer(1.2, False), 0.4)
add(C['f11'] + 0.72, thud(48, 1.2), 0.45)
# f13: cortina passando
add(C['f13'] + 0.3, whoosh(2.8), 0.3)
# f14: corte para o espaço e respiro grave
add(C['f14'] + 3.1, whoosh(0.7), 0.45)
add(C['f14'] + 3.3, env(thud(40, 3.0), 0.05, 2.0), 0.4)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
