/**
 * dor.js — peças do vídeo "E se você nunca mais pudesse sentir dor?" (lote 3).
 *
 *   DOR.proj(v3, cam) → [x, y, z]; DOR.txt(ctx, s, x, y, o); DOR.vis(st); DOR.quadro(); DOR.frase(ctx, cam, v3, "TXT", a, o)
 *   DOR.glowSprite(cor, tam, op)                         // brilho aditivo
 *   DOR.CSS(id)                                          // CSS do título no padrão doc (lote 2) só para a cena id
 *   const m = DOR.mao({ pele, escala });  m.g, m.dedos[i] (grupos), m.pontas[i] (Object3D na ponta), m.queima(k)  // mão PBR (dedos para +z, dorso para +y)
 *   DOR.bancada(S, { larg, prof, alt })                  // bancada de cozinha com tampo e azulejo
 *   DOR.panela(cor) → Group (fundo em y = 0, cabo para +x) ; DOR.boca(S, x, y, z) → { set(k) } boca do fogão acesa
 *   const n = DOR.nervos(S, { seed, raiz, dir, niveis, comp, raio, cor }); n.ramos [{ curva, nivel }], n.pontas [Vector3], n.pulsos(t, f)
 *   const d = DOR.dna(S, { n, raio, passo, gira }); d.set(t, { destaque: [k0, k1], brilho })
 *   DOR.osso(comp, raio) → LatheGeometry (osso longo, eixo y, centrado)
 *   DOR.cozinhaR11(S, LP) → { faca, tabua, cebola, rodelas[] } cozinha low-poly para as cenas R11 (f01/f13)
 *   DOR.poseCozinha(p, t, { corte }) → pose de braços picando; devolve { facaY }
 * Tudo determinístico (t e mulberry32). Chão em y = 0.
 */
import * as THREE from "../three.module.js";
import { M, roundBox, mesh } from "./toy.js";
import { mulberry32, clamp, lerp, ease } from "../kit.js";

export const AZUL = "#7cc8ff", LARANJA = "#ff8a4c";

/* ---------- 2D ---------- */
const _pv = new THREE.Vector3();
export function proj(v, cam) { cam.updateMatrixWorld(); _pv.copy(v).project(cam); return [(_pv.x + 1) * 540, (1 - _pv.y) * 960, _pv.z]; }
const FAM = { mono: '"JetBrains Mono", ui-monospace, monospace', inter: '"Inter", sans-serif' };
export function txt(ctx, s, x, y, { tam = 40, cor = "#fff", fonte = "mono", peso = 600, al = "center", a = 1, esp = 0.06, sombra = true } = {}) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a);
  ctx.font = `${peso} ${tam}px ${FAM[fonte] || FAM.mono}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = (fonte === "mono" ? esp * tam : 0) + "px";
  ctx.textAlign = al; ctx.textBaseline = "middle";
  if (sombra) { ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = tam * 0.4; ctx.shadowOffsetY = tam * 0.05; }
  ctx.fillStyle = cor; ctx.fillText(s, x, y); ctx.restore();
}
const _pos = [];
export function quadro() { _pos.length = 0; }
// pílula escura com borda colorida e fio fino até o ponto 3D; fica entre ymin e ymax (padrão: faixa dos rótulos)
export function frase(ctx, cam, v3, s, a, { cor = AZUL, tam = 30, dy = -40, dx = 0, ymin = 640, ymax = 1000, linha = true } = {}) {
  if (a <= 0.01) return;
  const [px, py, pz] = proj(v3, cam);
  if (pz > 1 || pz < -1) return;
  ctx.save(); ctx.font = `600 ${tam}px ${FAM.mono}`; if ("letterSpacing" in ctx) ctx.letterSpacing = tam * 0.06 + "px";
  const w = ctx.measureText(s).width + tam * 1.1, h = tam * 1.75;
  let x = clamp(px + dx, w / 2 + 40, 950 - w / 2), y = clamp(py + dy - h / 2, ymin + h / 2, ymax - h / 2);
  for (let k = 0; k < 6; k++) {
    const hit = _pos.find((r) => Math.abs(r[0] - x) < (r[2] + w) / 2 + 6 && Math.abs(r[1] - y) < (r[3] + h) / 2 + 6);
    if (!hit) break;
    y = hit[1] + (y >= hit[1] ? 1 : -1) * ((hit[3] + h) / 2 + 8);
    if (y > ymax - h / 2 || y < ymin + h / 2) { y = clamp(y, ymin + h / 2, ymax - h / 2); x = clamp(hit[0] + (x >= hit[0] ? 1 : -1) * ((hit[2] + w) / 2 + 10), w / 2 + 40, 950 - w / 2); }
  }
  _pos.push([x, y, w, h]);
  const A = Math.min(1, a);
  if (linha) { ctx.globalAlpha = A * 0.7; ctx.strokeStyle = cor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y + (py > y ? h / 2 : -h / 2)); ctx.stroke();
    ctx.globalAlpha = A; ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.283); ctx.fill(); }
  ctx.globalAlpha = A;
  ctx.translate(x, y); ctx.scale(0.85 + 0.15 * A, 0.85 + 0.15 * A);
  ctx.fillStyle = "rgba(6,9,18,0.74)"; ctx.shadowColor = cor; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h * 0.3); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = cor; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s, 0, 2);
  ctx.restore();
}
export function vis(st) { const T = st.T || 0, D = st.D || 1e9; return 1 - Math.min(1, Math.max(1 - T / 0.17, 1 - (D - T) / 0.12, 0)) * 0.85; }
// título no padrão doc (Inter 300, kicker mono azul, palavra-chave em degradê), escopado na cena
export function CSS(id) {
  const s = `[data-composition-id="${id}"]`;
  return `    ${s} .rot-t { font-family: "Inter", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }
    ${s} .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }
    ${s} .rot-t .r { font-weight: 800; color: #ff8a4c; }
    ${s} .rot-t .k { font-family: "JetBrains Mono", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }
    ${s} .rot-t .n { font-family: "JetBrains Mono", monospace; font-weight: 600; color: #7cc8ff; }
`;
}

/* ---------- brilho ---------- */
let _glow = null;
export function glowTex() {
  if (_glow) return _glow;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  _glow = new THREE.CanvasTexture(c); _glow.colorSpace = THREE.SRGBColorSpace; return _glow;
}
export function glowSprite(cor, tam, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: cor, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: op }));
  s.scale.setScalar(tam); return s;
}
export const emiss = (cor, k = 1.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(k), toneMapped: false, fog: false });

/* ---------- mão PBR (unidades: palma ~0.9 de largura; dedos para +z, dorso para +y) ---------- */
export const PELE = 0xc58f6c;
export function mao({ pele = PELE, escala = 1 } = {}) {
  const g = new THREE.Group(), pm = new THREE.MeshStandardMaterial({ color: pele, roughness: 0.52, metalness: 0, envMapIntensity: 0.6 });
  const palma = new THREE.Mesh(roundBox(0.9, 0.3, 0.95, 0.14), pm); palma.position.set(0, 0, 0); g.add(palma);
  const punho = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 1.4, 18), pm); punho.rotation.x = Math.PI / 2; punho.scale.set(1, 1, 0.55); punho.position.set(0, -0.02, -1.1); g.add(punho);
  const cap = (r, l) => { const q = new THREE.CapsuleGeometry(r, l, 5, 12); q.rotateX(Math.PI / 2); q.translate(0, 0, l / 2 + r * 0.6); return q; };
  const mats = [], dedos = [], pontas = [];
  const D = [[-0.33, 0.62, 0.1], [-0.11, 0.7, 0.105], [0.11, 0.66, 0.1], [0.32, 0.52, 0.09]];
  D.forEach(([x, L, r], i) => {
    let pai = new THREE.Group(); pai.position.set(x, 0.0, 0.45); pai.rotation.y = x * -0.12; g.add(pai); dedos.push(pai);
    const segs = [L * 0.45, L * 0.32, L * 0.25];
    segs.forEach((l, j) => {
      const m = pm.clone(); mats.push([m, i, j]);
      const s = new THREE.Mesh(cap(r * (1 - j * 0.08), l), m); pai.add(s);
      const nx = new THREE.Group(); nx.position.z = l + r * 0.2; nx.rotation.x = 0.12; pai.add(nx); pai = nx;
    });
    pontas.push(pai);
  });
  // polegar
  const pol = new THREE.Group(); pol.position.set(-0.46, -0.05, 0.0); pol.rotation.set(0.2, -0.9, 0.3); g.add(pol);
  const p1 = new THREE.Mesh(cap(0.12, 0.32), pm); pol.add(p1);
  const p2g = new THREE.Group(); p2g.position.z = 0.4; p2g.rotation.x = 0.2; pol.add(p2g); p2g.add(new THREE.Mesh(cap(0.11, 0.25), pm));
  // unhas
  pontas.forEach((p, i) => { const u = new THREE.Mesh(roundBox(0.1, 0.02, 0.1, 0.01), new THREE.MeshStandardMaterial({ color: 0xd9a48c, roughness: 0.25 })); u.position.set(0, D[i][2] * 0.92, -0.02); p.add(u); });
  g.scale.setScalar(escala);
  const base = new THREE.Color(pele), verm = new THREE.Color(0xb8402c), esc = new THREE.Color(0x3a1c14);
  // queimadura crescendo da ponta para a base: k 0..1
  function queima(k) {
    for (const [m, i, j] of mats) {
      const kk = clamp(k * 1.6 - (2 - j) * 0.25 - Math.abs(i - 1.5) * 0.05);
      m.color.copy(base).lerp(verm, clamp(kk * 1.6)).lerp(esc, clamp(kk * 1.5 - 0.6) * 0.8);
      m.roughness = lerp(0.52, 0.3, kk);
      m.emissive.set(0x5a1206); m.emissiveIntensity = kk * 0.25;
    }
  }
  return { g, dedos, pontas, queima, palma, mat: pm };
}

/* ---------- cozinha R10 ---------- */
export function bancada(S, { larg = 6, prof = 1.4, alt = 0.92, x = 0, z = 0, parede = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g);
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(larg, alt - 0.05, prof - 0.06), M(0x2c3036, 0.6)); corpo.position.y = (alt - 0.05) / 2; g.add(corpo);
  const tampo = new THREE.Mesh(new THREE.BoxGeometry(larg + 0.04, 0.05, prof), M(0x8d8a86, 0.28)); tampo.position.y = alt - 0.025; g.add(tampo);
  if (parede) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(larg + 4, 3), M(0xd8d2c6, 0.85)); p.position.set(0, alt + 1.5, -prof / 2); g.add(p);
    const az = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.15, 0.02), M(0xe9e4da, 0.25), 120); let k = 0; const o = new THREE.Object3D();
    for (let r = 0; r < 6; r++) for (let c = 0; c < 20; c++) { o.position.set(-3 + c * 0.31 + (r % 2) * 0.15, alt + 0.1 + r * 0.16, -prof / 2 + 0.01); o.updateMatrix(); az.setMatrixAt(k++, o.matrix); }
    g.add(az);
  }
  return g;
}
export function panela(cor = 0x2a2b2e) {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.26, 32, 1, true), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.32, metalness: 0.85, side: THREE.DoubleSide })); corpo.position.y = 0.13; g.add(corpo);
  const fundo = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.02, 32), corpo.material); fundo.position.y = 0.01; g.add(fundo);
  const borda = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.015, 6, 40), new THREE.MeshStandardMaterial({ color: 0x9a9da3, roughness: 0.2, metalness: 1 })); borda.rotation.x = Math.PI / 2; borda.position.y = 0.26; g.add(borda);
  const cabo = new THREE.Mesh(roundBox(0.7, 0.06, 0.1, 0.03), M(0x151518, 0.5)); cabo.position.set(0.75, 0.22, 0); cabo.rotation.z = 0.12; g.add(cabo);
  return g;
}
export function boca(S, x, y, z) {
  const m = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
  const a = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 36), m); a.rotation.x = Math.PI / 2; a.position.set(x, y, z); S.add(a);
  const b = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 28), m); b.rotation.x = Math.PI / 2; b.position.set(x, y, z); S.add(b);
  const gl = glowSprite(0xff5a1a, 1.4, 0); gl.position.set(x, y + 0.05, z); S.add(gl);
  const c = new THREE.Color(), q = new THREE.Color(0xff3a0a), w = new THREE.Color(0xffb060);
  return { set(k) { c.copy(q).lerp(w, k * 0.4).multiplyScalar(0.2 + 3 * k); m.color.copy(c); gl.material.opacity = 0.7 * k; } };
}

/* ---------- nervos com nociceptores nas pontas ---------- */
export function nervos(S, { seed = 3, raiz = new THREE.Vector3(), dir = new THREE.Vector3(0, 0, 1), niveis = 4, comp = 2.2, raio = 0.05, cor = 0x7cc8ff, plano = true, abre = 0.6 } = {}) {
  const r = mulberry32(seed), g = new THREE.Group(); S.add(g);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1d3446, emissive: cor, emissiveIntensity: 0.35, roughness: 0.4, transparent: true, opacity: 0.95 });
  const ramos = [], pontas = [];
  function ramo(p0, d, L, nv, rr) {
    const pts = [p0.clone()]; let p = p0.clone(), dd = d.clone();
    for (let i = 0; i < 4; i++) {
      dd.add(new THREE.Vector3((r() - 0.5) * 0.5, plano ? (r() - 0.5) * 0.12 : (r() - 0.5) * 0.5, (r() - 0.5) * 0.5)).normalize();
      p = p.clone().addScaledVector(dd, L / 4); pts.push(p);
    }
    const curva = new THREE.CatmullRomCurve3(pts);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curva, 12, rr, 5), mat); g.add(m);
    ramos.push({ curva, nivel: niveis - nv, raio: rr });
    if (nv <= 1) { pontas.push(p.clone()); return; }
    const k = 2 + (r() < 0.35 ? 1 : 0);
    for (let j = 0; j < k; j++) {
      const a = (j - (k - 1) / 2) * abre + (r() - 0.5) * 0.3;
      const nd = dd.clone().applyAxisAngle(plano ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), a);
      ramo(p, nd, L * (0.62 + r() * 0.15), nv - 1, rr * 0.7);
    }
  }
  ramo(raiz, dir.clone().normalize(), comp, niveis, raio);
  // nociceptores: bulbo + brilho
  const bulbos = pontas.map((p) => { const s = glowSprite(cor, 0.5, 0.9); s.position.copy(p); g.add(s);
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(raio * 1.4, 1), emiss(0xbfe4ff, 1.2)); b.position.copy(p); g.add(b); return { s, b }; });
  // pulsos viajando da ponta para a raiz
  const NP = 40, pul = Array.from({ length: NP }, () => { const s = glowSprite(0xffffff, 0.22, 0); g.add(s); return s; });
  const _p = new THREE.Vector3();
  function pulsos(t, f) {
    // f(i) → { u: 0..1 ao longo do ramo i (1 = ponta), a, cor } ou null
    let k = 0;
    for (let i = 0; i < ramos.length && k < NP; i++) {
      const o = f(i, ramos[i]); if (!o) continue;
      ramos[i].curva.getPointAt(clamp(o.u), _p); const s = pul[k++];
      s.position.copy(_p); s.material.opacity = o.a; s.material.color.set(o.cor || 0xffffff); s.scale.setScalar(o.tam || 0.22);
    }
    for (; k < NP; k++) pul[k].material.opacity = 0;
  }
  return { g, ramos, pontas, bulbos, pulsos, mat };
}

/* ---------- DNA ---------- */
export function dna(S, { n = 60, raio = 0.55, passo = 0.17, gira = 0.6 } = {}) {
  const g = new THREE.Group(); S.add(g);
  const geoB = new THREE.IcosahedronGeometry(0.085, 1), geoR = new THREE.CylinderGeometry(0.03, 0.03, 1, 6);
  const mB = new THREE.MeshStandardMaterial({ color: 0x9fc8e8, roughness: 0.25, metalness: 0.1, emissive: 0x16324a, emissiveIntensity: 0.6 });
  const mR = new THREE.MeshStandardMaterial({ color: 0x4f7ea3, roughness: 0.35, emissive: 0x0c2236, emissiveIntensity: 0.6 });
  const hB = new THREE.MeshStandardMaterial({ color: 0xffb08a, roughness: 0.2, emissive: 0xff6a2a, emissiveIntensity: 1.6 });
  const hR = new THREE.MeshStandardMaterial({ color: 0xffc29a, roughness: 0.3, emissive: 0xff7a3a, emissiveIntensity: 1.2 });
  const ib = new THREE.InstancedMesh(geoB, mB, n * 2), ir = new THREE.InstancedMesh(geoR, mR, n);
  const jb = new THREE.InstancedMesh(geoB, hB, n * 2), jr = new THREE.InstancedMesh(geoR, hR, n);
  for (const m of [ib, ir, jb, jr]) { m.frustumCulled = false; g.add(m); }
  const o = new THREE.Object3D(), a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const meio = (n - 1) * passo / 2;
  function set(t, { destaque = [-1, -1], brilho = 1, cresce = 0 } = {}) {
    hB.emissiveIntensity = 1.6 * brilho; hR.emissiveIntensity = 1.2 * brilho;
    for (let i = 0; i < n; i++) {
      const y = i * passo - meio, ang = i * 0.62 + t * gira;
      a.set(Math.cos(ang) * raio, y, Math.sin(ang) * raio); b.set(-a.x, y, -a.z);
      const h = i >= destaque[0] && i <= destaque[1], sc = h ? 1 + cresce * 0.35 : 1;
      for (const [k, p] of [[0, a], [1, b]]) {
        o.position.copy(p); o.scale.setScalar(sc); o.rotation.set(0, 0, 0); o.updateMatrix();
        (h ? jb : ib).setMatrixAt(i * 2 + k, o.matrix);
        o.scale.setScalar(1e-4); o.updateMatrix(); (h ? ib : jb).setMatrixAt(i * 2 + k, o.matrix);
      }
      o.position.set(0, y, 0); o.quaternion.setFromUnitVectors(up, a.clone().normalize()); o.rotateZ(0); o.scale.set(1, raio * 2, 1);
      // cilindro deitado ligando a e b
      o.quaternion.setFromUnitVectors(up, a.clone().sub(b).normalize()); o.updateMatrix();
      (h ? jr : ir).setMatrixAt(i, o.matrix); o.scale.setScalar(1e-4); o.updateMatrix(); (h ? ir : jr).setMatrixAt(i, o.matrix);
    }
    for (const m of [ib, ir, jb, jr]) m.instanceMatrix.needsUpdate = true;
  }
  return { g, set, meio, passo, raio };
}

/* ---------- osso longo (torno) ---------- */
export function osso(comp = 2, raio = 0.12) {
  const pts = [], N = 24;
  for (let i = 0; i <= N; i++) {
    const v = i / N, y = (v - 0.5) * comp;
    const e = Math.pow(Math.abs(v - 0.5) * 2, 6);
    pts.push(new THREE.Vector2(raio * (1 + 1.1 * e) * (v === 0 || v === 1 ? 0.3 : 1), y));
  }
  pts[0].x = 0.001; pts[N].x = 0.001;
  return new THREE.LatheGeometry(pts, 16);
}

/* ---------- cozinha R11 (low-poly) ---------- */
export function cozinhaR11(S, LP) {
  const g = new THREE.Group(); S.add(g);
  const tampo = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.7), LP.mat(0x6e6a64, 0.4)); tampo.position.set(0, 0.97, 0.55); g.add(tampo);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.94, 0.66), LP.mat(0x2e3a44, 0.7)); arm.position.set(0, 0.47, 0.56); g.add(arm);
  const tabua = LP.contorno(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.025, 0.3), LP.mat(0xb07a46, 0.7)), 0.01); tabua.position.set(0.02, 1.012, 0.48); g.add(tabua);
  // cebola: metade + rodelas cortadas
  const cm = LP.mat(0xd9b48a, 0.5), ci = LP.mat(0xf1e6d0, 0.5);
  const cebola = new THREE.Group(); cebola.position.set(0.1, 1.025, 0.48); g.add(cebola);
  const meia = LP.contorno(new THREE.Mesh(new THREE.SphereGeometry(0.06, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2), cm), 0.03); meia.rotation.z = Math.PI / 2; meia.position.x = 0.0; meia.scale.set(1, 1, 1); cebola.add(meia);
  const corte = new THREE.Mesh(new THREE.CircleGeometry(0.06, 10), ci); corte.rotation.y = -Math.PI / 2; corte.position.set(-0.001, 0, 0); corte.rotation.z = 0; cebola.add(corte);
  const rodelas = [];
  for (let i = 0; i < 5; i++) { const rd = LP.contorno(new THREE.Mesh(new THREE.CylinderGeometry(0.05 - i * 0.003, 0.05 - i * 0.003, 0.008, 10), ci), 0.05); rd.rotation.z = Math.PI / 2 + 0.3; rd.rotation.y = 0.2 * i; rd.position.set(-0.04 - i * 0.022, 0.0, 0.01 * (i % 2)); cebola.add(rd); rodelas.push(rd); }
  // faca: lâmina afilada (shape) + cabo
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.2, 0); sh.quadraticCurveTo(0.25, 0.005, 0.27, 0.04); sh.lineTo(0, 0.05); sh.lineTo(0, 0);
  const lam = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.003, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.28, metalness: 0.55, emissive: 0x2a2e34, flatShading: true }));
  const faca = new THREE.Group(); lam.position.set(0.02, -0.025, -0.0015); faca.add(lam);
  const cabo = LP.contorno(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.028, 0.022), LP.mat(0x1a1716, 0.5)), 0.04); cabo.position.set(-0.035, 0.0, 0); faca.add(cabo);
  g.add(faca);
  // azulejos e prateleira no fundo (desfocados)
  const par = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), LP.mat(0x3a4650, 0.9)); par.position.set(0, 1.5, -1.3); g.add(par);
  const lus = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0d0).multiplyScalar(2.2) })); lus.position.set(-0.6, 2.4, -0.6); g.add(lus);
  const gota = new THREE.Mesh(new THREE.IcosahedronGeometry(0.006, 1), new THREE.MeshStandardMaterial({ color: 0x4a0a0e, roughness: 0.15, metalness: 0.1 }));
  const risco = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.003, 0.004), new THREE.MeshStandardMaterial({ color: 0x5a0e12, roughness: 0.3 }));
  return { g, faca, tabua, cebola, rodelas, gota, risco };
}

// pose de picar: braço direito (índice 1, x < 0) segura a faca; esquerdo segura a cebola.
// ch: 0..1 (0 = faca em cima, 1 = na tábua). A faca fica no mundo, presa à mão direita a cada quadro.
const _hm = new THREE.Vector3();
export function poseCozinha(p, ch, faca, { inclina = 0.35 } = {}) {
  const [esq, dir] = p.bracos;
  esq.om.rotation.set(-0.55, 0, 0.32); esq.cot.rotation.set(-1.05, 0.0, -0.75);
  dir.om.rotation.set(-0.5 - 0.16 * (1 - ch), 0, -0.3); dir.cot.rotation.set(-1.15 - 0.3 * (1 - ch), 0, 0.7);
  p.cab.rotation.x = inclina;
  if (faca) {
    p.root.updateMatrixWorld(true);
    _hm.set(0, -0.34, 0.01); dir.cot.localToWorld(_hm);
    faca.position.copy(_hm); faca.rotation.set(0, -0.3, -0.12 - 0.25 * (1 - ch), "YXZ");
  }
}
export { clamp, lerp, ease };
