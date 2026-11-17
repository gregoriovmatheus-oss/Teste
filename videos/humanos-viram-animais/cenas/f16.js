/*META {"imports": ["globe"], "rotulos": [{"de": 4.8, "ate": 7.72, "top": 690, "sai": false, "texto": "<span class=\"p\">E VOCÊ,</span><br>QUAL ANIMAL <span class=\"y\">SERIA?</span>"}], "D0": 7.72} */
        const st = T.createToyStage(canvas, { fov: 50, nevoa: [120, 600] });
        const S = st.scene, cam = st.cam;
        const c = T.cidade({ n: 7, seed: 161, verde: 0.3 }); S.add(c.group);
        const rr = mulberry32(162);
        const nuv = Array.from({ length: 40 }, (_, i) => { const n = T.nuvem(700 + i); n.scale.setScalar(4 + rr() * 5); n.position.set((rr() - 0.5) * 160, 120 + rr() * 90, (rr() - 0.5) * 160); S.add(n); return n; });
        const ele = A.createAnimal("leao", { fase: 0.3 }); ele.group.scale.setScalar(2.2); A.face(ele.group, 0, 1); ele.group.position.set(-18, 0.5, 4); S.add(ele.group);
        const GS = new THREE.Scene();
        const G = GLOBE.createGlobe(GS, { detalhe: 96, destaque: null, marcador: false, onda: null, nuvensAlvo: 0,
          caminho: [{ t: 0, lon: -40, lat: -12, alt: 1.8 }, { t: 4.4, lon: -10, lat: 8, alt: 6.4 }] });
        st.extraWarm = [{ renderer: st.renderer, scene: GS, camera: G.camera }];
        function render(t) {
          if (t < 3.3) {
            const e = ease.inCubic(range(t, 0, 3.3));
            ele.update(t, { passo: 1.1 });
            ele.group.position.z = 4 + t * 0.9;
            cam.position.set(-18 + e * 10, lerp(14, 230, e), 16 + e * 20);
            cam.up.set(0, 0, -1);
            cam.lookAt(-18 + e * 10, 0, 4);
            st.sol(-10, 0, 80);
            st.draw(S, cam, { cor: "#ffffff", a: range(t, 2.4, 3.2) });
          } else {
            const u = t - 3.3;
            G.update(u);
            G.earth.rotation.y += u * 0.04;
            const blk = 0.4 * ease.inOutSine(range(t, 5.6, 7.72));
            st.draw(GS, G.camera, blk > 0 ? { cor: "#000000", a: blk } : { cor: "#ffffff", a: 1 - range(u, 0, 0.6) });
          }
        }
