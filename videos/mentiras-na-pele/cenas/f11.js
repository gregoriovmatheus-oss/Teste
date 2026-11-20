/*META {"imports": ["pele"], "rotulos": [], "D0": 3.32} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 34, ceu: ["#120d0c", "#3a271c"], nevoa: [8, 40], corNevoa: "#22170f", nuvens: 0, luz: 0.9 });
        const S = st.scene, cam = st.cam;
        st.rim.color.set(0x8fc4ff); st.rim.intensity = 1.8; st.hemi.intensity = 0.4;
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), T.M(0x5a4232, 0.5)); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        PELE.bokeh(S, { n: 26, seed: 111, centro: [0, 3, -16], area: [30, 10, 6], tam: [1, 3], op: 0.35 });
        // você (de costas, em primeiro plano) e a amiga com o corte de cabelo... ousado
        const eu = PELE.corpo({ cor: 0x5f8fb0, cor2: 0x2c3550, cabelo: 0x2a1d16, pele: 0xd6a07a, esc: 14 });
        eu.group.position.set(-0.45, 0, 0.6); eu.group.rotation.y = 2.5; S.add(eu.group);
        const ami = PELE.corpo({ cor: 0x8a5aa0, cor2: 0x3a3a3e, cabelo: 0x2bd4a0, pele: 0xe2ad85, mulher: true, esc: 14 });
        ami.group.position.set(0.45, 0, -0.5); ami.group.rotation.y = -0.65; S.add(ami.group);
        const mCab = T.M(0x2bd4a0, 0.5);
        [[0.0, 0.3, 0, 0.13], [0.09, 0.36, 0.03, 0.07], [-0.1, 0.33, -0.02, 0.09], [0.04, 0.42, -0.05, 0.06], [-0.12, 0.2, 0.06, 0.06], [0.14, 0.24, -0.06, 0.08]].forEach(([x, y, z, r]) => {
          const b = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mCab); b.position.set(x, y - 0.1, z); b.scale.set(r, r * 1.3, r); ami.head.add(b);
        });
        const v = new THREE.Vector3();
        function render(t) {
          const fala = range(t, 0.9, 1.3);
          eu.pele.marca(0, eu.PONTOS.pulsoD, 0.09 * ease.outCubic(range(t, 1.74, 2.3)));
          eu.pele.marca(1, eu.PONTOS.bracoE, 0.09 * ease.outCubic(range(t, 2.8, 3.32)));
          eu.pele.u.uBri.value = 1.5;
          eu.pose(t, { bracoD: [0.6 * fala + 0.1, 1.2 * fala, 0.2], cabeca: [0, -0.05] });
          ami.pose(t, { cabeca: [Math.sin(t * 2) * 0.15, -0.1 + 0.15 * range(t, 1.0, 1.6)], bracoE: [0.4, 1.6, 0.3], fase: 0.5 });
          // empurra por cima do ombro e gira até ver as duas marcas no seu braço
          const e = ease.inOutSine(range(t, 0, 3.32)), a = lerp(-0.35, -1.25, e), R = lerp(3.0, 2.4, e);
          cam.position.set(Math.sin(a) * R - 0.45, lerp(1.95, 1.6, e), Math.cos(a) * R + 0.6);
          cam.lookAt(lerp(0.3, 0.0, e), lerp(1.5, 1.3, e), lerp(-0.3, 0.1, e));
          st.sol(0, 0, 4);
          st.bloom = 0.5;
          st.draw();
          const c = st.ctx;
          PELE.txt(c, "“Seu cabelo", 470, 540, { fonte: "inter", peso: 300, italico: true, tam: 58, a: PELE.fade(t, 1.0, 2.05, 0.15) });
          PELE.txt(c, "ficou ótimo!”", 470, 610, { fonte: "inter", peso: 300, italico: true, tam: 58, a: PELE.fade(t, 1.0, 2.05, 0.15) });
          PELE.txt(c, "“Não doeu nada.”", 470, 580, { fonte: "inter", peso: 300, italico: true, tam: 58, a: PELE.fade(t, 2.15, 3.4, 0.15) });
          [[eu.PONTOS.pulsoD, 1.8], [eu.PONTOS.bracoE, 2.85]].forEach(([p, t0]) => {
            v.set(...p); eu.group.localToWorld(v); const [x, y] = PELE.proj(v, cam);
            PELE.tag(c, x, y, x + 110, y + 130, "+1", { cor: PELE.LARANJA, a: range(t, t0, t0 + 0.3), tam: 34 });
          });
        }
