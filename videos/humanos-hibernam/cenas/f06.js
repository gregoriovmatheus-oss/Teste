/*META {"imports": ["hiber"], "rotulos": [{"de": 0.93, "ate": 1.98, "texto": "<span class=\"k\">MARMOTAS</span><br>Relógio das <span class=\"y\">células</span>"}, {"de": 2.03, "ate": 3.6, "texto": "<span class=\"y\">Quase para</span>"}, {"de": 3.7, "ate": 5.84, "texto": "Envelhecer<br><span class=\"y\">mais lento</span>"}], "D0": 5.84, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#04060c", "#0b1222"], nevoa: [6, 22], corNevoa: "#070b16", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xffd8b0); st.key.intensity = 1.8; st.hemi.intensity = 0.35; st.rim.color.set(0x7cc8ff);
        // toca da marmota (terra) embaixo
        const chao = new THREE.Mesh(new THREE.CircleGeometry(4, 40), T.M(0x3a2a1c, 0.95)); chao.rotation.x = -Math.PI / 2; S.add(chao);
        const ninho = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 8, 24), T.M(0x8a7040, 0.95)); ninho.rotation.x = -Math.PI / 2; ninho.position.y = 0.06; S.add(ninho);
        const m = HIBER.marmota(T.M); m.g.rotation.y = -0.9; S.add(m.g);
        // DNA em dupla hélice (instanciado) + relógio
        const NB = 34, esf = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshStandardMaterial({ color: 0x7cc8ff, emissive: 0x2a6aa0, emissiveIntensity: 0.8, roughness: 0.3 }), NB * 2);
        const deg = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), new THREE.MeshStandardMaterial({ color: 0xff8a4c, emissive: 0x803010, emissiveIntensity: 0.6, roughness: 0.4 }), NB);
        const dna = new THREE.Group(); dna.position.set(0, 3.1, -0.5); dna.rotation.z = Math.PI / 2 - 0.25; dna.scale.setScalar(0.5); dna.add(esf, deg); S.add(dna);
        const o3 = new THREE.Object3D();
        const rel = new THREE.Group(); rel.position.set(0, 3.1, -1.6); rel.scale.setScalar(0.45); S.add(rel);
        rel.add(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.08, 48), T.M(0x10161f, 0.4)).rotateX(Math.PI / 2));
        const aro = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.04, 8, 64), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, toneMapped: false })); rel.add(aro);
        for (let i = 0; i < 12; i++) { const tk = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.02), new THREE.MeshBasicMaterial({ color: 0xcfe6ff })); const a = i / 12 * 6.283; tk.position.set(Math.sin(a) * 1.32, Math.cos(a) * 1.32, 0.06); tk.rotation.z = -a; rel.add(tk); }
        const ponteiro = (l, w, c) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(w, l, 0.02), new THREE.MeshBasicMaterial({ color: c, toneMapped: false })); b.position.y = l / 2; g.add(b); g.position.z = 0.08; rel.add(g); return g; };
        const ph = ponteiro(0.8, 0.07, 0xffffff), pm = ponteiro(1.2, 0.04, 0xff8a4c);
        // ângulo do tempo: corre rápido e freia até quase parar em "quase para" (2,36 s)
        const vel = (t) => lerp(6, 0.15, ease.outCubic(range(t, 1.2, 2.6)));
        const ang = (t) => { let s = 0; const n = Math.ceil(t * 60); for (let i = 0; i < n; i++) s += vel(i / 60) / 60; return s; };
        function render(t) {
          m.respira(t, 1);
          const A = ang(t);
          pm.rotation.z = -A * 2.2; ph.rotation.z = -A * 2.2 / 12;
          for (let i = 0; i < NB; i++) {
            const y = (i - NB / 2) * 0.2, a = i * 0.55 + A * 0.8;
            for (let s = 0; s < 2; s++) { o3.position.set(Math.cos(a + s * Math.PI) * 0.5, y, Math.sin(a + s * Math.PI) * 0.5); o3.rotation.set(0, 0, 0); o3.scale.setScalar(1); o3.updateMatrix(); esf.setMatrixAt(i * 2 + s, o3.matrix); }
            o3.position.set(0, y, 0); o3.rotation.set(0, -a, Math.PI / 2); o3.scale.set(1, 1, 1); o3.updateMatrix(); deg.setMatrixAt(i, o3.matrix);
          }
          esf.instanceMatrix.needsUpdate = true; deg.instanceMatrix.needsUpdate = true;
          esf.material.emissiveIntensity = lerp(0.9, 0.35, range(t, 1.2, 2.6));
          // grua: da marmota dormindo sobe até o DNA e o relógio
          const e = ease.inOutCubic(range(t, 0.5, 2.3)), e0 = ease.inOutSine(range(t, 0, 5.84));
          cam.position.set(lerp(1.4, 0.4, e) + e0 * 0.4, lerp(0.9, 2.9, e), lerp(1.6, 5.4, e) - e0 * 0.3);
          cam.lookAt(0, lerp(0.05, 1.95, e), lerp(0, -1, e)); m.g.visible = ninho.visible = e < 0.75;
          st.bloom = 0.6; st.sol(0, 0, 6);
          st.draw();
        }
