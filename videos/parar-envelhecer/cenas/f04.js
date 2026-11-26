/*META {"imports": ["idade"], "rotulos": [{"de": 3.69, "ate": 5.04, "texto": "<span class=\"k\">RISCO DE MORTE POR ANO</span><br><span class=\"y\">1 em 1.000</span>"}], "D0": 5.04, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
const ID = IDADE;
await ID.prepara();
const st = ID.palcoDoc(T, canvas, { fov: 34 });
const S = st.scene, cam = st.cam;
// 1.000 pessoas = 1.000 pontos (40 × 25); uma acende em laranja em "1 em mil"
const N = 1000, C = 40, geo = new THREE.OctahedronGeometry(0.035, 0), m = new THREE.MeshStandardMaterial({ color: 0x9fd6ff, emissive: 0x7cc8ff, emissiveIntensity: 0.6, roughness: 0.3 });
const im = new THREE.InstancedMesh(geo, m, N); S.add(im);
const o = new THREE.Object3D(), pos = [];
for (let i = 0; i < N; i++) { const x = (i % C - (C - 1) / 2) * 0.12, y = 0.35 + Math.floor(i / C) * 0.12; pos.push([x, y]); }
const ALVO = 612, cor = new THREE.Color(), halo = ID.brilho(0xff8a4c, 0.8, "suave", 0); S.add(halo);
const um = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshStandardMaterial({ color: 0xff8a4c, emissive: 0xff8a4c, emissiveIntensity: 1.6 })); S.add(um);
um.position.set(pos[ALVO][0], pos[ALVO][1], 0.02); halo.position.copy(um.position);
const al = new THREE.Vector3();
function render(t) {
  for (let i = 0; i < N; i++) { const [x, y] = pos[i], a = ease.outBack(range(t, 0.4 + (y - 0.35) * 0.35 + Math.abs(x) * 0.08, 1.2 + (y - 0.35) * 0.35 + Math.abs(x) * 0.08));
    o.position.set(x, y, 0.02 * Math.sin(t * 2 + i)); o.scale.setScalar(Math.max(0.001, a * (i === ALVO ? 0 : 1))); o.rotation.y = t + i; o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.instanceMatrix.needsUpdate = true;
  const k = ease.outBack(range(t, 3.69, 4.0)); um.scale.setScalar(Math.max(0.001, k)); um.rotation.y = t * 2; halo.material.opacity = k; halo.scale.setScalar(0.8 + 0.15 * Math.sin(t * 6));
  m.emissiveIntensity = 0.6 - 0.35 * range(t, 3.69, 4.1);
  // câmera: começa dentro da multidão de pontos e recua até ver as 1.000; depois aproxima do ponto laranja
  const e = ease.inOutSine(range(t, 0, 3.6)), f = ease.inOutCubic(range(t, 3.7, 5.04));
  cam.position.set(lerp(-1.2, 0.3, e) + f * 0.4, lerp(1.6, 1.0, e) + f * 0.4, lerp(1.3, 6.0, e) - f * 1.6);
  al.set(lerp(-0.9, 0, e) + f * 0.45, lerp(1.5, 0.45, e) + f * 0.55, 0); cam.lookAt(al);
  st.bloom = 0.8; st.draw();
  ID.txt(st.ctx, "JOVENS DE 25 ANOS", 540, 980, { tam: 30, cor: ID.AZUL, a: range(t, 1.87, 2.1) * (1 - range(t, 3.4, 3.6)), esp: 0.3 });
  ID.txt(st.ctx, "POR ANO", 540, 1000, { tam: 30, cor: ID.LARANJA, a: range(t, 4.28, 4.5), esp: 0.3 });
}
