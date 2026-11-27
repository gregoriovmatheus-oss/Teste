/*META {"imports": ["lowpoly", "cinema", "relogio"], "rotulos": [], "D0": 3.8} */
const LP = LOWPOLY, CI = CINEMA, R = RELOGIO;
await R.prepara();
const st = LP.palco(canvas, { foco: 2.4, faixa: 0.7, desfoque: 22, bloom: 0.85 });
const { S, cam } = st;
LP.luz(st, "frio"); st.exposicao = 0.95; CI.clima(st, "pesadelo"); st.U.sat.value = 0.55;
CI.cenario(S, "rua", { seed: 13 }); CI.ceu(S, { topo: 0x10141e, horizonte: 0x2a3444 });
const mol = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 12), new THREE.MeshStandardMaterial({ color: 0x0e1016, roughness: 0.12, metalness: 0.5, transparent: true, opacity: 0.6 })); mol.rotation.x = -Math.PI / 2; mol.position.set(-3.2, 0.113, -3); S.add(mol);   // calçada molhada
const poste = CI.luzPratica(S, "poste", [-4.1, 0.11, -1.4], { forca: 1.1 });
const ch = CI.chuva(S, { n: 380, area: [2.5, 4, 3], centro: [-3.2, 0, -1.2], vel: 8 });
// se não mudar: você, sozinho no banco, sob a chuva; ninguém sabe o que você sabe
const bc = R.banco(LP); bc.position.set(-3.2, 0.11, -1.25); bc.rotation.y = 0.5; S.add(bc);
const eu = R.heroi(LP); eu.root.position.set(-3.2, 0.11, -1.2); eu.root.rotation.y = 0.5; S.add(eu.root);
const h = new THREE.Vector3(), v = new THREE.Vector3();
function render(t) {
  LP.ator(eu, t, { seed: 18, pose: [["sentado", 1], ["encolhido", 0.6]], emocao: ["triste", "choro", range(t, 1.6, 2.8)], olhar: [0, -0.35] });
  eu.cab.rotation.x += 0.15;
  ch.update(t); poste.update(t);
  eu.cab.getWorldPosition(h);
  const e = ease.inOutSine(range(t, 0, 3.8));
  R.mira(cam, v.set(h.x + lerp(0.9, 1.6, e), lerp(1.4, 2.3, e), h.z + lerp(1.3, 2.4, e)), h, lerp(760, 720, e)); LP.camMao(cam, t, { seed: 13, intens: 0.6 });
  LP.focar(st, h); CI.preenche(st, h, { forca: 0.9, cor: 0xc8d8ff });
  st.draw();
  const c = st.ctx;
  R.txt(c, "SÓ UM PESO", 540, 985, { tam: 38, cor: "#dfe8f2", a: range(t, 1.8, 2.05) * (1 - range(t, 2.9, 3.05)), esp: 0.3 });
  R.txt(c, "CARREGADO SOZINHO", 540, 985, { tam: 34, cor: R.AZUL, a: range(t, 3.1, 3.3), esp: 0.24 });
}
