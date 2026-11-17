/*META {"imports": ["lua"], "rotulos": [{"de": 0.5, "ate": 1.85, "texto": "Nunca<br><span class=\"y\">parada</span>"}, {"de": 3.0, "ate": 5.14, "sai": false, "texto": "<span class=\"k\">AFASTAMENTO</span><br><span class=\"y\">3,8 cm</span><br>por ano"}], "D0": 5.14} */
        // f11 — diagrama: a Lua orbita a Terra e a órbita cresce em espiral (escala exagerada): órbita antiga sólida, nova tracejada, seta para fora. Grua descendo.
        const st = T.createToyStage(canvas, { fov: 40, ceu: "#02040a", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.5;
        S.environment = null;
        LUA.estrelas(S, { n: 2800, r: 400, seed: 111 });
        const SUN = new THREE.Vector3(-200, 60, 160);
        const E = LUA.terra(S, { r: 1 }); E.setSol(SUN); E.grupo.rotation.z = 0.41;
        st.key.position.copy(SUN); st.key.target.position.set(0, 0, 0); st.key.castShadow = false; st.key.intensity = 3.2; st.key.color.set(0xfff1e0);
        st.hemi.intensity = 0.2; st.hemi.color.set(0x8fa8d8); st.rim.intensity = 0;
        const R0 = 4, luaM = LUA.luaEsfera(0.32); S.add(luaM);
        const antiga = LUA.anel(R0, { tubo: 0.02, cor: 0xb8c8e8, opac: 0.55 }); S.add(antiga);
        const nova = LUA.anelTracejado(1, { n: 120, tubo: 0.02, cor: 0xff8a4c, opac: 0.9 }); S.add(nova);
        const rastro = LUA.pontos(S, 160, { tam: 1, atenua: 140 });
        for (let i = 0; i < 160; i++) rastro.C.set([1.0, 0.8, 0.5], i * 3);
        const seta = LUA.seta(0xff8a4c, 0.035); S.add(seta.g);
        const Rt = (t) => R0 + 1.1 * ease.inOutSine(range(t, 1.9, 4.6));
        const th = (t) => 0.9 + t * 0.55;
        const pm = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
        function render(t) {
          E.giro.rotation.y = t * 0.6;
          const R = Rt(t), ang = th(t);
          pm.set(Math.cos(ang) * R, 0, -Math.sin(ang) * R);
          luaM.position.copy(pm); luaM.rotation.y = ang - Math.PI / 2;
          const kn = range(t, 1.9, 2.3);
          nova.scale.set(R / 1, R / 1, 1); nova.visible = kn > 0; nova.userData.mat.opacity = 0.9 * kn;
          for (let i = 0; i < 160; i++) {
            const tt = t - i * 0.022, R2 = Rt(tt), a2 = th(tt);
            rastro.P.set([Math.cos(a2) * R2, 0, -Math.sin(a2) * R2], i * 3); rastro.A[i] = (1 - i / 160) * 0.8; rastro.S[i] = 0.5 * (1 - i / 200);
          }
          rastro.sync();
          const ks = ease.outCubic(range(t, 2.4, 3.0));
          a.copy(pm).normalize().multiplyScalar(R + 0.42); b.copy(pm).normalize().multiplyScalar(R + 0.42 + 1.1);
          seta.set(a, b, ks); seta.g.visible = ks > 0.02;
          const e = ease.inOutCubic(clamp(t / D));
          cam.position.set(lerp(0.5, 7.5, e), lerp(23, 8.5, e), lerp(9, 16, e));
          cam.lookAt(lerp(0.3, 0.8, e), lerp(-3, -3.2, e), lerp(4, 2, e));
          st.draw();
          const c = st.ctx, fa = LUA.borda(t, D);
          const [x, y] = LUA.proj(b, cam);
          LUA.tag(c, "+3,8 CM/ANO", x, y - 60, { a: fa * range(t, 3.1, 3.5), tam: 32, cor: "#ff8a4c" });
          LUA.tag(c, "ESCALA EXAGERADA", 420, 300, { a: fa * range(t, 2.2, 2.6) * 0.9, tam: 24, fundo: "rgba(8,10,20,0.4)" });
        }
