/*META {"imports": ["quatro"], "rotulos": [{"de": 2.1, "ate": 3.2, "texto": "<span class=\"k\">CÓRTEX MOTOR</span><br>um <span class=\"y\">mapa</span> do corpo"}, {"de": 4.15, "ate": 6.36, "texto": "cada braço novo<br>ganha <span class=\"o\">o seu pedaço</span>"}], "D0": 6.36, "css": "__CSS__"} */
        const Q4 = QUATRO;
        await Q4.prepara();
        const st = Q4.palcoDoc(T, canvas, { fov: 32, ceu: "#04060c" });
        const S = st.scene, cam = st.cam;
        // cérebro estilizado (2 hemisférios facetados, translúcidos)
        const mb = new THREE.MeshStandardMaterial({ color: 0xd9a0a8, emissive: 0x3a1a2a, roughness: 0.5, transparent: true, opacity: 0.82, flatShading: true });
        const B = new THREE.Group(); B.position.set(0, 1.3, 0); S.add(B);
        [-1, 1].forEach((s) => { const h = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 3), mb); h.scale.set(0.5, 0.72, 1.0); h.position.x = s * 0.255; B.add(h); });
        // faixa do córtex motor (arco de orelha a orelha) dividida em pedaços do corpo
        const PEC = [["PÉ", 0.5], ["PERNA", 0.7], ["TRONCO", 0.7], ["BRAÇO", 0.8], ["MÃO", 1.6], ["ROSTO", 1.4], ["BOCA", 1.2]];
        const segs = [], mkSeg = (cor) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.11), new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.5, roughness: 0.4 })); B.add(m); return m; };
        [1, -1].forEach((s) => PEC.forEach(([n, w], i) => segs.push({ m: mkSeg(0x7cc8ff), n, w, s, novo: false, i })));
        [1, -1].forEach((s) => { segs.push({ m: mkSeg(0xff8a4c), n: "BRAÇO 3", w: 0.8, s, novo: true, i: 3.5 }); });
        // homúnculo: mãos e boca grandes (proporcional ao córtex); o 2º par de braços nasce em "cada braço novo"
        const Hm = new THREE.Group(); Hm.position.set(0, 2.25, 0); S.add(Hm);
        const pele = T.M(0xd9a084, 0.6), lar = new THREE.MeshStandardMaterial({ color: 0xff8a4c, emissive: 0xff6a2c, emissiveIntensity: 0.4, roughness: 0.5 });
        const tr = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.18, 3, 8), pele); Hm.add(tr);
        const cb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), pele); cb.position.y = 0.26; Hm.add(cb);
        const boca = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.025, 5, 10), T.M(0xb04050, 0.5)); boca.position.set(0, 0.22, 0.12); Hm.add(boca);
        const braco = (y, s, m, ang) => { const g = new THREE.Group(); g.position.set(s * 0.1, y, 0); g.rotation.z = s * ang; Hm.add(g);
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.22, 5), m); b.position.y = -0.11; g.add(b);
          const mao = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 1), m); mao.scale.set(1, 1.2, 0.55); mao.position.y = -0.26; g.add(mao); return g; };
        [1, -1].forEach((s) => braco(0.1, s, pele, 2.1)); const NOVO = [1, -1].map((s) => braco(-0.02, s, lar, 1.0));
        [1, -1].forEach((s) => { const pn = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.22, 5), pele); pn.position.set(s * 0.05, -0.25, 0); Hm.add(pn); });
        const al = new THREE.Vector3(), tmp = new THREE.Vector3();
        function render(t) {
          // arco: os pedaços se abrem para caber o braço novo (3,6 s → 4,4 s)
          const k = ease.inOutCubic(range(t, 3.6, 4.4)), luz = range(t, 2.1, 2.6);
          segs.forEach((g) => { const lista = segs.filter((x) => x.s === g.s && (!x.novo || k > 0)).sort((a, b) => a.i - b.i);
            const tot = lista.reduce((a, x) => a + x.w * (x.novo ? k : 1), 0); let acc = 0;
            for (const x of lista) { const w = x.w * (x.novo ? k : 1); if (x === g) { acc += w / 2; break; } acc += w; }
            const ang = 0.12 + (acc / tot) * 1.35, R = 0.53;
            g.m.position.set(g.s * Math.sin(ang) * R * 0.62, Math.cos(ang) * R * 0.8 + 0.02, 0.08);
            g.m.rotation.z = -g.s * ang; g.m.scale.set(Math.max(0.001, g.w * (g.novo ? k : 1)) * 1.1, 1, 1);
            g.m.material.emissiveIntensity = g.novo ? 0.6 + 0.6 * Math.sin(t * 6) * k : 0.2 + 0.7 * luz; });
          NOVO.forEach((n) => n.scale.setScalar(Math.max(0.001, ease.outBack(range(t, 3.9, 4.6)))));
          Hm.visible = t > 0.9; Hm.scale.setScalar(ease.outCubic(range(t, 0.9, 1.5)) * 0.95 + 0.001); Hm.rotation.y = 0.4 * Math.sin(t * 0.7);
          B.rotation.y = lerp(-0.5, 0.35, ease.inOutSine(range(t, 0, 6.36)));
          const e = ease.inOutSine(range(t, 0, 6.36));
          cam.position.set(lerp(0.6, -0.3, e), lerp(2.1, 2.3, e), lerp(3.6, 2.9, e)); al.set(0, 1.2, 0); cam.lookAt(al);
          st.bloom = 0.65; st.draw();
          const c = st.ctx;
          const s0 = segs.find((x) => x.n === "MÃO" && x.s === -1), s1 = segs.find((x) => x.novo && x.s === -1);
          Q4.tag(c, "MÃO", s0.m.getWorldPosition(tmp), cam, range(t, 2.6, 2.9) * (1 - range(t, 3.5, 3.7)), { dx: 140, dy: -40 });
          Q4.tag(c, "BRAÇO NOVO", s1.m.getWorldPosition(tmp), cam, range(t, 4.4, 4.7), { cor: Q4.LARANJA, dx: 170, dy: -30 });
        }
