"""sfx-local.py: efeitos sintetizados localmente (sem API) para "E se todos os desertos virassem florestas?".
Whoosh em cada corte; vento na duna e o verde chegando (f01/f13), desertos acendendo (f02), lago (f03),
gotas, trovão e chuva (f04), moléculas puxadas (f05), pássaros e água (f06), raios de sol (f07), calor (f08),
vento da poeira (f09), pó caindo (f10), bichos (f11), pás e faixa crescendo (f12). Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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
def vento(d, a=0.04):  # vento na areia: ruído grave com rajadas
    n = int(SR * d); k = np.arange(n) / SR
    x = lp(rng.standard_normal(n), a) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * k) * np.sin(2 * np.pi * 0.11 * k + 1))
    return x / (np.abs(x).max() + 1e-9)
def piu(f0=3200, d=0.12):  # canto curto de pássaro
    n = int(SR * d); k = np.linspace(0, 1, n)
    f = f0 * (1 + 0.35 * np.sin(np.pi * k))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * k) ** 2
def gota(f=1400):
    n = int(SR * 0.09); k = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 2.5 * np.exp(-k * 60))) / SR) * np.exp(-k * 45)
def ronco_baixo(d, f0=40):
    n = int(SR * d); k = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * k + 2 * np.sin(2 * np.pi * 0.7 * k)) * 0.6 + lp(rng.standard_normal(n), 0.01) * 3) * np.sin(np.pi * k / d)

# f01: vento na duna; o verde chega (brilho subindo + whoosh) e pássaros
add(C['f01'], env(vento(5.8), 0.05, 0.6), 0.35)
add(C['f01'] + 3.6, whoosh(1.2), 0.45)
add(C['f01'] + 3.9, shimmer(2.0, True), 0.35)
for i, dt in enumerate([4.9, 5.1, 5.35]): add(C['f01'] + dt, piu(2800 + 400 * i), 0.18)
# f02: desertos acendem (tique) e viram floresta (brilho)
add(C['f02'] + 0.3, env(thud(40, 1.8), 0.3, 1.2), 0.3)
add(C['f02'] + 1.8, tique(1800), 0.3)
add(C['f02'] + 4.25, shimmer(1.6, True), 0.35)
# f03: rocha → vale: água do lago, pássaros, bufo do hipopótamo
add(C['f03'] + 0.1, env(vento(2.8, 0.02), 0.2, 0.8), 0.15)
add(C['f03'] + 2.7, env(agua(3.6, 0.08), 0.8, 0.6), 0.18)
for dt in [3.2, 3.5, 4.1]: add(C['f03'] + dt, piu(3400), 0.15)
add(C['f03'] + 5.3, thud(55, 0.7), 0.45)
# f04: gotas subindo, vapor, trovão e chuva
for i in range(10): add(C['f04'] + 1.2 + i * 0.17, gota(1100 + 90 * i), 0.18)
add(C['f04'] + 2.2, env(agua(1.6, 0.5), 0.5, 0.6), 0.15)
add(C['f04'] + 4.0, env(ronco_baixo(1.8, 34), 0.05, 1.0), 0.45)
add(C['f04'] + 4.6, env(chuva(1.4), 0.2, 0.3), 0.35)
# f05: mudas brotando; moléculas puxadas para as copas
add(C['f05'] + 0.1, shimmer(1.8, True), 0.28)
for i in range(6): add(C['f05'] + 2.0 + i * 0.22, whoosh(0.35), 0.18)
add(C['f05'] + 3.9, tique(2000), 0.25)
# f06: pássaros, risadinha de vento nas folhas e água
add(C['f06'], env(vento(5.3, 0.12), 0.3, 0.6), 0.1)
for dt in [0.4, 0.7, 1.5, 2.3, 3.8, 4.4]: add(C['f06'] + dt, piu(3000 + 300 * (dt % 1)), 0.15)
add(C['f06'] + 2.9, env(agua(2.0, 0.12), 0.3, 0.8), 0.2)
# f07: raios chegando (tom) e luz devolvida (brilho subindo)
add(C['f07'] + 0.3, env(np.sin(2 * np.pi * 660 * np.arange(int(SR * 1.1)) / SR), 0.3, 0.6), 0.08)
add(C['f07'] + 1.3, env(thud(45, 1.0), 0.1, 0.6), 0.25)
add(C['f07'] + 3.3, shimmer(1.5, True), 0.35)
# f08: calor subindo (ronco grave)
add(C['f08'] + 1.4, env(ronco_baixo(4.4, 46), 0.6, 1.0), 0.35)
# f09: vento longo da poeira atravessando o oceano
add(C['f09'] + 0.8, env(vento(3.4, 0.08), 0.6, 1.0), 0.4)
add(C['f09'] + 0.9, whoosh(1.6), 0.35)
add(C['f09'] + 3.1, tique(1800), 0.25)
# f10: pó caindo (tiques finos) que para; grave no fim
for i in range(14): add(C['f10'] + 0.05 + i * 0.09, tique(3200 + 180 * (i % 4)), 0.08 * (1 - i / 14))
add(C['f10'] + 3.1, env(thud(36, 2.0), 0.3, 1.4), 0.35)
# f11: vento, passos do camelo, guincho do feneco, clique do escorpião, mata crescendo
add(C['f11'], env(vento(5.3), 0.1, 0.6), 0.25)
for i in range(6): add(C['f11'] + 0.2 + i * 0.6, thud(80, 0.2), 0.15)
add(C['f11'] + 1.85, piu(1800, 0.18), 0.2)
add(C['f11'] + 2.3, clique(0.1, 900), 0.35)
add(C['f11'] + 2.8, shimmer(2.2, False), 0.25)
# f12: pás cavando e faixa verde crescendo
for i in range(8): add(C['f12'] + 0.3 + i * 0.6, estalo(), 0.2)
add(C['f12'] + 2.0, shimmer(3.4, True), 0.3)
add(C['f12'] + 4.3, tique(2000), 0.25)
# f13: vento calmo de fim de tarde; acorde suave no fecho
add(C['f13'], env(vento(7.4), 0.2, 1.5), 0.3)
add(C['f13'] + 4.3, shimmer(2.6, True), 0.25)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
