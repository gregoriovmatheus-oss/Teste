/*META {"rotulos": [{"de": 5.0, "ate": 7.51, "texto": "SÓ <span class=\"y\">INSTINTO</span>"}]} */
        const st = T.createToyStage(canvas, { fov: 50, ceu: ["#7FBFD0", "#E6E8C8"], nevoa: [40, 180] });
        const S = st.scene, cam = st.cam;
        const city = T.rua({ len: 240, larg: 18, seed: 101, chao: 0x9cc46a }); S.add(city.group);
        const rr = mulberry32(102);
        for (let i = 0; i < 90; i++) { const g = T.mesh(new THREE.ConeGeometry(0.4, 1.4, 6), [T.PAL.verde, T.PAL.verdeEsc][i % 2], S); g.position.set((rr() - 0.5) * 17, 0.6, 40 - rr() * 160); g.scale.setScalar(0.7 + rr()); }
        for (let i = 0; i < 12; i++) { const a = T.arvore(1.3 + rr(), T.PAL.verde, 300 + i); a.position.set((rr() - 0.5) * 16, 0, 20 - rr() * 120); S.add(a); }
        const arbustos = [[-6, -30], [6.5, -36], [-6.5, -44]].map(([x, z]) => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const b = T.mesh(T.SPH, T.PAL.verdeEsc, g, 0.9); b.scale.setScalar(1.3 + rr() * 0.6); b.position.set((rr() - 0.5) * 2, 0.8, (rr() - 0.5) * 2); } g.position.set(x, 0, z); S.add(g); return g; });
        const zeb = A.createAnimal("zebra", { fase: 0.1 }); zeb.group.scale.setScalar(1.3); S.add(zeb.group);
        const leao = A.createAnimal("leao", { fase: 0.6 }); leao.group.scale.setScalar(1.3); S.add(leao.group);
        const eles = [0, 1, 2].map((i) => { const e = A.createAnimal("elefante", { fase: i * 0.33 }); e.group.scale.setScalar(i === 2 ? 0.9 : 1.5); A.face(e.group, 0, 1); S.add(e.group); return e; });
        const peq = [0, 1, 2, 3].map((i) => { const a = A.createAnimal(i % 2 ? "rato" : "coelho", { fase: i * 0.2 }); a.group.scale.setScalar(i % 2 ? 3 : 1.8); S.add(a.group); return a; });
        function render(t) {
          const zz = -10 + t * 7;
          const zx = Math.sin(t * 2.2) * 2.5;
          zeb.group.position.set(zx, 0, zz); A.face(zeb.group, Math.cos(t * 2.2) * 2.5 * 2.2 / 7, 1); zeb.update(t, { passo: 2.6, amp: 0.8 });
          const lx = Math.sin((t - 0.35) * 2.2) * 2.5;
          leao.group.position.set(lx, 0, zz - 5 + Math.sin(t * 1.3) * 0.6); A.face(leao.group, Math.cos((t - 0.35) * 2.2) * 0.8, 1); leao.update(t, { passo: 2.8, amp: 0.8 });
          eles.forEach((e, i) => { e.group.position.set(-4 + i * 4.5, 0, -48 + t * 1.3 - (i === 2 ? -2 : i * 3)); e.update(t, { passo: 0.8 }); });
          peq.forEach((a, i) => { const b = arbustos[i % 3]; const k = ease.inCubic(range(t, 3.3 + i * 0.2, 5.2 + i * 0.2)); a.group.position.set(lerp(0.5 - i, b.position.x, k), 0.12, lerp(-34 - i * 3, b.position.z, k)); A.face(a.group, b.position.x - (0.5 - i), b.position.z + 34); a.update(t, { passo: 4, salto: i % 2 ? 0 : 0.3 }); a.group.visible = k < 0.98; });
          const w = ease.inOutCubic(range(t, 3.0, 5.0));
          cam.position.set(lerp(zx * 0.4 + 2, 9, w), lerp(2.8, 7, w), lerp(zz + 10, -20, w));
          cam.lookAt(lerp(0, -1, w), lerp(1.8, 2, w), lerp(zz - 2, -42, w));
          st.sol(0, lerp(zz, -40, w), 30);
          st.draw();
        }
