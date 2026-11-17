/*META {"imports": ["solkit"], "rotulos": [{"de": 0.5, "ate": 1.55, "top": 660, "texto": "A <span class=\"y\">escuridão</span> chega"}, {"de": 1.6, "ate": 4.55, "top": 660, "texto": "O dia vira <span class=\"y\">noite</span>", "sai": false}], "D0": 4.55} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 50, nevoa: [160, 560], nuvens: 0, ceu: ["#5E8FCB", "#F2D3A8"] });
        const S = st.scene, cam = st.cam;
        const ceu = SK.ceuDin(st, ["#5E8FCB", "#F2D3A8"], ["#02040a", "#0a1226"]);
        const cid = T.cidade({ n: 5, seed: 41, verde: 0.18 }); S.add(SK.aliviar(cid.group));
        const stars = SK.estrelas(S, { n: 2200, r: 900, seed: 42 });
        const rr = mulberry32(43);
        cid.buildings.forEach((b) => { b.userData.on = rr() < 0.55 ? 2.6 + rr() * 1.6 : 99; });
        // borda da sombra: placa invisível (não desenha cor nem profundidade) que só projeta sombra
        const SD = new THREE.Vector3(-1.2, 0.9, 0.6).normalize();
        const sunHalo = SK.brilho(0xffe2b0, 300, "suave", 1), sunCore = SK.brilho(0xffffff, 70, "disco", 1);
        S.add(sunHalo, sunCore);
        function render(t) {
          // a frente da escuridão atravessa a cidade (na direção em que a luz viajava, do lado do Sol para fora)
          const xe = lerp(-150, 170, ease.inOutSine(range(t, 0.45, 2.3)));
          st.sol(0, 0, 130);
          const k = range(t, 1.5, 2.7);
          ceu.set(ease.inOutSine(k));
          S.environmentIntensity = lerp(1, 0.07, k);
          st.hemi.intensity = 0.55 * lerp(1, 0.1, k);
          st.rim.intensity = 1.1 * (1 - k);
          st.key.intensity = 3.2 * (1 - range(t, 2.5, 3.0));
          stars.set(range(t, 1.8, 3.4), t);
          const sa = 1 - range(t, 0.8, 1.3);
          for (const s of [sunHalo, sunCore]) { s.position.copy(cam.position).addScaledVector(SD, 900); s.material.opacity = sa; }
          cid.buildings.forEach((b) => { b.userData.win.emissiveIntensity = 1.3 * range(t, b.userData.on, b.userData.on + 0.15); });
          // grua aérea girando e descendo
          const e = ease.inOutSine(range(t, 0, 4.55));
          const a = lerp(0.35, 0.85, e), R = lerp(175, 135, e);
          cam.position.set(Math.sin(a) * R, lerp(125, 82, e), Math.cos(a) * R);
          cam.lookAt(0, 0, -10);
          st.draw();
          // frente da escuridão varrendo a cidade (borda alaranjada = último entardecer), depois o escuro geral assume
          const ta = 0.82 * (1 - range(t, 2.3, 2.9));
          if (ta > 0.01) SK.terminador(st.ctx, cam, xe, ta);
        }
