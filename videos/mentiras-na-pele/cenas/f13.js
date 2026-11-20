/*META {"imports": ["pele"], "rotulos": [{"de": 0.3, "ate": 3.25, "top": 470, "texto": "Uma pele que<br><span class=\"y\">não mente</span>"}, {"de": 3.48, "ate": 7.07, "top": 470, "fixo": false, "sai": false, "texto": "Você teria coragem<br>de <span class=\"y\">mostrar a sua?</span>"}], "D0": 7.07} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 30, ceu: ["#0d0909", "#2a1a13"], nevoa: null, nuvens: 0, luz: 0.8, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.rim.color.set(0x8fc4ff); st.rim.intensity = 1.8; st.hemi.intensity = 0.35;
        const parede = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), T.M(0x2a1d17, 0.95)); parede.position.set(0, 0, -90); S.add(parede);
        PELE.bokeh(S, { n: 30, seed: 11, centro: [-8, 6, -60], area: [90, 70, 20], tam: [5, 13], op: 0.32 });
        // 1) de volta ao braço com o presente (a mesma imagem da abertura, agora tomada pela marca)
        const B = PELE.bracoClose({ pele: 0xd39a72, manga: 0x4d5b6c, papel: 0x8a1f2c });
        B.group.rotation.set(0.25, -0.35, 0.62); B.group.position.set(1.5, -2.5, 0); S.add(B.group);
        B.pele.marca(0, B.PULSO, 4.9);
        // 2) a pessoa inteira, segurando o presente, vira e olha para a câmera
        const sala = new THREE.Group(); sala.position.set(200, 0, 0); S.add(sala);
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), T.M(0x3a2a20, 0.55)); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; sala.add(piso);
        const bk = PELE.bokeh(sala, { n: 24, seed: 131, centro: [0, 2.5, -9], area: [14, 5, 3], tam: [0.6, 1.6], op: 0.35 });
        const P = PELE.corpo({ cor: 0x4d5b6c, cor2: 0x2c3550, cabelo: 0x2a1d16, pele: 0xd39a72, esc: 14 });
        sala.add(P.group); P.group.rotation.y = -0.9;
        const pres = new THREE.Mesh(T.roundBox(0.24, 0.2, 0.24, 0.02), T.M(0x8a1f2c, 0.6)); pres.position.set(0, -0.4, 0.1); P.arms[0].el.add(pres);
        const fita = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.21, 0.04), T.M(0xd8b25a, 0.3, { metalness: 0.6 })); fita.position.set(0, -0.4 + 0.1, 0.1); P.arms[0].el.add(fita);
        const TC = 3.0, v = new THREE.Vector3();
        function render(t) {
          B.pele.u.uBri.value = 1.1; B.update(t);
          P.pele.marca(0, P.PONTOS.pulsoE, 0.16); P.pele.marca(1, [0.24, 1.15, 0.05], 0.1 + 0.05 * range(t, 4, 7));
          P.pele.u.uBri.value = 1.3; P.pele.marca(2, P.PONTOS.pescoco, 0.07 * ease.outCubic(range(t, 4.2, 5.2)));
          sala.updateMatrixWorld(true);
          // cabeça vira para a câmera em "Você teria coragem" (3,48 s)
          const camA = lerp(0.15, 0.05, range(t, TC, 7.07));
          const olha = ease.inOutCubic(range(t, 3.4, 4.3));
          P.pose(t, { bracoE: [0.45, 1.25, 0.1], cabeca: [lerp(-0.6, 0.65 + camA, olha), lerp(-0.15, 0.02, olha)], tronco: 0.25 * olha });
          st.vel = 0.6 * Math.max(0, 1 - Math.abs(t - TC) / 0.22); st.velT = t;
          if (t < TC) {
            v.set(...B.PULSO); B.group.localToWorld(v);
            const e = ease.inOutSine(range(t, 0, TC)), a = lerp(0.35, -0.1, e), R = lerp(16, 21, e);
            cam.position.set(v.x + Math.sin(a) * R, v.y + lerp(3.5, 6, e), v.z + Math.cos(a) * R);
            cam.lookAt(v.x - 1.5, v.y + 0.5, v.z);
            st.sol(0, 0, 18);
          } else {
            // dolly-in lento até o rosto que encara a câmera
            const e = ease.inOutSine(range(t, TC, 7.07)), R = lerp(3.4, 1.55, e);
            cam.position.set(200 + Math.sin(camA) * R, lerp(1.6, 1.8, e), Math.cos(camA) * R);
            cam.lookAt(200 + lerp(0.1, 0.02, e), lerp(1.55, 1.88, e), 0);
            st.sol(200, 0, 4);
          }
          st.bloom = 0.6;
          st.draw(S, cam, { cor: "#0b0a12", a: range(t, 6.55, 7.07) * 0.6 });
        }
