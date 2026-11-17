/*META {"imports": ["avenida"], "rotulos": [{"de": 2.2, "ate": 3.9, "texto": "Luzes <span class=\"y\">acesas</span>"}, {"de": 4.2, "ate": 5.7, "texto": "<span class=\"y\">Silêncio</span>"}], "D0": 5.7} */
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#2E4176", "#EE9E62"], nevoa: [45, 260], corNevoa: "#7a6270", luz: 0.6 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.45;
        const av = AVENIDA.avenida(S);
        // celular largado no asfalto, tela ainda acesa
        const cel = new THREE.Group(); cel.position.set(-0.9, 0.13, 39.2); cel.rotation.y = 0.5; S.add(cel);
        T.mesh(T.roundBox(0.42, 0.06, 0.84, 0.03), 0x15161a, cel, 0.3);
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.74), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x9fd0ff, emissiveIntensity: 1.6 }));
        tela.rotation.x = -Math.PI / 2; tela.position.y = 0.065; cel.add(tela);
        const celG = new THREE.Sprite(AVENIDA.glowMat(0x9fd0ff)); celG.scale.setScalar(1.6); celG.position.y = 0.2; cel.add(celG); celG.material.opacity = 0.5;
        // pombos andando no asfalto vazio
        const pombos = [0, 1, 2].map((i) => { const p = A.createAnimal("passaro", { fase: i * 0.3, cor2: 0x6d7078 }); p.group.scale.setScalar(0.32); p.group.position.set(1.2 + i * 0.7, 0.13, 35.5 - i * 0.9); A.face(p.group, -0.4, 1); S.add(p.group); return p; });
        function render(t) {
          av.set({ janelas: 1, apagao: 0, luzRua: 1, farois: 1, sinal: 1, sujeira: 0.05 }, t);
          pombos.forEach((p, i) => { p.update(t, { passo: 2.2 }); p.group.position.z = 35.5 - i * 0.9 + t * 0.28; p.group.position.x = 1.2 + i * 0.7 - t * 0.12; });
          celG.material.opacity = 0.45 + 0.1 * Math.sin(t * 2);
          const e = ease.inOutSine(range(t, 0, 5.7));
          cam.position.set(lerp(-0.4, 0.5, e), lerp(0.9, 2.8, e), lerp(44, 29, e));
          cam.lookAt(lerp(-0.4, 0, e), lerp(0.5, 2.6, e), lerp(32, 0, e));
          st.sol(0, 20, 60);
          st.draw();
        }
