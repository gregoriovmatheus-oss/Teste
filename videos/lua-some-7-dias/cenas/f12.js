/*META {"imports": ["lua"], "rotulos": [{"de": 0.9, "ate": 3.55, "texto": "Longe demais para<br><span class=\"y\">cobrir o Sol</span>"}, {"de": 5.4, "ate": 8.0, "sai": false, "texto": "Só que<br><span class=\"y\">bem devagar</span>"}], "D0": 8.0} */
        // f12 — A: eclipse total visto de um morro; a Lua encolhe (mais longe) e deixa um anel de Sol: o eclipse total acaba. B (3,7 s): no espaço, a Lua se afasta devagar.
        const st = T.createToyStage(canvas, { fov: 60, ceu: "#050810", nevoa: [80, 600], corNevoa: "#3a2a2a", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.85;
        S.environment = null;
        const CT = { uT: "#060c22", uH: "#d07a40", uB: "#1a0f0a" }, CA = { uT: "#24467e", uH: "#e8b27a", uB: "#2a2018" };
        const ceu = LUA.ceuDome(S, { topo: CT.uT, horiz: CT.uH, base: CT.uB, exp: 0.45 });
        const est = LUA.estrelas(S, { n: 900, r: 1200, so: "cima", seed: 121 });
        const hgt = (x, z) => 1.4 * Math.exp(-((x + 1) * (x + 1) + z * z) / 40) + 0.6 * Math.sin(x * 0.06) + 10 * smoothstep(-80, -250, z) * (0.5 + 0.5 * Math.sin(x * 0.02 + 2));
        LUA.terreno(S, hgt, { w: 700, d: 500, seg: 80, cor: 0x1f2618, cz: -150 });
        const gente = [[-0.5, 0.4, 0x8a3a2c], [0.4, -0.3, 0x3a5a7a]].map(([x, z, c], i) => { const h = A.createAnimal("humano", { cor: c, cor2: 0x2a2a30, mulher: i === 1, fase: i * 0.3 }); h.group.position.set(x, hgt(x, z), z); A.face(h.group, -0.1, -1); S.add(h.group); return h; });
        // Sol + Lua alinhados no alto
        const SD = new THREE.Vector3(0.12, 0.72, -1).normalize();
        const solG = LUA.sol(S, { pos: SD.clone().multiplyScalar(500), r: 30, coroa: 0.6 });
        const coroa = LUA.sprite(LUA.glowTex("210,225,255", 0.9), 0xffffff, 0.9); coroa.scale.setScalar(30 * 6); solG.grupo.add(coroa);
        const luaD = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: 0x050608, fog: false }));
        luaD.position.copy(SD).multiplyScalar(470); S.add(luaD);
        const RL = 30 * 470 / 500 * 1.03;
        st.key.color.set(0xffc49a); st.sol(0, 0, 14); st.key.position.copy(SD).multiplyScalar(40);
        st.hemi.color.set(0x6a6a90); st.hemi.groundColor.set(0x1a1410);
        // B: espaço
        const SB = new THREE.Scene(), camB = new THREE.PerspectiveCamera(38, 1080 / 1920, 0.05, 2000);
        LUA.estrelas(SB, { n: 2800, r: 400, seed: 122 });
        const SUN = new THREE.Vector3(-250, 50, 120);
        const E = LUA.terra(SB, { r: 1 }); E.setSol(SUN); E.grupo.rotation.z = 0.41;
        const dlB = new THREE.DirectionalLight(0xfff1e0, 3.2); dlB.position.copy(SUN); SB.add(dlB);
        SB.add(new THREE.HemisphereLight(0x8fa8d8, 0x111111, 0.12));
        const luaB = LUA.luaEsfera(0.3); SB.add(luaB);
        const trilha = LUA.anelTracejado(1, { n: 60, tubo: 0.02, cor: 0x7cc8ff, opac: 0.5, cheio: 0.4 }); SB.add(trilha);
        st.extraWarm = [{ renderer: st.renderer, scene: SB, camera: camB }];
        const TB = 3.7, dirL = new THREE.Vector3(0.79, 0, -0.61).normalize(), pl = new THREE.Vector3();
        function render(t) {
          if (t < TB) {
            const s = lerp(1, 0.86, ease.inOutSine(range(t, 1.2, 3.2)));
            luaD.scale.setScalar(RL * s);
            const anelV = range(s, 0.995, 0.95);
            coroa.material.opacity = 0.9 * (1 - anelV * 0.85);
            solG.halo.material.opacity = 0.25 + 0.7 * anelV; solG.brilho.material.opacity = 0.2 + 0.8 * anelV;
            ceu.mix(CT, CA, anelV * 0.75);
            est.mat.uniforms.uA.value = 1.3 * (1 - anelV);
            st.key.intensity = lerp(0.35, 1.8, anelV); st.hemi.intensity = lerp(0.25, 0.6, anelV); st.rim.intensity = 0.3;
            gente.forEach((h, i) => h.update(t, { cabeca: 0.6 + Math.sin(t + i) * 0.03 }));
            const e = ease.inOutSine(range(t, 0, TB));
            cam.position.set(lerp(1.5, 0.6, e), hgt(1, 7) + lerp(1.0, 1.4, e), lerp(7.5, 6.2, e));
            cam.lookAt(SD.clone().multiplyScalar(30).add(new THREE.Vector3(lerp(-0.5, 0.5, e), lerp(-3.4, -2.6, e), 0)));
            st.draw(S, cam, { cor: "#000", a: range(t, TB - 0.2, TB) });
            const fa = LUA.borda(t, D);
            LUA.tag(st.ctx, "HOJE: ECLIPSE TOTAL", 440, 1360, { a: fa * range(t, 0.2, 0.5) * (1 - range(t, 2.2, 2.5)), tam: 30 });
            LUA.tag(st.ctx, "FUTURO: SÓ UM ANEL", 440, 1360, { a: range(t, 2.6, 2.9) * (1 - range(t, 3.45, 3.7)), tam: 30, cor: "#ff8a4c" });
          } else {
            const u = t - TB, e = ease.inOutSine(range(u, 0, D - TB));
            E.giro.rotation.y = u * 0.3;
            const d = 3.2 + 0.7 * e;
            pl.copy(dirL).multiplyScalar(d); luaB.position.copy(pl); luaB.lookAt(0, 0, 0);
            trilha.scale.set(d, d, 1); trilha.rotation.z = u * 0.05;
            camB.position.set(lerp(-1.5, -2.2, e), lerp(1.2, 2.0, e), lerp(6.5, 10.5, e));
            camB.lookAt(lerp(1.0, 1.4, e), lerp(-1.2, -1.9, e), -0.6);
            st.draw(SB, camB, { cor: "#000", a: 1 - range(u, 0, 0.3) });
            const [x, y] = LUA.proj(pl, camB);
            LUA.tag(st.ctx, "3,8 CM POR ANO", x - 20, y - 80, { a: range(u, 0.6, 1.0) * LUA.borda(t, D), tam: 28, cor: "#ff8a4c" });
          }
        }
