/*META {"imports": ["lua"], "rotulos": [{"de": 1.7, "ate": 4.1, "texto": "<span class=\"k\">BÚSSOLA DO BESOURO</span><br>Guiado pela<br><span class=\"y\">Via Láctea</span>"}, {"de": 5.5, "ate": 7.46, "sai": false, "texto": "<span class=\"k\">PLÂNCTON DO ÁRTICO</span><br><span class=\"y\">Sem ritmo</span>"}], "D0": 7.46} */
        // f08 — A: besouro rola-bosta empurrando a bola de costas; a câmera sobe e revela a Via Láctea, que fica mais brilhante.
        //       B (4,3 s): sob o gelo do Ártico, o plâncton sobe e desce em sincronia e depois perde o ritmo.
        const st = T.createToyStage(canvas, { fov: 46, ceu: "#02040a", nevoa: [25, 300], corNevoa: "#0a0e18", nuvens: 0, exposicao: 1.3 });
        const S = st.scene, cam = st.cam;
        st.bloom = 0.6;
        S.environment = null;
        LUA.ceuDome(S, { topo: "#03060f", horiz: "#16203a", base: "#06070a" });
        const est = LUA.estrelas(S, { n: 3000, r: 1200, so: "cima", seed: 81 }); est.mat.uniforms.uA.value = 1.5;
        const via = LUA.viaLactea(S, { r: 1150, seed: 82, n: 7000, normal: new THREE.Vector3(0.9, 0.1, -0.2).normalize() });
        const hgt = (x, z) => 0.08 * Math.sin(x * 0.9) * Math.cos(z * 0.7) + 0.05 * Math.sin(x * 2.3 + z);
        LUA.terreno(S, hgt, { w: 200, d: 200, seg: 80, cor: 0x7a6548, rough: 1, cz: -40 });
        const gr = LUA.grama(S, { n: 500, area: [-10, 10, -14, -1.5], seed: 83, cor: 0x8a7a4a, alt: [0.15, 0.4], h: hgt });
        const rr = mulberry32(84);
        const seixos = new THREE.InstancedMesh(LUA.SPH_L, T.M(0x8a7d6a, 0.95), 260); const o = new THREE.Object3D();
        for (let i = 0; i < 260; i++) { const x = (rr() - 0.5) * 16, z = 3 - rr() * 16; o.position.set(x, hgt(x, z), z); o.scale.set(0.05 + rr() * 0.12, 0.03 + rr() * 0.06, 0.05 + rr() * 0.1); o.rotation.y = rr() * 6; o.updateMatrix(); seixos.setMatrixAt(i, o.matrix); }
        S.add(seixos);
        const bes = LUA.besouro(); S.add(bes.group);
        const bolaGeo = new THREE.IcosahedronGeometry(0.55, 3); { const p = bolaGeo.attributes.position, v = new THREE.Vector3(), rb = mulberry32(85);
          for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + 0.05 * Math.sin(v.x * 17 + v.y * 11) * Math.cos(v.z * 13); p.setXYZ(i, v.x * k, v.y * k, v.z * k); } bolaGeo.computeVertexNormals(); }
        const bola = T.mesh(bolaGeo, 0x6a5236, S, 1);
        st.key.color.set(0x9fb2dd); st.key.intensity = 0.9; st.sol(0, 0, 8); st.key.position.set(-4, 9, 6);
        st.hemi.color.set(0x41588a); st.hemi.groundColor.set(0x1a140c); st.hemi.intensity = 0.45;
        st.rim.color.set(0xc8d8ff); st.rim.intensity = 1.8; st.rim.position.set(6, 5, -8);
        // B: Ártico sob o gelo
        const SB = new THREE.Scene(); SB.fog = new THREE.Fog(0x041722, 4, 38);
        const camB = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.05, 2000);
        LUA.ceuDome(SB, { topo: "#103650", horiz: "#04141f", base: "#01060a", exp: 0.8 });
        SB.add(new THREE.HemisphereLight(0x5f9cc0, 0x02080c, 1.5));
        const dl = new THREE.DirectionalLight(0xbfe0ff, 1.0); dl.position.set(2, 20, 4); SB.add(dl);
        const rg = mulberry32(86);
        for (let i = 0; i < 26; i++) { const p = new THREE.Mesh(T.roundBox(4 + rg() * 5, 1.2, 4 + rg() * 5, 0.4), new THREE.MeshStandardMaterial({ color: 0xcfe6f0, roughness: 0.35, emissive: 0x1d4a66, emissiveIntensity: 0.35 }));
          p.position.set((i % 6 - 2.5) * 6.8 + rg() * 1.2, 9 + rg() * 0.5, -Math.floor(i / 6) * 7 + 2 + rg()); p.rotation.y = rg() * 0.4; SB.add(p); }
        const NP = 2400, PL = LUA.pontos(SB, NP, { tam: 1, atenua: 260 }), PQ = [];
        for (let i = 0; i < NP; i++) { PQ.push([(rg() - 0.5) * 22, -2 + rg() * 7, -rg() * 26 + 2, rg() * 6.28, 0.6 + rg() * 0.9, rg()]); PL.C.set([0.45, 0.95 + rg() * 0.05, 0.85], i * 3); PL.S[i] = 0.5 + rg() * 0.7; }
        st.extraWarm = [{ renderer: st.renderer, scene: SB, camera: camB }];
        const TB = 4.3;
        function render(t) {
          if (t < TB) {
            const vx = 0.32, d = t * vx, bx = 1.6 - d;
            bes.group.position.set(bx, hgt(bx, 0), 0); bes.group.rotation.z = -0.55; bes.group.position.y += 0.18;
            bes.update(t, 2.2);
            bola.position.set(bx - 0.95, hgt(bx - 0.95, 0) + 0.55, 0); bola.rotation.z = d / 0.55;
            gr.update(t, 0.5);
            via.set(lerp(0.75, 1.6, ease.inOutSine(range(t, 2.9, 3.7))));
            const e = ease.inOutSine(range(t, 0, TB)), up = ease.inOutCubic(range(t, 1.3, 3.6));
            cam.position.set(bx - 0.4 + lerp(0.6, 0, e), lerp(1.0, 1.8, e), lerp(5.6, 6.4, e));
            cam.lookAt(bx - 0.5 - up * 1.5, lerp(0.35, 0.5, e) + up * 7, -2 - up * 6);
            st.draw(S, cam, { cor: "#000", a: range(t, TB - 0.25, TB) });
            // trilha tracejada: o besouro mantém a linha reta guiado pela faixa
            const c = st.ctx, [x0, y0] = LUA.proj(bola.position, cam);
            c.save(); c.globalAlpha = 0.5 * range(t, 1.9, 2.4) * (1 - range(t, 3.8, 4.1)); c.setLineDash([14, 14]); c.strokeStyle = "#7cc8ff"; c.lineWidth = 4;
            c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 - 600, y0 - 1400); c.stroke(); c.restore();
          } else {
            const u = t - TB, perde = ease.inOutSine(range(u, 1.2, 2.3));
            for (let i = 0; i < NP; i++) {
              const [x, y0, z, ph, f, k] = PQ[i];
              const sync = Math.sin(u * 2.4 - 1.2) * 2.2, solto = Math.sin(u * 2.4 * f + ph) * 2.2 + (k - 0.5) * 3 * perde;
              PL.P.set([x + Math.sin(u * 0.7 + ph) * 0.2, y0 + lerp(sync, solto, perde), z], i * 3);
              PL.A[i] = 0.8 * range(u, 0, 0.3);
            }
            PL.sync();
            const e = ease.inOutSine(range(u, 0, D - TB));
            camB.position.set(lerp(-1, 1.2, e), lerp(1.2, 2.2, e), lerp(9, 5.5, e));
            camB.lookAt(0, lerp(2.6, 3.6, e), -12);
            st.draw(SB, camB, { cor: "#000", a: 1 - range(u, 0, 0.25) });
            // gráfico: migração vertical (posição média) — em ritmo, depois sem ritmo
            const c = st.ctx, gx = 120, gy = 230, gw = 600, gh = 120, ga = range(u, 0.3, 0.6) * LUA.borda(t, D);
            if (ga > 0) {
              c.save(); c.globalAlpha = ga; c.fillStyle = "rgba(4,14,22,0.6)"; c.fillRect(gx - 20, gy - 50, gw + 40, gh + 80);
              c.font = "600 24px Montserrat, sans-serif"; c.fillStyle = "#bfe9e0"; c.fillText("SOBE E DESCE COM A LUA", gx, gy - 20);
              c.strokeStyle = "#7ff0d6"; c.lineWidth = 4; c.beginPath();
              for (let px = 0; px <= gw; px += 4) {
                const s = px / gw, uu = u - 2.6 + s * 2.6, pp = ease.inOutSine(range(uu, 1.2, 2.3));
                const val = lerp(Math.sin(uu * 2.4 * 2), Math.sin(uu * 9.1) * 0.35 + Math.sin(uu * 23) * 0.2, pp);
                if (uu < 0 && s < (2.6 - u) / 2.6 - 0.001) continue;
                c.lineTo(gx + px, gy + gh / 2 - val * gh * 0.42);
              }
              c.stroke(); c.restore();
            }
            LUA.tag(st.ctx, "ÁRTICO · NOITE POLAR", 450, 470, { a: range(u, 0.2, 0.6) * LUA.borda(t, D), tam: 28 });
          }
        }
