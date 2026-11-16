/*META {"rotulos": [{"de": 0.3, "ate": 3.4, "texto": "<span class=\"y\">MESES</span> DEPOIS"}]} */
        const st = T.createToyStage(canvas, { fov: 48, nevoa: [60, 240] });
        const S = st.scene, cam = st.cam;
        const city = T.rua({ len: 220, larg: 16, seed: 131 }); S.add(city.group);
        const rr = mulberry32(132);
        // materiais próprios para envelhecer sem afetar outras cenas
        const mats = [];
        city.group.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial && !o.isInstancedMesh) { o.material = o.material.clone(); o.material.userData.c0 = o.material.color.clone(); mats.push(o.material); } });
        const velho = new THREE.Color(0x7d8a6e);
        const cresce = [];
        city.buildings.forEach((b) => { if (Math.abs(b.position.z) > 70) return; for (let i = 0; i < 6; i++) { const v = T.mesh(T.SPH, [T.PAL.verde, T.PAL.verdeEsc][i % 2], b, 0.9); const top = i < 2; v.position.set((rr() - 0.5) * 6, top ? b.userData.h : rr() * b.userData.h, top ? (rr() - 0.5) * 4 : 4.3); v.userData.s = top ? 1.6 + rr() : 0.9 + rr() * 1.4; v.userData.t0 = rr() * 4; v.userData.flat = !top; cresce.push(v); } });
        for (let i = 0; i < 70; i++) { const g = T.mesh(new THREE.ConeGeometry(0.4, 1.3, 6), T.PAL.verdeEsc, S); g.position.set((rr() - 0.5) * 15, 0.1, 10 - rr() * 90); g.userData.s = 0.6 + rr(); g.userData.t0 = rr() * 4; g.userData.cone = true; cresce.push(g); }
        for (let i = 0; i < 8; i++) { const a = T.arvore(1, T.PAL.verde, 500 + i); a.position.set((rr() - 0.5) * 12, 0, 4 - i * 9); a.userData.s = 1.3 + rr() * 0.6; a.userData.t0 = 0.5 + rr() * 3; a.userData.arv = true; S.add(a); cresce.push(a); }
        const torto = city.buildings.filter((b) => Math.abs(b.position.z) < 40).sort((a, b) => b.userData.h - a.userData.h)[0];
        const ele = A.createAnimal("elefante", { fase: 0.2 }); ele.group.scale.setScalar(1.2); A.face(ele.group, 0, 1); S.add(ele.group);
        const gir = A.createAnimal("girafa", { fase: 0.6 }); A.face(gir.group, 0, 1); S.add(gir.group);
        const mac = A.createAnimal("macaco", { fase: 0.3 }); mac.group.scale.setScalar(1.3); A.face(mac.group, 1, 0); S.add(mac.group);
        function render(t) {
          const age = ease.inOutSine(range(t, 0.2, 5.5));
          mats.forEach((m) => { m.color.copy(m.userData.c0).lerp(velho, age * 0.55); });
          cresce.forEach((v) => {
            const s = v.userData.s * ease.outCubic(range(t, v.userData.t0, v.userData.t0 + 1.5)) + 0.001;
            if (v.userData.arv) v.scale.setScalar(s); else if (v.userData.cone) v.scale.set(s, s * 1.3, s); else v.scale.set(s, s, v.userData.flat ? s * 0.4 : s);
          });
          if (torto) torto.rotation.z = 0.12 * ease.inOutSine(range(t, 2.5, 5.5));
          const day = 0.5 + 0.5 * Math.cos(t * 2 * Math.PI / 2.2);
          st.key.intensity = 0.8 + 1.8 * day;
          st.sol(Math.sin(t * 2 * Math.PI / 2.2) * 30, -10, 50);
          ele.group.position.set(-3, 0, -40 + t * 1.6); ele.update(t, { passo: 0.8 });
          gir.group.position.set(3, 0, -28 + t * 1.2); gir.update(t, { passo: 0.9 });
          mac.group.position.set(-8.3, 0.4 + t * 0.6, -14); mac.update(t, { passo: 2, sobe: 1 });
          const e = ease.inOutSine(clamp(t / D));
          cam.position.set(lerp(12, -6, e), lerp(26, 14, e), lerp(30, 18, e));
          cam.lookAt(0, 4, -22);
          st.draw();
        }
