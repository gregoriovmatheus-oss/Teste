/*META {"rotulos": [{"de": 0.3, "ate": 3.0, "texto": "ONDE ACHAR <span class=\"y\">COMIDA?</span>"}], "D0": 7.15} */
        const st = T.createToyStage(canvas, { fov: 52, ceu: ["#F3E2C4", "#E8D3B0"], nevoa: [20, 80], nuvens: 0 });
        const S = st.scene, cam = st.cam;
        const piso = T.mesh(new THREE.PlaneGeometry(200, 200), 0xe9e4da, S, 0.6); piso.rotation.x = -Math.PI / 2; piso.castShadow = false;
        const teto = T.mesh(new THREE.PlaneGeometry(200, 200), 0xf3efe6, S, 0.9); teto.rotation.x = Math.PI / 2; teto.position.y = 9;
        for (let z = -40; z < 10; z += 8) { const l = T.mesh(T.roundBox(8, 0.2, 0.8, 0.08), T.M(0xffffff, 0.5, { emissive: 0xfff4d8, emissiveIntensity: 1 }), S); l.position.set(0, 8.8, z); }
        const rr = mulberry32(81), cores = [T.PAL.tijolo, T.PAL.amarelo, 0x6fafa6, 0x4f9bd9, 0xe9a3a0, 0x7dbb5a, 0xf6f1e8];
        const caem = [];
        for (const x of [-5, 5]) {
          for (let z = -36; z < 6; z += 7) {
            const sh = T.mesh(T.roundBox(2.4, 4.6, 6.6, 0.15), 0xd6d0c4, S); sh.position.set(x, 0, z);
            for (let lv = 0; lv < 3; lv++) {
              const pl = T.mesh(T.roundBox(2.8, 0.15, 6.6, 0.05), 0xf4f1ea, S); pl.position.set(x + Math.sign(-x) * 0.3, 0.6 + lv * 1.4, z);
              for (let i = 0; i < 6; i++) {
                const w = 0.5 + rr() * 0.3, h = 0.6 + rr() * 0.5;
                const p = T.mesh(T.roundBox(w, h, 0.8, 0.12), cores[Math.floor(rr() * cores.length)], S, 0.55);
                const px = x + Math.sign(-x) * 1.2, py = 0.75 + lv * 1.4, pz = z - 2.6 + i * 1.05;
                p.position.set(px, py, pz);
                if (rr() < 0.4 && z > -26) caem.push({ p, px, py, pz, t0: 1.2 + rr() * 4.5, vx: Math.sign(-x) * (1 + rr() * 2), vz: (rr() - 0.5) * 2, rot: (rr() - 0.5) * 8 });
              }
            }
          }
        }
        const macs = [[-5, -8], [5, -15], [-5, -22]].map(([x, z], i) => { const m = A.createAnimal("macaco", { fase: i * 0.3 }); m.group.scale.setScalar(1.3); m.group.position.set(x, 4.6, z); A.face(m.group, -x, 0.4); S.add(m.group); return m; });
        const leao = A.createAnimal("leao", { fase: 0.2 }); leao.group.scale.setScalar(1.2); S.add(leao.group);
        const carne = T.mesh(T.SPH, 0xd96b6b, S, 0.5); carne.scale.set(0.6, 0.3, 0.45); carne.position.set(0.6, 0.3, -29);
        const osso = T.mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), 0xf6f1e8, S); osso.rotation.z = Math.PI / 2; osso.position.set(0.6, 0.35, -29);
        const ratos = [0, 1, 2].map((i) => { const r = A.createAnimal("rato", { fase: i * 0.3 }); r.group.scale.setScalar(2.2); S.add(r.group); return r; });
        const migalhas = Array.from({ length: 14 }, () => { const m = T.mesh(T.SPH, T.PAL.amarelo, S); m.scale.setScalar(0.08 + rr() * 0.06); m.position.set((rr() - 0.5) * 3, 0.06, -6 - rr() * 5); return m; });
        function render(t) {
          caem.forEach((c) => {
            const u = Math.max(0, t - c.t0);
            const fall = c.py + 0.0 - 4.9 * u * u;
            const y = Math.max(0.3, fall);
            const tt = u > 0 ? Math.min(u, Math.sqrt(Math.max(0, (c.py - 0.3) / 4.9))) : 0;
            c.p.position.set(c.px + c.vx * tt, y, c.pz + c.vz * tt);
            c.p.rotation.set(c.rot * tt, 0, c.rot * tt * 0.7);
          });
          macs.forEach((m, i) => { m.update(t, { passo: 0, sobe: 0.5 + 0.5 * Math.sin(t * 6 + i) }); m.group.position.y = 4.6 + Math.abs(Math.sin(t * 3 + i)) * 0.3; });
          const lz = lerp(-40, -30.5, ease.outCubic(range(t, 0, 3.5)));
          leao.group.position.set(-0.2, 0, lz); A.face(leao.group, 0.1, 1);
          leao.update(t, { passo: t < 3.5 ? 1.5 : 0, cabeca: t > 3.5 ? -0.35 - Math.abs(Math.sin(t * 4)) * 0.2 : 0 });
          ratos.forEach((r, i) => { const a = t * 0.8 + i * 2; r.group.position.set(Math.cos(a) * 1.2 + (i - 1), 0, -8 + Math.sin(a) * 1.5); A.face(r.group, -Math.sin(a), Math.cos(a)); r.update(t, { passo: 5, cabeca: -0.2 }); });
          const e = ease.inOutSine(clamp(t / D));
          cam.position.set(Math.sin(t * 0.5) * 0.6, lerp(2.4, 3.6, e), lerp(2, -14, e));
          cam.lookAt(0, lerp(1.4, 1.2, e), lerp(-14, -32, e));
          st.sol(0, -15, 30);
          st.draw();
        }
