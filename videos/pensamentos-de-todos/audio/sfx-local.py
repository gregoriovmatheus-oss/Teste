"""sfx-local.py: efeitos sintetizados localmente (sem API) para "pensamentos de todos".
Whoosh em cada corte; ronco do metrô (f01/f02/f13); brilho quando os pensamentos explodem (f01); burburinho de festa e
"foco" (f04); vozes sobrepostas (f05); tilintar dos slots e vidro quebrando (f06); subida para o estádio e rugido da
torcida (f07); rajadas no túnel mental (f09); zumbido abafado (f10); vento no telhado (f12). Saída: assets/audio/sfx.wav."""
import json, numpy as np, wave
SR = 48000
v = json.load(open('video.json')); DUR = v['duracao']
out = np.zeros(int(SR * (DUR + 3)))
rng = np.random.default_rng(7)
C = {c['id']: c['inicio'] for c in v['cenas']}
def lp(x, a):
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
    return (tone + lp(rng.standard_normal(n), 0.06) * np.exp(-k * 12) * 1.5) / 2
def shimmer(d=1.6, sobe=True):
    n = int(SR * d); k = np.linspace(0, 1, n); s = np.zeros(n)
    for f in [880, 1320, 1760, 2640, 3520]:
        fr = f * (1 + (0.35 * k if sobe else 0.35 * (1 - k)))
        s += np.sin(2 * np.pi * np.cumsum(fr) / SR + f) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * k + f))
    return (s / 5 + lp(rng.standard_normal(n), 0.4) * 0.6) * np.sin(np.pi * k) ** 1.2
def ding(f=1320, d=0.5):
    n = int(SR * d); k = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * k) + 0.4 * np.sin(2 * np.pi * f * 2.76 * k)) * np.exp(-k * 9)
def estalo():
    n = int(SR * 0.07); k = np.arange(n) / SR
    return rng.standard_normal(n) * np.exp(-k * 120)
def ruido(d, a=0.05):
    x = lp(rng.standard_normal(int(SR * d)), a); return x / (np.abs(x).max() + 1e-9)
def env(sig, a=0.3, r=0.6):
    n = len(sig); e = np.ones(n); na, nr = int(SR * a), int(SR * r)
    e[:na] = np.linspace(0, 1, na); e[n - nr:] = np.linspace(1, 0, nr); return sig * e
def trem(d):  # ronco grave do metrô com batidas dos trilhos
    n = int(SR * d); k = np.arange(n) / SR
    s = ruido(d, 0.015) * 0.8 + np.sin(2 * np.pi * 48 * k) * 0.25
    for tb in np.arange(0.3, d, 0.9):
        add_i = int(tb * SR); m = min(n - add_i, int(SR * 0.12))
        if m > 0: s[add_i:add_i + m] += np.sin(2 * np.pi * 90 * k[:m]) * np.exp(-k[:m] * 40) * 0.6
    return s
def burburinho(d, dens=1.0):  # vozes sem palavras: formantes modulados
    n = int(SR * d); k = np.arange(n) / SR; s = np.zeros(n)
    for j in range(int(6 * dens)):
        f = 140 + rng.uniform(0, 120); am = (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(3, 6) * k + j)) ** 2
        s += np.sin(2 * np.pi * np.cumsum(f * (1 + 0.05 * np.sin(2 * np.pi * 2 * k + j))) / SR) * am
    return lp(s, 0.2) / (np.abs(s).max() + 1e-9)

for c in v['cenas'][1:]:
    add(c['inicio'] - 0.38, whoosh(), 0.5)
# f01-f02: metrô andando; f01 os pensamentos explodem em "escuta tudo"
add(C['f01'], env(trem(C['f03']), 0.2, 0.5), 0.3)
add(C['f01'] + 1.85, shimmer(1.8, True), 0.4)
add(C['f01'] + 1.85, thud(55, 1.0), 0.35)
add(C['f01'] + 2.3, env(burburinho(3.0, 1.5), 0.5, 0.5), 0.18)
for k, dt in enumerate([3.77, 4.04, 4.44]): add(C['f02'] + dt, ding(1100 + 220 * k, 0.4), 0.12)
# f03: rajadas do pensamento (cliques rápidos)
for dt in np.arange(5.95, 8.6, 1 / 12):
    add(C['f03'] + dt + rng.uniform(0, 0.03), estalo(), 0.06)
# f04: festa, depois o foco: o resto abafa
add(C['f04'], env(burburinho(2.9, 2), 0.3, 0.3), 0.3)
add(C['f04'] + 2.9, env(lp(burburinho(4.0, 2), 0.05), 0.05, 0.8), 0.25)
add(C['f04'] + 2.85, shimmer(1.0, False), 0.25)
# f05: 1, 2 e 3 vozes se somando; compreensão despenca
for dt, d in [(0.0, 5.8), (2.26, 3.6), (2.73, 3.1)]: add(C['f05'] + dt, env(burburinho(d, 0.7), 0.2, 0.5), 0.15)
add(C['f05'] + 5.1, thud(45, 0.8), 0.4)
# f06: itens entrando nos slots e vidro quebrando
for k, dt in enumerate([1.45, 1.75, 2.05, 2.3]): add(C['f06'] + dt, ding(880 + 110 * k, 0.35), 0.15)
add(C['f06'] + 3.3, thud(70, 0.5), 0.4)
for dt in np.sort(rng.uniform(3.3, 3.8, 18)): add(C['f06'] + dt, estalo(), 0.18)
# f07: subida rápida e torcida em tempestade
add(C['f07'] + 2.75, whoosh(0.7), 0.5)
add(C['f07'] + 3.37, env(ruido(3.2, 0.12), 0.8, 0.6), 0.35)
add(C['f07'] + 5.45, env(burburinho(1.2, 3), 0.3, 0.5), 0.2)
# f08: rua: passos e cidade
add(C['f08'], env(ruido(6.8, 0.03), 0.4, 0.6), 0.15)
# f09: túnel mental acelerando
add(C['f09'] + 0.2, env(ruido(5.0, 0.1), 1.5, 0.3), 0.3)
add(C['f09'] + 3.6, whoosh(1.5), 0.45)
add(C['f09'] + 3.6, env(burburinho(1.7, 3), 0.1, 0.3), 0.22)
# f10: zumbido que engole o próprio pensamento
add(C['f10'], env(lp(burburinho(3.4, 3), 0.08), 0.3, 0.5), 0.3)
# f11: rua esvaziando
add(C['f11'], env(burburinho(4.0, 1.5) * np.linspace(1, 0, int(SR * 4.0)), 0.1, 1.0), 0.18)
# f12: vento no telhado
add(C['f12'], env(ruido(4.1, 0.01), 0.6, 0.8), 0.25)
# f13: metrô desacelerando, fios apagando
add(C['f13'], env(trem(7.2), 0.2, 2.5), 0.22)
add(C['f13'] + 4.5, env(thud(40, 2.5), 0.05, 2.0), 0.3)

out = out[: int(SR * DUR)]
out = np.tanh(out * 1.2) * 0.8
pcm = (out * 32767).astype('<i2')
w = wave.open('assets/audio/sfx.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('ok', len(out) / SR)
