/*META {"imports": ["terra", "deserto"], "rotulos": [{"de": 1.6, "ate": 3.35, "top": 520, "texto": "a Terra absorve<br><span class=\"y\">mais calor</span>"}], "D0": 5.98, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const DS = DESERTO;
        await DS.prepara();
        const st = T.createToyStage(canvas, { fov: 34, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 31, n: 4000, via: 0.7 }));
        const E = await DS.terraVerde(TERRA); S.add(E.group);
        E.u.verde.value = 1; E.u.nuvens.value = 0.45; E.u.luzes.value = 0.6;
        const SOL = TERRA.createSol({ raio: 3, halo: 30 }); SOL.group.position.set(-38, 14, -40); S.add(SOL.group);
        E.sol.copy(SOL.group.position).normalize();
        const alvo = new THREE.Vector3(), sah = new THREE.Vector3(), aus = new THREE.Vector3();
        function render(t) {
          // perto da borda iluminada; a luz que antes voltava da areia agora fica: as antigas áreas de deserto esquentam
          E.aim(lerp(-2, 22, ease.inOutSine(range(t, 0, 5.98))), lerp(12, 20, ease.inOutSine(range(t, 0, 5.98))));
          E.nuv.rotation.y = t * 0.012;
          E.u.tt.value = t;
          E.u.calor.value = 0.25 * range(t, 1.4, 2.9) + 0.85 * ease.inOutSine(range(t, 3.4, 5.2));
          const e = ease.inOutCubic(range(t, 0, 5.98));
          cam.position.set(lerp(1.4, 0.55, e), lerp(0.55, 0.2, e), lerp(3.6, 2.35, e));
          alvo.set(lerp(0.35, 0.05, e), lerp(-0.05, -0.15, e), 0); cam.lookAt(alvo);
          st.bloom = 0.8;
          st.draw();
          const c = st.ctx;
          sah.copy(E.ponto(12, 21)); E.earth.localToWorld(sah);
          DS.etq(c, "SAARA · MAIS QUENTE", sah, cam, range(t, 3.9, 4.2), { cor: DS.LARANJA, dy: -130 });
          // feixes de sol chegando (entram e não voltam)
          const a = range(t, 0.2, 0.8) * (1 - range(t, 3.2, 3.6));
          if (a > 0) { const [sx, sy] = DS.proj(SOL.group.position, cam); DS.raios2D(c, sx, sy, a * 0.8, { n: 10, seed: 5, cor: "255,214,160", r1: 1600, giro: t * 0.03 }); }
        }
