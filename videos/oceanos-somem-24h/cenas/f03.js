/*META {"imports": ["oceano", "terra"], "rotulos": [{"de": 3.55, "ate": 5.0, "texto": "<span class=\"k\">VISTA ORBITAL</span><br>Um planeta <span class=\"y\">a seco</span>"}], "D0": 5.02} */
        const O = OCEANO, G0 = 9.87;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        // a Terra real perde o azul: o oceano drena (terra.js: seco 0 -> 1) e aparece o relevo do fundo
        const st = T.createToyStage(canvas, { fov: 34, ceu: ["#000000", "#02030a"], nuvens: 0, nevoa: null });
        const S = st.scene, cam = st.cam;
        const { E, SOL } = await O.espacoDoc(st, TERRA, { solDir: [-0.9, 0.35, 0.35] });
        function render(t) {
          const u = t / D;
          // drena: primeiro as plataformas, depois as bacias (curva lenta no fim)
          E.u.seco.value = ease.inOutCubic(range(t, 0.85, 3.6));
          E.u.nuvens.value = lerp(0.85, 0.45, range(t, 1.0, 4.0));
          E.nuv.rotation.y = t * 0.01;
          E.aim(lerp(-45, -25, u), lerp(22, 4, u));
          const dist = lerp(5.6, 3.7, ease.inOutSine(u));
          cam.position.set(lerp(0.5, -0.2, u), lerp(0.4, 0.05, u), dist);
          cam.up.set(0, 1, 0);
          cam.lookAt(0, lerp(-0.05, 0.1, u), 0);
          st.draw();
          O.etiqueta(st.ctx, cam, E.earth.localToWorld(E.ponto(-29, 38, 1)), "DORSAL MESO-ATLÂNTICA", { dx: 60, dy: -200, a: range(t, 2.6, 3.0) - range(t, 4.7, 5.0) });
          O.etiqueta(st.ctx, cam, E.earth.localToWorld(E.ponto(-50, 10, 1)), "PLANÍCIE ABISSAL", { dx: -60, dy: 220, a: range(t, 3.2, 3.6) - range(t, 4.7, 5.0) });
        }
