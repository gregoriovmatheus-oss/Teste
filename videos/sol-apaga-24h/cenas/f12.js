/*META {"imports": ["solkit"], "rotulos": [{"de": 1.3, "ate": 3.94, "top": 700, "texto": "Só as <span class=\"y\">luzes</span><br>das cidades", "sai": false}], "D0": 3.94} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 40, nevoa: null, nuvens: 0 });
        const S = SK.espaco(st), cam = st.cam;
        st.hemi.intensity = 0.05; st.hemi.color.setHex(0x6070a0);
        const stars = SK.estrelas(S, { n: 3000, seed: 121 });
        const terra = SK.criaTerra(S, st, { luzes: 3600, tamLuz: 6 });
        terra.cloudMat.opacity = 0.35;
        const SUN = new THREE.Vector3(1, 0, 0);
        function render(t) {
          terra.set({ sol: SUN, luz: 0, cidades: lerp(0.7, 1.2, range(t, 0, 1.5)) * (0.97 + 0.03 * Math.sin(t * 7)), rotY: 0.45 - t * 0.05, incl: 0.0 });
          terra.earth.rotation.x = 0.35;
          // órbita lenta afastando: a bola escura recorta as estrelas
          const e = ease.inOutSine(range(t, 0, 3.94));
          const a = lerp(-0.25, 0.15, e), R = lerp(3.0, 4.2, e);
          cam.position.set(Math.sin(a) * R, lerp(0.6, 0.9, e), Math.cos(a) * R);
          cam.lookAt(0, lerp(-0.25, -0.4, e), 0);
          stars.set(1, t);
          st.draw();
        }
