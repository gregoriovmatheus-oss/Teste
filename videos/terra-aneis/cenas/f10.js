/*META {"imports": ["terra", "aneis"], "rotulos": [{"de": 1.4, "ate": 2.95, "top": 520, "texto": "<span class=\"k\">ESTAÇÃO ESPACIAL</span><br>a <span class=\"y\">400 km</span>"}, {"de": 3.0, "ate": 4.4, "top": 520, "texto": "<span class=\"y\">abaixo</span> dos anéis"}, {"de": 4.45, "ate": 6.72, "top": 520, "texto": "cada lançamento<br><span class=\"o\">mais arriscado</span>"}], "D0": 6.72, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const AN = ANEIS;
        await AN.prepara();
        const st = T.createToyStage(canvas, { fov: 34, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 33, n: 4500, via: 0.5 }));
        const E = await TERRA.createTerra({ raio: 1 }); S.add(E.group);
        E.sol.set(0.6, 0.55, 0.6).normalize(); E.u.nuvens.value = 0.55; E.u.luzes.value = 0.6;
        const R = AN.anel({ Re: 1, r1: 1.25, r2: 2.4, op: 0.7, br: 1.5, amb: 0.02, sombraA: 0.7 });
        R.mesh.rotation.x = -Math.PI / 2; S.add(R.mesh);
        // órbita da estação: 400 km = 0,063 raio da Terra, inclinada 51,6°
        const orb = new THREE.Group(); orb.rotation.x = 51.6 * Math.PI / 180; S.add(orb);
        const tor = new THREE.Mesh(new THREE.TorusGeometry(1.063, 0.0045, 6, 200), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0 }));
        tor.rotation.x = Math.PI / 2; orb.add(tor);
        const ISS = AN.brilho(0xcfe8ff, 0.09, "suave", 1); S.add(ISS);
        // trajetória de lançamento (equador → além do anel)
        const curva = new THREE.CatmullRomCurve3([[0, 0, 1.0], [0.25, 0.04, 1.35], [0.75, 0.06, 1.85], [1.5, 0.05, 2.35], [2.3, 0.02, 2.65]].map((v) => new THREE.Vector3(...v)));
        const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, 120, 0.012, 6), new THREE.MeshBasicMaterial({ color: 0xff8a4c }));
        S.add(tubo); const NT = tubo.geometry.index.count;
        const cab = AN.brilho(0xffc890, 0.22, "suave", 1); S.add(cab);
        const alerta = AN.brilho(0xff6a3a, 0.8, "raios", 0); S.add(alerta);
        const alvo = new THREE.Vector3(), q = new THREE.Vector3();
        function render(t) {
          E.earth.rotation.y = (-60 + 3 * t) * Math.PI / 180; E.nuv.rotation.y = t * 0.01;
          tor.material.opacity = 0.9 * range(t, 0.25, 0.8);
          const a = 0.6 + t * 0.55; q.set(Math.cos(a) * 1.063, 0, Math.sin(a) * 1.063); orb.localToWorld(q); ISS.position.copy(q);
          const kl = range(t, 4.45, 6.3);
          tubo.geometry.setDrawRange(0, Math.floor(NT * kl / 6) * 6); tubo.visible = kl > 0;
          curva.getPoint(Math.max(0.001, kl), cab.position); cab.material.opacity = kl > 0 && kl < 1 ? 1 : 0;
          const cruza = range(kl, 0.2, 0.3) * (1 - range(kl, 0.55, 0.75)); curva.getPoint(0.42, alerta.position); alerta.material.opacity = cruza; alerta.scale.setScalar(0.5 + 0.5 * cruza);
          const e = ease.inOutSine(range(t, 0, 6.72)), az = lerp(-0.2, 0.35, e), el = lerp(0.95, 0.62, e), r = lerp(10.5, 9.0, e);
          cam.position.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
          alvo.set(0, lerp(1.6, 1.3, e), 0); cam.lookAt(alvo);
          R.u.uL.value.copy(E.sol); R.sync();
          st.bloom = 0.7; st.draw();
          const c = st.ctx;
          AN.etq(c, "ESTAÇÃO · 400 KM", ISS.position, cam, range(t, 1.45, 1.75) * (1 - range(t, 2.75, 2.95)), { dy: 300, dx: 160 });
          AN.etq(c, "ANEL · MILHARES DE KM", q.set(1.9, 0, 1.0), cam, range(t, 3.0, 3.3) * (1 - range(t, 4.2, 4.45)), { dy: -200, dx: -260 });
        }
