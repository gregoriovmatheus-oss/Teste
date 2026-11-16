/*META {"rotulos": [{"de": 0.4, "ate": 3.0, "texto": "FINALMENTE <span class=\"y\">VOANDO</span>"}]} */
        const st = T.createToyStage(canvas, { fov: 55, nevoa: [60, 260] });
        const S = st.scene, cam = st.cam;
        const city = T.rua({ len: 320, larg: 14, seed: 121, hMin: 22, hMax: 46 }); S.add(city.group);
        const ag = A.createAnimal("aguia", { fase: 0.1 }); ag.group.scale.setScalar(2.2); A.face(ag.group, 0, -1); S.add(ag.group);
        const fl = T.bando(S, { n: 160, seed: 12 });
        function render(t) {
          const v = 18;
          const z = 120 - t * v - Math.max(0, t - 3) * 4;
          const x = Math.sin(t * 1.4) * 2.5, y = 12 + Math.sin(t * 0.9) * 2 + range(t, 3, 6) * 18;
          ag.group.position.set(x, y, z);
          ag.group.rotation.x = -Math.cos(t * 1.4) * 0.35;
          ag.update(t, { voa: t < 3 ? 2.2 : 3 });
          const w = ease.inOutCubic(range(t, 2.8, 5.6));
          fl.update(t, [0, 46 + t * 0.5, z - 40], [26, 9, 30], Math.PI / 2, 1.6);
          cam.position.set(x * 0.6 + lerp(1.5, 0, w), lerp(y + 1.2, y - 4, w), z + lerp(7, 34, w));
          cam.lookAt(x, lerp(y + 0.3, y + 22, w), z - lerp(10, 40, w));
          st.sol(0, z - 10, 50);
          st.draw();
        }
