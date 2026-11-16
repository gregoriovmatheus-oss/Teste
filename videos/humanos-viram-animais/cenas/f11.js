/*META {"rotulos": [{"de": 0.5, "ate": 3.2, "texto": "TECNOLOGIA <span class=\"y\">SEM DONO</span>"}], "D0": 6.28} */
        const st = T.createToyStage(canvas, { fov: 42, nevoa: [14, 60] });
        const S = st.scene, cam = st.cam;
        const chao = T.mesh(new THREE.PlaneGeometry(200, 200), 0xb9b09a, S, 0.95); chao.rotation.x = -Math.PI / 2; chao.castShadow = false;
        const rr = mulberry32(111);
        for (let i = 0; i < 40; i++) { const g = T.mesh(new THREE.ConeGeometry(0.15, 0.5, 5), T.PAL.verde, S); g.position.set((rr() - 0.5) * 14, 0.2, -rr() * 14); }
        // escritório abandonado ao fundo
        for (let i = 0; i < 3; i++) {
          const mesa = T.mesh(T.roundBox(3, 0.15, 1.4, 0.06), 0xc9a27a, S); mesa.position.set(-4 + i * 3.6, 1.4, -6 - (i % 2) * 2);
          for (const sx of [-1.3, 1.3]) { const p = T.mesh(T.roundBox(0.15, 1.4, 1.2, 0.05), 0xa8865f, S); p.position.set(-4 + i * 3.6 + sx, 0, -6 - (i % 2) * 2); }
          const mon = T.mesh(T.roundBox(1.4, 0.9, 0.15, 0.08), 0x2d2f36, S); mon.position.set(-4 + i * 3.6, 1.65, -6.3 - (i % 2) * 2); mon.rotation.z = i === 1 ? 0.5 : 0;
          const tela = T.mesh(T.roundBox(1.2, 0.7, 0.05, 0.03), 0x1b2a33, S, 0.3); tela.position.set(-4 + i * 3.6, 1.75, -6.2 - (i % 2) * 2); tela.rotation.z = mon.rotation.z;
        }
        const car = T.carro(T.PAL.tijolo); car.position.set(5, 0, -11); car.rotation.set(0, 0.6, 0.08); S.add(car);
        for (let i = 0; i < 6; i++) { const v = T.mesh(T.SPH, T.PAL.verdeEsc, car, 0.9); v.scale.setScalar(0.5 + rr() * 0.4); v.position.set((rr() - 0.5) * 2, 1.6 + rr() * 0.4, (rr() - 0.5) * 3); }
        const mac = A.createAnimal("macaco", { fase: 0.2 }); mac.group.scale.setScalar(1.3); A.face(mac.group, 0.3, 1); S.add(mac.group);
        const telaM = new THREE.MeshStandardMaterial({ color: 0x0f1e2a, emissive: 0x59c3e8, emissiveIntensity: 0, roughness: 0.3 });
        const cel = new THREE.Group(); T.mesh(T.roundBox(0.5, 0.06, 0.9, 0.06), 0x24262d, cel, 0.4); const sc = T.mesh(T.roundBox(0.42, 0.02, 0.8, 0.02), telaM, cel); sc.position.y = 0.06;
        S.add(cel);
        function render(t) {
          mac.group.position.set(0, 0, 0);
          const pega = range(t, 1.0, 1.6);
          mac.update(t, { passo: 0, cabeca: -0.45 - Math.sin(t * 1.3) * 0.1 });
          mac.legs.forEach((l) => { l.rotation.z = 1.35; });
          mac.body.position.y = -0.42;
          // braço direito toca a tela
          mac.arms[0].rotation.z = 0.9 + Math.max(0, Math.sin(t * 5)) * 0.35 * range(t, 1.6, 2);
          mac.arms[1].rotation.z = lerp(0.3, 0.75, pega);
          if (t > 4.2) { mac.arms[1].rotation.z = Math.PI - 0.3; mac.arms[1].rotation.x = 0.5; }
          cel.position.set(0.55, 0.35 + 0.1 * pega, 0.65);
          cel.rotation.set(-0.5, 0.3, 0);
          const tap = Math.sin(t * 5) > 0.6 && t > 1.6;
          telaM.emissiveIntensity = t > 1.6 ? (tap ? 1.6 : 0.8) : 0;
          telaM.emissive.setHex(Math.floor(t * 2.5) % 3 === 0 ? 0x59c3e8 : Math.floor(t * 2.5) % 3 === 1 ? 0xf2b53a : 0xe9a3a0);
          const e = ease.inOutSine(clamp(t / D));
          cam.position.set(lerp(3.2, 1.6, e), lerp(2.4, 1.6, e), lerp(5.5, 3.0, e));
          cam.lookAt(0.2, lerp(1.0, 0.8, e), lerp(-1.5, 0, e));
          st.sol(0, -2, 12);
          st.draw();
        }
