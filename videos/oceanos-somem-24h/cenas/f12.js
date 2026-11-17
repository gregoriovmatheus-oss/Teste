/*META {"imports": ["oceano", "terra"], "rotulos": [{"de": 0.1, "ate": 2.1, "texto": "<span class=\"k\">T+24:00</span><br><span class=\"y\">24 horas</span> depois"}], "D0": 4.75} */
        const O = OCEANO, G0 = 60.55, TC = 2.7;
        // parte A: a água volta e invade a bacia
        const st = T.createToyStage(canvas, { fov: 50, ceu: ["#263f68", "#dfa678"], nevoa: [60, 520], corNevoa: "#a8876c", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const alt = (x, z) => 3.2 * O.fbm(x * 0.03, z * 0.03, 4, 21) + 1.2 * Math.abs(O.ruido(x * 0.012, z * 0.05, 22)) + Math.max(0, -z - 120) * 0.12;
        S.add(O.terreno({ w: 600, d: 700, sx: 90, sz: 100, cz: -220, alt, cor: (x, z, y, c) => O.mistura(c, 0x6f6152, 0x9a8a72, (y + 2) / 8) }));
        const ag = new THREE.PlaneGeometry(600, 700, 50, 60); ag.rotateX(-Math.PI / 2); ag.translate(0, 0, -220);
        const ap = ag.attributes.position, base = Float32Array.from(ap.array), col = new Float32Array(ap.count * 3);
        const chao = new Float32Array(ap.count); for (let i = 0; i < ap.count; i++) chao[i] = alt(base[i * 3], base[i * 3 + 2]);
        ag.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const agua = new THREE.Mesh(ag, T.TOON({ vertexColors: true, roughness: 0.12, transparent: true, opacity: 0.92, side: THREE.DoubleSide })); agua.material.envMapIntensity = 0.6; S.add(agua);
        const cA = new THREE.Color(0x0e4560), cE = new THREE.Color(0xf2efe8), cc = new THREE.Color();
        // parte B: a Terra fica azul de novo
        const st2 = T.createToyStage(canvas, { fov: 34, ceu: ["#000000", "#02030a"], nuvens: 0, nevoa: null });
        const { E } = await O.espacoDoc(st2, TERRA, { solDir: [-0.85, 0.3, 0.45] });
        function render(t) {
          if (t < TC) {
            // frente d'água vindo do fundo (-z) e subindo
            const wl = lerp(-4, 12, ease.inQuad(range(t, 0.2, TC))), frente = lerp(-420, 40, ease.inOutSine(range(t, 0, TC)));
            for (let i = 0; i < ap.count; i++) {
              const x = base[i * 3], z = base[i * 3 + 2], dz = z - frente;
              const y = wl + 4 * Math.exp(-((dz / 14) ** 2)) - (dz > 0 ? 30 * smoothstep(0, 25, dz) : 0) + 0.5 * Math.sin(0.2 * z + 0.15 * x - t * 6);
              ap.setY(i, y);
              const pr = y - chao[i], esp = clamp(1 - pr / 0.4) * 0.7;
              cc.copy(cA).lerp(cE, clamp(esp)); col.set([cc.r, cc.g, cc.b], i * 3);
            }
            ap.needsUpdate = true; ag.attributes.color.needsUpdate = true; ag.computeVertexNormals();
            const u = t / TC;
            cam.position.set(lerp(-10, -4, u), lerp(9, 7, u), lerp(30, 18, u));
            cam.lookAt(0, lerp(4, 3, u), -80);
            st.sol(0, -40, 90);
            st.draw();
            const sub = range(t, 2.25, 2.6);
            if (sub > 0) { st.ctx.fillStyle = `rgba(20,90,130,${0.85 * sub})`; st.ctx.fillRect(0, 0, 1080, 1920); }
          } else {
            const u = t - TC;
            E.u.seco.value = 1 - ease.inOutCubic(range(t, 2.85, 4.2));
            E.u.nuvens.value = lerp(0.4, 0.8, range(t, 3.2, 4.6)); E.nuv.rotation.y = t * 0.01;
            E.aim(lerp(150, 172, u / 2), lerp(8, 2, u / 2));
            const d = lerp(3.4, 5.4, ease.outCubic(range(u, 0, 2.05)));
            st2.cam.position.set(0.3, 0.2, d); st2.cam.lookAt(0, 0.2, 0);
            st2.T = st.T; st2.D = st.D;
            st2.draw(st2.scene, st2.cam, { cor: "#145a82", a: 1 - range(u, 0, 0.35) });
          }
        }
