/*META {"imports": ["terra", "aneis"], "rotulos": [{"de": 0.25, "ate": 1.6, "top": 520, "texto": "<span class=\"k\">ÓRBITA</span><br>um <span class=\"o\">perigo</span>"}, {"de": 4.15, "ate": 5.49, "top": 520, "texto": "<span class=\"y\">pedras e gelo</span><br>no caminho"}], "D0": 5.49, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const AN = ANEIS;
        await AN.prepara();
        const st = T.createToyStage(canvas, { fov: 40, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam; cam.near = 0.05; cam.far = 3000; cam.updateProjectionMatrix();
        S.environment = null; st.hemi.intensity = 0.12; st.rim.intensity = 0.4; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 29, n: 4000, via: 0.5, raio: 1500 }));
        // dentro do anel: Terra (raio 100) ao fundo, pedras e gelo passando perto da câmera
        const E = await TERRA.createTerra({ raio: 1 }); E.group.scale.setScalar(100); S.add(E.group);
        const SD = new THREE.Vector3(0.75, 0.42, 0.5).normalize();
        E.sol.copy(SD); E.u.nuvens.value = 0.6; E.u.luzes.value = 0.6; E.aim(-40, -5);
        const R = AN.anel({ Re: 100, r1: 125, r2: 240, op: 0.5, br: 1.3, amb: 0.03, sombraA: 0.7, seg: 512 });
        R.mesh.rotation.x = -Math.PI / 2; S.add(R.mesh); R.u.uL.value.copy(SD); R.sync();
        const RO = AN.campoRochas(S, { n: 700, area: [70, 1.0, 34], centro: [0, 0, 150], tam: [0.03, 0.55], seed: 3 });
        st.key.position.set(0, 0, 150).addScaledVector(SD, 40); st.key.target.position.set(0, 0, 150); st.key.intensity = 3.2; st.key.color.set(0xfff2e0);
        const SA = AN.satelite(); SA.g.scale.setScalar(0.55); S.add(SA.g);
        const FG = AN.foguete(); FG.g.scale.setScalar(1.6); S.add(FG.g);
        const rastro = Array.from({ length: 10 }, (_, i) => { const b = AN.brilho(0xffc890, 1.6 - i * 0.1, "suave", 0.5 - i * 0.04); S.add(b); return b; });
        const fp = (k, out) => out.set(-3.5 + 4 * k - 12 * Math.max(0, k - 0.5) ** 2, -5 + 18 * k, 136 - 4 * k);
        const alvo = new THREE.Vector3(), q = new THREE.Vector3(), q2 = new THREE.Vector3();
        function render(t) {
          RO.update(t, 0.9);
          // satélite atravessa o campo e desvia para cima em "desviar" (3,5 s), com jato do propulsor
          const dv = ease.inOutCubic(range(t, 3.25, 4.2));
          SA.g.position.set(lerp(-2.6, 2.2, t / 5.49), 0.9 + 1.2 * dv, 154);
          SA.g.rotation.set(0.25 - 0.35 * dv, 0.6 + 0.15 * t, 0.15 * Math.sin(t * 0.7) - 0.3 * dv);
          SA.jato(range(t, 3.15, 3.35) * (1 - range(t, 4.1, 4.5)));
          // foguete sobe ao fundo e faz a curva para fugir do plano do anel
          const k = range(t, 0.6, 5.49);
          fp(k, FG.g.position); fp(Math.min(1, k + 0.01), q2); q.copy(q2).sub(FG.g.position).normalize();
          FG.g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q); FG.chama(k > 0 ? 1 : 0, t);
          rastro.forEach((b, i) => { fp(Math.max(0, k - 0.02 * (i + 1)), b.position); b.material.opacity = (k > 0.02 * (i + 1) ? 1 : 0) * (0.45 - i * 0.035); });
          const e = ease.inOutSine(range(t, 0, 5.49));
          cam.position.set(lerp(-3.2, -0.8, e), lerp(2.0, 1.7, e), lerp(160.5, 159.5, e));
          alvo.set(lerp(0.4, 1.2, e), lerp(2.6, 3.0, e), 145); cam.lookAt(alvo);
          st.bloom = 0.7;
          st.draw();
          const c = st.ctx;
          AN.etq(c, "SATÉLITE", SA.g.position, cam, range(t, 1.6, 1.9) * (1 - range(t, 3.2, 3.4)), { dy: -220 });
          AN.etq(c, "FOGUETE", FG.g.position, cam, range(t, 2.3, 2.6) * (1 - range(t, 3.6, 3.8)), { dy: 120 });
          AN.etq(c, "DESVIO", SA.g.position, cam, range(t, 3.5, 3.7) * (1 - range(t, 4.05, 4.2)), { cor: AN.LARANJA, dy: -220 });
        }
