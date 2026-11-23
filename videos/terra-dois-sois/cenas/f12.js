/*META {"imports": ["doissois"], "rotulos": [{"de": 2.4, "ate": 5.08, "texto": "<span class=\"k\">MITOS ANTIGOS</span><br>dois <span class=\"y\">deuses</span> brigando"}], "D0": 5.08} */
        const DS = DOISSOIS;
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#1e1a40", "#e07a44"], nevoa: [30, 200], corNevoa: "#a85a40", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        const chao = new THREE.Mesh(new THREE.CircleGeometry(200, 48), T.M(0x4a3a2a, 0.95)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; S.add(chao);
        // círculo de pedras e o povo olhando o céu
        const R = mulberry32(1212);
        for (let i = 0; i < 11; i++) { const a = (i / 11) * 6.283, b = new THREE.Mesh(T.roundBox(0.9, 2.6 + R() * 1.4, 0.6, 0.15), T.M(0x7a7266, 0.9));
          b.position.set(Math.cos(a) * 6, 0, Math.sin(a) * 6 - 2); b.rotation.y = -a + Math.PI / 2; b.rotation.z = (R() - 0.5) * 0.12; b.castShadow = true; S.add(b); }
        const P = [];
        for (let i = 0; i < 6; i++) { const h = A.createAnimal("humano", { cor: [0x5a3a2a, 0x3a3a2a, 0x6a4a30][i % 3], cor2: 0x2a201a, cabelo: 0x1a1410, mulher: i % 2 === 1, fase: i * 0.17 });
          DS.barato(h.group); A.face(h.group, (R() - 0.5) * 0.4, -1); h.group.position.set(-2.6 + i * 1.05 + (R() - 0.5) * 0.3, 0, -0.5 - (i % 2) * 0.9); h.group.traverse((m) => { if (m.isMesh) m.castShadow = true; }); S.add(h.group); P.push(h); }
        // fogueira
        const fogo = DS.brilho(0xff8a3a, 2.2); fogo.position.set(0, 0.5, -3.2); S.add(fogo);
        const lf = new THREE.PointLight(0xff7a30, 2.5, 8, 1.5); lf.position.set(0, 0.8, -3.2); S.add(lf);
        // os dois "deuses": sóis girando um em volta do outro, com rastros de fogo
        const C = new THREE.Vector3(0, 30, -60);
        const SA = DS.estrela(S, { r: 3.2, tipo: "amarelo", halo: 7 }), SV = DS.estrela(S, { r: 2.2, tipo: "vermelho", halo: 8 });
        const NT = 90, tg = new THREE.BufferGeometry(), tp = new Float32Array(NT * 2 * 3), tcor = new Float32Array(NT * 2 * 3);
        tg.setAttribute("position", new THREE.BufferAttribute(tp, 3)); tg.setAttribute("color", new THREE.BufferAttribute(tcor, 3));
        const tm = new THREE.PointsMaterial({ size: 2.6, vertexColors: true, map: DS.glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
        const rastro = new THREE.Points(tg, tm); rastro.frustumCulled = false; S.add(rastro);
        const pos = (tt, k) => { const a = tt * 1.6 + k * Math.PI, r = 9 + 2 * Math.sin(tt * 2.3); return new THREE.Vector3(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r * 0.55, C.z + Math.sin(a) * 4); };
        const alvo = new THREE.Vector3();
        function render(t) {
          P.forEach((h) => h.update(t, { cabeca: 0.35 }));
          SA.group.position.copy(pos(t, 0)); SV.group.position.copy(pos(t, 1)); SA.set(1, t); SV.set(1, t);
          for (let i = 0; i < NT; i++) for (let k = 0; k < 2; k++) {
            const j = (i * 2 + k) * 3, tt = t - i * 0.012, p = pos(tt, k), f = 1 - i / NT;
            tp[j] = p.x; tp[j + 1] = p.y; tp[j + 2] = p.z;
            tcor[j] = f; tcor[j + 1] = f * (k ? 0.25 : 0.7); tcor[j + 2] = f * (k ? 0.1 : 0.3);
          }
          tg.attributes.position.needsUpdate = true; tg.attributes.color.needsUpdate = true;
          tm.size = 2.6 + 0.4 * Math.sin(t * 7);
          fogo.scale.setScalar(2.2 + 0.3 * Math.sin(t * 13) + 0.2 * Math.sin(t * 7.3)); lf.intensity = 2.4 + 0.5 * Math.sin(t * 11);
          // grua: de trás do povo, subindo até o céu
          const e = ease.inOutSine(range(t, 0, 5.08));
          cam.position.set(lerp(1.5, 0.5, e), lerp(2.2, 3.4, e), lerp(7.5, 10, e));
          alvo.set(0, lerp(2.2, 10, e), lerp(-8, -30, e)); cam.lookAt(alvo);
          st.key.color.set(0xffc080); st.sol(0, -1, 9); st.key.position.set(0, 10, -14).add(new THREE.Vector3(0, 0, -2));
          st.hemi.intensity = 0.12;
          st.bloom = 0.8;
          st.draw();
        }
