/*META {"imports": ["copia"], "rotulos": [{"de": 0.4, "ate": 2.3, "texto": "E as <span class=\"y\">memórias?</span>"}, {"de": 3.3, "ate": 4.85, "texto": "O cérebro <span class=\"y\">reconstrói</span>"}, {"de": 4.9, "ate": 6.41, "texto": "E ela <span class=\"y\">muda</span> um pouco"}], "D0": 6.41} */
        // Uma lembrança (casa, árvore, sol) feita de peças: se desfaz ao lembrar e se remonta um pouco diferente.
        const st = T.createToyStage(canvas, { ceu: "#05070e", nevoa: [5, 18], corNevoa: "#05070e", fov: 44, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.bloom = 0.7;
        st.key.color.set(0xfff0dc); st.key.intensity = 2.2; st.hemi.intensity = 0.7; st.rim.color.set(0x7cc8ff); st.rim.intensity = 1.4;
        await COPIA.fontes();
        const W = 26, Hh = 20, sz = 0.12;
        // a lembrança desenhada em pixels; v = 0 (original) ou 1 (versão reconstruída: sol mais baixo, árvore mais perto, telhado mais claro)
        function pic(i, j, v) {
          const sx = 19 - v * 2, sy = 15 - v * 3, tx = 5 + v * 2;
          if ((i - sx) ** 2 + (j - sy) ** 2 < 6.5) return v ? 0xffb347 : 0xffd84a;
          if (j <= 3) return v ? 0x5d9c48 : 0x4f8f45;
          if (i >= 10 && i <= 17 && j >= 4 && j <= 9) return (i === 13 || i === 14) && j <= 7 ? 0x6b3f2a : (i === 16 && j === 7 ? 0x9fd6ff : 0xeee2c8);
          if (j >= 10 && j <= 13 && i >= 9 + (j - 10) && i <= 18 - (j - 10)) return v ? 0xe2774a : 0xc9452f;
          if (i === tx && j >= 4 && j <= 6) return 0x5e4330;
          if ((i - tx) ** 2 + (j - 9) ** 2 < 6) return v ? 0x7dbb5a : 0x3d7a34;
          return null;
        }
        const cells = [];
        for (let i = 0; i < W; i++) for (let j = 0; j < Hh; j++) {
          const c0 = pic(i, j, 0), c1 = pic(i, j, 1);
          if (c0 !== null || c1 !== null) cells.push({ i, j, c0, c1 });
        }
        const N = cells.length, rr = mulberry32(808);
        cells.forEach((c) => { const a = rr() * 6.283, b = (rr() - 0.5) * 2.4, R = 1.6 + rr() * 2.2; c.s = new THREE.Vector3(Math.cos(a) * R, b + 1.2, Math.sin(a) * R * 0.7); c.d = rr(); c.rx = rr() * 8; c.ry = rr() * 8; });
        const box = new THREE.InstancedMesh(new THREE.BoxGeometry(sz * 0.92, sz * 0.92, sz * 0.92), new THREE.MeshStandardMaterial({ roughness: 0.45, emissive: 0x111111 }), N);
        box.frustumCulled = false; S.add(box);
        const fundoC = new THREE.Color(0x9fc7ee);
        const O = new THREE.Object3D(), cA = new THREE.Color(), cB = new THREE.Color(), v = new THREE.Vector3();
        const pos0 = (c) => v.set((c.i - W / 2) * sz, c.j * sz + 0.3, 0);
        function render(t) {
          const sai = ease.inOutCubic(range(t, 2.37, 3.1)), volta = ease.inOutCubic(range(t, 3.36, 4.6)), muda = ease.inOutSine(range(t, 5.0, 5.9));
          cells.forEach((c, k) => {
            const p0 = pos0(c).clone(), ex = c.s;
            const sd = ease.inOutCubic(range(sai, c.d * 0.3, c.d * 0.3 + 0.7)), vd = ease.inOutCubic(range(volta, c.d * 0.35, c.d * 0.35 + 0.65));
            const p = p0.clone().lerp(ex, sd * (1 - vd));
            p.add(v.set(Math.sin(t * 1.3 + c.rx) * 0.08, Math.cos(t * 1.1 + c.ry) * 0.08, 0).multiplyScalar(sd * (1 - vd)));
            O.position.copy(p); O.rotation.set(c.rx * sd * (1 - vd), c.ry * sd * (1 - vd), 0);
            // na reconstrução, peças que não existiam aparecem e outras somem
            const temA = c.c0 !== null, temB = c.c1 !== null, sc = temA && temB ? 1 : temA ? 1 - muda : muda;
            O.scale.setScalar(Math.max(0.0001, sc)); O.updateMatrix(); box.setMatrixAt(k, O.matrix);
            cA.set(c.c0 ?? c.c1); cB.set(c.c1 ?? c.c0); cA.lerp(cB, muda);
            if (sd * (1 - vd) > 0.05) cA.lerp(fundoC, 0.35 * sd * (1 - vd));
            box.setColorAt(k, cA);
          });
          box.instanceMatrix.needsUpdate = true; box.instanceColor.needsUpdate = true;
          // órbita lenta em volta da lembrança; afasta na explosão e volta
          const a = lerp(-0.5, 0.45, ease.inOutSine(range(t, 0, 6.41))), R = 6.2 + Math.sin(Math.PI * range(t, 2.2, 4.8)) * 2.0;
          cam.position.set(Math.sin(a) * R, 1.6, Math.cos(a) * R); cam.lookAt(0.05, 0.8, 0);
          st.sol(0, 0, 4);
          st.draw();
          const c = st.ctx, A2 = COPIA.vis(st);
          COPIA.tag(c, cam, v.set(0.9, 2.4, 0), "LEMBRANÇA", { a: A2 * range(t, 0.5, 0.8) * (1 - range(t, 2.2, 2.4)), dx: -120, dy: -170, sub: "VERSÃO 1" });
          COPIA.tag(c, cam, v.set(0.9, 2.2, 0), "LEMBRANÇA", { cor: COPIA.LARANJA, a: A2 * range(t, 5.28, 5.55), dx: -120, dy: -190, sub: "VERSÃO 2" });
          if (t > 2.37 && t < 4.6) COPIA.txt(c, "LEMBRANDO…", 540, 600, { tam: 26, cor: COPIA.AZUL, a: A2 * Math.sin(Math.PI * range(t, 2.37, 4.6)) });
        }
