/*META {"imports": ["hiber", "terra"], "rotulos": [{"de": 3.11, "ate": 3.7, "texto": "Uns <span class=\"y\">7 meses</span>", "sai": true}, {"de": 4.0, "ate": 5.9, "texto": "<span class=\"k\">AGÊNCIA ESPACIAL EUROPEIA</span><br>já <span class=\"y\">estuda</span> isso"}, {"de": 5.99, "ate": 8.24, "texto": "Tripulação <span class=\"y\">dormindo</span><br><span class=\"p\">o caminho todo</span>"}], "D0": 8.24, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#000000", "#02030a"], nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.08; st.rim.intensity = 0.2; st.key.intensity = 2.6; st.key.color.set(0xfff4e0);
        S.add(TERRA.createCeu({ seed: 8, n: 4000, via: 0.5 }));
        const E = await TERRA.createTerra({ raio: 1.2 }); E.group.position.set(-3.2, 4.6, -6); S.add(E.group); E.sol.set(1, 0.2, 0.6); E.aim(-20, 10);
        const ma = HIBER.marte(0.7); ma.position.set(3.4, 4.2, -9); S.add(ma);
        // arco de transferência (pontilhado azul)
        const arco = new THREE.CatmullRomCurve3([E.group.position.clone().add(new THREE.Vector3(1.0, 0.3, 0.5)), new THREE.Vector3(0, 6.2, -4.6), ma.position.clone().add(new THREE.Vector3(-0.8, 0.2, 0.6))]);
        const pts = arco.getPoints(90), dg = new THREE.BufferGeometry().setFromPoints(pts);
        const linha = new THREE.Line(dg, new THREE.LineDashedMaterial({ color: 0x7cc8ff, dashSize: 0.12, gapSize: 0.1, transparent: true, toneMapped: false })); linha.computeLineDistances(); S.add(linha);
        const nv = HIBER.nave(T.M); nv.g.scale.setScalar(0.12); S.add(nv.g);
        // interior: cápsulas
        const S2 = new THREE.Scene(); S2.background = new THREE.Color(0x05070c); S2.environment = S.environment;
        S2.add(new THREE.HemisphereLight(0x9fc8ff, 0x101418, 0.6));
        const kl = new THREE.DirectionalLight(0xcfe6ff, 1.6); kl.position.set(2, 5, 3); S2.add(kl);
        const casco = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 16, 24, 1, true), T.M(0x3a4048, 0.5, { metalness: 0.5, side: THREE.BackSide })); casco.rotation.z = Math.PI / 2; casco.position.y = 1.4; S2.add(casco);
        for (let i = 0; i < 8; i++) { const an = new THREE.Mesh(new THREE.TorusGeometry(3.75, 0.06, 6, 32), T.M(0x6a7480, 0.4, { metalness: 0.7 })); an.rotation.y = Math.PI / 2; an.position.set(-6 + i * 1.7, 1.4, 0); S2.add(an); }
        const caps = [];
        for (let i = 0; i < 4; i++) { const c = HIBER.capsula(T.M, { cabelo: [0x2a1d16, 0x8a6a40, 0x111111, 0x5a3a22][i] }); c.g.position.set(-3.6 + i * 2.4, 0, 0); S2.add(c.g); caps.push(c); }
        const cam2 = new THREE.PerspectiveCamera(58, 1080 / 1920, 0.05, 200);
        const v3 = new THREE.Vector3();
        function render(t) {
          const corte = t >= 3.72;
          if (!corte) {
            const u = 0.08 + 0.5 * ease.inOutSine(range(t, 0, 3.72));
            arco.getPoint(u, v3); nv.g.position.copy(v3); const v4 = arco.getPoint(Math.min(1, u + 0.01)); nv.g.lookAt(v4); nv.g.rotateY(-Math.PI / 2);
            linha.material.opacity = range(t, 1.5, 2.3);
            nv.motor.material.opacity = 0.7 + 0.3 * Math.sin(t * 20);
            const e = ease.inOutSine(range(t, 0, 3.72));
            cam.position.set(lerp(-1.5, 1.2, e), lerp(3.2, 3.6, e), lerp(4.5, 3.6, e));
            cam.lookAt(lerp(-0.6, 1.2, e), 4.6, -6);
            E.group.rotation.y = t * 0.05;
            st.bloom = 0.7; st.draw();
            const c = st.ctx, vv = HIBER.vis(st);
            const [ex, ey] = HIBER.proj(E.group.position, cam), [mx, my] = HIBER.proj(ma.position, cam);
            HIBER.txt(c, "TERRA", ex, ey + 110, { tam: 24, cor: HIBER.AZUL, a: vv * range(t, 0.3, 0.7), esp: 0.3 });
            HIBER.txt(c, "MARTE", mx, my + 80, { tam: 24, cor: HIBER.LARANJA, a: vv * range(t, 2.25, 2.6), esp: 0.3 });
          } else {
            const k = t - 3.72, e = ease.inOutSine(range(k, 0, 4.52));
            caps.forEach((c, i) => (c.faixa.material.emissiveIntensity = 1.6 + 0.8 * Math.sin(t * 1.2 + i)));
            cam2.position.set(lerp(-4.4, 2.6, e), 1.0, 3.1);
            cam2.lookAt(lerp(-4.0, 3.0, e), -0.6, 0);
            st.T = k; st.D = 4.52;   // dip no corte interno
            st.bloom = 0.6; st.draw(S2, cam2);
          }
        }
