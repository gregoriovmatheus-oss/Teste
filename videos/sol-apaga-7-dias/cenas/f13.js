/*META {"imports": ["solkit"], "rotulos": [{"de": 1.3, "ate": 3.94, "top": 700, "texto": "Só as <span class=\"y\">luzes</span><br>das cidades", "sai": false}], "D0": 3.94} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 40, nevoa: null, nuvens: 0 });
        const S = SK.espaco(st), cam = st.cam;
        st.bloom = 0.8;
        st.hemi.intensity = 0.05; st.hemi.color.setHex(0x6070a0);
        const stars = SK.ceuDoc(S, { seed: 121 });
        const terra = await SK.terraDoc(S);
        const SUN = new THREE.Vector3(1, 0, 0);
        function render(t) {
          terra.set({ sol: SUN, luz: 0, cidades: lerp(1.4, 1.6, range(t, 0, 1.5)) * (0.97 + 0.03 * Math.sin(t * 7)), rotY: 0, nuvens: 0.25 });
          terra.aim(-70 + t * 3, 36);
          // órbita lenta afastando: a bola escura recorta as estrelas
          const e = ease.inOutSine(range(t, 0, 3.94));
          const a = lerp(-0.25, 0.15, e), R = lerp(3.0, 3.8, e);
          cam.position.set(Math.sin(a) * R, lerp(0.6, 0.9, e), Math.cos(a) * R);
          cam.lookAt(0, lerp(-0.25, -0.4, e), 0);
          stars.set(1, t);
          st.draw();
        }
