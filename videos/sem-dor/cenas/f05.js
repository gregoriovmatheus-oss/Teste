/*META {"imports": ["dor"], "css": "    [data-composition-id=\"f05\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f05\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f05\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f05\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f05\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 3.05, "ate": 4.84, "sai": false, "texto": "A queimadura cresce em <span class=\"y\">silêncio</span>"}], "D0": 4.84} */
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#07080b", "#121318"], nevoa: [2, 9], corNevoa: "#0b0c10", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.4; st.key.intensity = 1.8; st.rim.intensity = 1.6;
        // cooktop de vidro preto
        const vid = new THREE.Mesh(new THREE.BoxGeometry(4, 0.04, 3), new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.08, metalness: 0.3 })); vid.position.y = -0.02; S.add(vid);
        const fogo = DOR.boca(S, 0, 0.004, 0.15);
        const m = DOR.mao({ escala: 0.55 }); m.g.position.set(0.05, 0.1, -0.42); m.g.rotation.y = -0.12; S.add(m.g);
        // nervo do dedo ao punho: o sinal sai e morre no caminho (sem reflexo)
        const ner = new THREE.CatmullRomCurve3([new THREE.Vector3(0.0, 0.17, 0.12), new THREE.Vector3(0.02, 0.2, -0.2), new THREE.Vector3(0.05, 0.22, -0.55), new THREE.Vector3(0.07, 0.2, -1.0)]);
        const nm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7cc8ff).multiplyScalar(1.4), toneMapped: false, transparent: true, opacity: 0, depthTest: false });
        const nt = new THREE.Mesh(new THREE.TubeGeometry(ner, 30, 0.006, 5), nm); nt.renderOrder = 4; S.add(nt);
        const pu = DOR.glowSprite(0xff8a4c, 0.18, 0); S.add(pu);
        // fumaça fina subindo das pontas dos dedos
        const R = mulberry32(55), NF = 260, fb = new Float32Array(NF * 4), fa = new Float32Array(NF * 3);
        for (let i = 0; i < NF; i++) { fb[i * 4] = (R() - 0.5) * 0.35; fb[i * 4 + 1] = R(); fb[i * 4 + 2] = 0.05 + (R() - 0.3) * 0.25; fb[i * 4 + 3] = R() * 6; }
        const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(fa, 3));
        const fum = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xb8b0a8, size: 0.035, transparent: true, opacity: 0, depthWrite: false, map: DOR.glowTex() })); S.add(fum);
        const ponta = new THREE.Vector3();
        function render(t) {
          fogo.set(0.85 + 0.1 * Math.sin(t * 7));
          const qk = ease.inOutSine(range(t, 1.9, 4.84)); m.queima(qk);
          // dedos se apoiam e não se mexem
          m.dedos.forEach((d, i) => { d.rotation.x = 0.18 + 0.02 * Math.sin(i); });
          nm.opacity = range(t, 0.5, 0.8) * (1 - range(t, 1.6, 2.2) * 0.75);
          const q = range(t, 0.7, 1.5); pu.position.copy(ner.getPointAt(q * 0.5)); pu.material.opacity = q > 0 ? (1 - q) : 0; pu.scale.setScalar(0.18 * (1 - q * 0.7));
          const fp = fum.geometry.attributes.position;
          for (let i = 0; i < NF; i++) { const life = (fb[i * 4 + 1] + t * 0.25) % 1; fp.setXYZ(i, fb[i * 4] + Math.sin(t * 1.3 + fb[i * 4 + 3]) * 0.05 * life, 0.1 + life * 0.9, fb[i * 4 + 2] + life * 0.05); }
          fp.needsUpdate = true; fum.material.opacity = 0.45 * qk;
          // macro: desliza e aproxima da ponta dos dedos
          const e = ease.inOutSine(range(t, 0, 4.84));
          cam.position.set(lerp(1.5, 0.8, e), lerp(1.1, 0.85, e), lerp(2.0, 1.5, e));
          cam.lookAt(0.0, lerp(-0.55, -0.62, e), lerp(-0.1, 0.0, e));
          st.bloom = 0.75;
          st.sol(0, 0, 2);
          st.draw();
          const c = st.ctx, vv = DOR.vis(st); DOR.quadro();
          m.pontas[1].getWorldPosition(ponta);
          DOR.frase(c, cam, ner.getPointAt(0.5), "REFLEXO: DESLIGADO", range(t, 1.48, 1.65) * (1 - range(t, 2.75, 2.95)) * vv, { cor: DOR.LARANJA, tam: 28, dy: 120 });
        }
