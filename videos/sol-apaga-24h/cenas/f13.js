/*META {"imports": ["solkit"], "rotulos": [{"de": 0.5, "ate": 1.9, "top": 700, "texto": "O Sol <span class=\"y\">volta</span>"}, {"de": 1.95, "ate": 4.15, "top": 700, "texto": "<span class=\"k\">DE NOVO</span><br><span class=\"y\">8 min 20 s</span>"}, {"de": 4.2, "ate": 5.45, "top": 680, "texto": "Tudo parece <span class=\"y\">normal</span>"}, {"de": 5.5, "ate": 8.62, "top": 680, "texto": "O planeta estaria<br><span class=\"y\">mesmo igual</span>?", "sai": false}], "D0": 8.62} */
        const SK = SOLKIT;
        await SK.fontes();
        // parte A: espaço (o Sol reacende e a frente de luz volta a viajar)
        const st = T.createToyStage(canvas, { fov: 40, nevoa: null, nuvens: 0 });
        const S = SK.espaco(st), cam = st.cam;
        st.bloom = 0.8;
        const stars = SK.ceuDoc(S, { seed: 131 });
        const SP = new THREE.Vector3(0, 7, -1.5);
        const sol = SK.criaSol(S, { r: 1.2, pos: SP.toArray(), halo: 8 });
        const terra = await SK.terraDoc(S);
        const cascaMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          uniforms: { uA: { value: 1 } },
          vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
          fragmentShader: `uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - abs(dot(vN, vV)); float a = (pow(f, 7.0) * 1.6 + 0.025) * uA; gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * a, 1.0); }` });
        const casca = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), cascaMat); casca.position.copy(SP); S.add(casca);
        const SUND = SP.clone().normalize();
        // parte B: a mesma rua do começo, ensolarada de novo
        const st2 = T.createToyStage(canvas, { fov: 50, ceu: ["#3f86d6", "#d9e8ee"], nevoa: [90, 340], exposicao: 1.05, nuvens: 10 });
        const S2 = st2.scene, cam2 = st2.cam;
        const rua = T.rua({ len: 280, larg: 14, seed: 21, hMin: 12, hMax: 36 }); S2.add(SK.aliviar(rua.group));
        const rr = mulberry32(132);
        const pessoas = Array.from({ length: 10 }, (_, i) => { const h = A.createAnimal("humano", { cor: [0xd9583b, 0x3d6a8c, 0xe8b24a, 0x6c7880, 0xae6848][i % 5], cor2: [0x3f5677, 0x2d2f36][i % 2], mulher: i % 2 === 0, fase: rr() });
          h.dir = rr() < 0.5 ? 1 : -1; h.x = (i % 2 ? 1 : -1) * (8.2 + rr() * 1.4); h.z0 = 20 - i * 6; h.v = 1.1 + rr() * 0.4; S2.add(h.group); return h; });
        const D2 = new THREE.Vector3(-0.32, 0.5, -1).normalize();
        const sh = SK.brilho(0xffe2b0, 260, "suave", 0.95), sc = SK.brilho(0xffffff, 60, "disco", 1); S2.add(sh, sc);
        st.extraWarm = [st2.warm];
        function render(t) {
          if (t < 4.1) {
            // reacende em 0,72 s ("volta"): brasa -> brilho total
            const L = ease.outCubic(range(t, 0.55, 1.1));
            sol.set(L, t);
            // a frente de luz sai do Sol e anda em velocidade constante até a Terra (chega em 3,6 s: "chegar")
            const p = range(t, 0.75, 3.6), R = Math.max(0.01, 1.2 + p * (SP.length() - 2.2));
            casca.scale.setScalar(R); casca.visible = p > 0 && p < 1;
            const chegou = range(t, 3.55, 3.85);
            terra.set({ sol: SUND, luz: chegou, cidades: 1 - 0.5 * chegou, rotY: 1.0 + t * 0.06, incl: 0.25 });
            const e = ease.inOutSine(range(t, 0, 4.1));
            cam.position.set(lerp(7, 4, e), lerp(2.0, 2.6, e), lerp(27, 23, e));
            cam.lookAt(0, lerp(1.6, 1.9, e), 0);
            stars.set(1, t);
            st.draw();
            const fl = range(t, 3.6, 4.1);
            if (fl > 0) { const c = st.ctx; c.save(); c.globalAlpha = fl; c.fillStyle = "#fff6e0"; c.fillRect(0, 0, 1080, 1920); c.restore(); }
          } else {
            const u = t - 4.1;
            st2.T = t; st2.D = 8.62;
            pessoas.forEach((h) => { h.group.position.set(h.x, 0.4, h.z0 + h.dir * h.v * t); A.face(h.group, 0, h.dir); h.update(t, { passo: h.v * 1.3 }); });
            // grua: de dentro da rua até acima dos prédios, olhando o céu de novo
            const e = ease.inOutSine(range(u, 0, 4.52));
            cam2.position.set(lerp(1.5, -2, e), lerp(3, 30, e), lerp(30, 52, e));
            cam2.lookAt(0, lerp(9, 16, e), -60);
            st2.sol(0, 0, 70);
            st2.key.position.copy(st2.key.target.position).addScaledVector(D2, 100);
            for (const s of [sh, sc]) s.position.copy(cam2.position).addScaledVector(D2, 900);
            st2.draw(S2, cam2, { cor: "#fff6e0", a: 1 - range(u, 0, 0.5) });
            // véu escuro atrás dos títulos (céu claro) e o fim escurecendo para a pergunta
            const c2 = st2.ctx, g = c2.createLinearGradient(0, 560, 0, 1080);
            g.addColorStop(0, "rgba(6,10,20,0)"); g.addColorStop(0.45, "rgba(6,10,20,0.55)"); g.addColorStop(1, "rgba(6,10,20,0)");
            c2.fillStyle = g; c2.fillRect(0, 560, 1080, 520);
            const fim = 0.45 * range(u, 2.0, 4.4); if (fim > 0) { c2.fillStyle = `rgba(4,6,14,${fim})`; c2.fillRect(0, 0, 1080, 1920); }
          }
        }
