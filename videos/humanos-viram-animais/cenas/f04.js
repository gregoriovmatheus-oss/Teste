/*META {"rotulos": [{"de": 2.7, "ate": 5.8, "texto": "<span class=\"y\">TONELADAS</span>"}]} */
        const st = T.createToyStage(canvas, { fov: 50, nevoa: [50, 220] });
        const S = st.scene, cam = st.cam;
        /* beco estreito em x = -200 */
        const beco = T.rua({ len: 90, larg: 5, calc: 1.2, seed: 41, arvores: false, hMin: 10, hMax: 22 });
        beco.group.position.x = -200; S.add(beco.group);
        const fio = T.mesh(new THREE.CylinderGeometry(0.06, 0.06, 9, 8), 0x2a2a2a, S); fio.rotation.z = Math.PI / 2; fio.position.set(-200, 5.2, -2);
        const placa = T.mesh(T.roundBox(3.2, 0.9, 0.2, 0.1), T.PAL.tijolo, S); placa.position.set(-198.4, 6.4, 4);
        const gir = A.createAnimal("girafa", { fase: 0.1 }); A.face(gir.group, 0, 1); S.add(gir.group);
        /* avenida engarrafada */
        const city = T.rua({ len: 200, larg: 18, seed: 42 }); S.add(city.group);
        const r = mulberry32(43), cores = [T.PAL.tijolo, T.PAL.amarelo, 0x9fc9d9, 0xf6f1e8, 0x6fafa6, 0xe9a3a0];
        const cars = [];
        for (let i = 0; i < 16; i++) { const c = T.carro(cores[i % cores.length]); const lane = [-6, -2.2, 2.2, 6][i % 4]; c.position.set(lane, 0, -60 + Math.floor(i / 4) * 8 + r() * 2); if (lane > 0) c.rotation.y = Math.PI; S.add(c); cars.push(c); }
        const rino = A.createAnimal("rinoceronte", { fase: 0.3 }); rino.group.scale.setScalar(1.3); A.face(rino.group, 0, 1); S.add(rino.group);
        const ele = A.createAnimal("elefante", { fase: 0.6 }); ele.group.scale.setScalar(2.1); A.face(ele.group, 0, 1); S.add(ele.group);
        function render(t) {
          const b = t < 2.5;
          if (b) {
            const gz = -14 + t * 2.4;
            gir.group.position.set(-200, 0, gz);
            const dz = gz + 1.2 - (-2);
            const duck = Math.max(0, 1 - Math.abs(dz) / 2.6);
            gir.update(t, { passo: 1.1, pescoco: ease.inOutSine(duck) * 0.9 });
            cam.position.set(-201.2, lerp(1.6, 2.6, t / 2.5), gz + 9 - t * 0.6);
            cam.lookAt(-200, 4.2, gz);
            st.sol(-200, gz, 20);
          } else {
            const u = t - 2.5;
            rino.group.position.set(-0.1 + Math.sin(u * 1.5) * 0.4, 0, -38 + u * 2.6);
            rino.update(t, { passo: 1.4 });
            ele.group.position.set(-3, 0, -52 + u * 1.6);
            ele.update(t, { passo: 0.7, tromba: 0.3 + Math.sin(u) * 0.3 });
            cars.forEach((c, i) => { c.position.y = 0; c.rotation.z = 0; });
            const e = ease.inOutSine(clamp(u / 3.5));
            cam.position.set(lerp(4, 12, e), lerp(3, 16, e), lerp(-22, -6, e));
            cam.lookAt(-1, lerp(2.5, 3, e), lerp(-36, -44, e));
            st.sol(0, -42, 35);
          }
          st.draw();
        }
