/*META {"imports": ["mente"], "rotulos": [{"de": 0.5, "ate": 3.1, "texto": "Não se eles são<br><span class=\"y\">inteligentes</span>"}, {"de": 3.3, "ate": 7.58, "texto": "Mas como tratamos<br>quem <span class=\"y\">não pode reclamar</span>"}], "D0": 7.58} */
        const st = T.createToyStage(canvas, { fov: 30, ceu: ["#2a2440", "#e08a5a"], nevoa: [2.5, 9], corNevoa: "#6a4a48", luz: 0.8, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.65;
        st.key.color.set(0xffa070);
        // o mesmo tronco do começo, agora ao entardecer: o tubo vazio e o cestinho já fora
        const tronco = T.mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.6, 40), 0x6b4a32, S, 0.9); tronco.position.y = -0.3;
        T.mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.02, 40), 0xb08a5e, S, 0.85).position.y = -0.005;
        for (let i = 1; i < 6; i++) { const an = T.mesh(new THREE.TorusGeometry(i * 0.15, 0.004, 4, 48), 0x8d6a46, S, 0.9); an.rotation.x = Math.PI / 2; an.position.y = 0.006; }
        const vidro = new THREE.MeshStandardMaterial({ color: 0xd8f0ff, roughness: 0.04, transparent: true, opacity: 0.22, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false });
        const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.3, 32, 1, true), vidro); tubo.position.set(0.33, 0.15, 0); S.add(tubo);
        const aro = T.mesh(new THREE.TorusGeometry(0.055, 0.004, 8, 32), T.M(0xeaf6ff, 0.1, { metalness: 0.6 }), S); aro.rotation.x = Math.PI / 2; aro.position.set(0.33, 0.3, 0);
        T.mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.02, 32), 0x3a3f46, S, 0.4).position.set(0.33, 0.01, 0);
        const cesto = new THREE.Group(); cesto.position.set(0.42, 0, 0.2); cesto.rotation.z = 1.4; S.add(cesto);
        T.mesh(new THREE.CylinderGeometry(0.03, 0.024, 0.036, 20, 1, true), T.M(0xc9a15a, 0.7, { side: THREE.DoubleSide }), cesto).position.y = 0.018;
        const arame = T.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0.1, 0.004, 0.24], [0.2, 0.004, 0.27], [0.24, 0.01, 0.29], [0.24, 0.02, 0.25]].map((p) => new THREE.Vector3(...p))), 30, 0.0028, 6), T.M(0xd9dde2, 0.18, { metalness: 0.95 }), S);
        const cv = MENTE.corvo(); cv.group.position.set(0.02, 0, 0.02); S.add(cv.group);
        const rr = mulberry32(131);
        for (let i = 0; i < 22; i++) { const b = MENTE.glow(rr() < 0.6 ? 0xffb080 : 0xd0a0c0, 0.3 + rr() * 0.6, 0.12 + rr() * 0.2); b.position.set(-3 + rr() * 6, 0.3 + rr() * 2, -3 - rr() * 3); S.add(b); }
        for (let i = 0; i < 9; i++) { const a = T.arvore(0.8 + rr() * 0.6, 0x3f5a2c, 500 + i); a.position.set(-6 + i * 1.5 + rr(), -0.6, -5.5 - rr() * 2); S.add(a); }
        const sol = MENTE.glow(0xffb070, 3.6, 0.6); sol.position.set(-2.2, 0.8, -6); S.add(sol);
        function render(t) {
          // perfil (um olho para nós) → vira e encara a câmera em 3,3 s
          const encara = ease.inOutCubic(range(t, 3.0, 3.9));
          const pisc = Math.sin(Math.PI * range(t, 5.6, 5.75));
          cv.update(t, { cabeca: lerp(0.05, -0.02, encara) + Math.sin(t * 0.8) * 0.02, vira: lerp(0.1, -0.85, encara), inclina: lerp(0.12, -0.08, encara) + Math.sin(t * 1.1) * 0.03, corpo: -0.02, bico: 0.02 });
          cv.group.rotation.y = lerp(0, -0.25, encara);
          // push-in lento até o olhar
          const e = ease.inOutSine(range(t, 0, 7.58));
          const alvo = new THREE.Vector3(lerp(0.12, 0.17, e), lerp(0.3, 0.38, e), 0.02);
          const R = lerp(1.7, 1.05, e), a = lerp(0.15, 0.05, e);
          cam.position.set(alvo.x + Math.sin(a) * R, alvo.y + lerp(0.08, 0.0, e), alvo.z + Math.cos(a) * R);
          cam.lookAt(alvo);
          st.sol(0.2, 0, 1.5, 0);
          // fim: escurece devagar
          st.draw(S, cam, { cor: "#0b0a12", a: range(t, 6.6, 7.58) * 0.7 + pisc * 0 });
        }
