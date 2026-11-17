/*META {"rotulos": [{"de": 0.6, "ate": 3.2, "texto": "MILHÕES NO <span class=\"y\">OCEANO</span>"}], "D0": 6.13} */
        const st = T.createToyStage(canvas, { fov: 55, ceu: ["#2E86A8", "#0B3550"], nevoa: [6, 75], corNevoa: "#185a7a", luz: 0.9, nuvens: 0 });
        const S = st.scene, cam = st.cam;
        const bgMar = S.background, bgCeu = T.gradTex("#6FB6CC", "#D7EBE6");
        st.hemi.color.setHex(0xbfe8ff);
        const agua = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x3aa0c8, transparent: true, opacity: 0.75, roughness: 0.2, side: THREE.DoubleSide }));
        agua.rotation.x = -Math.PI / 2; S.add(agua);
        const areia = T.mesh(new THREE.PlaneGeometry(600, 600), 0xe8cf9a, S, 0.95); areia.rotation.x = -Math.PI / 2; areia.position.y = -26;
        const rr = mulberry32(61);
        for (let i = 0; i < 26; i++) { const k = T.mesh(T.SPH, [0x4f8f45, 0xd9583b, 0xe9a3a0, 0x7dbb5a][i % 4], S); k.scale.set(0.6 + rr(), 1 + rr() * 2.2, 0.6 + rr()); k.position.set((rr() - 0.5) * 50, -26, -10 - rr() * 50); }
        const baleia = A.createAnimal("baleia", { fase: 0.1 }); S.add(baleia.group);
        const golf = [0, 1, 2].map((i) => { const d = A.createAnimal("golfinho", { fase: i * 0.3 }); d.group.scale.setScalar(1.6); S.add(d.group); return d; });
        const polvo = A.createAnimal("polvo", { fase: 0.2 }); polvo.group.scale.setScalar(1.6); S.add(polvo.group);
        const cores = [T.PAL.amarelo, 0xf6f1e8, T.PAL.tijolo, 0x6fafa6];
        const peixes = Array.from({ length: 34 }, (_, i) => { const f = A.createAnimal("peixe", { cor: cores[i % 4], fase: rr() }); f.group.scale.setScalar(1.6); f.o = [rr() - 0.5, rr() - 0.5, rr() - 0.5, rr() * 6]; S.add(f.group); return f; });
        const bolhas = Array.from({ length: 30 }, () => { const b = new THREE.Mesh(T.SPH, T.M(0xdff6ff, 0.2, { transparent: true, opacity: 0.6 })); b.o = [(rr() - 0.5) * 20, rr() * 30, -4 - rr() * 20, 0.08 + rr() * 0.15]; S.add(b); return b; });
        function render(t) {
          baleia.group.position.set(-13 + t * 2.4, -13 + Math.sin(t * 0.8) * 0.5, -24);
          baleia.group.rotation.z = Math.sin(t * 0.8) * 0.05;
          baleia.update(t, { nada: 0.45 });
          golf.forEach((d, i) => { const x = 14 - t * 5 - i * 3; d.group.position.set(x, -6 - i * 1.5 + Math.sin(t * 2 + i) * 1.2, -10 - i * 2); d.group.rotation.y = Math.PI; d.group.rotation.z = -Math.cos(t * 2 + i) * 0.4; d.update(t, { nada: 1.6 }); });
          polvo.group.position.set(4, -26, -16); polvo.group.rotation.y = 0.8 + t * 0.2; polvo.update(t, {});
          peixes.forEach((f, i) => { const [a, b, c, ph] = f.o; const ang = t * 0.5 + a * 2; f.group.position.set(-3 + Math.cos(ang) * (7 + a * 4) + b * 3, -9 + b * 5 + Math.sin(t * 2 + ph) * 0.3, -14 + Math.sin(ang) * (5 + c * 3)); f.group.rotation.y = -ang - Math.PI / 2; f.update(t, { nada: 3 }); });
          bolhas.forEach((b) => { const [x, y0, z, s] = b.o; b.position.set(x + Math.sin(t * 2 + y0) * 0.3, -26 + ((y0 + t * 3) % 26), z); b.scale.setScalar(s); });
          const d = ease.inOutCubic(range(t, 0, 1.6));
          const cy = lerp(-2, -8, d), cz = lerp(8, 6, d) - t * 0.8;
          cam.position.set(Math.sin(t * 0.3) * 2, cy, cz);
          cam.lookAt(0, lerp(-6, -11, d), -20);
          st.sol(0, -16, 40, -12);
          st.draw();
          // linha d'água descendo pela tela (a câmera afunda) e bolhas subindo
          const c = st.ctx;
          if (d < 1) {
            const yl = lerp(-60, 2000, d);
            c.save();
            c.beginPath(); c.moveTo(0, 1920);
            for (let x = 0; x <= 1080; x += 30) c.lineTo(x, yl + Math.sin(x / 70 + t * 9) * 22);
            c.lineTo(1080, 1920); c.closePath();
            const g = c.createLinearGradient(0, yl, 0, yl + 900); g.addColorStop(0, "rgba(255,244,214,0.92)"); g.addColorStop(1, "rgba(140,210,240,0.92)");
            c.fillStyle = g; c.fill();
            c.beginPath(); for (let x = 0; x <= 1080; x += 30) c[x ? "lineTo" : "moveTo"](x, yl + Math.sin(x / 70 + t * 9) * 22);
            c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,0.55)"; c.stroke();
            c.restore();
          }
          const rb = mulberry32(66);
          c.save(); c.lineWidth = 1.5; c.strokeStyle = "rgba(255,255,255,0.6)"; c.fillStyle = "rgba(220,240,255,0.18)";
          for (let i = 0; i < 40; i++) {
            const x0 = rb() * 1080, t0 = rb() * 2.2, sp = 500 + rb() * 700, r = 8 + rb() * 22, u = t - t0;
            if (u < 0 || u > 2.6) continue;
            const y = 1950 - u * sp, x = x0 + Math.sin(u * 5 + i) * 18;
            c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); c.stroke();
          }
          c.restore();
        }
