/*META {"imports": ["lowpoly", "hiber"], "rotulos": [{"de": 0.46, "ate": 3.6, "texto": "O inverno não é<br>para ser <span class=\"y\">vencido</span>"}, {"de": 3.69, "ate": 6.3, "texto": "É para ser <span class=\"y\">dormido</span>", "sai": false}], "D0": 6.3, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const LP = LOWPOLY;
        const st = LP.palco(canvas, { foco: 0.9, faixa: 0.4, desfoque: 22 });
        const { S, cam } = st;
        S.background = new THREE.Color(0x3a4656); st.exposicao = 1.25;
        st.hemi.intensity = 0.75; st.fria.color.set(0xfff0d0); st.fria.intensity = 2.4; st.fria.position.set(-1.2, 3.2, -4); st.quente.intensity = 1.3; st.quente.position.set(1.5, 1.4, 3); st.rim.color.set(0xffd8a0);
        const q = HIBER.quarto(S, { mk: LP.mat, estacao: "primavera" });
        q.cal.set(3); q.cob.visible = false; q.dobra.visible = false;
        // sentado na beira da cama, de frente, a janela de primavera atrás
        const p = LP.pessoa({ seed: 7, pele: 0xc08a6a, cabelo: 0x2a1a10, jaqueta: 0x3c4c62, camisa: 0x8a9ab0, barba: 0x3a2618, iris: 0x4a3020 });
        p.root.position.set(-0.85, -0.29, -0.42); S.add(p.root);
        p.pernas.forEach((l) => { l.q.rotation.x = -Math.PI / 2 + 0.1; l.j.rotation.x = Math.PI / 2 - 0.12; });
        p.bracos.forEach((b) => { b.om.rotation.x = -0.55; b.cot.rotation.x = -0.75; });
        const rosto = new THREE.Vector3(-0.85, 1.4, -0.32), alvo = new THREE.Vector3();
        const R = mulberry32(13), NP = 60, P = new Float32Array(NP * 3), J = Array.from({ length: NP }, () => [-1.0 + (R() - 0.5) * 1.4, R(), -1.4 - R() * 0.3, R() * 6.28]);
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(P, 3));
        S.add(new THREE.Points(pg, new THREE.PointsMaterial({ map: HIBER.glowTex(), color: 0xfff0c8, size: 0.03, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })));
        function render(t) {
          for (let i = 0; i < NP; i++) { const [x, o, z, ph] = J[i]; P[i * 3] = x + Math.sin(t * 0.5 + ph) * 0.1; P[i * 3 + 1] = 0.7 + ((o + t * 0.05) % 1) * 1.6; P[i * 3 + 2] = z + Math.cos(t * 0.4 + ph) * 0.1; }
          pg.attributes.position.needsUpdate = true;
          const olha = ease.inOutSine(range(t, 1.2, 2.2)) * (1 - ease.inOutSine(range(t, 3.6, 4.4)));
          p.emocao({ br: 0.04, by: 0.32, bo: [1.12, 0.32], ab: lerp(0.5, 0.62, range(t, 3.6, 4.4)), ol: [lerp(0.05, -0.45, olha), lerp(0.02, 0.15, olha)] });
          p.cab.rotation.set(lerp(0.05, -0.05, olha), lerp(0.05, -0.55, olha), 0);
          // começa no rosto e recua até o quarto inteiro: a mesma janela do começo, agora primavera
          const e = ease.inOutCubic(range(t, 0.2, 6.3));
          cam.position.set(lerp(-0.74, -0.2, e), lerp(1.45, 1.5, e), lerp(1.3, 3.1, e));
          alvo.set(lerp(-0.84, -0.75, e), lerp(0.98, 0.9, e), lerp(-0.32, -1.0, e)); cam.lookAt(alvo);
          st.U.foco.value = cam.position.distanceTo(rosto); st.U.faixa.value = lerp(0.35, 1.6, e);
          st.draw();
        }
