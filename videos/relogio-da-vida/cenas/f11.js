/*META {"imports": ["lowpoly", "cinema", "relogio"], "rotulos": [], "D0": 4.28} */
const LP = LOWPOLY, CI = CINEMA, R = RELOGIO, Y = R.ANOS;
await R.prepara();
const st = LP.palco(canvas, { foco: 1.6, faixa: 0.45, desfoque: 26, bloom: 0.9 });
const { S, cam } = st;
LP.luz(st, "interior"); st.exposicao = 1.05; st.quente.intensity = 1.4;
CI.cenario(S, "quarto", { seed: 8 });
const lamp = CI.luzPratica(S, "abajur", [-1.2, 0.5, -2.0], { forca: 0.7 });
// espelho no meio do quarto: o reflexo é um segundo você, virado para cá; o relógio dele é o seu, e está borrado
const ZE = -1.1, esp = R.espelho(LP); esp.position.set(0, 1.45, ZE); S.add(esp);
const fundo = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), LP.mat(0x2a3038, 0.9)); fundo.position.set(0, 1.45, ZE - 1.25); S.add(fundo);
[-1, 1].forEach((s) => { const lat = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.4), LP.mat(0x343a44, 0.9)); lat.rotation.y = -s * Math.PI / 2; lat.position.set(s * 0.46, 1.45, ZE - 0.625); S.add(lat); });
const eu = R.heroi(LP); eu.root.position.set(0.04, 0, ZE + 0.6); eu.root.rotation.y = Math.PI; S.add(eu.root);
const re = R.heroi(LP); re.root.position.set(0.04, 0, ZE - 0.6); S.add(re.root);
const h = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  const em = t < 1.9 ? ["calmo", "duvida", range(t, 0.4, 1.1)] : ["duvida", "nervoso", range(t, 2.3, 2.9)];
  LP.ator(eu, t, { seed: 18, emocao: em, olhar: [0, 0.05] });
  LP.ator(re, t, { seed: 18, emocao: em, olhar: [0, 0.05] });
  lamp.update(t);
  re.cab.getWorldPosition(h);
  const e = ease.inOutSine(range(t, 0, 4.28));
  R.mira(cam, v.set(lerp(0.42, 0.3, e), 1.68, ZE + lerp(1.7, 1.25, e)), h, 820, lerp(560, 600, e)); LP.camMao(cam, t, { seed: 15 });
  LP.focar(st, h); CI.preenche(st, h, { forca: 1.3 });
  st.draw();
  const c = st.ctx;
  R.relogio(c, 38 * Y + 2e7 - t, re, cam, range(t, 1.09, 1.35), { rotulo: "VOCÊ", tam: 58, sobe: 0.25, borrado: 1 - 0.35 * range(t, 3.05, 3.6), t, cor: R.LARANJA });
  R.txt(c, "O SEU PRÓPRIO RELÓGIO", 540, 985, { tam: 30, cor: R.AZUL, a: range(t, 0.62, 0.9) * (1 - range(t, 2.2, 2.4)), esp: 0.22 });
  R.txt(c, "CORAGEM DE OLHAR?", 540, 985, { tam: 34, cor: "#fff", a: range(t, 2.41, 2.65), esp: 0.22 });
}
