/*META {"imports": ["dor"], "css": "    [data-composition-id=\"f10\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f10\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f10\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f10\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f10\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 0.8, "ate": 2.55, "texto": "Checar o corpo<br>como um <span class=\"y\">carro</span>"}], "D0": 5.26} */
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#030407", "#0a0d14"], nevoa: [6, 18], corNevoa: "#06080c", nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.35; st.key.intensity = 1.3; st.rim.color.set(0x7cc8ff); st.rim.intensity = 1.8;
        const painel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.6, 0.3), new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.45, metalness: 0.4 })); painel.position.set(0, 0, -0.2); S.add(painel);
        const NOMES = ["PELE", "TEMPERATURA", "INCHAÇO"], TT = [2.69, 2.99, 3.66], GX = [-1.3, 0, 1.3];
        const G = GX.map((x, k) => {
          const g = new THREE.Group(); g.position.set(x, 0.1, 0); S.add(g);
          const aro = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 10, 48), new THREE.MeshStandardMaterial({ color: 0xb8bec8, roughness: 0.2, metalness: 1 })); g.add(aro);
          const fundo = new THREE.Mesh(new THREE.CircleGeometry(0.48, 40), new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 0.6 })); fundo.position.z = -0.01; g.add(fundo);
          const arcoM = new THREE.MeshBasicMaterial({ color: 0x1a3048, toneMapped: false });
          const arco = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.43, 40, 1, -Math.PI * 0.25, Math.PI * 1.5), arcoM); g.add(arco);
          const ag = new THREE.Group(); ag.position.z = 0.02; g.add(ag);
          const ag1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.4, 0.01), DOR.emiss(0xff8a4c, 1.6)); ag1.position.y = 0.17; ag.add(ag1);
          const cubo = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), new THREE.MeshStandardMaterial({ color: 0x30343c, metalness: 0.8, roughness: 0.3 })); cubo.position.z = 0.03; g.add(cubo);
          const luz = DOR.glowSprite(0x7cc8ff, 1.2, 0); luz.position.z = 0.05; g.add(luz);
          return { g, ag, arcoM, luz };
        });
        const azul = new THREE.Color(0x7cc8ff).multiplyScalar(1.6), apag = new THREE.Color(0x1a3048);
        const v = new THREE.Vector3();
        function render(t) {
          G.forEach(({ ag, arcoM, luz }, k) => {
            const t0 = TT[k], on = ease.outCubic(range(t, t0, t0 + 0.4));
            // checagem diária: em "todo santo dia" (4,12 s) os ponteiros varrem de novo
            const re = Math.sin(Math.PI * range(t, 4.12 + k * 0.12, 4.9 + k * 0.12));
            ag.rotation.z = lerp(Math.PI * 0.75, 0.15 - k * 0.2, on) + re * 0.9;
            arcoM.color.copy(apag).lerp(azul, on * (1 - re * 0.6));
            luz.material.opacity = on * 0.3;
          });
          const e = ease.inOutSine(range(t, 0, 5.26));
          cam.position.set(lerp(-0.7, 0.5, e), lerp(-0.6, -0.4, e), lerp(8.6, 8.0, e));
          cam.lookAt(lerp(-0.15, 0.1, e), -1.25, 0);
          cam.rotateZ(lerp(0.03, -0.03, e));
          st.bloom = 0.7;
          st.sol(0, 0, 3);
          st.draw();
          const c = st.ctx, vv = DOR.vis(st); DOR.quadro();
          G.forEach(({ g }, k) => { g.getWorldPosition(v); v.y -= 0.72; const [px, py] = DOR.proj(v, cam); const on = range(t, TT[k], TT[k] + 0.2);
            DOR.txt(c, NOMES[k] + (on > 0.5 ? " ✓" : ""), px, py, { tam: 26, cor: on > 0.5 ? DOR.AZUL : "#8a94a4", a: Math.max(0.35 * range(t, 0.2, 0.6), on) * vv, esp: 0.12 }); });
          DOR.txt(c, "↻ TODO SANTO DIA", 540, 860, { tam: 40, cor: DOR.LARANJA, a: range(t, 4.12, 4.3) * vv, esp: 0.18 });
        }
