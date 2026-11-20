/*META {"imports": ["mente"], "rotulos": [{"de": 1.3, "ate": 3.2, "texto": "<span class=\"k\">VAGÃO LOTADO</span><br><span class=\"y\">6</span> pessoas por m²"}, {"de": 4.5, "ate": 6.63, "texto": "<span class=\"k\">MARACANÃ</span><br>quase <span class=\"y\">80 mil</span> mentes"}], "D0": 6.63} */
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#05070d", "#0b0f18"], nevoa: [4, 30], corNevoa: "#0b0f18", nuvens: 0, exposicao: 0.95 });
        const S = st.scene, cam = st.cam;
        const v = MENTE.vagao(S, st, { len: 14, teto: false });
        const R = mulberry32(707), L = [], CEL = [];
        const OFF = [[0.25, 0.17], [0.75, 0.17], [0.25, 0.5], [0.75, 0.5], [0.25, 0.83], [0.75, 0.83]];
        for (let cx = -3; cx < 3; cx++) for (let cz = -1; cz < 1; cz++) OFF.forEach(([a, b]) => {
          L.push({ x: cx + a + (R() - 0.5) * 0.1, z: cz + b + (R() - 0.5) * 0.08, ry: R() * 6.28, sent: 0 }); CEL.push(cx === 0 && cz === 0);
        });
        const p = MENTE.povo(S, L, { seed: 708, leve: true });
        const f = MENTE.fios(S, L.length, { seed: 709, alt: 0.9, np: 40, aneis: false });
        const cab = L.map(() => new THREE.Vector3());
        const cel = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
        cel.rotation.x = -Math.PI / 2; cel.position.set(0.5, 0.02, 0.5); S.add(cel);
        // ---------- estádio (cena separada) ----------
        const ES = new THREE.Scene(); ES.background = new THREE.Color(0x03040a); ES.fog = new THREE.Fog(0x03040a, 300, 900);
        ES.add(new THREE.HemisphereLight(0x8aa6d8, 0x1a1410, 0.6));
        const sl = new THREE.DirectionalLight(0xfff0dc, 1.6); sl.position.set(60, 200, 80); ES.add(sl);
        const est = MENTE.estadio(ES, { n: 80000, seed: 710 });
        const cam2 = new THREE.PerspectiveCamera(40, 1080 / 1920, 1, 3000);
        st.extraWarm = [{ renderer: st.renderer, scene: ES, camera: cam2 }];
        const T1 = 3.37;
        function render(t) {
          const c = st.ctx;
          if (t < T1) {
            v.update(t, 0.6);
            p.update(t, {});
            const g = range(t, 1.32, 1.7), m2 = range(t, 2.3, 2.6);
            v.grade.opacity = 0.75 * g;
            cel.material.opacity = 0.35 * m2;
            p.tinta((i) => (CEL[i] ? 1 + 0.4 * m2 : 1 - 0.45 * m2));
            f.update(t, (i) => { p.cabeca(i, t, cab[i]); return { p: cab[i], a: CEL[i] ? 0.6 + 0.6 * m2 : 0.55 * (1 - 0.5 * m2), cor: CEL[i] ? MENTE.COR.azul : MENTE.COR.laranja, tumulto: 0.3 }; });
            st.bloom = 0.6;
            // de cima: sobe, gira até ficar a pino e, no fim, dispara para o alto
            const e = ease.inOutSine(range(t, 0, 2.6)), up = ease.inCubic(range(t, 2.75, T1));
            const h = lerp(4.2, 7.2, e) + up * 40;
            cam.up.set(1, 0, 0);
            cam.position.set(lerp(-2.6, 0.2, e), h, lerp(1.6, 0.05, e));
            cam.lookAt(lerp(0.4, 0.3, e), 0, 0);
            st.vel = up * 0.8; st.velT = t;
            st.sol(0, 0, 8);
            st.draw(S, cam, up > 0 ? { cor: "#05070d", a: up * 0.9 } : null);
            const vv = MENTE.vis(st), [x, y] = MENTE.proj(new THREE.Vector3(0.5, 0, -0.08), cam);
            MENTE.txt(c, "1 m²", x, y + 34, { tam: 30, cor: MENTE.AZUL, a: m2 * vv * (1 - up), esp: 0.15 });
          } else {
            const u = t - T1;
            const onda = range(t, 3.6, 4.4), caos = ease.inOutSine(range(t, 5.45, 6.5));
            est.update(t, { onda, caos, brilho: 1 });
            st.bloom = 0.85;
            st.vel = caos * 0.35; st.velT = t;
            // a pino sobre o estádio, descendo e girando devagar; no fim inclina para a tempestade
            const e = ease.outCubic(range(u, 0, 3.26)), a = lerp(-0.25, 0.3, e);
            cam2.up.set(Math.cos(a), 0, Math.sin(a));
            cam2.position.set(lerp(0, -40, caos), lerp(360, 250, e), lerp(0, 60, caos));
            cam2.lookAt(0, 0, 0);
            st.draw(ES, cam2, u < 0.35 ? { cor: "#05070d", a: 1 - u / 0.35 } : null);
          }
        }
