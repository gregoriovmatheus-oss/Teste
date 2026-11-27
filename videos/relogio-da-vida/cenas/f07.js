/*META {"imports": ["lowpoly", "cinema", "relogio"], "rotulos": [], "D0": 4.44} */
const LP = LOWPOLY, CI = CINEMA, R = RELOGIO, Y = R.ANOS;
await R.prepara();
const st = LP.palco(canvas, { foco: 1.6, faixa: 0.5, desfoque: 24, bloom: 0.9 });
const { S, cam } = st;
LP.luz(st, "interior"); st.exposicao = 1.1;
const Q = CI.cenario(S, "quarto", { seed: 4 });
const lamp = CI.luzPratica(S, "abajur", [-0.3, 0.5, -2.6], { forca: 0.9 });
// o motoboy avisado fica em casa, sentado na cama, capacete ao lado; o relógio dele não sabe o que mostrar
const mb = R.motoboy(LP); mb.capacete.visible = false; mb.root.position.set(0.6, 0, -0.85); mb.root.rotation.y = 0.15; S.add(mb.root);
const cap = new THREE.Group(); R.capacete(LP, { cab: cap }); cap.position.set(1.25, 0.72, -1.1); cap.rotation.set(0.3, 0.8, 0); S.add(cap);
const h = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  LP.ator(mb, t, { seed: 52, pose: [["sentado", 1], ["pensativo", range(t, 0.2, 0.9)]], emocao: t < 2.6 ? "duvida" : ["duvida", "nervoso", range(t, 2.6, 3.4)], olhar: [-0.2, 0.1] });
  lamp.update(t);
  mb.cab.getWorldPosition(h);
  const e = ease.inOutSine(range(t, 0, 4.44));
  R.mira(cam, v.set(lerp(-0.9, -0.6, e), lerp(1.5, 1.4, e), lerp(1.6, 1.0, e)), h, 800, 560); LP.camMao(cam, t, { seed: 9 });
  LP.focar(st, h); CI.preenche(st, h, { forca: 1.2 });
  st.draw();
  const c = st.ctx;
  // em "muda?" (3,91 s) o relógio pisca entre as 3 horas e uma vida inteira
  const gl = range(t, 3.3, 3.6), alt = t > 3.91 && Math.floor(t * 7) % 2 === 0;
  R.relogio(c, alt ? 47 * Y + 3e6 - t : 2 * 3600 + 41 * 60 + 10 - t, mb, cam, range(t, 0.3, 0.55), { rotulo: t > 3.91 ? "MUDA?" : "MOTOBOY", tam: 58, sobe: 0.26, cor: alt ? R.AZUL : R.LARANJA, glitch: gl, t });
  R.txt(c, "PARADOXO", 540, 985, { tam: 40, cor: R.LARANJA, a: range(t, 0.64, 0.9) * (1 - range(t, 1.9, 2.05)), esp: 0.34 });
  R.txt(c, "FICA EM CASA", 540, 985, { tam: 34, cor: "#fff", a: range(t, 2.6, 2.85) * (1 - range(t, 3.35, 3.5)), esp: 0.24 });
  R.txt(c, "O RELÓGIO MUDA?", 540, 985, { tam: 34, cor: R.AZUL, a: range(t, 3.47, 3.7), esp: 0.22 });
}
