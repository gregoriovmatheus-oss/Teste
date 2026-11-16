/*META {"rotulos": [{"de": 1.2, "ate": 3.6, "texto": "HOSPITAIS <span class=\"y\">VAZIOS</span>"}, {"de": 4.6, "ate": 6.42, "texto": "<span class=\"y\">COLAPSO</span>"}]} */
        const st = T.createToyStage(canvas, { fov: 45, ceu: 0x8cc7d8, nevoa: [120, 420] });
        const S = st.scene, cam = st.cam;
        const c = T.cidade({ n: 6, seed: 71, hMax: 30 }); S.add(c.group);
        // hospital no centro
        const hosp = T.predio({ w: 16, d: 12, h: 14, cor: 0xf6f1e8, seed: 2 }); hosp.position.set(-18, 0.5, -18); S.add(hosp);
        const cr = 0xd9583b;
        const c1 = T.mesh(T.roundBox(6, 0.6, 1.8, 0.2), cr, hosp); c1.position.y = 14.5; const c2 = T.mesh(T.roundBox(1.8, 0.6, 6, 0.2), cr, hosp); c2.position.y = 14.5;
        const f1 = T.mesh(T.roundBox(3, 1, 0.4, 0.1), cr, hosp); f1.position.set(0, 11, 6.1); const f2 = T.mesh(T.roundBox(1, 3, 0.4, 0.1), cr, hosp); f2.position.set(0, 11, 6.1);
        // usina: torres de resfriamento
        const fum = [];
        for (const [x, z] of [[30, 14], [40, 22]]) {
          const tw = T.mesh(new THREE.CylinderGeometry(4, 6, 16, 28, 1, true), 0xd8d2c4, S, 0.8); tw.position.set(x, 8, z); tw.material.side = THREE.DoubleSide;
          for (let i = 0; i < 6; i++) { const p = T.nuvem(x + i, 0xf2f2f2); p.scale.setScalar(1.2); p.userData.o = [x, z, i]; S.add(p); fum.push(p); }
        }
        const usinaBase = T.mesh(T.roundBox(30, 1, 24, 0.3), 0xbfb6a6, S); usinaBase.position.set(35, 0, 18);
        const all = [...c.buildings, hosp];
        const rr = mulberry32(72);
        const off = all.map(() => 1.6 + rr() * 4.4);
        const skyA = new THREE.Color(0x8cc7d8), skyB = new THREE.Color(0x323a5a), tmp = new THREE.Color();
        function render(t) {
          const k = range(t, 0.8, 6.2);
          tmp.copy(skyA).lerp(skyB, ease.inOutSine(k));
          S.background = tmp.clone(); S.fog.color.copy(tmp);
          st.key.intensity = lerp(2.5, 0.5, k); st.key.color.setHex(k > 0.5 ? 0xff9f6a : 0xffd6a0);
          st.hemi.intensity = lerp(1.15, 0.55, k);
          all.forEach((b, i) => { b.userData.win.emissiveIntensity = lerp(0.3, 1.6, range(t, 0, 1.5)) * (1 - range(t, off[i], off[i] + 0.25)); });
          fum.forEach((p) => { const [x, z, i] = p.userData.o; const u = ((t * 0.25 + i / 6) % 1); const on = 1 - range(t, 3.2, 4.2); p.position.set(x + u * 6, 16 + u * 14, z); p.scale.setScalar((0.8 + u * 2) * on + 0.001); });
          const e = ease.inOutSine(clamp(t / D));
          cam.position.set(lerp(-70, -20, e), lerp(70, 48, e), lerp(70, 40, e));
          cam.lookAt(lerp(-10, 10, e), 0, lerp(-10, 0, e));
          st.sol(0, 0, 90);
          st.draw();
        }
