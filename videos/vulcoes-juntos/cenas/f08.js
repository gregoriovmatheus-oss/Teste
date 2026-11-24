/*META {"imports": ["lowpoly", "cinema", "vulcoes"], "rotulos": [{"de": 0.3, "ate": 1.75, "texto": "Sem sol, a comida <span class=\"y\">acaba</span>"}, {"de": 4.6, "ate": 6.54, "texto": "Mercados <span class=\"y\">vazios</span>"}], "D0": 6.54, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        const LP = LOWPOLY, CI = CINEMA, V = VULCOES;
        await V.prepara();
        const st = LP.palco(canvas, { fov: 36, foco: 1.9, faixa: 0.8, desfoque: 18, bloom: 0.8 });
        const { S, cam } = st; cam.near = 0.1; cam.updateProjectionMatrix();
        LP.luz(st, "interior"); S.background = new THREE.Color(0x1a1a1c);
        st.fria.color.set(0xeaf2ff); st.fria.intensity = 2.4; st.fria.position.set(0.5, 4, 1); st.hemi.intensity = 0.55; st.hemi.color.set(0xdfe8f0);
        Object.assign(st.fria.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 }); st.fria.shadow.camera.updateProjectionMatrix();
        const mk = LP.mat, g = new THREE.Group(); S.add(g);
        const cx = (w, h, d, c, x, y, z, r = 0.7) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mk(c, r)); m.position.set(x, y, z); g.add(m); return m; };
        cx(8, 0.1, 16, 0xc8c4bc, 0, -0.05, -4, 0.35); cx(8, 0.1, 16, 0x2a2a2e, 0, 3.4, -4);
        cx(8, 3.4, 0.1, 0xb8c0c0, 0, 1.7, -11);
        // gôndolas dos dois lados, 4 prateleiras
        const NIV = [0.25, 0.75, 1.25, 1.75];
        [-1.35, 1.35].forEach((x) => { cx(0.7, 2.1, 12, 0x6a7078, x + Math.sign(x) * 0.15, 1.05, -4.5, 0.5); NIV.forEach((y) => cx(0.62, 0.04, 12, 0xd8dade, x, y, -4.5, 0.4)); });
        // produtos (instanciados) que vão sumindo
        const NP = 900, R = mulberry32(88), PR = [];
        const prod = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.24, 0.12), mk(0xffffff, 0.6), NP);
        const CORES = [0xd8b860, 0xf2efe6, 0xe0a020, 0xc84a3a, 0x3a7a4a, 0x2a5a9a, 0xe8d8b0];
        for (let i = 0; i < NP; i++) { const s = R() < 0.5 ? -1 : 1, lv = Math.floor(R() * 4); PR.push([s * (1.3 + (R() - 0.5) * 0.25), NIV[lv] + 0.14, -10 + R() * 11.2, R(), 0.8 + R() * 0.5]); prod.setColorAt(i, new THREE.Color(CORES[Math.floor(R() * CORES.length)])); }
        prod.castShadow = true; g.add(prod);
        // placas das seções (acendem quando ditas)
        const PL = [["TRIGO", -1.8, 1.81], ["ARROZ", -4.4, 2.16], ["MILHO", -7.0, 2.52]].map(([n, z, t0]) => { const m = V.placa(n, { w: 1.3, h: 0.42, fundo: "#14202c", cor: "#ffffff", tam: 110, emis: 0 }); m.position.set(0, 2.75, z); g.add(m);
          const h = cx(0.02, 0.5, 0.02, 0x333333, 0, 3.12, z); return [m, t0]; });
        // luminárias (uma falhando)
        const lums = [-1, -4, -7, -10].map((z) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf4f8ff).multiplyScalar(2.2), toneMapped: false })); l.position.set(0, 3.3, z); g.add(l); return l; });
        const falha = new THREE.PointLight(0xeaf2ff, 3, 6, 1.6); falha.position.set(0, 3.0, -4); S.add(falha);
        // ela, com a cesta vazia; figurantes no fundo
        const p = LP.pessoa({ seed: 71, feminina: true, roupa: "casaco", jaqueta: 0x6a3a4a, pele: 0xd9a07e, cabelo: 0x5a3a20, iris: 0x4a6a3a });
        S.add(p.root);
        const cesta = new THREE.Group(); const cb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.26), mk(0xc0302a, 0.5)); cb.position.y = -0.2; cesta.add(cb);
        const al = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 16, Math.PI), mk(0x222222, 0.5)); al.position.y = -0.1; cesta.add(al);
        const FG = [[0.5, -8.5, 72, 0x3d5a80], [-0.6, -9.5, 73, 0x7a6a3a], [0.3, -6.2, 74, 0x4a4a4a]].map(([x, z, s, c]) => { const f = LP.figurante({ seed: s, roupa: c, longo: s === 73 }); f.root.position.set(x, 0, z); S.add(f.root); return [f, x, z]; });
        const rosto = new THREE.Vector3(), alvo = new THREE.Vector3(), M4 = new THREE.Matrix4(), PS = new THREE.Vector3(), SC = new THREE.Vector3(), Q0 = new THREE.Quaternion();
        LP.segurar(p, 1, cesta, { pos: [0, -0.1, 0.03] });
        const voltaAbas = V.guardaAbas(p);
        function render(t) {
          // a comida some: 70% → quase nada até "vazios"
          const vazio = lerp(0.3, 0.97, ease.inOutSine(range(t, 0.6, 6.0)));
          for (let i = 0; i < NP; i++) { const r = PR[i], v = r[3] > vazio ? 1 : 0; PS.set(r[0], r[1], r[2]); SC.setScalar(v * r[4]); M4.compose(PS, Q0, SC); prod.setMatrixAt(i, M4); }
          prod.instanceMatrix.needsUpdate = true;
          PL.forEach(([m, t0]) => { const k = range(t, t0, t0 + 0.2); m.material.emissiveIntensity = 0.15 + 1.3 * k; m.material.emissive.setHex(k > 0 ? 0xffffff : 0x000000); });
          CI.piscar(falha, t, "falha"); lums[1].material.color.setHex(0xf4f8ff).multiplyScalar(falha.intensity > 1 ? 2.2 : 0.3);
          // ela anda devagar pelo corredor, olha as prateleiras vazias
          p.reset(); voltaAbas();
          const d = LP.andar(p, t, { vel: 0.55, amp: 0.7 });
          p.root.position.set(0.05, 0, -4.4 + d * 0.32);
          LP.punho(p, 0.7, 1);
          p.bracos[1].cot.rotation.x -= 0.5;
          p.root.updateMatrixWorld(true);
          const lado = Math.sin(t * 0.9) > 0 ? 1 : -1;
          LP.olharPara(p, alvo.set(1.3 * Math.sign(Math.sin(t * 0.8 + 0.5)), 1.0, p.root.position.z - 0.6), 0.6 * range(t, 1.6, 2.2) * (1 - range(t, 4.4, 4.9)));
          p.emocaoMix("nervoso", "triste", range(t, 3.6, 4.8), [0, -0.1]);
          LP.vida(p, t, { seed: 71, balanco: 0.3, olhos: false });
          FG.forEach(([f, x, z], i) => { f.reset(); const df = LP.andar(f, t + i * 0.6, { vel: 0.5 }); f.root.rotation.y = i === 1 ? 0 : Math.PI; f.root.position.z = z + (i === 1 ? df : -df) * 0.3; });
          // câmera: na frente dela (rosto no terço de cima) → em "mercados" recua e sobe para o corredor vazio
          p.cab.getWorldPosition(rosto);
          const w = ease.inOutCubic(range(t, 3.9, 6.54));
          cam.position.set(lerp(0.75, 0.3, w), lerp(1.45, 2.5, w), rosto.z + lerp(2.6, 4.6, w));
          alvo.copy(rosto); alvo.x -= 0.25 * (1 - w); alvo.y -= lerp(0.42, 0.9, w); alvo.z -= 2.5 * w;
          cam.lookAt(alvo); LP.camMao(cam, t, { intens: 0.8, seed: 9 });
          LP.focar(st, rosto); st.U.faixa.value = lerp(0.8, 3, w);
          st.draw();
        }
