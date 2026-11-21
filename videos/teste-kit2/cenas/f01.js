/*META {"imports": ["lowpoly"], "rotulos": [], "D0": 2.99} */
        const LP = LOWPOLY;
        const st = LP.palco(canvas, { foco: 1.38, faixa: 0.5, desfoque: 30 });
        const { S, cam } = st;
        const p = LP.pessoa({ seed: 4 }); S.add(p.root);
        const rr = mulberry32(9);
        for (let i = 0; i < 8; i++) { const o = LP.pessoa({ seed: 20 + i, jaqueta: [0x3d5a80, 0x7a3b3b, 0x4a6b4a, 0x6b5a7a][i % 4], barba: i % 3 === 0 }); o.root.position.set(-2.4 + i * 0.65 + rr() * 0.2, 0, -2.5 - rr() * 2); o.root.rotation.y = (rr() - 0.5) * 1.5; S.add(o.root); }
        S.background = new THREE.Color(0x10141c); LP.bokeh(S, { n: 60, seed: 3, y: [0.5, 4], z: [-14, -4] });
        function render(t) {
          const e = ease.inOutSine(range(t, 0, D));
          p.emocao(t < 1.2 ? "calmo" : "medo", [lerp(0, 0.45, range(t, 1.2, 1.6)), 0.1]);
          p.cab.rotation.set(0.04, lerp(0, -0.25, e), 0.03);
          cam.position.set(lerp(0.35, 0.18, e), 1.66, lerp(1.7, 1.3, e)); cam.lookAt(0.02, 1.56, 0);
          st.draw();
        }
