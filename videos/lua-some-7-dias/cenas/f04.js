/*META {"imports": ["lua"], "rotulos": [{"de": 2.9, "ate": 5.34, "sai": false, "texto": "<span class=\"k\">FORÇA DAS MARÉS</span><br><span class=\"y\">2/3</span><br>vêm da Lua"}], "D0": 5.34} */
        // f04 — diagrama 3D: Lua em órbita puxando a Terra. Setas de gravidade (todas para a Lua, menores longe dela) e os dois bojos de maré crescendo. Câmera orbitando.
        const st = T.createToyStage(canvas, { fov: 38, ceu: "#02040a", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.5;
        S.environment = null;
        LUA.estrelas(S, { n: 2600, r: 400, seed: 41 });
        const E = LUA.terra(S, { r: 1 });
        const SUN = new THREE.Vector3(60, 40, 90);
        E.setSol(SUN); E.atmo.material.uniforms.uA.value = 0.6;
        st.key.position.copy(SUN); st.key.target.position.set(0, 0, 0); st.key.castShadow = false; st.key.intensity = 3.0; st.key.color.set(0xfff1e0);
        st.hemi.intensity = 0.35; st.hemi.color.set(0x8fa8d8); st.hemi.groundColor.set(0x222838); st.rim.intensity = 0.6; st.rim.position.set(-60, 10, -40);
        // oceano deformado (bojos), exagerado para ver
        const marG = new THREE.Group(); S.add(marG);
        const mar = new THREE.Mesh(new THREE.SphereGeometry(1.0, 56, 36), new THREE.MeshStandardMaterial({ color: 0x4fb0ff, transparent: true, opacity: 0.55, roughness: 0.15, depthWrite: false, envMapIntensity: 0, emissive: 0x1a5fa8, emissiveIntensity: 0.9 }));
        marG.add(mar);
        const R = 4.0;
        const luaM = LUA.luaEsfera(0.34); S.add(luaM);
        const orb = LUA.anelTracejado(R, { n: 120, tubo: 0.012, cor: 0xb8c8e8, opac: 0.45 }); S.add(orb);
        // setas de gravidade: lado próximo, centro, lado oposto (∝ 1/d²)
        const L = [1.6, 0.95, 0.64];
        const setas = [0, 1, 2].map(() => { const s = LUA.seta(0x7cc8ff, 0.04); S.add(s.g); return s; });
        const u = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), alvo = new THREE.Vector3(), tmp = new THREE.Vector3();
        function render(t) {
          const th = 0.25 + t * 0.12;
          u.set(Math.cos(th), 0, -Math.sin(th));
          luaM.position.copy(u).multiplyScalar(R); luaM.rotation.y = th - Math.PI / 2;
          E.giro.rotation.y = t * 0.35; E.nuvens.rotation.y = t * 0.03;
          marG.rotation.y = th;
          const bj = ease.inOutCubic(range(t, 1.6, 2.6));
          mar.scale.set(1.035 + 0.42 * bj, 1.03 - 0.06 * bj, 1.03 - 0.06 * bj);
          const sa = ease.outCubic(range(t, 0.45, 1.3));
          [1.06, 0, -1.06].forEach((off, i) => { a.copy(u).multiplyScalar(off).setY(off === 0 ? 0 : 0.0); b.copy(a).addScaledVector(u, L[i]); setas[i].set(a, b, sa); setas[i].g.visible = sa > 0.02; });
          // câmera em órbita, sistema na parte de cima do quadro
          const ph = 0.55 + t * 0.2;
          alvo.set(u.x * 1.55, -1.7, u.z * 1.55);
          cam.position.set(alvo.x + Math.sin(ph) * 13.5, 5.0, alvo.z + Math.cos(ph) * 13.5);
          cam.lookAt(alvo);
          st.draw();
          const c = st.ctx, fa = LUA.borda(t, D);
          let [x, y] = LUA.proj(luaM.position, cam);
          LUA.tag(c, "LUA", x, y - 95, { a: fa * range(t, 0.2, 0.6), tam: 32 });
          tmp.copy(u).multiplyScalar(1.0); [x, y] = LUA.proj(tmp.setY(0), cam);
          LUA.tag(c, "GRAVIDADE", x, y + 110, { a: fa * range(t, 0.7, 1.1) * (1 - range(t, 1.9, 2.2)), tam: 30, cor: "#7cc8ff" });
          const pb1 = tmp.copy(u).multiplyScalar(1.45); [x, y] = LUA.proj(pb1, cam);
          LUA.tag(c, "BOJO", x + 40, y - 110, { a: fa * range(t, 2.0, 2.4), tam: 30, ax: x, ay: y, cor: "#9fd0ff" });
          const pb2 = tmp.copy(u).multiplyScalar(-1.45); const [x2, y2] = LUA.proj(pb2, cam);
          LUA.tag(c, "BOJO", x2 - 40, y2 - 110, { a: fa * range(t, 2.2, 2.6), tam: 30, ax: x2, ay: y2, cor: "#9fd0ff" });
          LUA.tag(c, "BOJOS EXAGERADOS", 540, 1300, { a: fa * range(t, 2.4, 2.8) * 0.9, tam: 24, fundo: "rgba(8,10,20,0.35)" });
        }
