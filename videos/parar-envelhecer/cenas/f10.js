/*META {"imports": ["lowpoly", "cinema", "idade"], "rotulos": [], "D0": 5.55, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, ID = IDADE;
await ID.prepara();
const st = LP.palco(canvas, { foco: 2.2, faixa: 0.8, desfoque: 22, bloom: 1.0, raios: 0.5 });
const { S, cam } = st;
LP.luz(st, "por-do-sol"); st.exposicao = 1.2;
CI.ceu(S, { topo: 0x3a4a7a, horizonte: 0xffb07a }); st.sol(new THREE.Vector3(0, 2.5, -20), 1.0);
const grama = new THREE.Mesh(new THREE.CircleGeometry(20, 40), LP.mat(0x5f8a3c, 0.95)); grama.rotation.x = -Math.PI / 2; S.add(grama);
const arco = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.05, 6, 28, Math.PI), LP.mat(0xf2ede4, 0.6)); arco.position.set(0, 1.25, -0.5); S.add(arco);
[-1, 1].forEach((s) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.25, 8), LP.mat(0xf2ede4, 0.6)); c.position.set(s * 1.05, 0.62, -0.5); S.add(c); });
for (let i = 0; i < 22; i++) { const a = (i / 21) * Math.PI, f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), LP.mat([0xff9ab0, 0xfff2f0, 0xffc0a0][i % 3], 0.6)); f.position.set(Math.cos(a) * 1.05, 1.25 + Math.sin(a) * 1.05, -0.45); S.add(f); }
const ptl = LP.poeira(S, { n: 140, centro: [0, 1.6, 0], raio: [1.4, 0.9, 1.0], cor: 0xffb8c8, tam: 0.012, seed: 6 });
const a = ID.heroi(LP, { roupa: "jaqueta", camisa: 0xf4f0ea, jaqueta: 0x22262e }); a.root.position.set(-0.3, 0, 0); a.root.rotation.y = Math.PI / 2; S.add(a.root);
const b = LP.pessoa({ seed: 30, feminina: true, roupa: "camiseta", camisa: 0xfaf6f0, calca: 0xf2ede4, pele: 0xd9a07e, cabelo: 0x5a3018 }); b.root.position.set(0.3, 0, 0); b.root.rotation.y = -Math.PI / 2; S.add(b.root);
const v = new THREE.Vector3(), M = new THREE.Vector3(0, 1.58, 0);
function render(t) {
  // mãos dadas; em "quase mil anos" ele arregala os olhos (nervoso), ela ri
  LP.ator(a, t, { seed: 12, emocao: t < 4.3 ? "alegre" : ["alegre", "nervoso", range(t, 4.38, 4.9)], olharPara: b.cab.getWorldPosition(v).clone(), olharK: 0.8 });
  LP.ator(b, t, { seed: 30, emocao: "alegre", olharPara: v.set(-0.3, 1.6, 0), olharK: 0.8 });
  a.root.updateMatrixWorld(true); b.root.updateMatrixWorld(true);
  [-1, 1].forEach((s, i) => { const m = v.set(0, 1.0 + 0.01 * Math.sin(t * 2), s * 0.13); LP.alcancar(a, i ? 1 : 0, m, 1); LP.alcancar(b, i ? 0 : 1, m, 1); });
  ptl.update(t);
  CI.trilho(cam, t, [[0, [1.7, 1.6, 2.4], [0, 1.08, 0]], [5.55, [0.7, 1.55, 2.6], [0, 1.1, 0]]], { mao: 1, seed: 5 }); LP.focar(st, M);
  st.draw();
  const c = st.ctx;
  ID.txt(c, "CASAR PARA SEMPRE", 540, 700, { tam: 32, cor: ID.AZUL, a: range(t, 1.97, 2.2) * (1 - range(t, 4.4, 4.6)), esp: 0.3 });
  ID.txt(c, "≈ 1.000 ANOS", 540, 720, { tam: 72, cor: ID.LARANJA, peso: 800, fonte: "inter", a: range(t, 4.74, 4.95), esp: 0 });
}
