/*META {"rotulos": [{"de": 0.8, "ate": 3.6, "texto": "A NATUREZA <span class=\"y\">VOLTA</span>"}], "D0": 5.54} */
        const st = T.createToyStage(canvas, { fov: 50, ceu: 0x5a8fd8, nevoa: [50, 200] });
        const S = st.scene, cam = st.cam;
        const city = T.rua({ len: 200, seed: 91 }); S.add(city.group);
        const rr = mulberry32(92);
        const tufos = Array.from({ length: 70 }, () => { const g = T.mesh(new THREE.ConeGeometry(0.35, 1, 6), [T.PAL.verde, T.PAL.verdeEsc][Math.floor(rr() * 2)], S); g.position.set((rr() - 0.5) * 15, 0, 6 - rr() * 70); g.userData.t0 = rr() * 3.2; g.userData.s = 0.6 + rr(); return g; });
        const rach = Array.from({ length: 14 }, () => { const c = T.mesh(T.roundBox(0.25, 0.04, 3 + rr() * 4, 0.02), 0x2c2f36, S); c.position.set((rr() - 0.5) * 12, 0.13, 2 - rr() * 60); c.rotation.y = (rr() - 0.5) * 1.4; c.userData.t0 = rr() * 1.5; return c; });
        const arv = Array.from({ length: 10 }, (_, i) => { const a = T.arvore(1, T.PAL.verde, 900 + i); a.position.set((i % 2 ? 1 : -1) * (2.5 + rr() * 4), 0, 2 - i * 6.5); a.userData.t0 = 0.5 + rr() * 2.5; S.add(a); return a; });
        const vinhas = [];
        city.buildings.forEach((b, bi) => { if (Math.abs(b.position.z) > 60) return; for (let i = 0; i < 4; i++) { const v = T.mesh(T.SPH, T.PAL.verdeEsc, b, 0.9); v.position.set((rr() - 0.5) * 5, rr() * b.userData.h * 0.8, 4.2); v.userData.s = 1 + rr() * 1.4; v.userData.t0 = 1 + rr() * 3.5; vinhas.push(v); } });
        const zeb = A.createAnimal("zebra", { fase: 0.2 }); A.face(zeb.group, 0, 1); S.add(zeb.group);
        const coe = [0, 1].map((i) => { const c = A.createAnimal("coelho", { fase: i * 0.4 }); c.group.scale.setScalar(1.5); A.face(c.group, 0.3, 1); S.add(c.group); return c; });
        const skyD = new THREE.Color(0x5a8fd8), skyN = new THREE.Color(0x2b2850), tmp = new THREE.Color();
        function render(t) {
          const day = 0.5 + 0.5 * Math.cos(t * 2 * Math.PI / 1.8);
          tmp.copy(skyN).lerp(skyD, day); S.background = tmp.clone(); S.fog.color.copy(tmp);
          st.key.intensity = 0.4 + 2.2 * day; st.hemi.intensity = 0.5 + 0.7 * day;
          const ang = t * 2 * Math.PI / 1.8;
          st.sol(Math.sin(ang) * 40, -20, 45);
          tufos.forEach((g) => { const s = ease.outBack(range(t, g.userData.t0, g.userData.t0 + 0.8)) * g.userData.s; g.scale.set(s + 0.001, s * 1.4 + 0.001, s + 0.001); g.position.y = 0.12 + s * 0.6; });
          rach.forEach((c) => { c.scale.z = range(t, c.userData.t0, c.userData.t0 + 0.6) + 0.001; });
          arv.forEach((a) => { a.scale.setScalar(1.6 * ease.outCubic(range(t, a.userData.t0, a.userData.t0 + 2)) + 0.001); });
          vinhas.forEach((v) => { const s = v.userData.s * ease.outCubic(range(t, v.userData.t0, v.userData.t0 + 1.2)); v.scale.set(s + 0.001, s * 1.3 + 0.001, 0.4 * s + 0.001); });
          zeb.group.position.set(-2, 0, -30 + t * 2.2); zeb.update(t, { passo: 1.2 });
          coe.forEach((c, i) => { c.group.position.set(3 + i, 0.12, -14 + t * 2.4 - i * 2); c.update(t, { passo: 2.5, salto: 0.25 }); });
          const e = ease.inOutSine(clamp(t / D));
          cam.position.set(lerp(3, -2, e), lerp(3, 12, e), lerp(14, 22, e));
          cam.lookAt(0, lerp(3, 4, e), -16);
          st.draw();
        }
