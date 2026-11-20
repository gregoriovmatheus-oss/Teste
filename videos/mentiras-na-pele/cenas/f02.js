/*META {"imports": ["pele"], "rotulos": [{"de": 0.8, "ate": 2.95, "top": 470, "texto": "<span class=\"k\">NESTE MUNDO</span><br>Cada mentira, <span class=\"y\">uma marca</span>"}, {"de": 5.47, "ate": 7.73, "top": 470, "texto": "Mentira grande:<br><span class=\"y\">o corpo inteiro</span>"}], "D0": 7.73} */
        await PELE.fontes();
        const st = T.createToyStage(canvas, { fov: 34, ceu: ["#07090e", "#1a2230"], nevoa: [14, 60], corNevoa: "#0d1118", nuvens: 0, luz: 0.85 });
        const S = st.scene, cam = st.cam;
        st.rim.color.set(0x8fc4ff); st.rim.intensity = 2.2; st.hemi.intensity = 0.3;
        const E = PELE.estudio(S, { raio: 1.4 });
        E.poca.position.set(0, 1.1, -1.4); E.poca.scale.setScalar(5);
        const P = PELE.corpo({ cor: 0xe8e2d4, cor2: 0x2c3550, cabelo: 0x2a1d16, pele: 0xd6a07a, esc: 13 });
        S.add(P.group);
        const PT = P.PONTOS;
        // mentiras pequenas: marcas discretas (pulso, pescoço, mão) — ditas em 3,6 / 4,2 / 4,6 s
        const peq = [[PT.pulsoE, 3.59, "PEQUENA"], [PT.pescoco, 4.16, ""], [PT.maoD, 4.62, ""]];
        const v = new THREE.Vector3();
        function render(t) {
          P.pose(t, { cabeca: [Math.sin(t * 0.4) * 0.15, -0.05] });
          peq.forEach(([p, t0], i) => P.pele.marca(i, p, 0.075 * ease.outCubic(range(t, t0, t0 + 0.6))));
          // mentira grande (5,5 s): a mancha nasce no peito e toma o corpo inteiro até 7,0 s
          const g = range(t, 5.47, 7.3);
          P.pele.marca(3, PT.peito, g <= 0 ? 0 : 0.05 + 1.6 * ease.inOutSine(g));
          P.pele.u.uBri.value = 0.9 + 0.8 * Math.sin(Math.PI * range(t, 5.4, 7.0));
          P.pose(t, { cabeca: [Math.sin(t * 0.4) * 0.15, -0.05] });
          // órbita contínua; acelera e sobe quando o corpo é tomado
          const a = -0.5 + t * 0.16 + 1.4 * ease.inOutSine(range(t, 5.2, 7.73));
          const R = lerp(5.4, 3.6, ease.inOutSine(range(t, 0, 5.2))) + 0.8 * ease.inOutSine(range(t, 5.2, 7.73));
          cam.position.set(Math.sin(a) * R, lerp(1.5, 1.25, range(t, 0, 5)) + 0.9 * ease.inOutSine(range(t, 5.4, 7.73)), Math.cos(a) * R);
          cam.lookAt(0, lerp(1.55, 1.45, range(t, 0, 5)) - 0.35 * ease.inOutSine(range(t, 5.4, 7.73)), 0);
          st.sol(0, 0, 4);
          st.bloom = 0.5 + 0.35 * g;
          st.vel = 0.25 * Math.sin(Math.PI * range(t, 5.4, 6.4)); st.velT = t;
          st.draw();
          const c = st.ctx;
          peq.forEach(([p, t0, s], i) => {
            v.set(...p); P.group.localToWorld(v);
            const [x, y] = PELE.proj(v, cam);
            const a2 = range(t, t0, t0 + 0.4) * (1 - range(t, 5.2, 5.5));
            PELE.tag(c, x, y, x + (i === 0 ? -190 : i === 1 ? -150 : 170), y - 90 - i * 30, i === 0 ? "MENTIRA PEQUENA" : "", { cor: PELE.LARANJA, a: a2, tam: 26 });
          });
          PELE.txt(c, "MARCAS DISCRETAS", 540, 1330, { tam: 30, cor: PELE.AZUL, a: PELE.fade(t, 4.16, 5.3, 0.25) });
        }
