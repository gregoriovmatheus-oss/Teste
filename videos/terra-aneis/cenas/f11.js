/*META {"imports": ["terra", "aneis"], "rotulos": [{"de": 2.5, "ate": 5.55, "top": 520, "texto": "<span class=\"k\">ESTUDO DE 2024</span><br>a Terra teve <span class=\"y\">um anel?</span>"}], "D0": 7.48, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const AN = ANEIS;
        await AN.prepara();
        const st = T.createToyStage(canvas, { fov: 34, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 41, n: 4500, via: 0.6 }));
        const eixo = new THREE.Group(); eixo.rotation.z = -0.3; S.add(eixo);
        const E = await TERRA.createTerra({ raio: 1 }); eixo.add(E.group);
        E.sol.set(-0.8, 0.3, 0.75).normalize(); E.u.nuvens.value = 0.8; E.u.luzes.value = 0;
        // anel do passado: mais estreito e mais escuro (poeira de rocha)
        const R = AN.anel({ Re: 1, r1: 1.3, r2: 1.95, op: 0.6, br: 1.3, amb: 0.02, cor: 0xd8b898, sombraA: 0.7 });
        R.mesh.rotation.x = -Math.PI / 2; eixo.add(R.mesh);
        const SH = AN.sombraAnel(1.012, R, { forca: 0.7 }); eixo.add(SH);
        const alvo = new THREE.Vector3();
        function render(t) {
          // a Terra gira para trás cada vez mais devagar: voltando no tempo
          const vt = 9 * (1 - Math.exp(-t * 0.55)) - 0.6 * t;
          E.earth.rotation.y = -vt * 2.2; E.nuv.rotation.y = -vt * 0.6;
          st.blur = 1.6 * (1 - range(t, 0.2, 2.2));
          R.u.uRev.value = 0.02 + 1.02 * ease.inOutCubic(range(t, 4.9, 6.3));
          const e = ease.inOutSine(range(t, 0, 7.48)), az = lerp(-0.5, 0.15, e), el = lerp(0.2, 0.5, e), r = lerp(5.2, 7.4, e);
          cam.position.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
          alvo.set(0, lerp(0.75, 1.05, e), 0); cam.lookAt(alvo);
          R.u.uL.value.copy(E.sol); R.sync();
          st.bloom = 0.7;
          st.draw(S, cam, { cor: "#3a2208", a: 0.18 * range(t, 0, 1.5) });
          const c = st.ctx, kn = range(t, 5.6, 6.9), an = range(t, 5.65, 5.95);
          if (an > 0) {
            AN.numero(c, String(Math.round(466 * ease.outCubic(kn))), 540, 790, an, { tam: 150, cor: "#ffffff", sub: "MILHÕES DE ANOS ATRÁS", subCor: AN.AZUL });
          }
          AN.etq(c, "VOLTANDO NO TEMPO", alvo, cam, range(t, 0.3, 0.6) * (1 - range(t, 2.2, 2.45)), { dy: -320 });
        }
