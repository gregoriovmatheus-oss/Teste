/*META {"imports": ["lua"], "rotulos": [{"de": 2.6, "ate": 5.36, "sai": false, "texto": "<span class=\"k\">DURAÇÃO</span><br><span class=\"y\">7 dias</span><br>sem Lua"}], "D0": 5.36} */
        // f02 — espaço: a câmera sai rente à atmosfera e recua até revelar a Terra inteira, sozinha, com a órbita da Lua vazia.
        const st = T.createToyStage(canvas, { fov: 38, ceu: "#010207", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.7;
        S.environment = null;
        const est = LUA.ceuDoc(S, { seed: 21, n: 5000, via: 0.32, raio: 400 });
        const SUN = new THREE.Vector3(-260, 80, 150);
        LUA.sol(S, { pos: SUN, r: 8 });
        const E = await LUA.terraDoc(S, { r: 1 });
        E.setSol(SUN); E.grupo.rotation.z = 0.41;
        st.key.position.copy(SUN); st.key.target.position.set(0, 0, 0); st.key.castShadow = false; st.key.intensity = 3.6; st.key.color.set(0xfff1e0);
        st.hemi.intensity = 0.03; st.rim.intensity = 0;
        const orb = LUA.anelTracejado(5, { n: 110, tubo: 0.014, cor: 0x9fb8e0, opac: 0.55 }); S.add(orb);
        const GP = new THREE.Vector3(-1.2, 0, 4.85);
        const fantasma = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 12), new THREE.MeshBasicMaterial({ color: 0x9fb8e0, wireframe: true, transparent: true, opacity: 0.3, fog: false }));
        fantasma.position.copy(GP); S.add(fantasma);
        const d0 = new THREE.Vector3(-0.15, 0.25, 1).normalize(), d1 = new THREE.Vector3(0.5, 0.42, 0.76).normalize(), dir = new THREE.Vector3(), alvo = new THREE.Vector3();
        function render(t) {
          E.giro.rotation.y = 1.2 + t * 0.12;
          E.nuvens.rotation.y = t * 0.02;
          const e = ease.inOutCubic(range(t, 0, 4.6)), e2 = ease.inOutSine(range(t, 0, 5.36));
          const dist = Math.exp(lerp(Math.log(1.32), Math.log(10.5), e));
          dir.copy(d0).lerp(d1, e2).normalize();
          cam.position.copy(dir).multiplyScalar(dist);
          alvo.set(lerp(-1.6, 0.4, e), lerp(1.25, -1.3, e), lerp(-1.2, 0.6, e));
          cam.lookAt(alvo);
          orb.userData.mat.opacity = 0.55 * range(t, 0.8, 2.2);
          fantasma.material.opacity = 0.32 * range(t, 1.2, 2.4);
          fantasma.rotation.y = t * 0.3;
          st.draw();
          const [x, y, ok] = LUA.proj(GP, cam);
          if (ok) LUA.tag(st.ctx, "AQUI ESTAVA A LUA", x + 30, y - 110, { a: range(t, 1.6, 2.2) * LUA.borda(t, D), tam: 30, ax: x, ay: y });
        }
