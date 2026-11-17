/*META {"imports": ["solkit"], "rotulos": [{"de": 0.3, "ate": 1.65, "top": 660, "texto": "A <span class=\"y\">escuridão</span> chega"}, {"de": 1.7, "ate": 4.55, "top": 660, "texto": "O dia vira <span class=\"y\">noite</span>", "sai": false}], "D0": 4.55} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 50, nevoa: [160, 560], nuvens: 0, ceu: ["#5E8FCB", "#F2D3A8"] });
        const S = st.scene, cam = st.cam;
        const ceu = SK.ceuDin(st, ["#5E8FCB", "#F2D3A8"], ["#02040a", "#0a1226"]);
        const cid = T.cidade({ n: 5, seed: 41, verde: 0.18 }); S.add(SK.aliviar(cid.group));
        const stars = SK.estrelas(S, { n: 2200, r: 900, seed: 42 });
        const rr = mulberry32(43);
        cid.buildings.forEach((b) => { b.userData.on = rr() < 0.55 ? 1.6 + rr() * 2.2 : 99; });
        const tremor = T.shaker(44);
        const SD = new THREE.Vector3(-1.2, 0.9, 0.6).normalize();
        const sunHalo = SK.brilho(0xffe2b0, 300, "suave", 1), sunCore = SK.brilho(0xffffff, 70, "disco", 1);
        S.add(sunHalo, sunCore);
        function render(t) {
          // a última luz chega a todo o lado iluminado quase ao mesmo tempo: o Sol, o céu e as sombras somem juntos em ~0,5 s
          st.sol(0, 0, 130);
          const k = ease.inOutSine(range(t, 0.55, 1.05));
          ceu.set(k);
          S.environmentIntensity = lerp(1, 0.07, k);
          st.hemi.intensity = 0.55 * lerp(1, 0.1, k);
          st.rim.intensity = 1.1 * (1 - k);
          st.key.intensity = 3.2 * (1 - k);
          stars.set(range(t, 1.0, 2.6), t);
          for (const s of [sunHalo, sunCore]) { s.position.copy(cam.position).addScaledVector(SD, 900); s.material.opacity = 1 - k; }
          cid.buildings.forEach((b) => { b.userData.win.emissiveIntensity = 1.3 * range(t, b.userData.on, b.userData.on + 0.15); });
          // grua aérea girando e descendo, com um leve tremor no instante do apagão
          const e = ease.inOutSine(range(t, 0, 4.55));
          const a = lerp(0.35, 0.85, e), R = lerp(175, 135, e);
          const [tx, ty, tz] = tremor(t, 1.6 * Math.exp(-Math.pow((t - 0.85) / 0.3, 2)));
          cam.position.set(Math.sin(a) * R + tx, lerp(125, 82, e) + ty, Math.cos(a) * R + tz);
          cam.lookAt(0, 0, -10);
          st.draw();
        }
