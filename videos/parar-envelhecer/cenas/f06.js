/*META {"imports": ["lowpoly", "cinema", "idade"], "rotulos": [], "D0": 5.48, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const LP = LOWPOLY, CI = CINEMA, ID = IDADE;
await ID.prepara();
const st = LP.palco(canvas, { fundo: 0x0a141c, foco: 1.2, faixa: 0.4, desfoque: 20, bloom: 0.9 });
const { S, cam } = st;
LP.luz(st, "dramatica"); st.exposicao = 1.25; st.hemi.intensity = 0.8;
const chao = new THREE.Mesh(new THREE.CircleGeometry(8, 40), LP.mat(0x3a2e26, 0.95)); chao.rotation.x = -Math.PI / 2; S.add(chao);
// à esquerda: aquário com a hidra numa pedra; à direita: o rato-toupeira-pelado na terra
const aq = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x6ab8e0, transparent: true, opacity: 0.18, roughness: 0.05, side: THREE.DoubleSide })); aq.position.set(-0.6, 0.5, 0); S.add(aq);
const agua = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.9, 28), new THREE.MeshStandardMaterial({ color: 0x1a6a8a, transparent: true, opacity: 0.22, roughness: 0.1, emissive: 0x0a3a5a, emissiveIntensity: 0.4 })); agua.position.set(-0.6, 0.45, 0); S.add(agua);
const pedra = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), LP.mat(0x5a6058, 0.9)); pedra.position.set(-0.6, 0.06, 0); pedra.scale.y = 0.6; S.add(pedra);
const h = ID.hidra(LP); h.root.position.set(-0.6, 0.1, 0); S.add(h.root);
const bol = LP.poeira(S, { n: 60, centro: [-0.6, 0.5, 0], raio: [0.3, 0.4, 0.3], cor: 0xbfe8ff, tam: 0.006, seed: 8 });
const ra = ID.rato(LP); ra.root.position.set(0.65, 0, 0.05); ra.root.rotation.y = -0.5; ra.root.scale.setScalar(1.7); S.add(ra.root);
[[0.4, -0.3, 0.25], [1.0, -0.2, 0.3], [0.8, 0.35, 0.18]].forEach(([x, z, s], i) => { const m = new THREE.Mesh(LP.facetado(1, () => {}, 20 + i, 0.3), LP.mat(0x4a3a2c, 0.95)); m.position.set(x, 0, z); m.scale.set(s, s * 0.5, s); S.add(m); });
const lamp = new THREE.PointLight(0xffd0a0, 2.5, 4, 2); lamp.position.set(0.6, 1.2, 0.8); S.add(lamp);
const lampA = new THREE.PointLight(0x7cd8ff, 2.5, 3, 2); lampA.position.set(-0.6, 1.1, 0.6); S.add(lampA);
const v = new THREE.Vector3();
function render(t) {
  h.update(t); ra.update(t, 0); bol.update(t);
  ra.root.position.x = 0.65 + 0.08 * ease.inOutSine(range(t, 3.0, 4.2));
  // hidra de perto → panorâmica para o rato → recua e mostra os dois
  CI.trilho(cam, t, [[0, [-0.35, 0.75, 1.3], [-0.6, 0.55, 0]], [2.4, [-0.4, 0.72, 1.4], [-0.6, 0.5, 0]], [3.2, [0.85, 0.55, 1.2], [0.65, 0.2, 0]], [4.0, [0.8, 0.6, 1.4], [0.6, 0.22, 0]], [5.48, [0.1, 1.05, 2.9], [0.05, 0.35, 0]]], { mao: 1, seed: 7 });
  LP.focar(st, v.set(range(t, 2.5, 3.2) * 1.25 - 0.6, 0.35, 0));
  st.draw();
  const c = st.ctx;
  ID.tag(c, "HIDRA", v.set(-0.6, 0.72, 0), cam, range(t, 2.34, 2.55), { dy: 200 });
  ID.tag(c, "RATO-TOUPEIRA-PELADO", v.set(0.75, 0.18, 0.1), cam, range(t, 2.96, 3.2), { cor: ID.LARANJA, dy: 260 });
  ID.txt(c, "QUASE NÃO ENVELHECEM", 540, 985, { tam: 34, cor: "#fff", a: range(t, 4.02, 4.3), esp: 0.2 });
}
