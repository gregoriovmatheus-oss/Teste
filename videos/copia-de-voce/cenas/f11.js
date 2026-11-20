/*META {"imports": ["copia"], "rotulos": [{"de": 0.3, "ate": 2.86, "texto": "<span class=\"k\">A DISPUTA</span><br>Quem fica com <span class=\"y\">o quê?</span>"}], "D0": 2.86} */
        // Casa, crachá e porta-retrato: cada um racha ao meio quando é dito, as metades se afastam.
        const st = T.createToyStage(canvas, { ceu: "#05070d", nevoa: [6, 22], fov: 50, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        COPIA.estudio(st); st.bloom = 0.75; st.key.intensity = 3.0; st.hemi.intensity = 0.9;
        await COPIA.fontes();
        function texMeia(desenha, lado) {
          const c = document.createElement("canvas"); c.width = 256; c.height = 320; desenha(c.getContext("2d"));
          const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
        }
        function plano(w, h, tex, lado) { // metade de um plano texturizado (lado -1 esquerda, 1 direita)
          const g = new THREE.PlaneGeometry(w / 2, h); const uv = g.attributes.uv;
          for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 0.5 + (lado > 0 ? 0.5 : 0));
          const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 })); m.position.x = lado * w / 4; return m;
        }
        const objs = [];
        // casa
        { const tri = new THREE.Shape(); tri.moveTo(0, 0); tri.lineTo(0.5, 0); tri.lineTo(0, 0.4); tri.lineTo(0, 0);
          const meias = [-1, 1].map((s) => { const g = new THREE.Group();
            const b = T.mesh(new THREE.BoxGeometry(0.42, 0.55, 0.6), 0xe6dccb, g, 0.8); b.position.set(s * 0.21, 0.275, 0);
            const tg = new THREE.ExtrudeGeometry(tri, { depth: 0.66, bevelEnabled: false }); tg.translate(0, 0, -0.33);
            const tl = T.mesh(tg, 0xc9452f, g, 0.7); tl.position.y = 0.55; tl.scale.x = s;
            const pt = T.mesh(new THREE.BoxGeometry(0.12, 0.26, 0.02), 0x6b3f2a, g, 0.6); pt.position.set(s * 0.08, 0.13, 0.31);
            return g; });
          objs.push({ meias, x: -2.0, t0: 1.23, nome: "CASA" }); }
        // crachá
        { const tex = texMeia((g) => { g.fillStyle = "#f4f6fa"; g.fillRect(0, 0, 256, 320); g.fillStyle = "#2f5c8a"; g.fillRect(0, 0, 256, 70);
            g.fillStyle = "#cfd8e4"; g.fillRect(78, 96, 100, 110); g.fillStyle = "#8a99ad"; g.beginPath(); g.arc(128, 140, 26, 0, 6.283); g.fill(); g.fillRect(92, 172, 72, 34);
            g.fillStyle = "#1c2430"; g.font = '600 26px "JetBrains Mono", monospace'; g.textAlign = "center"; g.fillText("CRACHÁ", 128, 46);
            g.fillStyle = "#4a5568"; g.fillRect(48, 232, 160, 12); g.fillRect(70, 256, 116, 10); for (let i = 0; i < 18; i++) g.fillRect(52 + i * 9, 284, i % 3 ? 4 : 6, 22); });
          const meias = [-1, 1].map((s) => { const g = new THREE.Group(); const p = plano(0.6, 0.75, tex, s); p.position.y = 0.5; g.add(p);
            const fita = T.mesh(new THREE.BoxGeometry(0.05, 0.5, 0.01), 0x2f5c8a, g); fita.position.set(s * 0.06, 1.1, -0.01); fita.rotation.z = s * 0.25; return g; });
          objs.push({ meias, x: 0, t0: 1.63, nome: "EMPREGO" }); }
        // porta-retrato (família genérica: três silhuetas)
        { const tex = texMeia((g) => { const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, "#9fc7ee"); gr.addColorStop(1, "#e9d8b8"); g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
            g.fillStyle = "#5c6f88"; for (const [x, s] of [[70, 1], [128, 0.7], [186, 1]]) { g.beginPath(); g.arc(x, 180 - 60 * s, 24 * s, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(x, 290 - 20 * (1 - s), 40 * s, 100 * s, 0, Math.PI, 0); g.fill(); }
            g.strokeStyle = "#3d2f26"; g.lineWidth = 22; g.strokeRect(0, 0, 256, 320); });
          const meias = [-1, 1].map((s) => { const g = new THREE.Group(); const p = plano(0.6, 0.75, tex, s); p.position.y = 0.45; g.add(p);
            const b = T.mesh(new THREE.BoxGeometry(0.3, 0.75, 0.04), 0x3d2f26, g, 0.5); b.position.set(s * 0.15, 0.45, -0.025); return g; });
          objs.push({ meias, x: 2.0, t0: 2.18, nome: "FAMÍLIA" }); }
        const fendas = objs.map((o) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 1.2), new THREE.MeshBasicMaterial({ color: 0xff8a4c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false })); m.position.set(o.x, 0.5, 0.05); S.add(m); return m; });
        objs.forEach((o) => o.meias.forEach((g) => { g.position.x = o.x; S.add(g); }));
        const v = new THREE.Vector3();
        function render(t) {
          objs.forEach((o, i) => {
            const ap = ease.outBack(range(t, 0.1 + i * 0.12, 0.5 + i * 0.12)) * (1 + 0.12 * Math.sin(Math.PI * range(t, o.t0 - 0.2, o.t0 + 0.2))), sp = ease.outCubic(range(t, o.t0 + 0.05, o.t0 + 0.6));
            o.meias.forEach((g, k) => { const s = k ? 1 : -1; g.scale.setScalar(Math.max(0.0001, ap)); g.position.set(o.x + s * sp * 0.28, Math.sin(t * 1.4 + i) * 0.03 + 0.25, 0); g.rotation.y = s * sp * 0.35; g.rotation.z = -s * sp * 0.05; });
            fendas[i].material.opacity = Math.sin(Math.PI * range(t, o.t0, o.t0 + 0.5)) * 0.9;
          });
          // travelling lateral rápido acompanhando as palavras
          const e = ease.inOutSine(range(t, 0.9, 2.6));
          cam.position.set(lerp(-2.3, 1.9, e), lerp(1.5, 1.25, e), lerp(4.1, 4.4, e));
          cam.lookAt(lerp(-1.9, 1.7, e), -0.15, 0);
          st.vel = Math.abs(Math.sin(Math.PI * e)) * 0.5; st.velT = t;
          st.sol(0, 0, 5);
          st.draw();
          const c = st.ctx, a = COPIA.vis(st);
          objs.forEach((o) => COPIA.tag(c, cam, v.set(o.x, 1.35, 0), o.nome, { cor: COPIA.LARANJA, a: a * range(t, o.t0, o.t0 + 0.2), dx: 0, dy: -120 }));
        }
