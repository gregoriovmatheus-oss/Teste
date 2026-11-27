/*META {"imports": ["lowpoly", "cinema", "sonho"], "rotulos": [], "D0": 4.91, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, SN = SONHO;
await SN.prepara();
const st = LP.palco(canvas, { fundo: 0x0a0c1c, foco: 1.8, faixa: 0.6, desfoque: 22, bloom: 1.1 });
const { S, cam } = st;
LP.luz(st, "noite"); st.exposicao = 1.2; st.hemi.intensity = 0.5;
const G = [0, 1].map((i) => { const g = new THREE.Group(); g.position.x = i * 60; S.add(g);
  const ch = new THREE.Mesh(new THREE.CircleGeometry(7, 32), LP.mat(0x2a2236, 0.8)); ch.rotation.x = -Math.PI / 2; g.add(ch);
  const pa = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), LP.mat(0x262a44, 0.9)); pa.position.set(0, 3, -1.6); g.add(pa); return g; });
// A: musicista dormindo, notas de luz saindo da cabeça; violão encostado na cama
const cA = SN.cama(LP, { coberta: 0x7a3a5a, lencol: 0xd8d0e0 }); G[0].add(cA.g);
const mus = LP.pessoa({ seed: 51, feminina: true, roupa: "pijama", camisa: 0xc8a0d8, jaqueta: 0xc8a0d8, calca: 0xc8a0d8, pele: 0x9a6a4a, cabelo: 0x1a100a, iris: 0x2a1a0a }); G[0].add(mus.root);
const vio = new THREE.Group(); G[0].add(vio); vio.position.set(-0.62, 0.55, -0.2); vio.rotation.set(0, 0, 0.25);
[[0.2, -0.18], [0.15, 0.05]].forEach(([rr, y]) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 0.08, 16), LP.mat(0xb06a2a, 0.4)); b.rotation.x = Math.PI / 2; b.position.y = y; vio.add(b); });
const braco = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.03), LP.mat(0x3a2010, 0.5)); braco.position.y = 0.38; vio.add(braco);
const NT = SN.notas(G[0], { n: 16, origem: [0, 0.85, -0.75], sobe: 1.6, largura: 0.9, seed: 5 });
const abA = CI.luzPratica(G[0], "abajur", [0.8, 0.35, -1.0], { forca: 0.8 });
// B: atleta dormindo; acima dele o "eu do sonho" (translúcido) correndo
const cB = SN.cama(LP, { coberta: 0x2a5a4a, lencol: 0xd0d8e0 }); G[1].add(cB.g);
const atl = LP.pessoa({ seed: 61, roupa: "camiseta", camisa: 0xe8582a, pele: 0xc08060, cabelo: 0x2a1a10, barba: false, iris: 0x3a2a1a }); G[1].add(atl.root);
const fan = LP.pessoa({ seed: 61, roupa: "camiseta", camisa: 0xe8582a, pele: 0xc08060, cabelo: 0x2a1a10, barba: false }); SN.fantasma(fan, 0x7cc8ff, 0.42); G[1].add(fan.root);
const rastro = LP.poeira(G[1], { n: 50, centro: [0, 1.6, -0.5], raio: [0.4, 0.5, 0.9], cor: 0x7cc8ff, seed: 6, tam: 0.01 });
const SEG = [0, 1.92], v = new THREE.Vector3(), R = new THREE.Vector3();
function render(t) {
  const i = t >= SEG[1] ? 1 : 0, u = t - SEG[i]; G.forEach((g, j) => (g.visible = j === i));
  if (i === 0) { SN.deitado(LP, mus, t, [0, 0.59, 0.86], { seed: 51, emocao: "dormindo", ergue: 0.3 });
    NT.update(t, range(t, 0.15, 0.5)); R.copy(LP.pontoCabeca(mus, "testa"));
    CI.trilho(cam, t, [[0, [-1.35, 1.45, 0.45], [0, 0.55, -0.45]], [1.92, [-1.0, 1.35, 0.15], [0, 0.6, -0.55]]], { mao: 1, seed: 2 }); LP.focar(st, R); abA.update && abA.update(t); }
  else { SN.deitado(LP, atl, u, [0, 0.59, 0.86], { seed: 61, emocao: "dormindo", tremer: 0.15 });
    LP.ator(fan, u, { seed: 61, correr: { vel: 1.2 }, emocao: "foco" }); fan.root.position.set(0, 1.05 + 0.05 * Math.sin(u * 9), -0.35); fan.root.rotation.y = Math.PI / 2;
    rastro.update(u * 3); R.copy(LP.pontoCabeca(atl, "testa")); cam.position.set(0, 0, 0);
    CI.trilho(cam, u, [[0, [-2.8, 1.5, 2.6], [0, 1.25, -0.4]], [2.99, [-2.3, 1.75, 2.1], [0, 1.3, -0.4]]], { mao: 1, seed: 3 }); cam.position.x += 60; LP.focar(st, v.set(60, 1.2, -0.4)); }
  st.draw();
  const c = st.ctx;
  SN.txt(c, "MÚSICOS", 540, 900, { tam: 30, cor: SN.AZUL, a: range(t, 0.1, 0.3) * (1 - range(t, 1.8, 1.9)), esp: 0.34 });
  SN.titulo(c, "", ["compondo *dormindo*"], range(t, 0.61, 0.85) * (1 - range(t, 1.8, 1.9)), { y: 970, tam: 58 });
  SN.txt(c, "ATLETAS", 540, 900, { tam: 30, cor: SN.LARANJA, a: range(t, 1.97, 2.2), esp: 0.34 });
  SN.titulo(c, "", ["treinando *sem sair da cama*"], range(t, 2.42, 2.7), { y: 970, tam: 54 });
}
