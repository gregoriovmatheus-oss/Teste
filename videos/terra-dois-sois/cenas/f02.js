/*META {"imports": ["terra", "doissois"], "rotulos": [{"de": 2.9, "ate": 4.85, "texto": "<span class=\"k\">NASA · 2011</span><br><span class=\"y\">Kepler-16b</span>"}, {"de": 4.95, "ate": 6.21, "texto": "gira em volta de<br><span class=\"y\">2 estrelas</span>"}], "D0": 6.21} */
        const DS = DOISSOIS;
        await DS.fontes();
        const st = T.createToyStage(canvas, { fov: 40, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0.04; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 16, n: 4500, via: 0.6 }));
        // binária: estrela A (laranja, maior) e B (anã vermelha) girando em volta do centro de massa
        const SA = DS.estrela(S, { r: 0.55, tipo: "amarelo", halo: 9 });
        const SB = DS.estrela(S, { r: 0.3, tipo: "vermelho", halo: 10 });
        const LA = new THREE.PointLight(0xffd6a8, 3.2, 0, 0), LB = new THREE.PointLight(0xff5a3a, 1.4, 0, 0); S.add(LA, LB);
        const RA = 0.45, RB = 1.55, RP = 5.2;
        S.add(DS.anel(RA, 0xffb070, 0.35, 0.012), DS.anel(RB, 0xff6a4a, 0.35, 0.012), DS.anel(RP, 0x7cc8ff, 0.6, 0.02));
        const P = DS.gigante(0.42); P.rotation.z = 0.2; S.add(P);
        const pp = new THREE.Vector3(), alvo = new THREE.Vector3();
        function render(t) {
          const w = 0.9 * t + 0.6;
          SA.group.position.set(Math.cos(w) * RA, 0, Math.sin(w) * RA);
          SB.group.position.set(-Math.cos(w) * RB, 0, -Math.sin(w) * RB);
          LA.position.copy(SA.group.position); LB.position.copy(SB.group.position);
          SA.set(1, t); SB.set(1, t * 1.3);
          const f = 1.15 + t * 0.07;
          pp.set(Math.cos(f) * RP, 0, Math.sin(f) * RP); P.position.copy(pp); P.rotation.y = t * 0.4;
          // do planeta em primeiro plano (sóis atrás) para o sistema inteiro visto de cima
          const e = ease.inOutCubic(range(t, 0.4, 5.6));
          const c0 = new THREE.Vector3(Math.cos(f - 0.32) * RP * 1.08, 0.4, Math.sin(f - 0.32) * RP * 1.08);
          const c1 = new THREE.Vector3(4.5, 10.5, 12.5);
          cam.position.lerpVectors(c0, c1, e);
          alvo.lerpVectors(pp.clone().multiplyScalar(0.62).add(new THREE.Vector3(0, -0.25, 0)), new THREE.Vector3(0.6, 0, 2.6), e);
          cam.lookAt(alvo);
          st.bloom = 0.85;
          st.draw();
        }
