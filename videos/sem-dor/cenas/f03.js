/*META {"imports": ["dor"], "css": "    [data-composition-id=\"f03\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f03\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f03\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f03\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f03\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 3.3, "ate": 4.75, "texto": "<span class=\"k\">SENSORES SÓ PARA A DOR</span><br><span class=\"y\">nociceptores</span>"}], "D0": 7.29} */
        const st = T.createToyStage(canvas, { fov: 44, ceu: ["#120a0c", "#2a1614"], nevoa: [4, 20], corNevoa: "#1a0e0e", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.5; st.key.intensity = 2.0; st.rim.intensity = 1.4;
        // pele: superfície translúcida com relevo suave; nervos logo abaixo
        const pg = new THREE.PlaneGeometry(24, 24, 120, 120); pg.rotateX(-Math.PI / 2);
        const pa = pg.attributes.position;
        for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); pa.setY(i, Math.sin(x * 2.1) * Math.cos(z * 1.7) * 0.025 + Math.sin(x * 7.3 + z * 5.1) * 0.008); }
        pg.computeVertexNormals();
        const pele = new THREE.MeshStandardMaterial({ color: 0xd99a80, roughness: 0.48, transparent: true, opacity: 0.9, depthWrite: false, emissive: 0x3a1208, emissiveIntensity: 0.4 });
        const sup = new THREE.Mesh(pg, pele); S.add(sup);
        const derme = new THREE.Mesh(new THREE.PlaneGeometry(24, 24).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5a2420, roughness: 0.8 })); derme.position.y = -0.9; S.add(derme);
        const nv = DOR.nervos(S, { seed: 31, raiz: new THREE.Vector3(-0.4, -0.35, -9), dir: new THREE.Vector3(0.1, 0, 1), niveis: 6, comp: 3.0, raio: 0.06, abre: 0.7 });
        // três sensores para calor, corte e pressão: os mais perto do centro da tela final
        const ord = nv.pontas.map((p, i) => [i, Math.hypot(p.x - 0.2, p.z - 0.6)]).sort((a, b) => a[1] - b[1]).map((a) => a[0]);
        const SEN = [[ord[0], "CALOR", 4.99, 0xff8a4c], [ord[2], "CORTE", 5.34, 0xff5a5f], [ord[4], "PRESSÃO", 5.81, 0x7cc8ff]];
        const fonte = SEN.map(([i, , , c]) => { const s = DOR.glowSprite(c, 1.2, 0); s.position.copy(nv.pontas[i]); s.position.y += 0.25; S.add(s); return s; });
        // ponta -> ramo que termina nela
        const ramoDa = (p) => nv.ramos.findIndex((r) => r.curva.getPointAt(1).distanceTo(p) < 1e-3);
        const CX = nv.pontas.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / nv.pontas.length);
        function render(t) {
          // a pele fica translúcida quando a câmera desce: os nervos aparecem
          const rev = ease.inOutSine(range(t, 0.6, 2.4));
          pele.opacity = lerp(0.97, 0.32, rev);
          nv.mat.emissiveIntensity = 0.2 + rev * 0.6;
          nv.bulbos.forEach(({ s, b }, i) => { const on = range(t, 1.8 + (i % 9) * 0.08, 2.4 + (i % 9) * 0.08); s.material.opacity = on * (0.55 + 0.35 * Math.sin(t * 3 + i)); b.scale.setScalar(0.4 + on * 0.6); });
          // estímulos: cada sensor dispara um pulso que corre até a raiz
          nv.pulsos(t, (i, r) => {
            for (const [k, , t0, c] of SEN) { const rk = ramoDa(nv.pontas[k]); if (rk !== i) continue; const q = (t - t0) / 0.6; if (q < 0 || q > 1) return null; return { u: 1 - q, a: 1, cor: c, tam: 0.35 }; }
            // patrulha: pulsos fracos e lentos o tempo todo ("vigiam")
            const q = ((t * 0.35 + i * 0.137) % 1); return r.nivel > 2 && t > 2.2 ? { u: 1 - q, a: 0.35 * rev, cor: 0xbfe4ff, tam: 0.16 } : null;
          });
          SEN.forEach(([, , t0], j) => { fonte[j].material.opacity = range(t, t0 - 0.1, t0) * (1 - range(t, t0 + 0.6, t0 + 1.4)) * 0.9; });
          // câmera: rasante sobre a pele → desce e plana por cima dos nervos
          const e = ease.inOutSine(range(t, 0, 7.29));
          cam.position.set(CX.x + lerp(-1.2, 0.6, e), lerp(3.8, 2.6, e), CX.z + lerp(4.4, 3.2, e));
          cam.lookAt(CX.x + lerp(-0.4, 0.2, e), -0.4, CX.z + lerp(-0.6, 0.3, e));
          st.bloom = 0.55 + rev * 0.3;
          st.sol(0, 0, 8);
          st.draw();
          const c = st.ctx, vv = DOR.vis(st); DOR.quadro();
          SEN.forEach(([k, nome, t0, cc]) => DOR.frase(c, cam, nv.pontas[k], nome, range(t, t0, t0 + 0.2) * vv, { cor: "#" + cc.toString(16).padStart(6, "0"), tam: 30, dy: -70 }));
        }
