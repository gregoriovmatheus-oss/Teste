/*META {"imports": ["pele"], "rotulos": [{"de": 0.1, "ate": 1.7, "texto": "<span class=\"k\">A MAIORIA</span><br>Mentira <span class=\"y\">social</span>"}], "D0": 3.83} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 34, ceu: ["#0f0b0a", "#2b1d15"], nevoa: [10, 50], corNevoa: "#1d1410", nuvens: 0, luz: 0.85 });
        const S = st.scene, cam = st.cam;
        st.rim.color.set(0x8fc4ff); st.rim.intensity = 1.8; st.hemi.intensity = 0.35;
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), T.M(0x4a3426, 0.55)); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        PELE.bokeh(S, { n: 34, seed: 55, centro: [0, 3, -22], area: [40, 12, 8], tam: [1.2, 3.2], op: 0.4 });
        const mesa = new THREE.Mesh(T.roundBox(3.2, 0.08, 1.2, 0.03), T.M(0xe9e2d6, 0.8)); mesa.position.set(0.4, 0.95, -1.4); S.add(mesa);
        const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 8), T.M(0x2a2a2a, 0.5)); pe.position.set(0.4, 0.47, -1.4); S.add(pe);
        const bolo = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 24), T.M(0xf3e6d0, 0.7)); bolo.position.set(0.1, 1.13, -1.4); S.add(bolo);
        const P = [
          { x: -1.35, z: 0.1, ry: 0.35, c: [0xb83a2e, 0x2c3550, 0x2a1d16, 0xe2ad85], f: "“Que lindo!”", t0: 1.76, p: "maoE", mulher: true },
          { x: 0.05, z: -0.25, ry: 0, c: [0x3f6e4a, 0x3a3a3e, 0x111111, 0x8a5a3c], f: "“Foi o trânsito.”", t0: 2.37, p: "pescoco" },
          { x: 1.4, z: 0.15, ry: -0.35, c: [0xd9a23a, 0x1e2230, 0x6b4a2e, 0xc98f68], f: "“Tô bem.”", t0: 3.02, p: "bracoD", mulher: true },
        ].map((o) => {
          const b = PELE.corpo({ cor: o.c[0], cor2: o.c[1], cabelo: o.c[2], pele: o.c[3], mulher: o.mulher, esc: 14 });
          b.group.position.set(o.x, 0, o.z); b.group.rotation.y = o.ry; S.add(b.group);
          return { ...o, b };
        });
        const v = new THREE.Vector3();
        function render(t) {
          P.forEach((o, i) => {
            const fala = range(t, o.t0 - 0.2, o.t0 + 0.3);
            const br = i === 0 ? { bracoE: [0.9 * fala + 0.1, 1.2 * fala, 0.3], bracoD: [0.9 * fala + 0.1, 1.2 * fala, 0.3] }
              : i === 1 ? { bracoD: [0.5 * fala, 1.4 * fala, 0.5 * fala + 0.1] } : { bracoE: [0.6 * fala, 1.9 * fala, 0.45] };
            o.b.pose(t, { ...br, fase: i * 0.3, cabeca: [Math.sin(t * 0.8 + i) * 0.2, -0.05 + 0.08 * fala] });
            o.b.pele.marca(0, o.b.PONTOS[o.p], 0.08 * ease.outCubic(range(t, o.t0 + 0.15, o.t0 + 0.7)));
            o.b.pele.u.uBri.value = 1.4;
            o.b.pose(t, { ...br, fase: i * 0.3, cabeca: [Math.sin(t * 0.8 + i) * 0.2, -0.05 + 0.08 * fala] });
          });
          // travelling lateral, da esquerda para a direita, acompanhando quem fala
          const e = ease.inOutSine(range(t, 0, 3.83));
          cam.position.set(lerp(-2.4, 2.0, e), lerp(1.75, 1.55, e), lerp(5.2, 4.6, e));
          cam.lookAt(lerp(-0.9, 0.9, e), 1.25, 0);
          st.sol(0, 0, 5);
          st.bloom = 0.55;
          st.draw();
          const c = st.ctx;
          P.forEach((o) => {
            v.set(0, 2.15, 0); o.b.group.localToWorld(v);
            const [x, y] = PELE.proj(v, cam);
            PELE.txt(c, o.f, clamp(x, 220, 720), y - 10, { fonte: "inter", peso: 300, italico: true, tam: 46, a: PELE.fade(t, o.t0 - 0.15, o.t0 + 0.75, 0.15) });
            v.set(...o.b.PONTOS[o.p]); o.b.group.localToWorld(v);
            const [mx, my] = PELE.proj(v, cam);
            PELE.tag(c, mx, my, mx + 60, my + 120, "", { cor: PELE.LARANJA, a: range(t, o.t0 + 0.2, o.t0 + 0.5) });
          });
        }
