/*META {"imports": ["mente"], "rotulos": [{"de": 1.8, "ate": 4.6, "texto": "<span class=\"k\">ESTUDO COM 2.250 PESSOAS</span><br><span class=\"y\">47%</span> do tempo<br>divagando"}, {"de": 5.4, "ate": 6.84, "texto": "A mente <span class=\"y\">divaga</span>"}], "D0": 6.84} */
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#1b2440", "#d98a5a"], nevoa: [18, 95], corNevoa: "#5e4656", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        const rua = MENTE.ruaNoite(S, { len: 140, larg: 10, seed: 801, luz: 0.9 });
        st.key.color.set(0xffb07a); st.key.intensity = 2.0; st.hemi.intensity = 0.5;
        const R = mulberry32(802), N = 30, L = [];
        for (let i = 0; i < N; i++) {
          const vz = (R() < 0.5 ? 1 : -1) * (0.9 + R() * 0.5), x = (R() - 0.5) * 13, z = -16 + R() * 26;
          L.push({ x, z, vx: 0, vz, ry: vz > 0 ? 0 : Math.PI, sent: 0 });
        }
        const p = MENTE.povo(S, L, { seed: 803 });
        // 47% divagam: 14 de 30 (escolhidos por sorteio fixo)
        const ord = L.map((q, i) => [i, R()]).sort((a, b) => a[1] - b[1]), DIV = new Set(ord.slice(0, 14).map((a) => a[0]));
        const tex = MENTE.bolhaTex();
        const B = L.map((q, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xcfe9ff, transparent: true, depthWrite: false, fog: false, opacity: 0 })); s.scale.setScalar(0.75); S.add(s); return s; });
        const cab = L.map(() => new THREE.Vector3()), bp = L.map(() => new THREE.Vector3());
        const cAz = new THREE.Color(0xa9dcff), cLa = new THREE.Color(0xff9a5c), tmp = new THREE.Color();
        function render(t) {
          p.update(t, {});
          const d1 = ease.inOutSine(range(t, 1.85, 3.4)), d2 = ease.inOutSine(range(t, 5.4, 6.8));
          B.forEach((s, i) => {
            p.cabeca(i, t, cab[i]);
            const dv = DIV.has(i) ? 1 : 0, ph = i * 1.9, dd = dv * (d1 * 0.8 + d2 * 0.9);
            bp[i].set(cab[i].x + Math.sin(ph + t * 0.6) * 1.6 * dd, cab[i].y + 0.55 + 1.5 * dd + Math.sin(t * 2 + ph) * 0.05, cab[i].z + Math.cos(ph) * 0.8 * dd);
            s.position.copy(bp[i]);
            s.material.opacity = 0.9 * range(t, 0.2 + (i % 7) * 0.08, 0.6 + (i % 7) * 0.08);
            s.material.color.copy(tmp.copy(cAz).lerp(cLa, dv * d1));
            s.scale.setScalar(0.75 * (1 - 0.2 * dd));
          });
          st.bloom = 0.6;
          // travelling lateral ao lado da multidão
          const e = ease.inOutSine(range(t, 0, 6.84));
          cam.position.set(lerp(8.5, 4.5, e), lerp(3.6, 3.0, e), lerp(9, 1, e));
          cam.lookAt(lerp(0, -0.5, e), lerp(1.8, 2.0, e), lerp(-1, -7, e));
          st.sol(0, -2, 18);
          st.draw();
          // fio pontilhado: o pensamento solto, longe de quem pensa
          const c = st.ctx, vv = MENTE.vis(st);
          c.save(); c.setLineDash([6, 8]); c.lineWidth = 2; c.strokeStyle = MENTE.LARANJA; c.globalAlpha = 0.7 * vv * d1;
          DIV.forEach((i) => { const [x0, y0, z0] = MENTE.proj(cab[i], cam), [x1, y1] = MENTE.proj(bp[i], cam); if (z0 < 1) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); } });
          c.restore();
        }
