// cinema.js: câmera, luz, clima, efeitos, céu, água, cenários e bichos para o padrão R11 "cinematográfico".
// Use junto com lowpoly.js (META "imports": ["lowpoly", "cinema"] -> LOWPOLY e CINEMA). Tudo determinístico (só t e seed).
import * as THREE from "../three.module.js";
import { mat, matTecido, contorno, facetado, mulberry32, olhoDe, COR } from "./lowpoly.js";

const L = (a, b, k) => a + (b - a) * k, sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const halo = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.4, "rgba(255,255,255,0.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const brilho = (cor, k = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(k) });

// ===================== CÂMERA (66–70) =====================
// trilho: interpola posição e alvo por pontos-chave [[t, [x,y,z], [ax,ay,az]], ...] com curva suave (Catmull-Rom) e easing entre chaves
export function trilho(cam, t, chaves, { mao = 0, seed = 1 } = {}) {
  const n = chaves.length; let i = 0; while (i < n - 2 && t > chaves[i + 1][0]) i++;
  const a = chaves[Math.max(0, i - 1)], b = chaves[i], c = chaves[Math.min(n - 1, i + 1)], d = chaves[Math.min(n - 1, i + 2)];
  const u = sm((t - b[0]) / Math.max(1e-4, c[0] - b[0]));
  const cr = (k) => { const p0 = new THREE.Vector3(...a[k]), p1 = new THREE.Vector3(...b[k]), p2 = new THREE.Vector3(...c[k]), p3 = new THREE.Vector3(...d[k]);
    return new THREE.CatmullRomCurve3([p0, p1, p2, p3], false, "centripetal").getPoint((1 + u) / 3); };
  cam.position.copy(cr(1)); cam.lookAt(cr(2));
  if (mao) { const r = mulberry32(seed); const o = [r() * 6, r() * 6]; cam.rotation.x += mao * 0.004 * Math.sin(t * 1.3 + o[0]); cam.rotation.y += mao * 0.004 * Math.sin(t * 1.1 + o[1]); }
}
export const orbita = (cam, t, { centro = [0, 1.5, 0], raio = 2, alt = 1.5, vel = 0.2, ang0 = 0 } = {}) => { const a = ang0 + t * vel; cam.position.set(centro[0] + Math.sin(a) * raio, alt, centro[2] + Math.cos(a) * raio); cam.lookAt(...centro); };
// dolly zoom (efeito vertigem): a câmera anda para trás e o fov fecha mantendo o alvo do mesmo tamanho
export function dollyZoom(cam, alvo, k, { dist0 = 1.2, dist1 = 3.5, largura = 0.9 } = {}) {
  const e = sm(k), d = L(dist0, dist1, e), dir = cam.position.clone().sub(alvo).normalize();
  cam.position.copy(alvo).add(dir.multiplyScalar(d)); cam.fov = 2 * Math.atan(largura / (2 * d)) * 180 / Math.PI * 1.78; cam.updateProjectionMatrix(); cam.lookAt(alvo);
}
// desfoque de movimento: passe a velocidade de tela (ex.: chicote de câmera); 0 desliga
export const movimento = (st, vx = 0, vy = 0) => st.U.mov.value.set(vx, vy);
// troca de foco entre dois rostos (k 0 → a, 1 → b)
export const focoEntre = (st, a, b, k) => { st.U.foco.value = L(st.cam.position.distanceTo(a), st.cam.position.distanceTo(b), sm(k)); };
// regra dos terços: coloca o alvo no terço de cima (rosto) ou no centro, mantendo a câmera onde está
export function enquadrar(cam, alvo, { terco = "cima", lado = 0 } = {}) {
  cam.lookAt(alvo); const off = terco === "cima" ? 0.33 : terco === "baixo" ? -0.33 : 0; const v = (cam.fov * Math.PI) / 180;
  cam.rotateX(-off * v * 0.5); cam.rotateY(lado * v * 0.28);
}

// plano: enquadramento pronto em 1 linha. alvo = rosto (vec3); k = progresso da cena (t / D). Inclui movimento lento, câmera na mão e foco.
// tipo: "close" (push-in no rosto) | "extremo" (olhos) | "medio" (cintura pra cima) | "aberto" (corpo e cenário) | "ombro" (por cima do ombro, passe de: vec3 do outro)
//       | "baixo" (contra-plongée, herói/ameaça) | "alto" (plongée, pequeno/sozinho) | "orbita" (gira 40° em volta)
// lado: -1/1 escolhe o lado do rosto. Rosto fica no terço de cima, longe da zona do título.
const _p = new THREE.Vector3(), _l = new THREE.Vector3();
const PLANOS = { extremo: [0.5, 0.42, 0, -0.03], close: [1.0, 0.82, 0.02, -0.02], medio: [1.9, 1.6, -0.05, 0.05], aberto: [3.6, 3.1, 0.3, 0.25],
  baixo: [1.5, 1.3, -0.6, -0.05], alto: [2.4, 2.1, 1.7, 0.1], ombro: [1.3, 1.15, 0.05, 0], orbita: [1.3, 1.3, 0.05, 0] };
export function plano(st, alvo, t, k, tipo = "close", { lado = 1, de = null, mao = 1, seed = 1, desfoque = true } = {}) {
  const [d0, d1, h, dy] = PLANOS[tipo] || PLANOS.close, e = sm(k), d = L(d0, d1, e);
  let ang = lado * 0.42;
  if (tipo === "orbita") ang = lado * L(-0.35, 0.35, e);
  if (tipo === "ombro" && de) { _p.copy(de).sub(alvo).setY(0).normalize(); ang = Math.atan2(_p.x, _p.z) + lado * 0.2; }
  _p.set(alvo.x + Math.sin(ang) * d, alvo.y + h * (tipo === "baixo" ? 1 : Math.min(1, d)), alvo.z + Math.cos(ang) * d);
  st.cam.position.copy(_p); _l.copy(alvo); _l.y -= dy + d * 0.1; st.cam.lookAt(_l);
  if (mao) { const r = mulberry32(seed * 17 + 5), a = [r() * 6, r() * 6, r() * 6];
    st.cam.rotation.x += mao * (0.0045 * Math.sin(t * 1.3 + a[0]) + 0.002 * Math.sin(t * 3.7 + a[1]));
    st.cam.rotation.y += mao * (0.0045 * Math.sin(t * 1.1 + a[1]) + 0.002 * Math.sin(t * 4.1 + a[2])); }
  if (desfoque) { st.U.foco.value = st.cam.position.distanceTo(alvo); st.U.faixa.value = Math.max(0.25, d * 0.45); }
}

// ===================== LUZ (73–77) =====================
// luz prática: "abajur" | "celular" | "vela" | "tv" | "poste" — objeto que brilha + luz pontual; devolve {g, luz, update(t)}
export function luzPratica(S, tipo, pos, { cor, forca = 1 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); S.add(g); let pl, up = () => {};
  if (tipo === "abajur") { cor = cor ?? 0xffc88a; const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.18, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2e2c8, emissive: cor, emissiveIntensity: 1.4, side: THREE.DoubleSide, flatShading: true })); cup.position.y = 0.4; g.add(cup);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 5), mat(0x3a3028)); h.position.y = 0.17; g.add(h); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.03, 8), mat(0x3a3028)); g.add(b);
    pl = new THREE.PointLight(cor, 5 * forca, 4, 1.6); pl.position.y = 0.38; }
  if (tipo === "celular") { cor = cor ?? 0xbfd8ff; const c = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.008), mat(0x111114, 0.3)); g.add(c); const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.125), brilho(cor, 2.2)); tela.position.z = 0.0045; g.add(tela);
    pl = new THREE.PointLight(cor, 1.6 * forca, 1.2, 2); pl.position.z = 0.12; }
  if (tipo === "vela") { cor = cor ?? 0xffa040; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), mat(0xf2ead8)); c.position.y = 0.06; g.add(c);
    const ch = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), brilho(cor, 4)); ch.scale.set(0.7, 1.8, 0.7); ch.position.y = 0.14; g.add(ch); pl = new THREE.PointLight(cor, 1.8 * forca, 2.5, 2); pl.position.y = 0.16;
    up = (t) => { const f = 0.85 + 0.1 * Math.sin(t * 13.1) + 0.06 * Math.sin(t * 29.7); pl.intensity = 1.8 * forca * f; ch.scale.y = 1.8 * f; }; }
  if (tipo === "tv") { cor = cor ?? 0x7fb0ff; const tv = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.52, 0.05), mat(0x0c0c0e, 0.3)); g.add(tv); const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.46), brilho(cor, 1.6)); tela.position.z = 0.026; g.add(tela);
    pl = new THREE.PointLight(cor, 3 * forca, 5, 1.6); pl.position.z = 0.4; up = (t) => { const f = 0.7 + 0.3 * Math.abs(Math.sin(t * 2.3) * Math.sin(t * 5.1 + 1)); pl.intensity = 3 * forca * f; tela.material.color.setHex(cor).multiplyScalar(1.6 * f); }; }
  if (tipo === "poste") { cor = cor ?? 0xffb060; const h = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 6), mat(0x2a2c30, 0.5)); h.position.y = 1.6; g.add(h);
    const lp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), brilho(cor, 3)); lp.position.set(0, 3.2, 0.25); g.add(lp); pl = new THREE.PointLight(cor, 10 * forca, 9, 1.5); pl.position.set(0, 3.1, 0.25); }
  g.add(pl); up(0); return { g, luz: pl, update: up };
}
// luz piscando: "raio" (relâmpago), "sirene" (vermelho/azul), "falha" (lâmpada ruim), "tv"
export function piscar(luz, t, tipo = "falha", base = null) {
  base = base ?? (luz.userData.base ??= luz.intensity);
  if (tipo === "raio") { const ph = t % 4.3; luz.intensity = base * (ph < 0.08 || (ph > 0.18 && ph < 0.24) ? 14 : 0.05); }
  else if (tipo === "sirene") { const a = Math.sin(t * 2 * Math.PI * 1.6); luz.color.setHex(a > 0 ? 0xff2a2a : 0x2a5aff); luz.intensity = base * (0.3 + 0.7 * Math.abs(a)); }
  else if (tipo === "falha") { const r = Math.sin(t * 37.3) * Math.sin(t * 11.1 + 2); luz.intensity = base * (r > 0.55 ? 0.1 : 1); }
  else luz.intensity = base * (0.7 + 0.3 * Math.abs(Math.sin(t * 2.3) * Math.sin(t * 5.1 + 1)));
}
// gobo: sombra de janela (grade) projetada pela luz principal; os caixilhos não aparecem na câmera, só a sombra
export function gobo(S, { pos = [-2, 2, 0], tam = [1.2, 1.6], barras = 3, girar = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = girar; S.add(g);
  const m = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  for (let i = 0; i <= barras; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, tam[1], 0.06), m); v.position.x = -tam[0] / 2 + (tam[0] * i) / barras; v.castShadow = true; g.add(v);
    const h = new THREE.Mesh(new THREE.BoxGeometry(tam[0], 0.06, 0.06), m); h.position.y = -tam[1] / 2 + (tam[1] * i) / barras; h.castShadow = true; g.add(h); }
  return g;
}
// chão molhado: reflexo falso (cópia espelhada de um grupo sob um chão semitransparente). Chame update() a cada quadro.
export function chaoMolhado(S, alvo, { cor = 0x0e1016, opac = 0.72, tam = 30 } = {}) {
  const ref = alvo.clone(true); ref.scale.y = -1; S.add(ref);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.15, metalness: 0.4, transparent: true, opacity: opac })); chao.rotation.x = -Math.PI / 2; chao.position.y = 0.001; chao.receiveShadow = true; S.add(chao);
  const copia = (a, b) => { b.position.copy(a.position); b.quaternion.copy(a.quaternion); b.scale.copy(a.scale); b.visible = a.visible; for (let i = 0; i < a.children.length; i++) if (b.children[i]) copia(a.children[i], b.children[i]); };
  return { chao, ref, update() { copia(alvo, ref); ref.position.y = -alvo.position.y; ref.scale.y = -alvo.scale.y; } };
}
// preenchimento que segue o rosto (luz suave do lado da câmera; evita rosto escuro em contraluz)
export function preenche(st, alvo, { forca = 0.8, cor = 0xffe2c8 } = {}) {
  if (!st._pre) { st._pre = new THREE.PointLight(cor, forca, 3, 2); st.S.add(st._pre); }
  st._pre.position.copy(st.cam.position).lerp(alvo, 0.35).add(new THREE.Vector3(0.3, 0.2, 0)); st._pre.intensity = forca;
}

// ===================== CLIMA DE COR E EXPOSIÇÃO (88, 91) =====================
const CLIMAS = { neutro: [[1, 1, 1], 0.92, 0.35], sepia: [[1.12, 0.98, 0.78], 0.55, 0.4], pesadelo: [[0.85, 0.95, 1.05], 0.5, 0.55], sonho: [[1.06, 0.98, 1.08], 0.8, 0.15],
  memoria: [[1.08, 1.0, 0.86], 0.65, 0.25], hospital: [[0.92, 1.05, 1.02], 0.75, 0.3], alerta: [[1.15, 0.9, 0.86], 1.0, 0.5] };
export function clima(st, nome) { const c = CLIMAS[nome]; if (!c) return; st.U.tinta.value.set(...c[0]); st.U.sat.value = c[1]; st.U.contraste.value = c[2]; if (nome === "sonho") { st.U.bloom.value = 1.6; st.U.desf.value *= 1.3; } }
export function respirarExposicao(st, t, { amp = 0.04, base = null } = {}) { base = base ?? (st._exb ??= st.exposicao); st.exposicao = base * (1 + amp * Math.sin(t * 0.8) + amp * 0.5 * Math.sin(t * 2.1)); }

// ===================== CÉU, PARTÍCULAS, FOGO, ÁGUA, VENTO (93–99) =====================
// céu: domo com gradiente (zênite/horizonte), estrelas opcionais e nuvens facetadas
export function ceu(S, { topo = 0x0b1a3a, horizonte = 0x6a5a8a, estrelas = 0, nuvens = 0, corNuvem = 0xd8d0e0, seed = 3 } = {}) {
  const g = new THREE.Group(); S.add(g);
  const dm = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { a: { value: new THREE.Color(topo) }, b: { value: new THREE.Color(horizonte) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 a, b; varying vec3 vP; void main(){ float k = pow(clamp(vP.y, 0.0, 1.0), 0.55); gl_FragColor = vec4(mix(b, a, k), 1.0); }" });
  const domo = new THREE.Mesh(new THREE.SphereGeometry(180, 24, 12), dm); domo.renderOrder = -10; g.add(domo); S.background = null;
  const r = mulberry32(seed);
  if (estrelas) { const pos = []; for (let i = 0; i < estrelas; i++) { const a = r() * 6.283, y = 0.08 + r() * 0.9, rr = Math.sqrt(1 - y * y); pos.push(Math.cos(a) * rr * 170, y * 170, Math.sin(a) * rr * 170); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false }))); }
  for (let i = 0; i < nuvens; i++) { const n = new THREE.Group(); const a = r() * 6.283, d = 60 + r() * 60; n.position.set(Math.cos(a) * d, 14 + r() * 18, Math.sin(a) * d - 30);
    for (let j = 0; j < 5; j++) { const b = new THREE.Mesh(facetado(1, () => {}, seed + i * 7 + j, 0.2), mat(corNuvem, 1)); b.scale.setScalar(3 + r() * 4); b.position.set((j - 2) * 4 + r() * 2, r() * 2, r() * 2); n.add(b); } n.scale.y = 0.6; g.add(n); }
  return g;
}
// chuva: riscos caindo (e respingos no chão). update(t)
export function chuva(S, { n = 400, area = [6, 4, 6], centro = [0, 0, -2], vel = 9, cor = 0xa8c0e0, seed = 2 } = {}) {
  const r = mulberry32(seed), g = new THREE.Group(); S.add(g); const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(1.6), transparent: true, opacity: 0.45, depthWrite: false });
  const geo = new THREE.BoxGeometry(0.004, 0.22, 0.004), P = [];
  for (let i = 0; i < n; i++) { const q = new THREE.Mesh(geo, m); g.add(q); P.push([centro[0] + (r() - 0.5) * 2 * area[0], r() * area[1], centro[2] + (r() - 0.5) * 2 * area[2], r()]); }
  const sp = new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.5, depthWrite: false }), R = [];
  for (let i = 0; i < 60; i++) { const c = new THREE.Mesh(new THREE.RingGeometry(0.01, 0.025, 8), sp); c.rotation.x = -Math.PI / 2; g.add(c); R.push([centro[0] + (r() - 0.5) * 2 * area[0], centro[2] + (r() - 0.5) * 2 * area[2], r()]); }
  const up = (t) => { g.children.forEach((q, i) => { if (i < n) { const p = P[i]; q.position.set(p[0] + 0.15 * ((t * vel * 0.1) % 1), area[1] - ((p[1] + t * vel + p[3] * area[1]) % area[1]), p[2]); }
    else { const k = R[i - n], f = (t * 1.8 + k[2]) % 1; q.position.set(k[0], 0.01, k[1]); q.scale.setScalar(0.4 + f * 2.2); q.material.opacity = 0.5 * (1 - f); } }); };
  up(0); return { g, update: up };
}
// fumaça/vapor: bolas macias que sobem, crescem e somem (café, chaleira, incêndio, respiração no frio)
export function fumaca(S, { pos = [0, 0, 0], n = 24, cor = 0xd8d8dc, sobe = 1.2, largura = 0.4, tam = 0.25, opac = 0.35, seed = 5 } = {}) {
  const r = mulberry32(seed), g = new THREE.Group(); g.position.set(...pos); S.add(g); const P = [];
  for (let i = 0; i < n; i++) { const m = new THREE.SpriteMaterial({ map: halo, color: cor, transparent: true, opacity: 0, depthWrite: false }); const s = new THREE.Sprite(m); g.add(s); P.push([r(), (r() - 0.5) * largura, (r() - 0.5) * largura, 0.7 + r() * 0.6]); }
  const up = (t) => g.children.forEach((s, i) => { const p = P[i], f = (t * 0.35 * p[3] + p[0]) % 1; s.position.set(p[1] * (0.3 + f) + 0.1 * Math.sin(t + i), f * sobe, p[2] * (0.3 + f)); const z = tam * (0.4 + f * 2.2); s.scale.set(z, z, z); s.material.opacity = opac * Math.sin(Math.PI * f); });
  up(0); return { g, update: up };
}
// fogo com brasas: chamas facetadas que pulsam + luz que tremula + brasas subindo
export function fogo(S, { pos = [0, 0, 0], tam = 1, seed = 6 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(tam); S.add(g); const r = mulberry32(seed), ch = [];
  [[0xffd060, 0.16, 0.55], [0xff8a30, 0.24, 0.42], [0xff4a20, 0.3, 0.3]].forEach(([c, raio, h], k) => { for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(raio * (0.6 + r() * 0.5), h * (0.8 + r() * 0.6), 5), brilho(c, 2.6 - k * 0.5)); m.position.set((r() - 0.5) * raio, h * 0.4, (r() - 0.5) * raio); m.userData.f = 0.7 + r(); g.add(m); ch.push(m); } });
  const luzF = new THREE.PointLight(0xff8a40, 6, 6, 1.6); luzF.position.y = 0.4; g.add(luzF);
  const br = fumaca(g, { n: 30, cor: 0xffa040, sobe: 2.2, largura: 0.5, tam: 0.05, opac: 0.9, seed: seed + 1 });
  const up = (t) => { ch.forEach((m, i) => { const f = 0.8 + 0.25 * Math.sin(t * 9 * m.userData.f + i) + 0.1 * Math.sin(t * 23 + i * 2); m.scale.set(1, f, 1); m.rotation.y = t * 0.6 * m.userData.f; });
    luzF.intensity = 6 * (0.8 + 0.15 * Math.sin(t * 11) + 0.1 * Math.sin(t * 27)); br.update(t * 2.5); };
  up(0); return { g, luz: luzF, update: up };
}
// água: superfície facetada com ondas (vértices animados) e brilho especular
export function agua(S, { tam = 20, seg = 40, cor = 0x1d4a6a, altura = 0.06, pos = [0, 0, 0] } = {}) {
  const geo = new THREE.PlaneGeometry(tam, tam, seg, seg); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.12, metalness: 0.3, flatShading: true, transparent: true, opacity: 0.92 }));
  m.position.set(...pos); S.add(m); const p0 = geo.attributes.position.array.slice();
  const up = (t) => { const a = geo.attributes.position; for (let i = 0; i < a.count; i++) { const x = p0[i * 3], z = p0[i * 3 + 2]; a.setY(i, altura * (Math.sin(x * 1.3 + t * 1.6) + 0.6 * Math.sin(z * 1.7 - t * 1.2) + 0.3 * Math.sin((x + z) * 3.1 + t * 2.7))); } a.needsUpdate = true; geo.computeVertexNormals(); };
  up(0); return { m, update: up };
}
// vento: balança árvores/plantas/cabelos de um grupo (rotação pela altura). Guarde a rotação base na 1ª chamada.
export function vento(obj, t, { forca = 1, seed = 1 } = {}) { obj.traverse((o) => { if (!o.isMesh) return; o.userData.rb ??= o.rotation.clone(); const h = o.position.y + (o.parent ? o.parent.position.y : 0);
  o.rotation.z = o.userData.rb.z + forca * 0.04 * h * Math.sin(t * 1.7 + o.position.x * 0.8 + seed); o.rotation.x = o.userData.rb.x + forca * 0.025 * h * Math.sin(t * 1.3 + o.position.z * 0.7 + seed * 2); }); }
export function arvore(S, { pos = [0, 0, 0], alt = 2.4, cor = 0x3f6a3a, seed = 1 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); S.add(g); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, alt * 0.5, 6), mat(0x5a4030)); t.position.y = alt * 0.25; g.add(t);
  const r = mulberry32(seed); for (let i = 0; i < 4; i++) { const c = contorno(new THREE.Mesh(facetado(1, () => {}, seed + i, 0.25), mat(new THREE.Color(cor).multiplyScalar(0.85 + r() * 0.3).getHex(), 0.9)), 0.02); c.scale.setScalar(alt * (0.22 + r() * 0.1)); c.position.set((r() - 0.5) * alt * 0.3, alt * (0.55 + r() * 0.3), (r() - 0.5) * alt * 0.3); g.add(c); }
  return g;
}

// ===================== CENÁRIOS PRONTOS (98) =====================
// cenario(S, "quarto|cozinha|hospital|rua|laboratorio|escritorio") → {g, pontos} (pontos úteis: cama, mesa, janela, porta…)
export function cenario(S, nome, { seed = 1 } = {}) {
  const g = new THREE.Group(); S.add(g); const pts = {};
  const caixa = (w, h, d, c, x, y, z, rough = 0.85) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, rough)); m.position.set(x, y, z); g.add(m); return m; };
  const sala = (piso, parede, w = 6, d = 6, h = 3) => { caixa(w, 0.1, d, piso, 0, -0.05, 0, 0.6); caixa(0.1, h, d, parede, -w / 2, h / 2, 0); caixa(w, h, 0.1, parede, 0, h / 2, -d / 2); caixa(0.12, 0.1, d, 0xeeeae2, -w / 2 + 0.06, 0.05, 0); };
  const janela = (x, y, z, w = 1.0, h = 1.3) => { const j = new THREE.Mesh(new THREE.PlaneGeometry(w, h), brilho(0xfff0d8, 1.8)); j.position.set(x, y, z); j.rotation.y = Math.PI / 2; g.add(j); caixa(0.08, h + 0.1, 0.06, 0xeae6de, x + 0.02, y, z - w / 2); caixa(0.08, h + 0.1, 0.06, 0xeae6de, x + 0.02, y, z + w / 2); caixa(0.08, 0.06, w, 0xeae6de, x + 0.02, y, z); pts.janela = new THREE.Vector3(x, y, z); };
  if (nome === "quarto") { sala(0x6a4a34, 0x5a6a7a); janela(-2.94, 1.6, -0.8); caixa(1.5, 0.35, 2.1, 0x3a3a48, 0.8, 0.25, -1.6); caixa(1.45, 0.12, 2.0, 0xe8e4f0, 0.8, 0.48, -1.6); caixa(1.4, 0.15, 0.45, 0xf4f0f8, 0.8, 0.6, -2.4);
    caixa(0.5, 0.5, 0.4, 0x5a4030, -0.3, 0.25, -2.6); pts.cama = new THREE.Vector3(0.8, 0.6, -1.6); pts.criado = new THREE.Vector3(-0.3, 0.52, -2.6); }
  if (nome === "cozinha") { sala(0xd8d0c0, 0xe8e0d0); caixa(3.5, 0.9, 0.6, 0xf2f0ea, 0, 0.45, -2.6, 0.5); caixa(3.5, 0.05, 0.62, 0x3a3a3e, 0, 0.92, -2.6, 0.2); caixa(3.5, 0.7, 0.35, 0xf2f0ea, 0, 2.1, -2.8, 0.5);
    caixa(0.6, 0.02, 0.4, 0x2a2a2e, 0.9, 0.95, -2.6, 0.3); janela(-2.94, 1.6, -1.2); pts.bancada = new THREE.Vector3(0, 0.95, -2.5); pts.fogao = new THREE.Vector3(0.9, 0.96, -2.6); }
  if (nome === "hospital") { sala(0xc8d0d0, 0xdfe8e8); caixa(0.95, 0.55, 2.0, 0xc8ccd0, 0.5, 0.45, -1.4, 0.4); caixa(0.9, 0.12, 1.9, 0xf4f8fa, 0.5, 0.78, -1.4); caixa(0.05, 1.6, 0.05, 0x9aa0a8, -0.2, 0.8, -2.2, 0.3);
    const mon = caixa(0.45, 0.32, 0.08, 0x1a1c20, -0.25, 1.4, -2.3, 0.3); const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.27), brilho(0x2aff9a, 0.9)); tela.position.set(-0.25, 1.4, -2.25); g.add(tela);
    pts.cama = new THREE.Vector3(0.5, 0.84, -1.4); pts.monitor = new THREE.Vector3(-0.25, 1.4, -2.25); }
  if (nome === "laboratorio") { sala(0xb8c0c4, 0xd0d8dc); caixa(3, 0.9, 0.8, 0xe8ecee, 0, 0.45, -2.3, 0.4); caixa(3, 0.04, 0.82, 0x1c2228, 0, 0.92, -2.3, 0.2);
    const vidro = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.35, roughness: 0.05 }); for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 8), vidro); f.position.set(-1 + i * 0.45, 1.05, -2.3); g.add(f);
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.1, 8), brilho([0x3aff9a, 0x3ac8ff, 0xff6a9a][i % 3], 1.2)); liq.position.set(-1 + i * 0.45, 0.99, -2.3); g.add(liq); } pts.bancada = new THREE.Vector3(0, 0.95, -2.2); }
  if (nome === "escritorio") { sala(0x4a4a52, 0x8a8a90); caixa(1.4, 0.05, 0.7, 0x6a4a30, 0, 0.75, -1.8, 0.5); caixa(0.05, 0.73, 0.6, 0x2a2a2e, -0.6, 0.37, -1.8); caixa(0.05, 0.73, 0.6, 0x2a2a2e, 0.6, 0.37, -1.8);
    caixa(0.6, 0.38, 0.03, 0x111114, 0, 1.0, -2.05, 0.3); const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.34), brilho(0x8ab8ff, 1.3)); tela.position.set(0, 1.0, -2.03); g.add(tela); janela(-2.94, 1.6, -1); pts.mesa = new THREE.Vector3(0, 0.78, -1.7); pts.tela = new THREE.Vector3(0, 1.0, -2.03); }
  if (nome === "rua") { const r = mulberry32(seed); caixa(30, 0.1, 30, 0x2a2c32, 0, -0.05, -8, 0.35); caixa(2.2, 0.16, 30, 0x55565c, -3.2, 0.03, -8); caixa(2.2, 0.16, 30, 0x55565c, 3.2, 0.03, -8);
    for (let i = 0; i < 10; i++) { const h = 4 + r() * 6, s = i % 2 ? 1 : -1; const pr = caixa(3, h, 3.2, [0x3a3e48, 0x4a4040, 0x3e4a44][i % 3], s * 5.8, h / 2, -2 - Math.floor(i / 2) * 3.6, 0.8);
      for (let k = 0; k < 6; k++) { const jl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), r() < 0.5 ? brilho(0xffd09a, 1.3) : mat(0x1a1c22, 0.2)); jl.position.set(s * 4.29, 1.2 + (k % 3) * 1.3, pr.position.z - 0.8 + Math.floor(k / 3) * 1.6); jl.rotation.y = -s * Math.PI / 2; g.add(jl); } }
    pts.calcada = new THREE.Vector3(-3.2, 0.11, 0); }
  return { g, pontos: pts };
}

// ===================== BICHOS (60–63) =====================
function quadrupede({ seed, cor, corB, corpoTam, cabTam, focinho, orelha, cauda, perna }) {
  const R = new THREE.Group(), m = mat(cor, 0.85), mb = mat(corB ?? cor, 0.85);
  const corpo = contorno(new THREE.Mesh(facetado(2, (v) => { v.z *= 1.6; v.y *= 0.85; }, seed, 0.08), m), 0.015); corpo.scale.setScalar(corpoTam); corpo.position.y = perna + corpoTam * 0.6; R.add(corpo);
  const cab = new THREE.Group(); cab.position.set(0, perna + corpoTam * 1.2, corpoTam * 1.55); R.add(cab);
  cab.add(contorno(new THREE.Mesh(facetado(2, (v) => { v.z *= 1.05; }, seed + 1, 0.06), m), 0.02)).children.at(-1).scale.setScalar(cabTam);
  const foc = contorno(new THREE.Mesh(facetado(1, (v) => { v.z *= 1.4; v.y *= 0.75; }, seed + 2, 0.08), mb), 0.03); foc.scale.setScalar(cabTam * focinho); foc.position.set(0, -cabTam * 0.25, cabTam * 0.85); cab.add(foc);
  const nar = new THREE.Mesh(new THREE.IcosahedronGeometry(cabTam * 0.16, 0), mat(0x18100c, 0.3)); nar.position.set(0, -cabTam * 0.12, cabTam * (0.85 + focinho * 1.25)); cab.add(nar);
  const orelhas = [1, -1].map((s) => { const o = contorno(new THREE.Mesh(new THREE.ConeGeometry(cabTam * 0.32, cabTam * orelha, 4), m), 0.05); o.position.set(s * cabTam * 0.6, cabTam * 0.85, -cabTam * 0.1); o.rotation.z = -s * 0.35; cab.add(o); return o; });
  const olhos = [1, -1].map((s) => { const o = olhoDe(cabTam * 0.22, 0x3a2410, cor); o.g.position.set(s * cabTam * 0.42, cabTam * 0.15, cabTam * 0.75); o.g.rotation.y = s * 0.35; o.abrir(0.8); cab.add(o.g); return o; });
  const patas = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz], i) => { const g = new THREE.Group(); g.position.set(sx * corpoTam * 0.55, perna, sz * corpoTam * 1.05); R.add(g);
    const c = contorno(new THREE.Mesh(new THREE.CylinderGeometry(corpoTam * 0.2, corpoTam * 0.16, perna, 5), m), 0.03); c.position.y = -perna / 2; g.add(c); return g; });
  const rabo = new THREE.Group(); rabo.position.set(0, perna + corpoTam * 0.9, -corpoTam * 1.5); R.add(rabo); const elos = []; let pai = rabo;
  for (let j = 0; j < 6; j++) { const g = new THREE.Group(); g.position.y = j ? cauda / 6 : 0; g.rotation.x = j ? 0.15 : -2.2; pai.add(g); const c = new THREE.Mesh(new THREE.CylinderGeometry(corpoTam * 0.08 * (1 - j / 8), corpoTam * 0.08 * (1 - (j + 1) / 8), cauda / 6, 5), m); c.position.y = cauda / 12; g.add(c); elos.push(g); pai = g; }
  const o = { root: R, corpo, cab, olhos, orelhas, patas, elos,
    respira(k) { corpo.scale.set(corpoTam * (1 + 0.03 * k), corpoTam * (1 + 0.04 * k), corpoTam); },
    andar(t, vel = 1) { const ph = t * vel * 2 * Math.PI * 1.4; patas.forEach((g, i) => (g.rotation.x = 0.45 * Math.sin(ph + [0, Math.PI, Math.PI, 0][i]))); corpo.position.y = perna + corpoTam * 0.6 + 0.015 * Math.abs(Math.sin(ph)); cab.rotation.x = 0.05 * Math.sin(ph * 2); return t * vel * 1.1; },
    abanar(t, forca = 1) { elos.forEach((g, j) => { if (j) g.rotation.z = forca * 0.35 * Math.sin(t * 14 - j * 0.6); }); },
    emocao(nome) { const e = { feliz: [0.75, -0.3, 0.2], medo: [1.1, 0.5, -0.2], triste: [0.45, 0.7, 0.15], alerta: [1, -0.1, -0.05], dormindo: [0, 0.4, 0.25] }[nome] || [0.8, 0, 0];
      olhos.forEach((q) => q.abrir(e[0])); orelhas.forEach((q, i) => (q.rotation.x = e[1])); cab.rotation.x = e[2]; } };
  return o;
}
export const cachorro = ({ seed = 21, cor = 0xb07a40, corB = 0xe8d0a8 } = {}) => quadrupede({ seed, cor, corB, corpoTam: 0.22, cabTam: 0.105, focinho: 0.6, orelha: 0.9, cauda: 0.3, perna: 0.28 });
export const gato = ({ seed = 23, cor = 0x6a6a72, corB = 0xd8d8dc } = {}) => quadrupede({ seed, cor, corB, corpoTam: 0.15, cabTam: 0.08, focinho: 0.4, orelha: 1.15, cauda: 0.42, perna: 0.18 });
// pássaro voando: asas com ciclo de batida e planeio. voar(t) devolve a distância
export function passaro({ seed = 31, cor = 0x3a4a6a, corB = 0xd8c8a8 } = {}) {
  const R = new THREE.Group(), m = mat(cor, 0.6), mb = mat(corB, 0.7);
  const corpo = contorno(new THREE.Mesh(facetado(1, (v) => { v.z *= 1.8; v.y *= 0.8; }, seed, 0.1), m), 0.03); corpo.scale.setScalar(0.08); R.add(corpo);
  const cab = contorno(new THREE.Mesh(facetado(1, () => {}, seed + 1, 0.1), m), 0.04); cab.scale.setScalar(0.055); cab.position.set(0, 0.04, 0.14); R.add(cab);
  const bico = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.06, 4), mat(0xe0a030, 0.4)); bico.rotation.x = Math.PI / 2; bico.position.set(0, 0.035, 0.21); R.add(bico);
  const ventre = new THREE.Mesh(facetado(1, (v) => { v.z *= 1.6; }, seed + 2, 0.1), mb); ventre.scale.set(0.06, 0.05, 0.07); ventre.position.set(0, -0.025, 0.02); R.add(ventre);
  const asas = [1, -1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.05, 0.02, 0.02); R.add(g); const a = contorno(new THREE.Mesh(facetado(1, (v) => { v.x = (v.x + 1) * s; v.y *= 0.12; v.z *= 0.6; }, seed + 3 + s, 0.1), m), 0.04); a.scale.setScalar(0.11); g.add(a);
    const p = new THREE.Group(); p.position.x = s * 0.2; g.add(p); const b = contorno(new THREE.Mesh(facetado(1, (v) => { v.x = (v.x + 1) * s; v.y *= 0.08; v.z *= 0.45; }, seed + 6 + s, 0.1), m), 0.04); b.scale.setScalar(0.1); p.add(b); return { g, p, s }; });
  const cauda = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 3), m); cauda.rotation.x = -Math.PI / 2; cauda.scale.y = 0.3; cauda.position.set(0, 0, -0.16); R.add(cauda);
  return { root: R, asas, voar(t, { vel = 1, planar = 0 } = {}) { const ph = t * 2 * Math.PI * 4.5 * vel, bat = (1 - planar) * Math.sin(ph);
    asas.forEach(({ g, p, s }) => { g.rotation.z = s * (0.15 + 0.85 * bat); p.rotation.z = s * (0.35 * Math.sin(ph - 0.9)) * (1 - planar); }); R.position.y += 0.02 * Math.sin(ph); return t * vel * 3; } };
}
// peixe / baleia: corpo que ondula (cadeia de segmentos) e nadadeiras
export function peixe({ seed = 41, cor = 0xe08a3a, corB = 0xf2e0c8, tam = 0.3, baleia = false } = {}) {
  const R = new THREE.Group(), m = mat(cor, 0.4), mb = mat(corB, 0.5), segs = []; let pai = R;
  for (let j = 0; j < 6; j++) { const g = new THREE.Group(); g.position.z = j ? -tam * 0.33 : 0; pai.add(g); const r0 = tam * 0.32 * Math.sin(((j + 1.4) / 7.4) * Math.PI) * (baleia ? 1.3 : 1);
    const c = contorno(new THREE.Mesh(facetado(1, (v) => { v.z *= 1.3; v.x *= baleia ? 1.1 : 0.65; }, seed + j, 0.08), j === 0 ? m : j % 2 ? m : m), 0.02); c.scale.setScalar(Math.max(0.03, r0)); c.position.z = -tam * 0.16; g.add(c); segs.push(g); pai = g; }
  const cauda = contorno(new THREE.Mesh(facetado(1, (v) => { v.z *= 0.2; v.x *= baleia ? 1.6 : 0.2; v.y *= baleia ? 0.2 : 1.4; }, seed + 9, 0.1), m), 0.03); cauda.scale.setScalar(tam * 0.3); cauda.position.z = -tam * 0.3; pai.add(cauda);
  const vt = new THREE.Mesh(facetado(1, (v) => { v.z *= 2; v.y *= 0.5; }, seed + 8, 0.1), mb); vt.scale.set(tam * 0.22, tam * 0.15, tam * 0.4); vt.position.set(0, -tam * 0.12, -tam * 0.15); R.add(vt);
  const olhos = [1, -1].map((s) => { const o = olhoDe(tam * 0.06, 0x1a1a1a, cor); o.g.position.set(s * tam * 0.17, tam * 0.06, tam * 0.08); o.g.rotation.y = s * 1.2; o.abrir(baleia ? 0.6 : 1); R.add(o.g); return o; });
  return { root: R, segs, olhos, nadar(t, vel = 1) { const ph = t * 2 * Math.PI * (baleia ? 0.5 : 2.2) * vel; segs.forEach((g, j) => { if (baleia) g.rotation.x = 0.1 * (j / 5) * Math.sin(ph - j * 0.7); else g.rotation.y = 0.18 * (j / 5 + 0.2) * Math.sin(ph - j * 0.8); }); return t * vel * (baleia ? 1.5 : 0.8); } };
}
