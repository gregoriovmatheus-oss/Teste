/*META {"imports": ["deserto"], "rotulos": [], "D0": 5.6} */
        const DS = DESERTO;
        await DS.prepara();
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#3f7ec4", "#d6e6ef"], nevoa: [40, 160], corNevoa: "#c8dbe6", nuvens: 4, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xfff0d8); st.key.intensity = 2.8; st.hemi.intensity = 0.75; st.sol(0, 0, 18);
        // corte do solo (frente em z = 2.5) com raízes desenhadas; três árvores em cima
        const solo = new THREE.Mesh(new THREE.BoxGeometry(16, 3.2, 5), T.M(0x5a3d26, 0.95)); solo.position.set(0, -1.6, 0); S.add(solo);
        const grama = new THREE.Mesh(new THREE.BoxGeometry(16, 0.12, 5), T.M(0x5d8a34, 0.9)); grama.position.set(0, 0.02, 0); S.add(grama);
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), T.M(0x6f8d3c, 0.95)); chao.rotation.x = -Math.PI / 2; chao.position.set(0, -0.01, -102.6); S.add(chao);
        const XS = [-4.2, 0, 4.2], raizM = T.M(0x8a6040, 0.8), r = mulberry32(3), pontas = [];
        XS.forEach((x, i) => { const a = T.arvore(1.05 - i * 0.08 + (i === 1 ? 0.15 : 0), 0x3f7a30, 10 + i); a.position.set(x, 0, 0.4); S.add(a);
          for (let j = 0; j < 5; j++) { const ang = -Math.PI / 2 + (j - 2) * 0.45 + (r() - 0.5) * 0.2, L = 1.5 + r() * 1.0;
            const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, L, 5), raizM); const ex = x + Math.cos(ang) * L, ey = Math.sin(ang) * L;
            c.position.set((x + ex) / 2, ey / 2, 2.52); c.rotation.z = ang - Math.PI / 2; S.add(c); pontas.push([x, ex, ey]); } });
        // água subindo (raiz → tronco → copa) e depois virando vapor
        const N = 600, pos = new Float32Array(N * 3), gw = new THREE.BufferGeometry(); gw.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const agua = new THREE.Points(gw, new THREE.PointsMaterial({ map: DS.glowTex("suave"), color: 0x6cc8ff, size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); agua.frustumCulled = false; S.add(agua);
        const D = []; for (let i = 0; i < N; i++) D.push([r(), Math.floor(r() * pontas.length), 0.25 + r() * 0.2, r() - 0.5, r() - 0.5]);
        const vap = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ map: DS.glowTex("suave"), color: 0xf4f8ff, size: 1.6, transparent: true, opacity: 0, depthWrite: false })); vap.frustumCulled = false; S.add(vap);
        const NV = 160, pv = new Float32Array(NV * 3); vap.geometry.setAttribute("position", new THREE.BufferAttribute(pv, 3));
        // nuvem que se forma e chuva
        const nuv = T.nuvem(5, 0xffffff); nuv.position.set(0, 10.5, -1); S.add(nuv);
        const nm = nuv.children[0].material;
        const NR = 260, gota = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.5, 0.03), new THREE.MeshBasicMaterial({ color: 0xa8d4ff, transparent: true, opacity: 0.7 }), NR); gota.frustumCulled = false; S.add(gota);
        const RD = []; for (let i = 0; i < NR; i++) RD.push([(r() - 0.5) * 9, (r() - 0.5) * 4 - 1, r()]);
        const m4 = new THREE.Matrix4(), alvo = new THREE.Vector3();
        const cam0 = new THREE.Vector3(2.2, -1.2, 7.5), al0 = new THREE.Vector3(0, -1.4, 2.5), cam1 = new THREE.Vector3(1.2, 4.2, 15.5), al1 = new THREE.Vector3(0, 4.2, 0), cam2 = new THREE.Vector3(-0.8, 6.5, 19), al2 = new THREE.Vector3(0, 6.0, 0);
        function render(t) {
          const sobe = range(t, 0.6, 1.2);
          D.forEach((d, i) => { const [x, ex, ey] = pontas[d[1]], f = (d[0] + t * d[2]) % 1;
            let px, py, pz = 2.6;
            if (f < 0.35) { const k = f / 0.35; px = lerp(ex, x, k); py = lerp(ey, 0, k); }
            else { const k = (f - 0.35) / 0.65; px = x + d[3] * 1.6 * k; py = lerp(0, 3.8, k); pz = lerp(2.6, 0.4, Math.min(1, k * 3)) + d[4] * 1.4 * k; }
            const on = i < N * sobe ? 1 : 0;
            pos[i * 3] = on ? px : 0; pos[i * 3 + 1] = on ? py : -50; pos[i * 3 + 2] = pz; });
          gw.attributes.position.needsUpdate = true;
          // vapor saindo das copas (em "soltariam no ar", 2,2 s)
          vap.material.opacity = 0.55 * range(t, 2.1, 2.8) * (1 - 0.5 * range(t, 4.6, 5.4));
          for (let i = 0; i < NV; i++) { const f = ((i * 0.618) % 1 + t * 0.32) % 1, x = XS[i % 3] + Math.sin(i * 7.1) * 1.2 * (1 + f) * (1 - f * 0.8);
            pv[i * 3] = x * (1 - 0.6 * f); pv[i * 3 + 1] = 4.2 + f * 6; pv[i * 3 + 2] = 0.4 + Math.cos(i * 3.3) * 0.8 - f; }
          vap.geometry.attributes.position.needsUpdate = true;
          // nuvem cresce em "nuvens" (4,0 s) e escurece; chuva em "chuva" (4,7 s)
          const ns = 0.05 + 1.15 * ease.outBack(range(t, 3.3, 4.3));
          nuv.scale.setScalar(ns); nm.color.setRGB(1, 1, 1).multiplyScalar(lerp(1, 0.55, range(t, 4.2, 4.8)));
          const ch = range(t, 4.55, 4.8);
          RD.forEach((d, i) => { const f = (d[2] + t * 1.6) % 1, y = lerp(9.5, -0.2, f);
            m4.makeTranslation(d[0], ch > 0 && i < NR * ch ? y : -80, d[1]); gota.setMatrixAt(i, m4); });
          gota.instanceMatrix.needsUpdate = true;
          // câmera: das raízes (sob o chão) sobe em grua até a nuvem
          const a = ease.inOutCubic(range(t, 0.9, 3.9)), b = ease.inOutSine(range(t, 3.9, 5.6));
          cam.position.lerpVectors(cam0, cam1, a).lerp(cam2, b); alvo.lerpVectors(al0, al1, a).lerp(al2, b); cam.lookAt(alvo);
          st.bloom = 0.45;
          st.draw();
          const c = st.ctx;
          DS.etq(c, "ÁGUA DO SOLO", new THREE.Vector3(pontas[2][1], pontas[2][2], 2.6), cam, range(t, 1.25, 1.55) * (1 - range(t, 2.8, 3.0)), { dy: -140 });
          DS.etq(c, "VAPOR", new THREE.Vector3(0.4, 6.5, 0.2), cam, range(t, 3.35, 3.6) * (1 - range(t, 3.9, 4.0)), { dy: 0, dx: 160 });
          DS.etq(c, "NUVENS", nuv.position, cam, range(t, 4.0, 4.2) * (1 - range(t, 4.6, 4.7)), { dy: 40 });
          DS.etq(c, "CHUVA", new THREE.Vector3(2.5, 4.5, -1), cam, range(t, 4.7, 4.95), { dy: 60, dx: 120 });
        }
