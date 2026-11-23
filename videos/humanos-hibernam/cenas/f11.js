/*META {"imports": ["hiber"], "rotulos": [{"de": 0.1, "ate": 1.65, "texto": "Quem fica <span class=\"y\">acordado</span>"}, {"de": 1.72, "ate": 3.57, "texto": "<span class=\"y\">Vigia</span> de um<br>mundo adormecido"}], "D0": 3.57, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#03060e", "#1a2438"], nevoa: [12, 60], corNevoa: "#111a2a", nuvens: 0, exposicao: 0.8 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0x9fb8e0); st.key.intensity = 0.9; st.hemi.intensity = 0.3; st.rim.intensity = 0.3;
        const r = T.rua({ len: 80, larg: 10, calc: 3, seed: 14, arvores: false, hMin: 9, hMax: 24, chao: 0xdfe8f2 }); S.add(r.group);
        r.buildings.forEach((b, i) => (b.userData.win.emissiveIntensity = i === 5 ? 0.8 : 0));
        const neveRua = new THREE.Mesh(new THREE.PlaneGeometry(16, 80), T.M(0xb8c4d4, 0.85)); neveRua.rotation.x = -Math.PI / 2; neveRua.position.y = 0.42; S.add(neveRua);
        for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.5, 8), T.M(0x2a2c30, 0.4)); p.position.set(5.5, 2.6, 10 - i * 12); S.add(p); }
        const h = A.createAnimal("humano", { cor: 0x6a3a2a, cor2: 0x2a2e38 }); S.add(h.group);
        const lan = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd28a, toneMapped: false })); S.add(lan);
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: HIBER.glowTex(), color: 0xffb060, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })); halo.scale.set(0.9, 0.9, 1); S.add(halo);
        const luz = new THREE.PointLight(0xffb066, 2.5, 7, 1.6); S.add(luz);
        const nv = HIBER.neve(S, { n: 1500, x: [-8, 8], y: [0, 9], z: [-30, 10], seed: 71, tam: 0.07, vel: 0.6 });
        function render(t) {
          nv.update(t, 0.15);
          // o vigia anda rua abaixo, sozinho, com a lanterna
          const z = lerp(0, -4.2, t / 3.57);
          h.group.position.set(1.2, 0.42, z); h.group.rotation.y = Math.PI / 2; h.update(t, { passo: 1.1 });
          lan.position.set(1.5, 1.35 + Math.sin(t * 7) * 0.03, z - 0.15); halo.position.copy(lan.position); luz.position.copy(lan.position);
          const e = ease.inOutSine(range(t, 0, 3.57));
          cam.position.set(lerp(-0.6, 0.2, e), lerp(5.2, 4.4, e), z + lerp(9.5, 8.0, e));
          cam.lookAt(0.8, -1.7, z - 3);
          st.bloom = 0.7; st.sol(0, z, 12);
          st.draw();
        }
