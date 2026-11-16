/*META {"rotulos": [{"de": 3.2, "ate": 6.7, "texto": "LEÕES NA <span class=\"y\">AVENIDA</span>"}]} */
        const st = T.createToyStage(canvas, { fov: 50, nevoa: [50, 200] });
        const S = st.scene, cam = st.cam;
        const city = T.rua({ len: 200, seed: 21 });
        S.add(city.group);
        const leao = A.createAnimal("leao", { fase: 0.2 }); leao.group.scale.setScalar(1.3); S.add(leao.group); A.face(leao.group, 1, 0.15);
        const ele = A.createAnimal("elefante", { fase: 0.5 }); ele.group.scale.setScalar(1.2); S.add(ele.group); A.face(ele.group, 0, 1);
        const car = T.carro(T.PAL.amarelo); S.add(car);
        const car2 = T.carro(0x6fafa6); car2.position.set(-3.5, 0, -24); S.add(car2);
        const macs = [0, 1, 2].map((i) => { const m = A.createAnimal("macaco", { fase: i * 0.3 }); m.group.scale.setScalar(1.4); A.face(m.group, 1, 0); S.add(m.group); return m; });
        const aves = [0, 1, 2, 3, 4, 5, 6].map((i) => { const b = A.createAnimal("passaro", { fase: i * 0.13, cor: [0x4f9bd9, 0xd9583b, 0xf2b53a][i % 3] }); b.group.scale.setScalar(2); S.add(b.group); return b; });
        const pf = T.createBurst(S, { seed: 7, n: 18, cores: [0xd9cfc0, 0xffffff], raio: 2.2, tam: 0.3 });
        function render(t) {
          const lx = -12 + t * 3.2;
          leao.group.position.set(lx, 0, 2 + t * 0.4);
          leao.update(t, { passo: 2.0 });
          const ez = -22 + t * 1.7;
          ele.group.position.set(1.8, 0, ez);
          ele.update(t, { passo: 0.9, tromba: range(t, 3.6, 4.2) });
          // contato ~ t 4.0: carro é empurrado e tomba
          const k = ease.outCubic(range(t, 4.0, 4.9));
          car.position.set(2.6 + k * 2.2, k * 0.9 * (1 - range(t, 4.7, 5.1)) + Math.sin(k * Math.PI) * 0.8, -12.5 + k * 1.5);
          car.rotation.set(0, k * 0.5, -k * 1.55);
          pf.at(t, 4.05, 3, 0.5, -12);
          macs.forEach((m, i) => {
            const y = Math.max(0, (t - 0.4 * i) * 1.6);
            m.group.position.set(12.6, 1 + y, -6 - i * 7);
            m.update(t, { passo: 2.2, sobe: 1 });
          });
          aves.forEach((b, i) => {
            const t0 = 4.6 + i * 0.1, ta = Math.max(0, t - t0);
            b.group.position.set(-9.5 + i * 0.9 + ta * 1.5, 0.4 + ta * ta * 2.2, -2 - i * 1.3 - ta * 2);
            b.group.rotation.z = -0.5 * range(ta, 0, 0.4);
            b.update(t, { voa: ta > 0 ? 8 : 0 });
          });
          const e = ease.inOutSine(clamp(t / D));
          const sh = t > 4 ? T.shaker(3)(t, 0.25 * (1 - range(t, 4, 5))) : [0, 0, 0];
          cam.position.set(lerp(-7, -9, e) + sh[0], lerp(2.6, 9, e) + sh[1], lerp(13, 18, e));
          cam.lookAt(lerp(lx * 0.5, 2, e), lerp(2.6, 4.5, e), lerp(-3, -10, e));
          st.sol(0, -6, 35);
          st.draw();
        }
