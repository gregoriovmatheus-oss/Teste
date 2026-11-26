/*META {"imports": ["quatro"], "rotulos": [{"de": 3.1, "ate": 5.67, "texto": "<span class=\"k\">ATENÇÃO</span><br><span class=\"y\">um foco</span> só"}], "D0": 5.67, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const Q4 = QUATRO;
        await Q4.prepara();
        const st = Q4.palcoDoc(T, canvas, { fov: 34, ceu: "#030409" });
        const S = st.scene, cam = st.cam; st.key.intensity = 0.25; st.hemi.intensity = 0.08; st.rim.intensity = 0.5;
        // 4 tarefas em pedestais num semicírculo: panela, notebook, celular, baqueta
        const N = ["COZINHAR", "DIGITAR", "CELULAR", "TOCAR"], P = N.map((n, i) => { const a = -0.75 + i * 0.5, x = Math.sin(a) * 1.5, z = -Math.cos(a) * 1.5 + 0.4;
          const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g);
          const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.7, 20), T.M(0x2a2f3a, 0.5)); ped.position.y = 0.35; ped.castShadow = ped.receiveShadow = true; g.add(ped);
          const o = new THREE.Group(); o.position.y = 0.78; g.add(o); const M = (c, r = 0.4, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
          if (i === 0) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.1, 16), M(0x2a2a2e, 0.3, 0.6)); o.add(p); const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.03), M(0x2a2a2e)); c.position.set(0.26, 0.03, 0); o.add(c); }
          if (i === 1) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.24), M(0x9aa0a8, 0.3, 0.5)); o.add(b); const tl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.015), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x6a9cff, emissiveIntensity: 0.6 })); tl.position.set(0, 0.1, -0.12); tl.rotation.x = -0.25; o.add(tl); }
          if (i === 2) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.015), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x9fd0ff, emissiveIntensity: 0.5 })); c.position.y = 0.1; c.rotation.x = -0.3; o.add(c); }
          if (i === 3) { [-1, 1].forEach((s) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.36, 6), M(0xe0c89a, 0.6)); b.rotation.set(Math.PI / 2, 0, s * 0.3); b.position.set(s * 0.04, 0.02, 0); o.add(b); }); }
          const luz = new THREE.SpotLight(0xffe8c8, 0, 6, 0.32, 0.5, 1); luz.position.set(x * 0.9, 3.4, z + 0.3); luz.target = o; S.add(luz);
          const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0d8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
          cone.position.set(x * 0.95, 2.05, z + 0.15); S.add(cone);
          return { g, o, luz, cone, n };
        });
        const al = new THREE.Vector3();
        function render(t) {
          // 0,6–2,4 s: as 4 piscam juntas (cansa); 3,0 s+: só uma fica acesa e o foco pula de uma para outra
          const todas = range(t, 0.55, 0.9) * (1 - range(t, 2.5, 3.0)), canso = 0.75 + 0.25 * Math.sin(t * 23) * range(t, 1.6, 2.4);
          const foco = t < 3.0 ? -1 : Math.floor((t - 3.0) / 0.75) % 4;
          P.forEach((p, i) => { const a = Math.max(todas * canso * (t > 2.2 ? 0.55 : 1), i === foco ? range((t - 3.0) % 0.75, 0, 0.12) : 0);
            p.luz.intensity = 26 * a; p.cone.material.opacity = 0.07 * a; p.o.rotation.y = t * 0.4 + i; p.o.position.y = 0.78 + 0.03 * Math.sin(t * 2 + i); });
          const e = ease.inOutSine(range(t, 0, 5.67));
          cam.position.set(lerp(-0.9, 0.9, e), lerp(3.4, 3.0, e), lerp(6.4, 5.6, e)); al.set(0, -0.55, -0.4); cam.lookAt(al);
          st.bloom = 0.8; st.draw();
          const c = st.ctx;
          P.forEach((p, i) => Q4.tag(c, p.n, p.o.getWorldPosition(al), cam, (t < 2.6 ? range(t, 0.7 + i * 0.1, 0.95 + i * 0.1) * (1 - range(t, 2.4, 2.6)) : (i === foco ? 1 : 0)), { dy: i % 2 ? -150 : -90, cor: i === foco ? Q4.LARANJA : Q4.AZUL, tam: 22 }));
        }
