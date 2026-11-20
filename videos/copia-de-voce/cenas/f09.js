/*META {"imports": ["copia"], "rotulos": [{"de": 0.1, "ate": 2.3, "texto": "Gêmeos <span class=\"y\">idênticos</span>"}, {"de": 4.41, "ate": 5.71, "texto": "<span class=\"k\">EPIGENÉTICA</span><br>Marcas <span class=\"y\">diferentes</span>"}], "D0": 5.71} */
        // Duas duplas hélices iguais; com os anos surgem marcas epigenéticas (pontos laranja) em lugares diferentes.
        const st = T.createToyStage(canvas, { ceu: "#04070f", nevoa: [5, 20], corNevoa: "#04070f", fov: 46, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.bloom = 0.8;
        st.key.color.set(0xdfeeff); st.key.intensity = 2.0; st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.0; st.hemi.intensity = 0.5;
        await COPIA.fontes();
        const NB = 34, passo = 0.17, R = 0.42;
        const esf = new THREE.SphereGeometry(0.075, 10, 8), deg = new THREE.CylinderGeometry(0.03, 0.03, 1, 6);
        const cores = [0x7cc8ff, 0x9fe0c8, 0xf2d27a, 0xe8a0c8].map((c) => new THREE.Color(c));
        const O = new THREE.Object3D(), Y = new THREE.Vector3(0, 1, 0);
        const helices = [-0.85, 0.85].map((x0, h) => {
          const g = new THREE.Group(); g.position.x = x0; S.add(g);
          const bb = new THREE.InstancedMesh(esf, new THREE.MeshStandardMaterial({ color: 0xcfe4ff, roughness: 0.3, metalness: 0.2, emissive: 0x1a3550 }), NB * 2);
          const rg = new THREE.InstancedMesh(deg, new THREE.MeshStandardMaterial({ roughness: 0.5 }), NB * 2);
          const pos = [];
          for (let i = 0; i < NB; i++) {
            const a = i * 0.6, y = i * passo;
            const p1 = new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R), p2 = new THREE.Vector3(-Math.cos(a) * R, y, -Math.sin(a) * R);
            pos.push(p1, p2);
            O.position.copy(p1); O.scale.setScalar(1); O.rotation.set(0, 0, 0); O.updateMatrix(); bb.setMatrixAt(i * 2, O.matrix);
            O.position.copy(p2); O.updateMatrix(); bb.setMatrixAt(i * 2 + 1, O.matrix);
            const m = p1.clone().lerp(p2, 0.5);
            for (const [k, q] of [[0, p1], [1, p2]]) {
              const mid = q.clone().lerp(m, 0.5), d = m.clone().sub(q);
              O.position.copy(mid); O.quaternion.setFromUnitVectors(Y, d.clone().normalize()); O.scale.set(1, d.length(), 1); O.updateMatrix();
              rg.setMatrixAt(i * 2 + k, O.matrix); rg.setColorAt(i * 2 + k, cores[(i * 3 + k * 2) % 4]);
              O.quaternion.identity();
            }
          }
          g.add(bb, rg);
          // marcas: posições e momentos sorteados com sementes diferentes
          const rr = mulberry32(900 + h * 77), M = [];
          for (let k = 0; k < 22; k++) M.push({ i: Math.floor(rr() * NB * 2), t0: 2.55 + rr() * 2.3 });
          const mk = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff8a4c, emissive: 0xff6a20, emissiveIntensity: 1.2, roughness: 0.3 }), M.length);
          g.add(mk);
          const halos = M.map(() => { const s = COPIA.brilho(0xff8a4c, 0.35, 0); g.add(s); return s; });
          return { g, pos, M, mk, halos };
        });
        const v = new THREE.Vector3();
        function render(t) {
          helices.forEach((H, h) => {
            H.g.rotation.y = t * 0.5 + h * 0.4;
            H.M.forEach((m, k) => {
              const s = ease.outBack(range(t, m.t0, m.t0 + 0.35)), p = H.pos[m.i];
              O.position.copy(p).multiplyScalar(1.28); O.position.y = p.y; O.rotation.set(0, 0, 0); O.scale.setScalar(Math.max(0.0001, s)); O.updateMatrix(); H.mk.setMatrixAt(k, O.matrix);
              H.halos[k].position.copy(O.position); H.halos[k].material.opacity = range(t, m.t0, m.t0 + 0.2) * (0.5 + 0.5 * (t > 4.41 ? Math.sin(t * 9 + k) * 0.5 + 0.5 : 0.4));
            });
            H.mk.instanceMatrix.needsUpdate = true;
          });
          // grua subindo ao longo das hélices
          const e = ease.inOutSine(range(t, 0, 5.71));
          cam.position.set(lerp(-1.2, 1.0, e), lerp(0.6, 4.4, e), lerp(5.0, 4.3, e));
          cam.lookAt(0, lerp(1.6, 3.6, e), 0);
          st.sol(0, 0, 5);
          st.draw();
          const c = st.ctx, a = COPIA.vis(st);
          const tg = a * range(t, 0.3, 0.6) * (1 - range(t, 2.3, 2.5));
          COPIA.tag(c, cam, v.set(-0.85, 3.4, 0), "GÊMEO A", { a: tg, dx: -60, dy: -150 });
          COPIA.tag(c, cam, v.set(0.85, 3.4, 0), "GÊMEO B", { a: tg, dx: 60, dy: -150 });
          const anos = Math.round(50 * range(t, 2.55, 4.85)), ca = a * range(t, 2.45, 2.65) * (1 - range(t, 4.3, 4.45));
          COPIA.txt(c, "IDADE DOS GÊMEOS", 540, 740, { tam: 24, cor: COPIA.AZUL, a: ca });
          COPIA.txt(c, anos + " ANOS", 540, 800, { tam: 56, a: ca, esp: 0.04 });
          COPIA.txt(c, "● MARCA EPIGENÉTICA", 540, 870, { tam: 22, cor: COPIA.LARANJA, a: ca });
        }
