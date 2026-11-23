/*META {"imports": ["dor"], "css": "    [data-composition-id=\"f04\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f04\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f04\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f04\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f04\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [], "D0": 5.68} */
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#0c1018", "#1c2330"], nevoa: [6, 22], corNevoa: "#121824", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.45; st.key.intensity = 1.6; st.rim.color.set(0x9fd6ff); st.rim.intensity = 2.4;
        const ban = DOR.bancada(S, { larg: 3, prof: 1.0, alt: 0.92, x: 0.9, z: 0, parede: false }); ban.rotation.y = Math.PI / 2;
        const pan = DOR.panela(); pan.position.set(0.95, 0.92, 0.25); pan.rotation.y = Math.PI; S.add(pan);
        const fogo = DOR.boca(S, 0.95, 0.925, 0.25);
        // pessoa em silhueta escura, de perfil (olha para +x)
        const h = A.createAnimal("humano", { cor: 0x2b3240, cor2: 0x1f2530, cabelo: 0x15181e }); S.add(h.group);
        const braco = h.arms[0];
        // via do reflexo: dedo → nervo do braço → medula (pescoço) → volta ao músculo; ramo lento até o cérebro
        const P = (x, y, z) => new THREE.Vector3(x, y, z);
        const matL = (c) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0, depthTest: false });
        const tubo = (pts, c, r = 0.012) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 5), matL(c)); m.renderOrder = 5; S.add(m); return m; };
        const medula = tubo([P(-0.14, 0.95, 0.0), P(-0.16, 1.25, 0.0), P(-0.13, 1.55, 0.0)], 0x7cc8ff, 0.02);
        const cer = tubo([P(-0.13, 1.55, 0), P(-0.08, 1.68, 0), P(0.0, 1.8, 0)], 0x7cc8ff, 0.01);
        const cerebro = DOR.glowSprite(0x7cc8ff, 0.5, 0); cerebro.position.set(0, 1.82, 0); S.add(cerebro);
        const nodo = DOR.glowSprite(0x7cc8ff, 0.4, 0); nodo.position.set(-0.13, 1.5, 0); S.add(nodo);
        const pul = [0, 1, 2].map((i) => { const s = DOR.glowSprite(i === 2 ? 0x7cc8ff : 0xff8a4c, 0.28, 0); S.add(s); return s; });
        const calor = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xffb070, size: 0.025, transparent: true, opacity: 0.5, depthWrite: false }));
        { const R = mulberry32(44), a = new Float32Array(240 * 3); for (let i = 0; i < 240; i++) { a[i * 3] = 0.95 + (R() - 0.5) * 0.7; a[i * 3 + 1] = R(); a[i * 3 + 2] = 0.25 + (R() - 0.5) * 0.7; } calor.geometry.setAttribute("position", new THREE.BufferAttribute(a, 3)); calor.userData.b = a.slice(); S.add(calor); }
        const mao = new THREE.Vector3(), cot = new THREE.Vector3(), omb = new THREE.Vector3(0, 1.47, 0.3);
        const ponto = (k, out) => { braco.updateMatrixWorld(true); return out.set(0, -0.66 * k, 0).applyMatrix4(braco.matrixWorld); };
        let ida = null, volta = null, lenta = null;
        function curvas() {
          ponto(1, mao); ponto(0.5, cot);
          ida = new THREE.CatmullRomCurve3([mao.clone(), cot.clone(), omb.clone(), P(-0.13, 1.5, 0.05)]);
          volta = new THREE.CatmullRomCurve3([P(-0.13, 1.5, 0.05), omb.clone(), cot.clone().add(P(0, 0.03, 0))]);
          lenta = new THREE.CatmullRomCurve3([P(-0.13, 1.5, 0), P(-0.08, 1.68, 0), P(0, 1.82, 0)]);
        }
        let nervoBraco = null;
        function render(t) {
          // mão vai à panela (toca em 1,9 s), reflexo puxa em 2,9 s
          const vai = ease.inOutSine(range(t, 0.4, 1.9)), puxa = ease.outCubic(range(t, 2.88, 3.15));
          braco.rotation.z = lerp(0.15, 1.02, vai) - puxa * 0.95;
          braco.rotation.x = -0.15 * vai;
          h.update(0, {}); braco.rotation.z = lerp(0.15, 1.02, vai) - puxa * 0.95;
          h.group.updateMatrixWorld(true);
          curvas();
          if (nervoBraco) { S.remove(nervoBraco); nervoBraco.geometry.dispose(); }
          nervoBraco = new THREE.Mesh(new THREE.TubeGeometry(ida, 30, 0.012, 5), matL(0xff8a4c)); nervoBraco.renderOrder = 5; S.add(nervoBraco);
          const mostra = range(t, 1.7, 2.0);
          nervoBraco.material.opacity = mostra * 0.85; medula.material.opacity = mostra; cer.material.opacity = mostra * 0.5;
          fogo.set(0.9 + 0.1 * Math.sin(t * 9));
          const ca = calor.geometry.attributes.position, b0 = calor.userData.b;
          for (let i = 0; i < ca.count; i++) { ca.setY(i, 0.95 + ((b0[i * 3 + 1] + t * 0.35) % 1) * 0.6); ca.setX(i, b0[i * 3] + Math.sin(t * 2 + i) * 0.02); }
          ca.needsUpdate = true;
          // sinais: dor sobe (1,95–2,45), ordem volta (2,45–2,85), aviso lento ao cérebro (2,45–4,5)
          const q1 = range(t, 1.95, 2.45), q2 = range(t, 2.45, 2.85), q3 = range(t, 2.5, 4.5);
          pul[0].position.copy(ida.getPointAt(q1)); pul[0].material.opacity = q1 > 0 && q1 < 1 ? 1 : 0;
          pul[1].position.copy(volta.getPointAt(q2)); pul[1].material.opacity = q2 > 0 && q2 < 1 ? 1 : 0;
          pul[2].position.copy(lenta.getPointAt(q3)); pul[2].material.opacity = q3 > 0 && q3 < 1 ? 0.8 : 0;
          nodo.material.opacity = range(t, 2.4, 2.5) * (1 - range(t, 3.2, 4.0) * 0.6);
          cerebro.material.opacity = range(t, 4.4, 4.6) * 0.9;
          // órbita lenta de perfil para 3/4
          const e = ease.inOutSine(range(t, 0, 5.68));
          const ang = lerp(1.2, 0.8, e), r = lerp(4.6, 4.0, e);
          cam.position.set(lerp(-0.3, 0.3, e), lerp(1.7, 1.5, e), lerp(5.6, 4.9, e));
          cam.lookAt(0.32, lerp(1.0, 1.1, e), 0.1);
          st.bloom = 0.7;
          st.sol(0.3, 0, 4, 1);
          st.draw();
          const c = st.ctx, vv = DOR.vis(st); DOR.quadro();
          DOR.frase(c, cam, pan.position.clone().add(P(0.1, 0.3, 0)), "QUENTE", range(t, 1.92, 2.1) * (1 - range(t, 3.3, 3.5)) * vv, { cor: DOR.LARANJA, tam: 28, dy: 60 });
          DOR.frase(c, cam, P(-0.13, 1.5, 0), "MEDULA", range(t, 2.45, 2.6) * vv, { cor: DOR.AZUL, tam: 30, dy: 80 });
          DOR.frase(c, cam, P(0, 1.82, 0), "CÉREBRO · DEPOIS", range(t, 4.48, 4.65) * vv, { cor: DOR.AZUL, tam: 28, dy: 160 });
        }
