/*META {"imports": ["mente"], "rotulos": [{"de": 5.2, "ate": 6.89, "texto": "<span class=\"k\">ATENÇÃO SELETIVA</span><br>Efeito <span class=\"y\">coquetel</span>"}], "D0": 6.89} */
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#0d0814", "#1a1020"], nevoa: [8, 34], corNevoa: "#140c18", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        const R = mulberry32(404);
        st.key.color.set(0xffc996); st.key.intensity = 1.6; st.rim.color.set(0xb06bff); st.rim.intensity = 1.2; st.hemi.intensity = 0.35;
        // salão: piso de madeira escura, paredes, varal de luzinhas
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), T.M(0x3a2a20, 0.45)); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        for (const [x, z, ry] of [[0, -9, 0], [-9, 0, Math.PI / 2], [9, 0, -Math.PI / 2]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), T.M(0x2a2230, 0.9)); w.position.set(x, 3, z); w.rotation.y = ry; S.add(w); }
        const corL = [0xffc46b, 0xff7a59, 0x7cc8ff, 0xff9ad5, 0xfff1c8];
        for (let k = 0; k < 4; k++) for (let i = 0; i < 16; i++) {
          const u = i / 15, x = lerp(-8.5, 8.5, u), z = -8 + k * 4.2, y = 3.6 - Math.sin(Math.PI * u) * 0.7;
          const s = MENTE.glowSprite(corL[(i + k) % 5], 0.7, 0.9); s.position.set(x, y, z); S.add(s);
        }
        const mesa = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.05, 16), T.M(0x6b4a34, 0.5)); mesa.position.set(-3.2, 0.52, -1.5); mesa.castShadow = true; S.add(mesa);
        // grupos de conversa (o alvo é o grupo 0, perto da câmera)
        const G = [[0.4, 1.4, 3], [-3.2, -1.5, 4], [3.4, -0.8, 4], [-1.5, -4.6, 4], [2.6, -4.8, 3], [-5.6, 1.6, 3], [5.6, 2.4, 3], [-0.4, -7.2, 4]];
        const L = [], grp = [];
        G.forEach(([cx, cz, n], g) => { for (let k = 0; k < n; k++) { const a = (k / n) * 6.283 + R() * 0.4 + g, r = 0.62; const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; L.push({ x, z, ry: Math.atan2(cx - x, cz - z), sent: 0, braco: R() < 0.3 }); grp.push(g); } });
        const p = MENTE.povo(S, L, { seed: 405 });
        const f = MENTE.fios(S, L.length, { seed: 406, alt: 1.1 });
        const cab = L.map(() => new THREE.Vector3());
        // cone de foco azul descendo sobre o grupo 0
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.35, 4.2, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        cone.position.set(G[0][0], 2.1, G[0][1]); S.add(cone);
        const disco = new THREE.Mesh(new THREE.CircleGeometry(1.35, 32), cone.material.clone()); disco.rotation.x = -Math.PI / 2; disco.position.set(G[0][0], 0.02, G[0][1]); S.add(disco);
        const centro = new THREE.Vector3(G[0][0], 1.4, G[0][1]);
        function render(t) {
          const fo = ease.inOutCubic(range(t, 2.85, 3.6)), ig = ease.inOutSine(range(t, 4.1, 4.9));
          p.update(t, { olhaBaixo: 0 });
          p.tinta((i) => (grp[i] === 0 ? 1 : 1 - 0.55 * fo));
          f.update(t, (i) => {
            p.cabeca(i, t, cab[i]);
            const alvo = grp[i] === 0;
            return { p: cab[i], a: alvo ? 0.7 + 0.5 * fo : 0.8 * (1 - 0.75 * ig), cor: alvo ? MENTE.COR.azul : (i % 3 ? MENTE.COR.laranja : MENTE.COR.branco), tumulto: alvo ? 0 : 0.5 };
          });
          cone.material.opacity = 0.16 * fo; disco.material.opacity = 0.3 * fo;
          st.bloom = 0.75;
          // grua: do alto do salão até a altura do grupo em foco
          const e = ease.inOutSine(range(t, 0, 6.89));
          cam.position.set(lerp(-4.0, 2.4, e), lerp(6.5, 2.3, e), lerp(9.5, 6.0, e));
          cam.lookAt(lerp(-0.5, G[0][0], e), lerp(0.4, 1.3, e), lerp(-2.0, G[0][1], e));
          st.sol(0, -1, 14);
          st.draw();
          const c = st.ctx, vv = MENTE.vis(st);
          const [x, y] = MENTE.proj(centro, cam);
          MENTE.foco(c, x, y, lerp(900, 330, fo), Math.max(fo * 0.6, ig) * vv);
          MENTE.quadro();
          [["…E AÍ ELA DISSE SIM!", 0], ["SÉRIO?!", 1]].forEach(([s, k]) => MENTE.frase(c, cam, cab[k].clone().add(new THREE.Vector3(0, 0.35, 0)), s, range(t, 3.2 + k * 0.4, 3.5 + k * 0.4) * vv, { cor: MENTE.AZUL, tam: 30 }));
        }
