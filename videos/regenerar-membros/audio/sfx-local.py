"""sfx-local.py: efeitos sintetizados localmente (sem API) para "E se os humanos pudessem regenerar membros?".
Whoosh em cada corte; brilho da mão crescendo (f01/f13), bolhas e coração do axolote (f02), fígado (f03), células (f04/f05),
calendário e pratos (f06), bipe de monitor (f07), passos e dente (f08), alarme do câncer (f09), alavanca do freio (f10),
memórias apagando (f11), cicatriz (f12). Saída: assets/audio/sfx.wav (mono 48 kHz)."""
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
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 3 * k)) / SR) * np.exp(-k * 50)
def tom(f, d, am=0):
    n = int(SR * d); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * (1 - am + am * np.sin(2 * np.pi * 4 * k)) * np.minimum(1, k * 30) * np.minimum(1, (d - k) * 20)
r = np.random.default_rng(5)
# f01: impacto abafado do acidente; zumbido baixo; brilho subindo quando a mão cresce
add(C['f01'] + 0.05, thud(40, 1.4), 0.55)
add(C['f01'] + 0.3, env(zumbido_cai(2.6), 0.5, 0.8), 0.18)
add(C['f01'] + 2.5, shimmer(2.4, True), 0.4)
for i in range(4): add(C['f01'] + 3.25 + i * 0.14, tique(2600 + i * 300), 0.12)
# f02: bolhas debaixo d'água; brilho na pata; coração
add(C['f02'] + 0.05, env(agua(6.7, 0.05), 0.4, 0.6), 0.12)
for dt in np.sort(r.uniform(0.2, 6.5, 14)): add(C['f02'] + dt, bolha(r.uniform(350, 800)), 0.12)
add(C['f02'] + 3.8, shimmer(1.2, True), 0.3)
for i in range(2): add(C['f02'] + 4.75 + i * 0.8, batida(), 0.4)
# f03: o fígado perde 2/3 (brilho descendo) e cresce de volta (subindo)
add(C['f03'] + 2.45, shimmer(0.6, False), 0.3)
add(C['f03'] + 2.5, thud(50, 0.6), 0.35)
add(C['f03'] + 3.0, shimmer(2.1, True), 0.35)
add(C['f03'] + 5.16, tique(1800), 0.25)
# f04: células surgindo (estalinhos) e virando jovens (brilho)
for dt in np.sort(r.uniform(0.15, 1.3, 18)): add(C['f04'] + dt, tique(r.uniform(2500, 4200)), 0.05)
add(C['f04'] + 3.9, shimmer(1.6, True), 0.35)
add(C['f04'] + 4.4, env(agua(1.8, 0.2), 0.4, 0.8), 0.1)
# f05: divisões acelerando; um clique para cada camada
for dt in 0.65 + np.log2(np.arange(1, 200)) * 0.2:
    if dt < 2.6: add(C['f05'] + dt, tique(3000), 0.04)
for dt in [2.92, 3.7, 4.3, 4.92]: add(C['f05'] + dt, clique(0.12, 600), 0.3); add(C['f05'] + dt, thud(70, 0.3), 0.2)
# f06: calendário virando; pratos empilhando
for i in range(8): add(C['f06'] + 0.4 + i * 0.27, estalo(), 0.2)
for i in range(9): add(C['f06'] + 2.6 + i * 0.38, tique(3400), 0.18)
# f07: bipe do monitor; brilho do curativo
for i in range(7): add(C['f07'] + 0.3 + i, tom(1000, 0.12), 0.08)
add(C['f07'] + 2.7, shimmer(2.0, True), 0.25)
# f08: passos de corrida; dente nascendo; bocejo
for i in range(9): add(C['f08'] + 0.1 + i * 0.29, clique(0.07, 140), 0.25)
add(C['f08'] + 3.0, shimmer(1.8, True), 0.3)
add(C['f08'] + 5.4, env(uivo(1.1) * 0.5, 0.3, 0.5), 0.12)
# f09: pulsos acelerando + alarme
for i in range(10): add(C['f09'] + 1.3 + 2.6 * (1 - np.exp(-i * 0.35)), batida(), 0.3)
add(C['f09'] + 2.8, tom(660, 1.7, 0.5), 0.1)
add(C['f09'] + 4.4, thud(45, 0.8), 0.45)
# f10: alavanca liga e desliga
add(C['f10'] + 2.86, clique(0.12, 400), 0.5); add(C['f10'] + 2.9, tom(880, 0.25), 0.15)
add(C['f10'] + 3.0, env(agua(1.0, 0.25), 0.2, 0.3), 0.12)
add(C['f10'] + 4.01, clique(0.12, 300), 0.5); add(C['f10'] + 4.05, thud(55, 0.5), 0.35); add(C['f10'] + 4.05, tom(330, 0.3), 0.12)
# f11: memórias se apagam
add(C['f11'] + 1.9, shimmer(1.6, False), 0.35)
add(C['f11'] + 2.0, env(thud(36, 2.0), 0.2, 1.4), 0.4)
# f12: cicatriz fechando; tiques das vantagens
add(C['f12'] + 0.4, shimmer(1.6, True), 0.2)
for dt in [3.27, 4.24, 4.76]: add(C['f12'] + dt, tique(2000), 0.22)
# f13: o mapa acende por dentro da mão
add(C['f13'] + 2.9, shimmer(2.6, True), 0.3)
add(C['f13'] + 5.2, env(thud(40, 1.4), 0.3, 1.0), 0.25)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
