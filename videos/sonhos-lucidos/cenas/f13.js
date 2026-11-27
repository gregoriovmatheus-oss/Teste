/*META {"imports": ["lowpoly", "cinema", "sonho"], "rotulos": [], "D0": 5.65, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, SN = SONHO;
await SN.prepara();
const st = LP.palco(canvas, { fundo: 0x140a30, foco: 1.0, faixa: 0.35, desfoque: 22, bloom: 1.0 });
const { S, cam } = st;
LP.luz(st, "noite"); st.exposicao = 0.95; st.hemi.color.set(0xb89aff); st.hemi.intensity = 0.7; st.quente.color.set(0xffc0e0); st.quente.intensity = 1.6; st.rim.color.set(0x8fb8ff);
CI.clima(st, "sonho"); st.U.nevoa.value = 0.015;
const ceu = SN.ilhaSonho(S, LP, CI, { seed: 4 });
// mesma imagem da f01: cama flutuando no céu de sonho. Ele olha as próprias mãos e depois encara a câmera
const C = SN.cama(LP, { coberta: 0x5a4aa8, brilha: 0.15, lencol: 0xb8b0dc, madeira: 0x6a5aa8 }); C.g.position.set(0, 1.0, 0); S.add(C.g);
const base = SN.nuvem(LP, { seed: 9, n: 7, cor: 0xe6dcff, emis: 0.3 }); base.position.set(0, 0.72, 0); base.scale.set(1.3, 0.7, 2.0); base.rotation.y = Math.PI / 2; S.add(base);
const lu = SN.lua(0xfff0e0, 1.4); lu.position.set(-5, 8, -14); S.add(lu);
const p = SN.heroi(LP); S.add(p.root);
const extra = SN.dedoExtra(p, 0);
const poe = LP.poeira(S, { n: 70, centro: [0, 1.9, -0.4], raio: [1.0, 0.6, 1.0], cor: 0xd8c8ff, seed: 3 });
const R = new THREE.Vector3(), al = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  const mk = ease.inOutCubic(range(t, 0.55, 1.3)) * (1 - ease.inOutCubic(range(t, 2.3, 3.0)));
  const em = t < 2.2 ? ["alegre", "foco", range(t, 0.6, 1.2)] : ["foco", "surpresa", range(t, 2.4, 3.0)];
  SN.deitado(LP, p, t, [0, 1.59, 0.86], { seed: 7, emocao: em, olhar: [0, 0.15], ergue: 1 });
  R.copy(LP.pontoCabeca(p, "testa")).lerp(LP.pontoCabeca(p, "boca"), 0.5);
  [0, 1].forEach((l) => { LP.alcancar(p, l, v.set(R.x + (l ? 0.11 : -0.11), R.y + 0.12, R.z + 0.34), mk, { polo: new THREE.Vector3(l ? 1 : -1, -1, 0), maoGira: l ? 1.3 : -1.3 }); SN.contarDedos(p, l, 4, mk); });
  extra.scale.setScalar(Math.max(0.001, ease.outBack(range(t, 1.5, 1.9)) * (1 - range(t, 2.3, 2.5))));
  if (mk > 0.05) LP.olharPara(p, p.bracos[0].pulso.getWorldPosition(v), mk * 0.6);
  // termina no enquadramento do quadro 0 da f01
  const e = ease.inOutSine(range(t, 0, 5.65));
  cam.position.set(R.x + lerp(-0.3, 0.12, e), R.y + lerp(0.75, 0.36, e), R.z + lerp(2.4, 1.45, e));
  al.set(R.x, R.y - lerp(0.35, 0.3, e), R.z); cam.lookAt(al); LP.camMao(cam, t, { seed: 2 });
  LP.focar(st, R); CI.preenche(st, R, { forca: 1.4, cor: 0xffd8f0 });
  ceu.update(t); poe.update(t);
  st.draw();
  const c = st.ctx;
  SN.txt(c, "OLHE PARA AS SUAS MÃOS", 540, 975, { tam: 30, cor: SN.AZUL, a: range(t, 0.61, 0.85) * (1 - range(t, 2.1, 2.3)), esp: 0.24 });
  SN.titulo(c, "", ["Tem certeza de que", "*está acordado*?"], range(t, 2.6, 3.0), { y: 900, tam: 62 });
}
