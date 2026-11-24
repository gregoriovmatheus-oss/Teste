/*META {"imports": ["terra", "deserto"], "rotulos": [{"de": 1.75, "ate": 3.7, "top": 520, "texto": "<span class=\"k\">DESERTOS</span><br>≈ <span class=\"y\">1/3</span> da terra firme"}, {"de": 4.35, "ate": 5.74, "top": 520, "texto": "todos virando <span class=\"y\">floresta</span>"}], "D0": 5.74} */
        const DS = DESERTO;
        await DS.prepara();
        const st = T.createToyStage(canvas, { fov: 40, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 12, n: 4500, via: 0.55 }));
        const E = await DS.terraVerde(TERRA); S.add(E.group);
        E.sol.set(-0.9, 0.45, 0.75); E.u.nuvens.value = 0.55; E.u.luzes.value = 0.4;
        const alvo = new THREE.Vector3();
        function render(t) {
          // a Terra gira devagar da África para a Ásia; desertos acendem em laranja e depois viram floresta
          E.aim(lerp(12, 48, ease.inOutSine(range(t, 0, 5.74))), -20);
          E.nuv.rotation.y = t * 0.01;
          E.u.realce.value = range(t, 0.25, 1.6) * (1 - range(t, 4.3, 5.3));
          E.u.verde.value = ease.inOutSine(range(t, 4.25, 5.6));
          const e = ease.inOutSine(range(t, 0, 5.74));
          cam.position.set(lerp(-0.25, 0.3, e), lerp(0.75, 0.6, e), lerp(2.85, 3.3, e));
          alvo.set(lerp(-0.1, 0.1, e), 0.62, 0); cam.lookAt(alvo);
          st.bloom = 0.7;
          st.draw();
          const c = st.ctx;
          DS.etq(c, "SAARA", E.earth.localToWorld(E.ponto(13, 22)), cam, range(t, 0.5, 0.8) * (1 - range(t, 1.6, 1.8)), { cor: DS.LARANJA, dy: -40 });
          DS.etq(c, "ARÁBIA", E.earth.localToWorld(E.ponto(46, 23)), cam, range(t, 0.85, 1.15) * (1 - range(t, 1.6, 1.8)), { cor: DS.LARANJA, dy: 40, dx: 60 });
        }
