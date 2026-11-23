/*META {"imports": ["hiber", "terra"], "rotulos": [{"de": 1.38, "ate": 4.03, "texto": "Nave <span class=\"y\">⅓ menor</span>"}], "D0": 4.03, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#000000", "#02030a"], nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.15; st.rim.intensity = 0.6; st.rim.color.set(0x7cc8ff); st.key.intensity = 2.6; st.key.color.set(0xfff4e0);
        S.add(TERRA.createCeu({ seed: 9, n: 4000, via: 0.4 }));
        const nv = HIBER.nave(T.M); S.add(nv.g);
        const fant = HIBER.nave(T.M), fm = new THREE.MeshBasicMaterial({ color: 0x7cc8ff, wireframe: true, transparent: true, opacity: 0.35, toneMapped: false });
        fant.g.traverse((o) => { if (o.isMesh) o.material = fm; }); fant.motor.visible = false; fant.g.scale.setScalar(0.3); fant.g.position.set(0, 2.2, 0); S.add(fant.g);
        // carga: caixas de comida (laranja) e tambores de água (azul) ao lado
        const RR = mulberry32(91), NC = 24;
        const cx = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), T.M(0xc8823a, 0.6), NC);
        const ag = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.17, 12), T.M(0x3a7ac8, 0.35, { metalness: 0.4 }), NC);
        const PC = Array.from({ length: NC }, (_, i) => [-1.2 + (i % 8) * 0.13, 1.5 - Math.floor(i / 8) * 0.17, 0.3, RR()]);
        const PA = Array.from({ length: NC }, (_, i) => [0.1 + (i % 8) * 0.13, 1.5 - Math.floor(i / 8) * 0.19, 0.3, RR()]);
        S.add(cx, ag);
        const o3 = new THREE.Object3D();
        const setI = (im, L, t0, t) => { L.forEach(([x, y, z, r], i) => { const s = 1 - ease.inCubic(range(t, t0 + r * 0.4, t0 + r * 0.4 + 0.35)) * (i % 3 === 0 ? 0 : 1); o3.position.set(x, y, z); o3.rotation.set(r, r * 2, 0); o3.scale.setScalar(Math.max(s, 1e-4)); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); }); im.instanceMatrix.needsUpdate = true; };
        function render(t) {
          const k = ease.inOutCubic(range(t, 1.38, 2.0)), s = lerp(1, 0.667, k);
          nv.g.scale.setScalar(0.3 * s); nv.g.position.set(0.2 * (1 - s), 2.2, 0); fm.opacity = 0.15 + 0.35 * k;
          nv.motor.material.opacity = 0.8 + 0.2 * Math.sin(t * 20);
          setI(cx, PC, 2.63, t); setI(ag, PA, 3.36, t);
          const e = ease.inOutSine(range(t, 0, 4.03));
          cam.position.set(lerp(0.9, -0.6, e), lerp(1.3, 0.9, e), lerp(8.0, 7.2, e));
          cam.lookAt(-0.07, 0.3, 0);
          st.bloom = 0.6; st.draw();
          const c = st.ctx, vv = HIBER.vis(st), [x1, y1] = HIBER.proj(new THREE.Vector3(-0.75, 1.02, 0.3), cam), [x2, y2] = HIBER.proj(new THREE.Vector3(0.55, 1.02, 0.3), cam);
          HIBER.txt(c, "− COMIDA", x1, y1, { tam: 26, cor: HIBER.LARANJA, a: vv * range(t, 2.97, 3.2), esp: 0.2 });
          HIBER.txt(c, "− ÁGUA", x2, y2, { tam: 26, cor: HIBER.AZUL, a: vv * range(t, 3.49, 3.7), esp: 0.2 });
        }
