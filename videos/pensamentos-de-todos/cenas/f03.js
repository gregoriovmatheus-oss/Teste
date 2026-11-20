/*META {"imports": ["mente"], "rotulos": [{"de": 4.0, "ate": 5.85, "texto": "<span class=\"k\">EM VOZ ALTA</span><br><span class=\"y\">150</span> palavras/min"}, {"de": 6.05, "ate": 8.7, "texto": "Curto, rápido e<br><span class=\"y\">embaralhado</span>"}], "D0": 8.7} */
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#04060c", "#0a1020"], nevoa: [8, 30], corNevoa: "#060912", nuvens: 0, exposicao: 1 });
        const S = st.scene, cam = st.cam;
        const R = mulberry32(303);
        // rede de neurônios ao fundo: nós + ligações, faíscas correndo
        const NN = 140, np = new Float32Array(NN * 3);
        for (let i = 0; i < NN; i++) { np[i * 3] = (R() - 0.5) * 16; np[i * 3 + 1] = (R() - 0.5) * 14; np[i * 3 + 2] = -4 - R() * 8; }
        const ng = new THREE.BufferGeometry(); ng.setAttribute("position", new THREE.BufferAttribute(np, 3));
        const nodes = new THREE.Points(ng, new THREE.PointsMaterial({ map: MENTE.glowTex(), size: 0.35, color: 0x5d8fd0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
        S.add(nodes);
        const lp = [], E = [];
        for (let i = 0; i < NN; i++) for (let j = i + 1; j < NN; j++) {
          const d = Math.hypot(np[i * 3] - np[j * 3], np[i * 3 + 1] - np[j * 3 + 1], np[i * 3 + 2] - np[j * 3 + 2]);
          if (d < 2.6) { lp.push(np[i * 3], np[i * 3 + 1], np[i * 3 + 2], np[j * 3], np[j * 3 + 1], np[j * 3 + 2]); E.push([i, j]); }
        }
        const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
        const lm = new THREE.LineBasicMaterial({ color: 0x2f5a8a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
        S.add(new THREE.LineSegments(lg, lm));
        const NSP = 160, spp = new Float32Array(NSP * 3), spg = new THREE.BufferGeometry(); spg.setAttribute("position", new THREE.BufferAttribute(spp, 3));
        const spm = new THREE.PointsMaterial({ map: MENTE.glowTex(), size: 0.3, color: 0xbfe4ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
        S.add(new THREE.Points(spg, spm));
        const SPK = Array.from({ length: NSP }, () => [Math.floor(R() * E.length), R(), 0.6 + R()]);
        // fala: forma de onda lenta e suave (azul) / pensamento: rajadas embaralhadas (laranja)
        const NB = 64, voz = MENTE.barras(S, NB, { larg: 0.075, prof: 0.075 }), pen = MENTE.barras(S, NB, { larg: 0.075, prof: 0.075 });
        const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
        // linha-base das duas trilhas
        const base = (y, cor) => { const m = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.5, toneMapped: false })); m.position.set(0, y, 0); S.add(m); return m; };
        const b1 = base(1.25, 0x7cc8ff), b2 = base(-1.95, 0xff8a4c);
        const PAL = ["SERÁ", "BOLETO", "ELA", "FOME", "AMANHÃ", "CHAVE", "NÃO", "MÃE", "PRAZO", "LA LA", "FRIO", "VERGONHA", "E SE", "PIZZA"];
        function render(t) {
          // faíscas na rede (a mente nunca para)
          SPK.forEach(([e, o, vv], k) => { const [i, j] = E[e], u = ((t * vv * 0.8 + o) % 1 + 1) % 1; for (let c = 0; c < 3; c++) spp[k * 3 + c] = lerp(np[i * 3 + c], np[j * 3 + c], u); });
          spg.attributes.position.needsUpdate = true;
          lm.opacity = 0.25 + 0.15 * Math.sin(t * 2);
          const aV = range(t, 2.2, 2.9), aP = range(t, 5.9, 6.3);
          b1.material.opacity = 0.5 * aV; b2.material.opacity = 0.5 * aP;
          for (let i = 0; i < NB; i++) {
            const x = (i / (NB - 1) - 0.5) * 5.0;
            // voz: envelope de sílabas lento (~2,5 sílabas/s), deslizando devagar
            const s = Math.abs(Math.sin(x * 1.6 - t * 1.4)) * (0.55 + 0.45 * Math.sin(x * 0.7 - t * 0.6)) * 0.55 * aV;
            voz.set(i, x, 1.25, 0, 0.02 + s, [0.49 * 1.6, 0.78 * 1.6, 1.6]);
            // pensamento: rajadas curtas, rápidas e caóticas (troca 24×/s)
            const q = Math.floor(t * 24), r1 = hash(i, q), burst = hash(Math.floor(i / 6), Math.floor(t * 7)) > 0.45 ? 1 : 0.2;
            pen.set(i, x, -1.95, 0, (0.03 + r1 * 1.25 * burst) * aP, [1.7, 0.92, 0.5]);
          }
          voz.fim(); pen.fim();
          st.bloom = 0.85;
          // travelling lateral lento + push-in; no fim desce para a trilha do pensamento
          const e = ease.inOutSine(range(t, 0, 8.7)), e2 = ease.inOutSine(range(t, 5.6, 7.2));
          cam.position.set(lerp(-1.6, 1.0, e), lerp(0.6, -0.5, e2) + Math.sin(t * 0.5) * 0.08, lerp(10.5, 8.2, e));
          cam.lookAt(lerp(-0.4, 0.3, e), lerp(0.2, -0.8, e2), 0);
          st.draw();
          const c = st.ctx, vv = MENTE.vis(st);
          const [vx, vy] = MENTE.proj(new THREE.Vector3(-2.5, 1.25, 0), cam), [px, py] = MENTE.proj(new THREE.Vector3(-2.5, -1.95, 0), cam);
          MENTE.txt(c, "FALA", vx, vy - 120, { tam: 28, cor: MENTE.AZUL, al: "left", a: aV * vv, esp: 0.3 });
          MENTE.txt(c, "150 PALAVRAS/MIN", vx, vy + 120, { tam: 26, cor: "#cfe6ff", al: "left", a: range(t, 4.04, 4.3) * vv, esp: 0.15 });
          MENTE.txt(c, "PENSAMENTO", px, py - 260, { tam: 28, cor: MENTE.LARANJA, al: "left", a: aP * vv, esp: 0.3 });
          // palavras soltas do pensamento, embaralhadas, aparecendo e sumindo rápido
          if (t > 6.0) for (let k = 0; k < 9; k++) {
            const q = Math.floor(t * 6 + k * 0.37), r = mulberry32(q * 31 + k * 7);
            const w = PAL[Math.floor(r() * PAL.length)], u = (t * 6 + k * 0.37) % 1;
            MENTE.txt(c, MENTE.embaralha(w, range(t, 7.2, 8.2) * 0.8, q + k), 120 + r() * 840, py + 140 + r() * 300, { tam: 30 + r() * 26, cor: r() < 0.5 ? "#ffd2b8" : MENTE.LARANJA, a: Math.sin(Math.PI * u) * vv * 0.95 });
          }
        }
