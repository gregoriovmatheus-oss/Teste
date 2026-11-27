/*META {"imports": ["lowpoly", "cinema", "sonho"], "rotulos": [], "D0": 5.49, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, SN = SONHO;
await SN.prepara();
const st = LP.palco(canvas, { foco: 1.6, faixa: 0.6, desfoque: 22, bloom: 1.0 });
const { S, cam } = st;
const G = [0, 1, 2].map((i) => { const g = new THREE.Group(); g.position.x = i * 60; S.add(g); return g; });
// A: voando sobre o oceano ao pôr do sol
CI.ceu(G[0], { topo: 0x2a2a7a, horizonte: 0xffa070, nuvens: 6, corNuvem: 0xffc8b0, seed: 4 });
const mar = CI.agua(G[0], { tam: 40, seg: 36, cor: 0x1d4a7a, altura: 0.1, pos: [0, 0, -6] });
const solM = SN.brilho(0xffc080, 14, "suave", 0.9); solM.position.set(0, 5, 60); G[0].add(solM);
const voa = SN.heroi(LP); G[0].add(voa.root);
// B: reencontro — abraço com a avó numa luz dourada
const g1 = G[1]; CI.ceu(g1, { topo: 0x6a4a3a, horizonte: 0xffd8a0, seed: 6 });
LP.bokeh(g1, { n: 30, seed: 3, y: [0.6, 3], z: [-6, -3], cores: [0xffd08a, 0xffb060, 0xfff0d0] });
const chB = new THREE.Mesh(new THREE.CircleGeometry(6, 32), LP.mat(0xc8a070, 0.9)); chB.rotation.x = -Math.PI / 2; g1.add(chB);
const h1 = SN.heroi(LP, { roupa: "camiseta", camisa: 0x6f8fb8 }), avo = LP.pessoa({ seed: 31, feminina: true, idade: "idoso", roupa: "casaco", camisa: 0xc8a8d8, jaqueta: 0x8a5a7a, pele: 0xd8a888, iris: 0x4a3a2a });
h1.root.position.set(-0.27, 0, 0); h1.root.rotation.y = Math.PI / 2; avo.root.position.set(0.27, 0, 0); avo.root.rotation.y = -Math.PI / 2; g1.add(h1.root, avo.root);
const luzB = new THREE.PointLight(0xffc880, 3, 5, 1.5); luzB.position.set(0.4, 2.2, 1.2); g1.add(luzB);
// C: ensaio da conversa difícil — o "outro" é uma figura de sonho translúcida
const g2 = G[2]; CI.ceu(g2, { topo: 0x0e1030, horizonte: 0x3a3a7a, estrelas: 200, seed: 8 });
const chC = new THREE.Mesh(new THREE.CircleGeometry(6, 32), LP.mat(0x2a2a48, 0.6)); chC.rotation.x = -Math.PI / 2; g2.add(chC);
const h2 = SN.heroi(LP, { roupa: "camiseta", camisa: 0x6f8fb8 }), outro = LP.pessoa({ seed: 44, roupa: "jaqueta", camisa: 0xd8d8e0, jaqueta: 0x3a4a6a });
SN.fantasma(outro, 0x8fc8ff, 0.5); h2.root.position.set(0, 0, 0.45); h2.root.rotation.y = Math.PI; outro.root.position.set(0, 0, -0.45); g2.add(h2.root, outro.root);
const SEG = [0, 1.62, 3.28], v = new THREE.Vector3(), R = new THREE.Vector3();
let seg0 = -1;
function render(t) {
  let i = 0; SEG.forEach((s, j) => { if (t >= s) i = j; });
  const t0 = SEG[i], t1 = i < 2 ? SEG[i + 1] : 5.49, u = t - t0, k = u / (t1 - t0);
  G.forEach((g, j) => (g.visible = j === i));
  if (i !== seg0) { seg0 = i; LP.luz(st, ["por-do-sol", "interior", "noite"][i]); CI.clima(st, i === 1 ? "memoria" : "neutro"); }
  st.U.bloom.value = 1.1; st.U.desf.value = 22;
  if (i === 0) { mar.update(t * 2); mar.m.position.z = -6 + ((t * 2.2) % 2);
    LP.ator(voa, t, { seed: 7, pose: [["espreguicar", 1]], emocao: ["surpresa", "alegre", range(t, 0.3, 0.9)] });
    voa.pernas.forEach((l, j) => (l.q.rotation.x = 0.1 + 0.08 * Math.sin(t * 3 + j)));
    voa.root.position.set(0, 2.2 + 0.08 * Math.sin(t * 1.5), 0); voa.root.rotation.set(-(Math.PI / 2 - 0.25), Math.PI, 0.1 * Math.sin(t * 1.2));
    voa.cab.rotation.x -= 0.9; voa.root.updateMatrixWorld(true);
    R.copy(LP.pontoCabeca(voa, "testa"));
    const e = ease.inOutSine(range(t, 0, 1.62)); cam.position.set(R.x + lerp(0.9, 0.55, e), R.y + lerp(-0.45, -0.3, e), R.z - lerp(1.5, 1.15, e)); cam.lookAt(R.x, R.y - 0.22, R.z + 0.35); LP.camMao(cam, t, { seed: 2 }); LP.focar(st, R); }
  if (i === 1) { const ab = ease.inOutCubic(range(u, 0.1, 0.9));
    LP.ator(h1, u, { seed: 7, emocao: ["triste", "alegre", range(u, 0.5, 1.2)] }); LP.ator(avo, u, { seed: 31, emocao: "alegre" });
    LP.abracar(h1, avo, ab);
    R.set(60, 1.55, 0); CI.trilho(cam, u, [[0, [0.9, 1.65, 1.25], [0, 1.45, 0]], [1.66, [0.55, 1.6, 1.05], [0, 1.45, 0]]], { mao: 1, seed: 3 }); cam.position.x += 60; LP.focar(st, R); }
  if (i === 2) { LP.ator(h2, u, { seed: 7, emocao: ["nervoso", "foco", range(u, 0.8, 1.4)], fala: true, gestos: true }); LP.ator(outro, u, { seed: 44, emocao: "calmo" });
    R.copy(LP.pontoCabeca(h2, "boca")); R.y += 0.1; CI.plano(st, R, u, k, "ombro", { de: outro.root.getWorldPosition(v).setY(1.6), lado: 1, seed: 4 }); }
  st.draw();
  const c = st.ctx;
  SN.txt(c, "VOAR SOBRE O OCEANO", 540, 975, { tam: 32, cor: "#fff", a: range(t, 0.39, 0.6) * (i === 0 ? 1 : 0), esp: 0.26 });
  SN.txt(c, "REENCONTRAR QUEM JÁ PARTIU", 540, 975, { tam: 30, cor: "#ffd27a", a: range(t, 1.75, 1.95) * (i === 1 ? 1 : 0), esp: 0.22 });
  SN.txt(c, "ENSAIAR", 540, 900, { tam: 30, cor: SN.AZUL, a: range(t, 3.32, 3.5), esp: 0.34 });
  SN.titulo(c, "", ["a *conversa difícil*"], range(t, 4.28, 4.5), { y: 970, tam: 60 });
}
