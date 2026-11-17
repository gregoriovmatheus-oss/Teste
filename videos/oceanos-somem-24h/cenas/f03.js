/*META {"imports": ["oceano"], "rotulos": [{"de": 3.55, "ate": 5.0, "texto": "<span class=\"k\">VISTA ORBITAL</span><br>Um planeta <span class=\"y\">a seco</span>"}], "D0": 5.02} */
        const O = OCEANO, G0 = 9.87;
        try { await document.fonts.load('500 26px "JetBrains Mono"'); } catch (e) {}
        const st = T.createToyStage(canvas, { fov: 36, nuvens: 0, nevoa: null, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        O.espaco(st, { solDir: [-0.85, 0.3, 0.5] });
        const G = O.globoSeco(S, {});
        function render(t) {
          const u = t / D;
          // o nível do mar desce: primeiro aparecem as plataformas, depois as dorsais, por fim as planícies e fossas
          G.setAgua(1 - ease.inOutCubic(range(t, 0.75, 3.4)));
          G.aim(lerp(-42, -22, u), lerp(20, 6, u));
          const dist = lerp(6.9, 4.5, ease.inOutSine(u));
          cam.position.set(lerp(0.5, -0.3, u), lerp(0.35, 0.05, u), dist);
          cam.up.set(0, 1, 0);
          cam.lookAt(0, lerp(0.15, 0.3, u), 0);
          st.draw();
          O.etiqueta(st.ctx, cam, G.earth.localToWorld(O.llv(-30, 45, 0.99)), "DORSAL MESO-ATLÂNTICA", { dx: 70, dy: -170, tam: 26, a: range(t, 2.6, 3.0) - range(t, 4.7, 5.0) });
        }
