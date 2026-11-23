/*META {"imports": ["hiber"], "rotulos": [{"de": 1.91, "ate": 3.15, "texto": "<span class=\"k\">METABOLISMO</span><br>Cai para <span class=\"y\">¼</span> do normal"}, {"de": 3.22, "ate": 5.63, "texto": "Quase <span class=\"y\">nenhuma</span><br>energia gasta"}], "D0": 5.63, "css": ".rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }\n    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    .rot-t .o { font-weight: 800; color: #ff8a4c; } .rot-t .p { font-size: 60px; }\n    .rot-t .k { display: inline-block; font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n"} */
        await HIBER.prepara();
        const st = T.createToyStage(canvas, { fov: 36, ceu: ["#05070d", "#0d1320"], nevoa: [8, 26], corNevoa: "#0a0f1a", nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        st.key.color.set(0xdfe9ff); st.key.intensity = 1.8; st.hemi.intensity = 0.3; st.rim.color.set(0x7cc8ff);
        const piso = new THREE.Mesh(new THREE.CircleGeometry(12, 48), T.M(0x141a24, 0.35, { metalness: 0.3 })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; S.add(piso);
        const mesa = new THREE.Mesh(T.roundBox(2.4, 0.5, 0.9, 0.12), T.M(0x2a3240, 0.4, { metalness: 0.4 })); S.add(mesa);
        const h = A.createAnimal("humano", { cor: 0x8a9ab0, cor2: 0x3c4c62 }); h.group.rotation.z = -Math.PI / 2; h.group.position.set(-2.1, 0.72, 0); S.add(h.group); mesa.position.x = -1.15;
        h.arms.forEach((a) => (a.rotation.z = 0.05));
        // medidor em arco (270°) atrás da pessoa
        const N = 54, seg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.17, 0.03), new THREE.MeshBasicMaterial({ toneMapped: false }), N);
        const o3 = new THREE.Object3D(), RG = 0.85, CY = 1.25, GX = 1.05;
        for (let i = 0; i < N; i++) { const an = THREE.MathUtils.degToRad(225 - 270 * i / (N - 1)); o3.position.set(GX + Math.cos(an) * RG, CY + Math.sin(an) * RG, 0); o3.rotation.set(0, 0, an - Math.PI / 2); o3.updateMatrix(); seg.setMatrixAt(i, o3.matrix); seg.setColorAt(i, new THREE.Color(0x10161f)); }
        S.add(seg);
        // calor saindo do corpo (partículas laranja subindo)
        const NP = 260, P = new Float32Array(NP * 3), RR = mulberry32(44), J = Array.from({ length: NP }, () => [-1.15 + (RR() - 0.5) * 1.9, (RR() - 0.5) * 0.5, RR(), 0.5 + RR()]);
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(P, 3));
        const pm = new THREE.PointsMaterial({ map: HIBER.glowTex(), color: 0xff8a4c, size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
        S.add(new THREE.Points(pg, pm));
        const cA = new THREE.Color(0x7cc8ff), cB = new THREE.Color(0xff8a4c), cOff = new THREE.Color(0x10161f), cc = new THREE.Color();
        const pctF = (t) => lerp(1, 0.25, ease.inOutCubic(range(t, 1.41, 2.46)));
        function render(t) {
          const pct = pctF(t), lit = Math.round(pct * N), k = range(t, 1.41, 2.46);
          cc.copy(cA).lerp(cB, k);
          for (let i = 0; i < N; i++) seg.setColorAt(i, i < lit ? cc : cOff);
          seg.instanceColor.needsUpdate = true;
          for (let i = 0; i < NP; i++) { const [x, z, o, v] = J[i], uu = ((t * 0.35 * v * (0.3 + pct) + o) % 1); P[i * 3] = x; P[i * 3 + 1] = 0.85 + uu * 1.4; P[i * 3 + 2] = z + Math.sin(t + i) * 0.05; }
          pg.attributes.position.needsUpdate = true; pm.opacity = 0.2 + 0.8 * pct;
          // grua descendo e girando devagar
          const e = ease.inOutSine(range(t, 0, 5.63)), a = lerp(-0.12, 0.12, e), d = lerp(11, 9.8, e);
          cam.position.set(Math.sin(a) * d, lerp(2.4, 1.8, e), Math.cos(a) * d);
          cam.lookAt(-0.3, lerp(-0.9, -0.8, e), 0);
          st.bloom = 0.6; st.sol(0, 0, 6);
          st.draw();
          const c = st.ctx, vv = HIBER.vis(st), [x, y] = HIBER.proj(new THREE.Vector3(GX, CY, 0), cam);
          HIBER.txt(c, "METABOLISMO", x, y - 40, { tam: 20, cor: HIBER.AZUL, a: vv * range(t, 0.6, 1.0), esp: 0.3 });
          HIBER.txt(c, Math.round(pct * 100) + "%", x, y + 20, { tam: 64, cor: k > 0.5 ? HIBER.LARANJA : "#fff", a: vv * range(t, 0.6, 1.0), esp: 0 });
        }
