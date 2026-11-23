"""sfx-local.py: efeitos sintetizados localmente (sem API) para "humanos hibernam".
Whoosh em cada corte; vento e neve, folhas do calendário (f01), coração do urso 50→10 bpm (f02), insetos (f03),
queda do metabolismo (f04), chama (f05), relógio freando (f06), monitor e frio (f07), motor e cápsulas (f08),
encolher e carga sumindo (f09), cliques de pausa (f10), passos na neve (f11), notificações (f12), pássaros (f13).
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
def tique(f=2400, d=0.03):
    n = int(SR * d); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.exp(-k * 220)
def vento(d, a=0.03):
    n = int(SR * d); x = lp(rng.standard_normal(n), a); k = np.linspace(0, 1, n)
    x = x * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * k * d)); return x / (np.abs(x).max() + 1e-9)
def folha():  # papel virando
    n = int(SR * 0.16); k = np.arange(n) / SR
    return lp(rng.standard_normal(n), 0.5) * np.sin(np.pi * k / k[-1]) ** 2
def bipe(f=1000, d=0.12):
    n = int(SR * d); k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * np.minimum(1, k * 200) * np.exp(-k * 12)
def passo_neve():
    n = int(SR * 0.14); k = np.arange(n) / SR
    return lp(rng.standard_normal(n), 0.25) * np.exp(-k * 30)
def piu(f0=3200):  # pássaro: varredura curta
    n = int(SR * 0.09); k = np.linspace(0, 1, n)
    f = f0 * (1 + 0.4 * np.sin(np.pi * k)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * k)
# f01: vento de inverno, janela fechando, calendário virando, brilho em "três meses"
add(C['f01'], env(vento(5.9), 0.6, 0.8), 0.18)
add(C['f01'] + 1.9, clique(0.12, 300), 0.35)
for dt in (3.3, 3.55, 3.8): add(C['f01'] + dt, folha(), 0.5)
add(C['f01'] + 4.3, shimmer(1.4, True), 0.25)
# f02: vento + coração do urso: 50 bpm até 4,1 s, cai até 10 bpm em 6,15 s
add(C['f02'], env(vento(6.6, 0.02), 0.4, 0.6), 0.15)
ph, t = 0.0, 2.3
while t < 6.6:
    bpm = 50 + (10 - 50) * min(1, max(0, (t - 4.1) / 2.05))
    ph += bpm / 60 / 200; t += 1 / 200
    if ph >= 1: ph -= 1; add(C['f02'] + t, batida(), 0.45)
# f03: insetos da noite em Madagascar
r = np.random.default_rng(5)
for dt in np.sort(r.uniform(0.2, 5.5, 40)): add(C['f03'] + dt, tique(4200 + r.uniform(0, 1200), 0.02), 0.04)
# f04: metabolismo despencando (tom caindo) e grave em "um quarto"
add(C['f04'] + 1.3, env(zumbido_cai(1.4), 0.1, 0.4), 0.4)
add(C['f04'] + 2.08, thud(45, 1.0), 0.45)
# f05: chama acende e crepita
add(C['f05'] + 3.35, whoosh(0.6), 0.4)
add(C['f05'] + 3.5, env(agua(1.5, 0.2), 0.2, 0.6), 0.12)
for dt in np.sort(r.uniform(3.6, 5.0, 10)): add(C['f05'] + dt, estalo(), 0.15)
# f06: relógio: tiques que freiam até quase parar
t, iv = 0.6, 0.12
while t < 5.6:
    add(C['f06'] + t, tique(1500, 0.04), 0.2); t += iv; iv = iv * (1.35 if t > 1.2 else 1.0)
# f07: monitor (bipe lento) e chiado do frio
for i in range(5): add(C['f07'] + 0.3 + i * 1.15, bipe(980), 0.15)
add(C['f07'] + 3.0, env(agua(2.6, 0.45), 0.6, 0.5), 0.12)
# f08: motor da nave; no corte para dentro, zumbido das cápsulas
add(C['f08'], env(thud(32, 3.7), 0.3, 1.0), 0.35)
n = int(SR * 4.4); k = np.arange(n) / SR
add(C['f08'] + 3.8, env(np.sin(2 * np.pi * 110 * k) * 0.5 + np.sin(2 * np.pi * 165 * k) * 0.25, 0.4, 0.8), 0.12)
add(C['f08'] + 5.99, shimmer(1.6, False), 0.2)
# f09: nave encolhendo; caixas e tambores sumindo
add(C['f09'] + 1.35, shimmer(0.8, False), 0.35)
for dt in np.linspace(2.65, 3.9, 10): add(C['f09'] + dt, clique(0.06, 900), 0.12)
# f10: vento na cidade; cliques de "pausado"; grave nos 3 meses
add(C['f10'], env(vento(5.8), 0.5, 0.6), 0.16)
for dt in (1.85, 2.36, 3.08): add(C['f10'] + dt, clique(0.1, 520), 0.3)
add(C['f10'] + 4.84, thud(40, 1.0), 0.35)
# f11: passos do vigia na neve
for i in range(7): add(C['f11'] + 0.2 + i * 0.45, passo_neve(), 0.3)
add(C['f11'], env(vento(3.5), 0.3, 0.5), 0.12)
# f12: acordar (grave lento) e notificações chegando
add(C['f12'] + 0.1, env(thud(36, 1.6), 0.4, 1.0), 0.3)
for dt in (3.07, 3.38, 3.75, 3.94, 4.48): add(C['f12'] + dt, bipe(1760, 0.09), 0.22)
# f13: primavera: pássaros e brilho final
for dt in (0.3, 0.45, 1.6, 1.75, 2.9, 4.2, 4.33): add(C['f13'] + dt, piu(2800 + 600 * (dt % 1)), 0.12)
add(C['f13'] + 3.69, shimmer(2.2, True), 0.25)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
