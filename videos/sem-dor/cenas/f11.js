/*META {"imports": ["dor"], "css": "    [data-composition-id=\"f11\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f11\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f11\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f11\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f11\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 5.2, "ate": 6.57, "sai": false, "texto": "<span class=\"k\">ANALGÉSICOS DO FUTURO</span><br>remédios <span class=\"y\">sem vício</span>"}], "D0": 6.57} */
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#03060b", "#0b1626"], nevoa: [4, 14], corNevoa: "#06101c", nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.5; st.key.intensity = 2.0; st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.2;
        // bicamada lipídica com o canal Nav1.7 no meio
        const NL = 26, SP = 0.17, cab = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.08, 1), new THREE.MeshStandardMaterial({ color: 0x9fc8e8, roughness: 0.3, emissive: 0x10283c, emissiveIntensity: 0.6 }), NL * NL * 2);
        cab.frustumCulled = false; S.add(cab); { const o = new THREE.Object3D(); let k = 0;
          for (const y of [0.28, -0.28]) for (let i = 0; i < NL; i++) for (let j = 0; j < NL; j++) { const x = (i - NL / 2) * SP + (j % 2) * SP / 2, z = (j - NL / 2) * SP; const d = Math.hypot(x, z);
            o.position.set(x, y, z); o.scale.setScalar(d < 0.38 ? 1e-4 : 1); o.updateMatrix(); cab.setMatrixAt(k++, o.matrix); } }
        const meio = new THREE.Mesh(new THREE.BoxGeometry(NL * SP, 0.4, NL * SP), new THREE.MeshStandardMaterial({ color: 0xd8b86a, roughness: 0.6, transparent: true, opacity: 0.35, depthWrite: false })); S.add(meio);
        const canal = new THREE.Group(); S.add(canal);
        for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, c = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.7, 6, 12), new THREE.MeshStandardMaterial({ color: 0xe0784a, roughness: 0.35, emissive: 0x5a1a08, emissiveIntensity: 0.6 })); c.position.set(Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24); canal.add(c); }
        // íons (o sinal de dor) atravessando o canal
        const NI = 160, R = mulberry32(111), ib = [], ip = new Float32Array(NI * 3);
        for (let i = 0; i < NI; i++) ib.push([R() * 6.283, 0.3 + R() * 1.2, R()]);
        const ig = new THREE.BufferGeometry(); ig.setAttribute("position", new THREE.BufferAttribute(ip, 3));
        const ions = new THREE.Points(ig, new THREE.PointsMaterial({ color: 0xbfe4ff, size: 0.07, map: DOR.glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); S.add(ions);
        // a molécula do remédio
        const mol = new THREE.Group(); S.add(mol);
        [[0, 0, 0, 0.11], [0.13, 0.06, 0, 0.08], [-0.12, 0.05, 0.05, 0.08], [0.02, 0.14, -0.08, 0.07], [0, -0.1, 0.06, 0.07]].forEach(([x, y, z, r]) => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.2, emissive: 0x3a7cb8, emissiveIntensity: 0.8 })); s.position.set(x, y, z); mol.add(s); });
        const TD = 3.55;
        function render(t) {
          const dock = ease.inOutCubic(range(t, 2.85, TD));
          mol.position.set(lerp(1.6, 0, dock), lerp(2.2, 0.52, dock), lerp(0.8, 0, dock)); mol.rotation.set(t * 0.8 * (1 - dock), t * 1.1 * (1 - dock), 0);
          mol.visible = t > 2.7;
          const fecha = t > TD ? 1 : 0;
          canal.children.forEach((c, i) => { c.material.emissiveIntensity = fecha ? 0.25 : 0.6 + 0.3 * Math.sin(t * 5 + i); });
          for (let i = 0; i < NI; i++) { const [a, r, f] = ib[i]; let u = (f + t * 0.45) % 1;
            // antes do bloqueio: descem afunilando pelo canal; depois param acima da membrana
            if (fecha) { u = Math.min(u, 0.42 + f * 0.05); }
            const y = lerp(1.8, -1.8, u), funil = Math.min(1, Math.abs(y) / 0.9);
            ip[i * 3] = Math.cos(a + t * 0.3) * r * funil * 0.9; ip[i * 3 + 1] = y + (fecha ? Math.sin(t * 2 + i) * 0.05 : 0); ip[i * 3 + 2] = Math.sin(a + t * 0.3) * r * funil * 0.9; }
          ig.attributes.position.needsUpdate = true;
          ions.material.color.set(fecha ? 0x7c8ca0 : 0xbfe4ff);
          const e = ease.inOutSine(range(t, 0, 6.57)), ang = lerp(-0.5, 0.4, e);
          cam.position.set(Math.sin(ang) * 5.6, lerp(2.6, 1.9, e), Math.cos(ang) * 5.6);
          cam.lookAt(0, lerp(-0.9, -1.0, e), 0);
          st.bloom = 0.7;
          st.sol(0, 0, 3, 0);
          st.draw();
          const c = st.ctx, vv = DOR.vis(st); DOR.quadro();
          DOR.frase(c, cam, new THREE.Vector3(0.3, 0.3, 0), "CANAL Nav1.7", range(t, 1.35, 1.55) * (1 - range(t, 4.9, 5.1)) * vv, { cor: DOR.LARANJA, tam: 28, dy: 160 });
          DOR.frase(c, cam, new THREE.Vector3(-0.4, 1.0, 0), "SINAL DE DOR", range(t, 0.6, 0.8) * (1 - range(t, 2.7, 2.9)) * vv, { cor: DOR.AZUL, tam: 26, dy: 260 });
          DOR.frase(c, cam, mol.position, fecha ? "DESLIGADO" : "REMÉDIO", range(t, 2.91, 3.1) * (1 - range(t, 4.9, 5.1)) * vv, { cor: fecha ? DOR.LARANJA : DOR.AZUL, tam: 28, dy: 330 });
        }
