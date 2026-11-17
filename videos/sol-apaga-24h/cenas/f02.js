/*META {"imports": ["solkit"], "rotulos": [{"de": 0.9, "ate": 3.6, "top": 660, "texto": "Ninguém <span class=\"y\">percebe</span>"}, {"de": 3.6, "ate": 5.98, "top": 660, "texto": "<span class=\"k\">A LUZ AINDA ESTÁ A CAMINHO</span><br><span class=\"y\">8 min 20 s</span>", "sai": false}], "D0": 5.98} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 52, ceu: ["#3f86d6", "#d9e8ee"], nevoa: [90, 340], exposicao: 1.05, nuvens: 10 });
        const S = st.scene, cam = st.cam;
        const rua = T.rua({ len: 280, larg: 14, seed: 21, hMin: 12, hMax: 36 }); S.add(SK.aliviar(rua.group));
        const rr = mulberry32(22);
        const CAM = [0xd9583b, 0x3d6a8c, 0xe8b24a, 0x6c7880, 0xae6848, 0x7dbb5a];
        const pessoas = Array.from({ length: 12 }, (_, i) => {
          const h = A.createAnimal("humano", { cor: CAM[i % 6], cor2: [0x3f5677, 0x2d2f36, 0x6b5a48][i % 3], mulher: i % 3 === 0, fase: rr() });
          h.lado = i % 2 ? 1 : -1; h.dir = rr() < 0.5 ? 1 : -1; h.x = h.lado * (8.2 + rr() * 1.4); h.z0 = 30 - i * 7 - rr() * 3; h.v = 1.1 + rr() * 0.5;
          S.add(h.group); return h;
        });
        const carros = [0, 1, 2, 3].map((i) => { const c = T.carro([0xd9583b, 0xf6f1e8, 0x3d6a8c, 0xe8b24a][i]); c.lane = i % 2 ? 3.4 : -3.4; c.z0 = -60 + i * 35; c.v = i % 2 ? -9 : 11; S.add(c); return c; });
        // o Sol no céu (ainda brilhando para quem está aqui)
        const SDIR = new THREE.Vector3(-0.32, 0.5, -1).normalize();
        const sunHalo = SK.brilho(0xffe2b0, 260, "suave", 0.95), sunCore = SK.brilho(0xffffff, 60, "disco", 1), sunRaios = SK.brilho(0xfff0d0, 420, "raios", 0.35);
        S.add(sunHalo, sunRaios, sunCore);
        function render(t) {
          pessoas.forEach((h) => {
            const z = h.z0 + h.dir * h.v * t;
            h.group.position.set(h.x, 0.4, z); A.face(h.group, 0, h.dir); h.update(t, { passo: h.v * 1.3 });
          });
          carros.forEach((c) => { c.position.set(c.lane, 0.1, c.z0 + c.v * t); c.rotation.y = c.v > 0 ? 0 : Math.PI; });
          // travelling para a frente, grua subindo devagar
          const e = ease.inOutSine(range(t, 0, 5.98));
          cam.position.set(lerp(-2.5, 1.0, e), lerp(2.4, 5.0, e), lerp(34, 12, e));
          cam.lookAt(lerp(1.5, -1, e), lerp(7, 10, e), -40);
          st.sol(0, cam.position.z - 30, 70);
          st.key.position.copy(st.key.target.position).addScaledVector(SDIR, 100);
          for (const s of [sunHalo, sunCore, sunRaios]) s.position.copy(cam.position).addScaledVector(SDIR, 900);
          sunRaios.material.rotation = t * 0.04;
          st.draw();
          const c2 = st.ctx, g = c2.createLinearGradient(0, 560, 0, 1080);
          g.addColorStop(0, "rgba(6,10,20,0)"); g.addColorStop(0.45, "rgba(6,10,20,0.5)"); g.addColorStop(1, "rgba(6,10,20,0)");
          c2.fillStyle = g; c2.fillRect(0, 560, 1080, 520);
        }
