/*META {"imports": ["hiber"], "rotulos": [{"de": 1.03, "ate": 2.25, "texto": "Um <span class=\"y\">primata</span> que hiberna"}, {"de": 2.31, "ate": 3.6, "texto": "<span class=\"k\">MADAGASCAR</span><br><span class=\"p\">lêmure-anão-de-<span class=\"y\">cauda-gorda</span></span>"}, {"de": 3.69, "ate": 5.71, "texto": "Primata, <span class=\"y\">como nós</span>"}], "D0": 5.71, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 34, ceu: ["#2a2440", "#e89a5c"], nevoa: [10, 60], corNevoa: "#c07a58", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xffb070); st.key.intensity = 2.4; st.hemi.intensity = 0.5; st.rim.color.set(0xff8a4c);
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), T.M(0xa07a54, 0.95)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; S.add(chao);
        const b = HIBER.baoba(T.M, 3, 1); S.add(b.g);
        const R = mulberry32(33);
        for (let i = 0; i < 7; i++) { const o = HIBER.baoba(T.M, 40 + i, 0.7 + R() * 0.6); o.g.position.set((R() - 0.5) * 40, 0, -10 - R() * 30); o.g.rotation.y = R() * 6; S.add(o.g); }
        for (let i = 0; i < 14; i++) { const o = T.arvore(0.5 + R() * 0.5, 0x6a7a3a, 60 + i); o.position.set((R() - 0.5) * 30, 0, -4 - R() * 20); S.add(o); }
        const l = HIBER.lemure(T.M); l.g.position.copy(b.oco).add(new THREE.Vector3(0.0, -0.3, -0.12)); l.g.rotation.y = -1.3; l.g.scale.setScalar(1.25); S.add(l.g);
        const luz = new THREE.PointLight(0xffc890, 1.4, 2, 1.5); luz.position.copy(b.oco).add(new THREE.Vector3(0.2, 0.3, 0.8)); S.add(luz);
        const alvo = new THREE.Vector3();
        function render(t) {
          l.respira(t, 1);
          // aproxima em arco do oco do baobá ao entardecer
          const e = ease.inOutSine(range(t, 0, 5.71)), a = lerp(0.5, -0.15, e), r = lerp(5.2, 1.5, e);
          cam.position.set(Math.sin(a) * r, lerp(1.6, 1.45, e), b.oco.z + Math.cos(a) * r);
          alvo.set(0, lerp(1.0, 1.05, e), b.oco.z); cam.lookAt(alvo);
          st.bloom = 0.55; st.sol(0, 0, 8);
          st.draw();
        }
