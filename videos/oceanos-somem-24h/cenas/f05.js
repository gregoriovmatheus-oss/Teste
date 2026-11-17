/*META {"imports": ["oceano", "terra"], "rotulos": [{"de": 2.1, "ate": 5.15, "texto": "<span class=\"k\">DORSAL MESO-OCEÂNICA</span><br><span class=\"y\">65 mil km</span><br>de cordilheira"}], "D0": 5.18} */
        const O = OCEANO, G0 = 20.19, TC = 2.55;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        // parte A: voo sobre a dorsal (vale de rifte no eixo, falhas transformantes deslocando segmentos)
        const st = T.createToyStage(canvas, { fov: 52, ceu: ["#46699a", "#d6b993"], nevoa: [200, 1300], corNevoa: "#ad9f8d", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const off = (z) => { const s = Math.floor((z + 2000) / 170); return (O.ruido(s * 7.3, 0.5, 31)) * 45; };
        const xr = (x, z) => x - off(z) - 8 * Math.sin(z * 0.01);
        const alt = (x, z) => {
          const a = xr(x, z);
          let y = 58 * Math.exp(-((a / 85) ** 2)) - 14 * Math.exp(-((a / 7) ** 2));
          y += 5 * Math.sin(a * 0.11) * Math.exp(-((a / 110) ** 2));
          return y + 4 * O.fbm(x * 0.02, z * 0.02, 4, 32);
        };
        const cor = (x, z, y, c) => { const a = Math.abs(xr(x, z)); O.mistura(c, 0x2e2b2a, 0x7a6b5a, smoothstep(5, 140, a) + 0.15 * O.ruido(x * 0.05, z * 0.05, 33)); };
        S.add(O.terreno({ w: 700, d: 1400, sx: 110, sz: 150, cz: -500, alt, cor, rough: 0.85 }));
        const eixo = []; for (let z = 260; z > -1180; z -= 6) { const x = off(z) + 8 * Math.sin(z * 0.01); eixo.push(new THREE.Vector3(x, alt(x, z) + 0.4, z)); }
        const lava = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(eixo), 480, 1.2, 5, false), new THREE.MeshBasicMaterial({ color: 0xff6a20 }));
        S.add(lava);
        // parte B: a Terra seca com as dorsais acendendo como uma costura
        const st2 = T.createToyStage(canvas, { fov: 34, ceu: ["#000000", "#02030a"], nuvens: 0, nevoa: null });
        const { E } = await O.espacoDoc(st2, TERRA, { solDir: [-0.7, 0.4, 0.6] });
        E.u.seco.value = 1; E.u.nuvens.value = 0.4;
        const cristas = O.dorsaisTerra(E, { raio: 0.009, r: 1.006 });
        function render(t) {
          if (t < TC) {
            const z = 140 - t * 70;
            const sobe = ease.inOutSine(range(t, 0, TC));
            cam.position.set(lerp(-30, -60, sobe) + off(z) * 0.4, lerp(70, 150, sobe), z);
            cam.lookAt(off(z - 200) * 0.5, lerp(30, 0, sobe), z - 260);
            st.sol(0, z - 120, 260);
            st.draw();
          } else {
            const u = t - TC;
            cristas(ease.inOutCubic(range(t, 2.75, 4.7)));
            E.aim(lerp(0, 40, u / 2.6), lerp(-25, -32, u / 2.6));
            const d = lerp(5.4, 4.3, ease.outCubic(range(u, 0, 2.6)));
            st2.cam.position.set(0.2, 0.25, d); st2.cam.lookAt(0, 0.35, 0);
            st2.T = st.T; st2.D = st.D;
            st2.draw(st2.scene, st2.cam, { cor: "#000", a: 1 - range(u, 0, 0.25) });
          }
          if (t < TC) O.etiqueta(st.ctx, cam, new THREE.Vector3(off(-110), alt(off(-110), -110), -110), "VALE DE RIFTE", { dx: 80, dy: -90, tam: 26, a: range(t, 0.5, 0.9) - range(t, 2.0, 2.3), sub: "eixo da dorsal" });
        }
