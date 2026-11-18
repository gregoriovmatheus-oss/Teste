/*META {"imports": ["solkit"], "rotulos": [{"de": 0.8, "ate": 3.1, "top": 660, "texto": "Os postes<br><span class=\"y\">acendem</span>"}, {"de": 3.3, "ate": 5.13, "top": 660, "texto": "Essa noite<br><span class=\"y\">não termina</span>", "sai": false}], "D0": 5.13} */
        const SK = SOLKIT;
        await SK.fontes();
        const st = T.createToyStage(canvas, { fov: 50, ceu: ["#02040b", "#0e1932"], nevoa: [50, 260], corNevoa: "#0b1326", nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environmentIntensity = 0.1; st.hemi.intensity = 0.14; st.hemi.color.setHex(0x6f86c0); st.rim.intensity = 0.15; st.rim.color.setHex(0x7f9bd8);
        st.key.intensity = 0.3; st.key.color.setHex(0x8fa8ff);
        const rua = T.rua({ len: 260, larg: 14, seed: 81, hMin: 14, hMax: 38 }); S.add(SK.aliviar(rua.group));
        const stars = SK.estrelas(S, { n: 2400, r: 900, seed: 82 });
        const rr = mulberry32(83);
        rua.buildings.forEach((b) => { b.userData.on = 1.4 + rr() * 2.6; b.userData.max = rr() < 0.25 ? 0 : 0.8 + rr() * 0.8; });
        const postes = [];
        for (let z = 56, i = 0; z > -120; z -= 15, i++) for (const s of [1, -1]) {
          const p = SK.poste(7.5, s); p.group.position.set(s * 7.7, 0.4, z + (s > 0 ? 0 : 7)); S.add(p.group);
          p.on = 0.85 + i * 0.05 + (s > 0 ? 0 : 0.03); postes.push(p);
        }
        const car = T.carro(0xd9583b); S.add(car);
        const farois = [0.65, -0.65].map((x) => { const g = SK.brilho(0xfff2c8, 3.2, "suave", 1); S.add(g); g.dx = x; return g; });
        function render(t) {
          // cada poste acende sozinho (fotocélula), com a piscadinha da lâmpada esquentando
          postes.forEach((p) => {
            const u = t - p.on;
            let k = clamp(u / 0.5);
            if (u > 0 && u < 0.3) k *= Math.sin(u * 60) > 0 ? 1 : 0.35;
            p.set(k);
          });
          rua.buildings.forEach((b) => { b.userData.win.emissiveIntensity = b.userData.max * range(t, b.userData.on, b.userData.on + 0.1); });
          const cz = -110 + t * 16;
          car.position.set(-3.4, 0.1, cz); car.rotation.y = 0;
          farois.forEach((g) => g.position.set(-3.4 + g.dx, 0.95, cz + 2.2));
          // travelling para a frente, câmera baixa subindo
          const e = ease.inOutSine(range(t, 0, 5.13));
          cam.position.set(lerp(2.5, -0.5, e), lerp(2.2, 4.4, e), lerp(44, 22, e));
          cam.lookAt(lerp(-1, 1, e), lerp(6, 7.5, e), -40);
          st.sol(0, cam.position.z - 30, 60);
          stars.set(1, t);
          st.draw();
        }
