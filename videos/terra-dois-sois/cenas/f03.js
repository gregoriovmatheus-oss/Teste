/*META {"imports": ["terra", "doissois"], "rotulos": [{"de": 0.55, "ate": 3.5, "texto": "<span class=\"k\">ESTRELAS COMO O SOL</span><br>quase <span class=\"y\">metade</span><br>vive em par"}, {"de": 3.95, "ate": 5.67, "texto": "nós somos a <span class=\"y\">exceção</span>"}], "D0": 5.67} */
        const DS = DOISSOIS;
        const st = T.createToyStage(canvas, { fov: 46, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 31, n: 5000, via: 0.7 }));
        const R = mulberry32(303), SIS = [];
        const CORES = [0xfff0d0, 0xffd49a, 0xffb070, 0xff7a50, 0xd8e4ff];
        const SOL = new THREE.Vector3(2.6, 1.2, -26);
        for (let i = 0; i < 34; i++) {
          const pos = new THREE.Vector3((R() - 0.5) * 26, (R() - 0.5) * 22, -6 - R() * 60);
          if (pos.distanceTo(SOL) < 6) pos.x -= 9;
          const par = i % 2 === 0 && i !== 0;
          const g = new THREE.Group(); g.position.copy(pos); S.add(g);
          const a = DS.brilho(CORES[i % 5], 2.4), a2 = DS.brilho(0xffffff, 0.5, "disco"); g.add(a, a2);
          const s = { g, par, a, a2, ph: R() * 6.28, w: 0.8 + R() * 1.4, sep: 0.5 + R() * 0.4 };
          if (par) {
            s.b = DS.brilho(CORES[(i + 2) % 5], 1.6); s.b2 = DS.brilho(0xffffff, 0.35, "disco"); g.add(s.b, s.b2);
            s.anel = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.035, 4, 64), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
            g.add(s.anel);
          }
          SIS.push(s);
        }
        // o nosso Sol: sozinho, com anel laranja
        const sol = new THREE.Group(); sol.position.copy(SOL); S.add(sol);
        sol.add(DS.brilho(0xffe2a8, 3.4), DS.brilho(0xffffff, 0.7, "disco"), DS.brilho(0xffd7a0, 9, "raios", 0.4));
        const anelSol = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 4, 64), new THREE.MeshBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
        sol.add(anelSol);
        const alvo = new THREE.Vector3();
        function render(t) {
          const hl = ease.outCubic(range(t, 0.58, 1.3)), apaga = range(t, 3.7, 4.4);
          for (const s of SIS) {
            if (!s.par) continue;
            const a = s.ph + t * s.w, d = s.sep;
            s.a.position.set(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.25, 0); s.a2.position.copy(s.a.position);
            s.b.position.set(-Math.cos(a) * d, -Math.sin(a) * d * 0.6, 0); s.b2.position.copy(s.b.position);
            s.anel.material.opacity = 0.75 * hl * (1 - 0.7 * apaga);
            s.anel.lookAt(cam.position);
          }
          anelSol.material.opacity = ease.outCubic(range(t, 3.8, 4.3));
          anelSol.lookAt(cam.position); anelSol.scale.setScalar(1 + 0.08 * Math.sin(t * 4));
          // voo pelo campo de estrelas; em "Nós" vira para o Sol solitário
          const e = ease.inOutSine(range(t, 0, 3.8)), v = ease.inOutCubic(range(t, 3.5, 5.67));
          cam.position.set(lerp(-2, 1, e) + v * 1.2, lerp(-1, 0.5, e), lerp(14, -4, e) - v * 12);
          alvo.set(lerp(0, 1, e), lerp(2.2, 1.5, e), -40).lerp(SOL.clone().add(new THREE.Vector3(0, -2.2, 0)), v);
          cam.lookAt(alvo);
          st.bloom = 0.9;
          st.draw();
        }
