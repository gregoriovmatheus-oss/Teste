/*META {"imports": ["lua"], "rotulos": [{"de": 1.5, "ate": 3.3, "texto": "<span class=\"k\">7 DIAS DEPOIS</span><br>Nada<br><span class=\"y\">muda</span>"}, {"de": 4.4, "ate": 7.08, "sai": false, "texto": "<span class=\"k\">INCLINAÇÃO DO EIXO</span><br><span class=\"y\">23,4°</span>"}], "D0": 7.08} */
        // f09 — diagrama no espaço: a Terra gira 7 vezes (7 dias) em torno do eixo inclinado 23,4°; o eixo e o ângulo ficam parados. Câmera em órbita lenta.
        const st = T.createToyStage(canvas, { fov: 36, ceu: "#02040a", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.7;
        S.environment = null;
        LUA.ceuDoc(S, { seed: 91, n: 5000, via: 0.32, raio: 400 });
        const SUN = new THREE.Vector3(-320, 0, 60);
        LUA.sol(S, { pos: SUN, r: 9 });
        const E = await LUA.terraDoc(S, { r: 1 }); E.setSol(SUN);
        const TILT = 23.4 * Math.PI / 180;
        E.grupo.rotation.z = -TILT;   // polo norte inclinado para +x
        st.key.position.copy(SUN); st.key.target.position.set(0, 0, 0); st.key.castShadow = false; st.key.intensity = 3.4; st.key.color.set(0xfff1e0);
        st.hemi.intensity = 0.12; st.hemi.color.set(0x8fa8d8); st.rim.intensity = 0;
        // eixo de rotação (preso à Terra, não gira com ela)
        const eixoMat = new THREE.MeshBasicMaterial({ color: 0x7cc8ff, fog: false });
        const eixo = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 3.4, 10), eixoMat); E.grupo.add(eixo);
        const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 12), eixoMat); ponta.position.y = 1.78; E.grupo.add(ponta);
        // vertical de referência (perpendicular ao plano da órbita), tracejada
        const ref = new THREE.Group(); S.add(ref);
        for (let i = 0; i < 16; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 6), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.7, fog: false })); d.position.y = -1.65 + i * 0.22; ref.add(d); }
        // arco do ângulo
        const arco = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.016, 6, 40, TILT), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
        arco.rotation.z = Math.PI / 2 - TILT; S.add(arco);
        // plano da órbita
        const plano = LUA.anel(7, { tubo: 0.015, cor: 0x9fb8e0, opac: 0.35 }); S.add(plano);
        const disco = new THREE.Mesh(new THREE.RingGeometry(1.2, 7, 64), new THREE.MeshBasicMaterial({ color: 0x5f7fb8, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false, fog: false }));
        disco.rotation.x = -Math.PI / 2; S.add(disco);
        const pA = new THREE.Vector3(Math.sin(TILT) * 1.95, Math.cos(TILT) * 1.95, 0), pG = new THREE.Vector3(Math.cos(Math.PI / 2 - TILT / 2) * 1.62, Math.sin(Math.PI / 2 - TILT / 2) * 1.62, 0);
        function render(t) {
          const dias = 7 * ease.inOutSine(range(t, 1.3, 4.6));
          E.giro.rotation.y = 0.6 + dias * 6.283 + t * 0.1;
          E.nuvens.rotation.y = dias * 0.4;
          const ph = lerp(-0.55, 0.35, ease.inOutSine(clamp(t / D)));
          const R = lerp(11.5, 10.5, clamp(t / D));
          cam.position.set(Math.sin(ph) * R, lerp(1.3, 2.0, clamp(t / D)), Math.cos(ph) * R);
          cam.lookAt(0, -1.5, 0);
          st.draw();
          const c = st.ctx, fa = LUA.borda(t, D);
          let [x, y] = LUA.proj(pA, cam);
          LUA.tag(c, "EIXO", x + 70, y - 30, { a: fa * range(t, 0.3, 0.7), tam: 30, cor: "#7cc8ff" });
          [x, y] = LUA.proj(pG, cam);
          LUA.tag(c, "23,4°", x, y - 70, { a: fa * range(t, 4.5, 4.9), tam: 34, borda: "rgba(124,200,255,0.9)" });
          const n = Math.min(7, 1 + Math.floor(dias));
          LUA.tag(c, `DIA ${n}`, 430, 1330, { a: fa * range(t, 1.2, 1.5), tam: 40, borda: "rgba(255,255,255,0.6)" });
        }
