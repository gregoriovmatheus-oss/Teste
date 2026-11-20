/*META {"imports": ["pausa", "terra"], "rotulos": [{"de": 0.3, "ate": 2.6, "texto": "<span class=\"k\">RELATIVIDADE</span><br>O tempo não passa <span class=\"y\">igual</span>"}], "D0": 9.22} */
        // f11 — o tempo já não é igual para todos: satélite GPS a 20.200 km, relógio que adianta 38 µs por dia
        //       (efeito gravitacional +45 µs, velocidade −7 µs) e precisa ser corrigido. Câmera: do satélite até a órbita inteira.
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#000000", "#02030a"], nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.15; st.key.castShadow = false; st.key.color.set(0xffffff); st.key.intensity = 2.6; st.rim.intensity = 0.4;
        S.add(TERRA.createCeu({ seed: 9, n: 5000, via: 0.5 }));
        const E = await TERRA.createTerra({ raio: 1 }); S.add(E.group);
        E.sol.set(1, 0.25, 0.5); E.u.luzes.value = 1.0; E.u.atmo.value = 1.2; E.aim(-50, -15);
        const RO = 4.17; // raio da órbita GPS (26.571 km / 6.371 km)
        const orb = new THREE.Mesh(new THREE.TorusGeometry(RO, 0.006, 6, 200), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
        orb.rotation.x = Math.PI / 2 - 0.96; S.add(orb); // inclinação de 55°
        const SAT = PAUSA.satelite(); SAT.scale.setScalar(0.035); S.add(SAT);
        const outros = Array.from({ length: 5 }, (_, i) => { const g = PAUSA.glow(0xbfe3ff, 0.12, S); g.userData.a = (i + 1) * 1.05; return g; });
        const pos = (a, out) => out.set(Math.cos(a) * RO, 0, Math.sin(a) * RO).applyEuler(orb.rotation);
        const sp = new THREE.Vector3(), up0 = new THREE.Vector3();
        function render(t) {
          const a0 = 0.35 + t * 0.03;
          pos(a0, sp); SAT.position.copy(sp); SAT.lookAt(0, 0, 0); SAT.rotateX(Math.PI / 2);
          outros.forEach((g) => pos(a0 + g.userData.a, g.position));
          E.nuv.rotation.y = t * 0.004;
          const adianta = range(t, 4.1, 5.8), corr = range(t, 7.33, 8.3);
          SAT.luz.material.color.set(corr > 0 ? 0x7cc8ff : adianta > 0 ? 0xff8a4c : 0x7cc8ff); SAT.luz.material.opacity = 0.6 + 0.4 * Math.sin(t * 6) ** 2;
          st.bloom = 0.8;
          // câmera: colada no satélite com a Terra atrás, depois recua até ver a órbita inteira
          const e = ease.inOutCubic(range(t, 1.0, 8.6));
          const dir = sp.clone().normalize();
          const near = sp.clone().addScaledVector(dir, 0.28).add(new THREE.Vector3(0.12, 0.1, 0.05));
          const far = new THREE.Vector3(3.5, 7.5, 15.5);
          cam.position.lerpVectors(near, far, e);
          const look = new THREE.Vector3().lerpVectors(sp, new THREE.Vector3(0, 0, 0), ease.inOutSine(range(t, 0.5, 6)));
          cam.lookAt(look);
          st.draw(S, cam);
          const c = st.ctx;
          // dois relógios: na Terra x no satélite
          const v = PAUSA.vis(t, 0.6, 9.22), us = Math.round(38 * ease.inOutSine(adianta) * (1 - ease.inOutSine(corr)));
          PAUSA.painel(c, 290, 1360, "RELÓGIO NA TERRA", "12:00:00.000000", { a: v, cor: PAUSA.AZUL, tam: 40 });
          const gps = "12:00:00." + String(us).padStart(6, "0");
          PAUSA.painel(c, 790, 1360, "RELÓGIO DO GPS", gps, { a: v, cor: us > 0 ? PAUSA.LARANJA : PAUSA.AZUL, tam: 40, sub: corr > 0.5 ? "CORRIGIDO" : us > 0 ? "ADIANTADO" : "" });
          const [sx, sy, ok] = PAUSA.proj(sp, cam);
          if (ok) PAUSA.tag(c, sx, sy, sx < 540 ? sx + 220 : sx - 220, Math.max(520, sy - 260), [["SATÉLITE GPS · 20.200 km", corr > 0.5 ? PAUSA.AZUL : PAUSA.LARANJA], [corr > 0.5 ? "−38 µs/dia" : "+38 µs/dia", "#fff"]], { a: PAUSA.vis(t, 4.6, 9.22), cor: corr > 0.5 ? PAUSA.AZUL : PAUSA.LARANJA });
          PAUSA.texto(c, "FORA DE ESCALA", 1000, 1560, { a: v * 0.6, cor: "#9fb3c8", tam: 20, alinha: "right", esp: 0.3 });
        }
