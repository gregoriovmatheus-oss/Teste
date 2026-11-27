/*META {"imports": ["encontros"], "rotulos": [], "D0": 5.77} */
const E = ENCONTROS;
await E.prepara();
const st = E.palcoDoc(T, canvas, { fov: 34 });
const S = st.scene, cam = st.cam;
// agenda: um mês (7 × 5) de quadradinhos; cada "mais um encontro" acende um dia e o número sobe
const g = new THREE.Group(); S.add(g); g.position.set(0, 1.05, 0); g.rotation.x = -0.25;
const base = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.45, 0.04), new THREE.MeshStandardMaterial({ color: 0x141a24, roughness: 0.5 })); base.position.set(0, 0.02, -0.03); g.add(base);
const topo = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 0.06), new THREE.MeshStandardMaterial({ color: 0xff8a4c, emissive: 0xff8a4c, emissiveIntensity: 0.4 })); topo.position.set(0, 0.73, 0); g.add(topo);
const dias = []; for (let i = 0; i < 35; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.03), new THREE.MeshStandardMaterial({ color: 0x2a3444, emissive: 0xff8a4c, emissiveIntensity: 0, roughness: 0.4 }));
  d.position.set(-0.72 + (i % 7) * 0.24, 0.5 - Math.floor(i / 7) * 0.24, 0.01); g.add(d); dias.push(d); }
const MARCA = [[9, 1.95], [12, 2.79], [16, 3.67], [20, 4.0], [23, 4.2], [26, 4.4], [30, 4.6]];
const brilhos = MARCA.map(([i]) => { const b = E.brilho(0xff8a4c, 0.45, "suave", 0); b.position.copy(dias[i].position); b.position.z = 0.06; g.add(b); return b; });
const al = new THREE.Vector3(), topoV = new THREE.Vector3();
function render(t) {
  let n = 1;
  MARCA.forEach(([i, t0], j) => { const k = ease.outBack(range(t, t0, t0 + 0.3)); dias[i].material.emissiveIntensity = 1.4 * range(t, t0, t0 + 0.15); dias[i].position.z = 0.01 + 0.05 * k;
    brilhos[j].material.opacity = range(t, t0, t0 + 0.2) * 0.9; n += ease.inOutCubic(range(t, t0, t0 + 0.35)); });
  const e = ease.inOutSine(range(t, 0, 5.77));
  cam.position.set(lerp(-0.9, 0.5, e), lerp(1.3, 1.5, e), lerp(4.0, 3.5, e)); al.set(lerp(-0.15, 0.05, e), lerp(1.15, 1.2, e), 0); cam.lookAt(al);
  st.bloom = 0.85; st.draw();
  const c = st.ctx;
  g.localToWorld(topoV.set(0, 0.95, 0));
  E.sobreCabeca(c, n, topoV, cam, range(t, 0.2, 0.5), { rotulo: "ENCONTROS", tam: 84, ymin: 520, pulso: LP_mola(t) });
  E.txt(c, "MAIS UM ENCONTRO", 540, 985, { tam: 32, cor: E.LARANJA, a: range(t, 2.33, 2.6) * (1 - range(t, 3.25, 3.4)), esp: 0.22 });
  E.txt(c, "E MAIS OUTRO", 540, 985, { tam: 32, cor: E.LARANJA, a: range(t, 3.4, 3.6) * (1 - range(t, 4.3, 4.45)), esp: 0.22 });
  E.txt(c, "SÓ PARA VER O NÚMERO MUDAR", 540, 985, { tam: 30, cor: "#fff", a: range(t, 4.46, 4.7), esp: 0.16 });
}
function LP_mola(t) { let s = 0; MARCA.forEach(([, t0]) => { if (t >= t0) s += Math.exp(-5 * (t - t0)) * Math.sin(2.2 * 6.283 * (t - t0)); }); return s; }
