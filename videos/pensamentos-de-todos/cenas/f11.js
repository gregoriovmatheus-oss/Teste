/*META {"imports": ["mente"], "rotulos": [{"de": 2.8, "ate": 5.62, "texto": "O <span class=\"y\">silêncio</span> viraria<br>a coisa mais rara"}], "D0": 5.62} */
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#070a16", "#1a2036"], nevoa: [14, 80], corNevoa: "#121626", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        const rua = MENTE.ruaNoite(S, { len: 140, larg: 10, seed: 1101, luz: 1.1 });
        st.key.color.set(0xa9c2ff); st.key.intensity = 1.2; st.hemi.intensity = 0.4;
        const R = mulberry32(1102), L = [{ x: 0.6, z: -5, vx: 0, vz: 1.15, ry: 0, sent: 0, cor: 0xe8e2d4 }];
        for (let i = 0; i < 34; i++) { const vz = (R() - 0.5) * 1.2; L.push({ x: (R() - 0.5) * 14, z: -9 - R() * 16, vx: 0, vz, ry: vz > 0 ? 0 : Math.PI, sent: 0 }); }
        const p = MENTE.povo(S, L, { seed: 1103, leve: true });
        const f = MENTE.fios(S, L.length, { seed: 1104, alt: 1.3, np: 40 });
        const cab = L.map(() => new THREE.Vector3());
        function render(t) {
          p.update(t, {});
          const sil = range(t, 2.6, 5.2);
          f.update(t, (i) => { p.cabeca(i, t, cab[i]); return i ? { p: cab[i], a: 0.9 * (1 - 0.8 * sil), cor: i % 2 ? MENTE.COR.laranja : MENTE.COR.azul, tumulto: 0.6 * (1 - sil) } : { p: cab[i], a: 0.35, cor: MENTE.COR.azul, alt: 0.6 }; });
          st.bloom = 0.65;
          // grua: na frente de quem sai, recuando e subindo, a multidão ficando para trás
          const e = ease.inOutSine(range(t, 0, 5.62)), zp = -5 + 1.15 * t;
          cam.position.set(lerp(2.2, 3.4, e), lerp(1.7, 6.5, e), zp + lerp(4.5, 9.5, e));
          cam.lookAt(0.3, lerp(1.4, 0.8, e), zp - lerp(2, 7, e));
          st.sol(0, zp, 20);
          st.draw();
        }
