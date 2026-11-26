/*META {"imports": ["terra", "aneis"], "rotulos": [{"de": 1.7, "ate": 3.95, "top": 520, "texto": "<span class=\"k\">INVERNO NO NORTE</span><br>a <span class=\"y\">sombra</span> dos anéis"}, {"de": 4.0, "ate": 5.33, "top": 520, "texto": "sobre <span class=\"o\">metade</span><br>do planeta"}], "D0": 5.33, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const AN = ANEIS;
        await AN.prepara();
        const st = T.createToyStage(canvas, { fov: 34, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 17, n: 4500, via: 0.4 }));
        // solstício: polo norte inclinado para longe do Sol (+x) → a sombra do anel cai no hemisfério norte
        const eixo = new THREE.Group(); eixo.rotation.z = 0.41; S.add(eixo);
        const E = await TERRA.createTerra({ raio: 1 }); eixo.add(E.group);
        E.sol.set(0.7, 0, 0.71).normalize(); E.u.nuvens.value = 0.55; E.u.luzes.value = 0.7;
        const SOL = TERRA.createSol({ raio: 3, halo: 30 }); SOL.group.position.copy(E.sol).multiplyScalar(60); S.add(SOL.group);
        const R = AN.anel({ Re: 1, r1: 1.25, r2: 2.4, op: 0.55, br: 1.6, amb: 0.02, sombraA: 0.7 });
        R.mesh.rotation.x = -Math.PI / 2; eixo.add(R.mesh);
        const SH = AN.sombraAnel(1.012, R, { forca: 0 }); eixo.add(SH);
        const alvo = new THREE.Vector3(), pn = new THREE.Vector3();
        function render(t) {
          E.earth.rotation.y = (-115 + 4 * t) * Math.PI / 180; E.nuv.rotation.y = t * 0.012;
          SH.material.uniforms.uF.value = 1.0 * ease.inOutSine(range(t, 1.5, 2.6));   // a sombra "acende" quando é dita
          const e = ease.inOutSine(range(t, 0, 5.33)), az = lerp(0.5, 0.25, e), el = lerp(0.82, 0.68, e), r = lerp(7.4, 6.6, e);
          cam.position.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
          alvo.set(0, lerp(0.95, 0.8, e), 0); cam.lookAt(alvo);
          R.u.uL.value.copy(E.sol); R.sync();
          st.bloom = 0.75;
          st.draw();
          pn.set(0.25, 0.55, 0.8).normalize(); pn.applyQuaternion(eixo.quaternion);
          AN.etq(st.ctx, "HEMISFÉRIO NORTE · INVERNO", pn, cam, range(t, 2.6, 2.95) * (1 - range(t, 3.9, 4.1)), { cor: AN.LARANJA, dy: 200, dx: 120 });
        }
