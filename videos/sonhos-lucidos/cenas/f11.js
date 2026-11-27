/*META {"imports": ["lowpoly", "cinema", "sonho"], "rotulos": [], "D0": 6.32, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, SN = SONHO;
await SN.prepara();
const st = LP.palco(canvas, { fundo: 0x10102a, foco: 0.5, faixa: 0.2, desfoque: 24, bloom: 1.0 });
const { S, cam } = st;
LP.luz(st, "noite"); st.exposicao = 1.25; st.hemi.intensity = 0.6; st.quente.intensity = 1.8;
const ceu = SN.ilhaSonho(S, LP, CI, { seed: 13, topo: 0x0e0a30, horizonte: 0x4a3a8a, nN: 8, orbes: 40 });
// teste de realidade: a mão na frente do rosto; no sonho, nasce um sexto dedo
const p = SN.heroi(LP); S.add(p.root);
const extra = SN.dedoExtra(p, 0);
const R = new THREE.Vector3(), M = new THREE.Vector3(), v = new THREE.Vector3(), al = new THREE.Vector3();
function render(t) {
  LP.ator(p, t, { seed: 7, emocao: t < 4.8 ? ["calmo", "foco", range(t, 1.6, 2.2)] : ["foco", "surpresa", range(t, 4.85, 5.3)], olharPara: M, olharK: range(t, 1.2, 1.9) * 0.9 });
  R.copy(LP.pontoCabeca(p, "boca"));
  const sobe = ease.inOutCubic(range(t, 0.9, 1.9));
  M.set(R.x - 0.1, R.y - 0.1, R.z + 0.3);
  LP.alcancar(p, 0, M, sobe, { polo: new THREE.Vector3(-1, -1, 0), maoGira: 0 });
  SN.contarDedos(p, 0, 4, sobe);
  const x6 = ease.outBack(range(t, 5.45, 5.9)); extra.scale.setScalar(Math.max(0.001, x6));
  p.bracos[0].mao.getWorldPosition(v);
  const cl = ease.inOutCubic(range(t, 1.95, 2.5));
  // plano médio → close da mão em primeiro plano, o rosto desfocado atrás
  CI.trilho(cam, t, [[0, [0.5, 1.72, 1.8], [0, 1.3, 0]], [1.95, [0.35, 1.66, 1.4], [0, 1.32, 0.1]]], { mao: 1, seed: 7 });
  if (cl > 0) { al.set(v.x + 0.2, v.y + 0.06, v.z + 0.72); cam.position.lerp(al, cl); al.set(lerp(R.x, v.x, cl), lerp(R.y - 0.25, v.y - 0.12, cl), lerp(R.z, v.z, cl)); cam.lookAt(al); LP.camMao(cam, t, { seed: 3 }); }
  st.U.foco.value = cam.position.distanceTo(cl > 0.5 ? v : R); st.U.faixa.value = cl > 0.5 ? 0.1 : 0.4;
  ceu.update(t);
  st.draw();
  const c = st.ctx;
  SN.txt(c, "O TRUQUE", 540, 975, { tam: 30, cor: SN.AZUL, a: range(t, 1.7, 1.9) * (1 - range(t, 2.6, 2.8)), esp: 0.34 });
  const nd = x6 > 0.5 ? 6 : 5;
  SN.txt(c, nd + " DEDOS", 540, 690, { tam: 34, cor: nd === 6 ? SN.LARANJA : "#fff", a: range(t, 2.84, 3.05), esp: 0.3 });
  // o texto lido duas vezes: na 2ª leitura (e no sonho) ele embaralha e muda
  const ta = range(t, 3.29, 3.5); if (ta > 0) {
    const s1 = "VOCÊ ESTÁ ACORDADO", s2 = "VOCÊ ESTÁ SONHANDO", mk = range(t, 4.83, 5.6), emb = Math.sin(Math.PI * mk);
    const s = SN.embaralha(mk < 0.5 ? s1 : s2, Math.max(emb, 0.25 * range(t, 4.02, 4.2) * (1 - range(t, 4.4, 4.6))), Math.floor(t * 12));
    SN.painel(c, 150, 905, 780, 96, ta, { borda: mk > 0.5 ? SN.LARANJA : SN.AZUL });
    SN.txt(c, s, 540, 955, { tam: 40, cor: mk > 0.5 ? SN.LARANJA : "#fff", a: ta, esp: 0.08, sombra: false });
    SN.txt(c, range(t, 4.02, 4.1) > 0 ? "LEIA DE NOVO" : "LEIA", 540, 870, { tam: 24, cor: SN.AZUL, a: ta * (1 - range(t, 4.8, 4.9)), esp: 0.3 });
  }
}
