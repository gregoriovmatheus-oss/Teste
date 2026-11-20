/*META {"imports": ["mente"], "rotulos": [], "D0": 3.43} */
        const st = T.createToyStage(canvas, { fov: 42, ceu: ["#05060c", "#100a12"], nevoa: [5, 20], corNevoa: "#07060c", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xcfe0ff); st.key.intensity = 1.6; st.hemi.intensity = 0.25; st.rim.color.set(0xff8a4c); st.rim.intensity = 1.4;
        const piso = new THREE.Mesh(new THREE.CircleGeometry(14, 48), T.M(0x15161c, 0.4, { metalness: 0.2 })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        const R = mulberry32(1001), L = [{ x: 0, z: 0, ry: 0, sent: 0, cor: 0xe8e2d4 }];
        for (let i = 0; i < 22; i++) { const a = (i / 22) * 6.283 + R() * 0.2, r = 1.6 + R() * 2.6, x = Math.cos(a) * r, z = Math.sin(a) * r - 0.5; L.push({ x, z, ry: R() * 6.28, sent: 0 }); }
        const p = MENTE.povo(S, L, { seed: 1002 });
        p.tinta((i) => (i ? 0.45 : 1.1));
        const f = MENTE.fios(S, L.length, { seed: 1003, alt: 1.6, np: 60 });
        const cab = L.map(() => new THREE.Vector3());
        function render(t) {
          p.update(t, {});
          const perde = range(t, 1.5, 2.8);
          f.update(t, (i) => { p.cabeca(i, t, cab[i]); return i ? { p: cab[i], a: 0.6 + 0.4 * perde, cor: i % 3 ? MENTE.COR.laranja : MENTE.COR.branco, tumulto: 0.6 + 0.8 * perde } : { p: cab[i], a: 1.3 * (1 - 0.85 * perde), cor: MENTE.COR.azul, alt: 1.2 }; });
          st.bloom = 0.8;
          st.blur = perde * 0.8;
          const e = ease.inOutSine(range(t, 0, 3.43));
          cam.position.set(lerp(1.2, 0.4, e), lerp(3.4, 2.3, e), lerp(7.5, 3.6, e));
          cam.lookAt(0, lerp(1.5, 1.85, e), 0);
          st.sol(0, 0, 8);
          st.draw();
          const c = st.ctx, vv = MENTE.vis(st); MENTE.quadro();
          const s = MENTE.embaralha("O QUE EU IA DIZER MESMO?", range(t, 1.6, 2.7), 7 + Math.floor(t * 12));
          MENTE.frase(c, cam, cab[0].clone().add(new THREE.Vector3(0, 0.5, 0)), s, range(t, 0.3, 0.6) * (1 - range(t, 2.6, 3.2)) * vv, { cor: MENTE.AZUL, tam: 32, ymin: 520 });
        }
