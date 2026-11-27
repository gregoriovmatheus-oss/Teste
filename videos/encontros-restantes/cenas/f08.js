/*META {"imports": ["lowpoly", "cinema", "encontros"], "rotulos": [], "D0": 6.23} */
const LP = LOWPOLY, CI = CINEMA, E = ENCONTROS;
await E.prepara();
const st = LP.palco(canvas, { foco: 1.3, faixa: 0.45, desfoque: 24, bloom: 0.95, raios: 0.7 });
const { S, cam } = st;
LP.luz(st, "por-do-sol"); st.exposicao = 1.15; st.quente.intensity = 1.6;
CI.cenario(S, "quarto", { seed: 3 }); st.sol(new THREE.Vector3(-2.94, 1.6, -0.8), 1.0);
const poe = LP.poeira(S, { n: 70, centro: [0, 1.5, 0.2], raio: [1.0, 0.7, 0.6], cor: 0xffd89a });
const lamp = CI.luzPratica(S, "abajur", [-0.9, 0, -1.4], { forca: 0.8 });
// 1º plano: a despedida vira um abraço longo (mãe); 2º plano (3,85 s): você liga para ela
const eu = E.heroi(LP); S.add(eu.root);
const ma = E.mae(LP); ma.root.position.set(0, 0, 0.42); ma.root.rotation.y = Math.PI; S.add(ma.root);
const cel = CI.luzPratica(S, "celular", [0, 0, 0], { forca: 0.3 }); LP.segurar(eu, 0, cel.g, { pos: [0, -0.1, 0.04] }); cel.g.rotation.set(-1.2, 0, Math.PI);
const v = new THREE.Vector3(), R = new THREE.Vector3(0, 1.6, 0), CORTE = 3.85;
function render(t) {
  const lig = t >= CORTE;
  ma.root.visible = !lig; cel.g.visible = lig;
  if (!lig) {
    LP.ator(eu, t, { seed: 12, emocao: ["calmo", "choro", range(t, 1.2, 2.6)], olhar: [0, -0.2] });
    LP.ator(ma, t, { seed: 37, emocao: ["alegre", "calmo", range(t, 2.0, 2.6)] });
    const k = ease.inOutCubic(range(t, 0.15, 0.9)); LP.abracar(eu, ma, k);
    eu.cab.rotation.z += 0.12 * k; ma.cab.rotation.z -= 0.1 * k;
    // câmera em órbita lenta em volta do abraço; o rosto dele aparece por cima do ombro dela
    const a = lerp(0.45, 0.85, ease.inOutSine(range(t, 0, CORTE)));
    cam.position.set(Math.sin(a) * 1.7, 1.7, 0.2 + Math.cos(a) * 1.7); cam.lookAt(0.0, 1.38, 0.05); LP.camMao(cam, t, { seed: 4 });
    LP.focar(st, R);
  } else {
    const u = t - CORTE;
    eu.root.rotation.y = 0.4;
    LP.ator(eu, t, { seed: 12, emocao: ["calmo", "alegre", range(u, 0.4, 1.0)], fala: true, olhar: [0.1, -0.35] });
    eu.root.updateMatrixWorld(true); LP.alcancar(eu, 0, eu.root.localToWorld(v.set(0.06, 1.36, 0.3)), 1, { polo: new THREE.Vector3(1, -0.6, -0.3) });
    cel.update(t);
    CI.plano(st, eu.cab.getWorldPosition(v), u, u / 2.4, "medio", { lado: 1, seed: 5 });
  }
  CI.preenche(st, eu.cab.getWorldPosition(v), { forca: 1.4 }); poe.update(t); lamp.update(t);
  st.draw();
  const c = st.ctx;
  E.txt(c, "DESPEDIDA", 540, 935, { tam: 26, cor: E.AZUL, a: range(t, 0.1, 0.4) * (1 - range(t, 2.0, 2.15)), esp: 0.32 });
  E.txt(c, "VIRA EVENTO", 540, 985, { tam: 34, cor: "#fff", a: range(t, 1.43, 1.7) * (1 - range(t, 2.0, 2.15)), esp: 0.22 });
  E.txt(c, "ABRAÇOS MAIS LONGOS", 540, 985, { tam: 34, cor: E.LARANJA, a: range(t, 2.18, 2.45) * (1 - range(t, 3.6, 3.8)), esp: 0.2 });
  E.txt(c, "LIGAR AGORA", 540, 935, { tam: 34, cor: E.LARANJA, a: range(t, 3.95, 4.2), esp: 0.24 });
  E.txt(c, "NÃO DEPOIS", 540, 985, { tam: 26, cor: E.AZUL, a: range(t, 5.26, 5.5), esp: 0.3 });
}
