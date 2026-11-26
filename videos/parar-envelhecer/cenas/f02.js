/*META {"imports": ["lowpoly", "cinema", "idade"], "rotulos": [], "D0": 3.71, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, ID = IDADE;
await ID.prepara();
const st = LP.palco(canvas, { foco: 1.9, faixa: 0.5, desfoque: 22, bloom: 0.8 });
const { S, cam } = st;
LP.luz(st, "interior"); st.exposicao = 1.15; st.quente.intensity = 2.2; st.quente.position.set(0.8, 2.4, 0.2); st.hemi.intensity = 0.7;
CI.cenario(S, "quarto");
// espelho: moldura + vidro levemente azulado; o "reflexo" é a mesma pessoa virada para a câmera
const mold = new THREE.Group(); S.add(mold); mold.position.set(0, 1.45, 0);
[[0.95, 0.05, 0, 0.66], [0.95, 0.05, 0, -0.66], [0.05, 1.37, 0.45, 0], [0.05, 1.37, -0.45, 0]].forEach(([w, h, x, y]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), LP.mat(0xd8b878, 0.35)); m.position.set(x, y, 0); mold.add(m); });
const vidro = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.28), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.6 })); mold.add(vidro);
const p = ID.heroi(LP, { camisa: 0x2f6f9a }); p.root.position.set(0, 0, 0.55); p.root.rotation.y = Math.PI; S.add(p.root);
const r = ID.heroi(LP, { camisa: 0x2f6f9a }); r.root.position.set(0, 0, -0.55); S.add(r.root);
const R = new THREE.Vector3(0, 1.62, -0.49);
function render(t) {
  CI.trilho(cam, t, [[0, [0.42, 1.78, 1.75], [0, 1.42, -0.5]], [3.71, [0.26, 1.74, 1.45], [0, 1.43, -0.5]]], { mao: 1, seed: 4 });
  const em = ["duvida", "alegre", range(t, 1.9, 2.5)], k = ease.inOutCubic(range(t, 0.3, 0.9)) * (1 - ease.inOutCubic(range(t, 2.4, 3.0)));
  [[p, 0], [r, 1]].forEach(([q, lado]) => { LP.ator(q, t, { seed: 12, emocao: em });
    q.root.updateMatrixWorld(true); LP.alcancar(q, lado, LP.pontoCabeca(q, "bochecha", lado), k, { polo: new THREE.Vector3(lado ? -1 : 1, -0.3, -0.2) });
    q.cab.rotation.y += 0.25 * Math.sin(t * 1.4) * (lado ? 1 : -1) * k; });
  LP.focar(st, R); CI.preenche(st, R, { forca: 1.8 });
  st.draw();
  ID.lista(st.ctx, [["RUGAS", 0.1, 2.25], ["CABELO BRANCO", 0.47, 2.4], ["DOR NAS COSTAS", 1.32, 2.55]], t, 540, 690, { w: 560 });
  ID.txt(st.ctx, "NADA DISSO", 540, 920, { tam: 34, cor: ID.LARANJA, a: range(t, 2.25, 2.5), esp: 0.3 });
}
