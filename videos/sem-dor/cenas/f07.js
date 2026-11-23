/*META {"imports": ["dor"], "css": "    [data-composition-id=\"f07\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f07\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f07\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f07\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f07\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [], "D0": 3.67} */
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#05070c", "#101826"], nevoa: [4, 14], corNevoa: "#0a0f18", nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.5; st.key.intensity = 2.4; st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.2;
        const om = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.55 });
        const J = new THREE.Group(); J.position.y = 1.0; S.add(J);
        const fem = new THREE.Mesh(DOR.osso(1.7, 0.13), om); fem.position.y = 0.95; J.add(fem);
        for (const s of [1, -1]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), om); c.position.set(0, 0.17, s * 0.11); c.scale.set(1.1, 0.85, 1); J.add(c); }
        const tib = new THREE.Group(); J.add(tib);
        const tb = new THREE.Mesh(DOR.osso(1.6, 0.12), om); tb.position.y = -0.95; tib.add(tb);
        const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.12, 24), om); plat.position.y = -0.12; tib.add(plat);
        const cm = new THREE.MeshStandardMaterial({ color: 0x9fd6ff, roughness: 0.15, emissive: 0x2a6ea8, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 });
        const cart = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.09, 28), cm); cart.position.y = -0.015; tib.add(cart);
        const pele = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.48, 3.4, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xc58f6c, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide })); pele.position.y = 1.0; S.add(pele);
        const R = mulberry32(77), NDB = 120, db = [];
        const dm = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.018), new THREE.MeshStandardMaterial({ color: 0xffb08a, emissive: 0xff8a4c, emissiveIntensity: 0.8 }), NDB); dm.frustumCulled = false; S.add(dm);
        for (let i = 0; i < NDB; i++) db.push([R() * 6.283, 0.2 + R() * 0.12, 0.6 + R() * 2.9, (R() - 0.5) * 0.6, R() * 6]);
        const o3 = new THREE.Object3D(), azul = new THREE.Color(0x9fd6ff), lar = new THREE.Color(0xff8a4c), ea = new THREE.Color(0x2a6ea8), el = new THREE.Color(0xa83a10);
        const v = new THREE.Vector3();
        function render(t) {
          const k = ease.inOutSine(range(t, 0.5, 3.3));
          // passos: o joelho dobra no ritmo da caminhada; em "pisando errado" a tíbia entorta
          tib.rotation.z = -Math.abs(Math.sin(t * 3.2)) * 0.45;
          tib.rotation.x = 0.16 * ease.outCubic(range(t, 2.6, 3.0)) * (0.7 + 0.3 * Math.sin(t * 6.4));
          cart.scale.set(1, lerp(1, 0.18, k), 1); cart.position.y = -0.06 + 0.045 * lerp(1, 0.18, k);
          cm.color.copy(azul).lerp(lar, k); cm.emissive.copy(ea).lerp(el, k);
          db.forEach(([a, r, t0, vy, rr], i) => { const q = t - t0; const s = q > 0 ? 1 - range(q, 0.6, 1.0) : 0;
            o3.position.set(Math.cos(a) * r, 1.0 - 0.05 - q * 0.25 - 0.4 * q * q, Math.sin(a) * r + vy * q * 0.2); o3.rotation.set(rr + q * 4, rr, 0); o3.scale.setScalar(s || 1e-4); o3.updateMatrix(); dm.setMatrixAt(i, o3.matrix); });
          dm.instanceMatrix.needsUpdate = true;
          // órbita em volta do joelho
          const e = ease.inOutSine(range(t, 0, 3.67)), ang = lerp(-0.7, 0.5, e);
          cam.position.set(Math.sin(ang) * 2.8, lerp(1.0, 0.85, e), Math.cos(ang) * 2.8);
          cam.lookAt(0, lerp(0.42, 0.45, e), 0);
          st.bloom = 0.55 + k * 0.2;
          st.sol(0, 0, 3, 1);
          st.draw();
          const c = st.ctx, vv = DOR.vis(st); DOR.quadro();
          cart.getWorldPosition(v);
          DOR.frase(c, cam, v, k < 0.5 ? "CARTILAGEM" : "CARTILAGEM GASTA", range(t, 0.75, 0.9) * vv * (1 - range(t, 2.3, 2.45)) + range(t, 2.6, 2.75) * vv, { cor: k < 0.5 ? DOR.AZUL : DOR.LARANJA, tam: 28, ymin: 560, ymax: 700, dy: 120 });
          DOR.frase(c, cam, v.clone().add(new THREE.Vector3(0, -0.6, 0)), "PISADA ERRADA", range(t, 2.7, 2.85) * vv, { cor: DOR.LARANJA, tam: 28, ymin: 760, ymax: 1000, dy: 60 });
        }
