/*META {"imports": ["terra", "deserto"], "rotulos": [{"de": 3.1, "ate": 4.85, "top": 520, "texto": "<span class=\"k\">NASA · SATÉLITE CALIPSO</span><br>~<span class=\"y\">27 milhões</span> t/ano"}], "D0": 6.27, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const DS = DESERTO;
        await DS.prepara();
        const st = T.createToyStage(canvas, { fov: 38, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 44, n: 4500, via: 0.5 }));
        const E = await DS.terraVerde(TERRA); S.add(E.group);
        E.sol.set(0.6, 0.5, 1); E.u.nuvens.value = 0.5; E.u.luzes.value = 0.3;
        const PO = DS.poeiraArco(E, { n: 2800, de: [6, 19], ate: [-62, -3], seed: 9, tam: 0.02, larg: 0.06 });
        const alvo = new THREE.Vector3(), a0 = new THREE.Vector3(), a1 = new THREE.Vector3();
        function render(t) {
          // do Saara (perto) para o Atlântico inteiro: a pluma atravessa o oceano e chega na Amazônia em "Brasil" (2,35 s)
          const e = ease.inOutSine(range(t, 0, 6.27));
          E.aim(lerp(0, -30, e), lerp(14, 4, e));
          E.nuv.rotation.y = t * 0.01;
          PO.update(t, ease.inOutSine(range(t, 0.85, 2.5)), range(t, 0.7, 1.1));
          cam.position.set(lerp(0.6, 0.15, e), lerp(0.8, 0.35, e), lerp(2.2, 3.55, e));
          alvo.set(lerp(0.35, 0.0, e), lerp(0.4, 0.0, e), 0); cam.lookAt(alvo);
          st.bloom = 0.75;
          st.draw();
          const c = st.ctx;
          a0.copy(PO.P0).multiplyScalar(E.raio); E.earth.localToWorld(a0);
          a1.copy(PO.P1).multiplyScalar(E.raio); E.earth.localToWorld(a1);
          DS.etq(c, "SAARA", a0, cam, range(t, 1.4, 1.7) * (1 - range(t, 2.9, 3.1)), { cor: DS.LARANJA, dy: -60 });
          DS.etq(c, "BRASIL · AMAZÔNIA", a1, cam, range(t, 2.3, 2.6) * (1 - range(t, 2.9, 3.1)) + range(t, 4.85, 5.15), { cor: "#8fe08a", dy: -90 });
        }
