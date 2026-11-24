/*META {"imports": ["regen"], "css": "    [data-composition-id=\"f03\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f03\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f03\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f03\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f03\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 0.1, "ate": 2.55, "texto": "E você já faz<br><span class=\"y\">um pouco</span> disso"}], "D0": 6.02} */
        const RG = REGEN;
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#040812", "#0c1a2e"], nevoa: [4, 16], corNevoa: "#060c18", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.45; st.key.intensity = 2.4; st.key.color.set(0xfff0e0); st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.6; st.sol(0, 0, 3, 1.2);
        // corpo "fantasma": silhueta em linhas azuis (tronco, cabeça, braços)
        const fm = new THREE.MeshBasicMaterial({ color: 0x7cc8ff, wireframe: true, transparent: true, opacity: 0.12, depthWrite: false, fog: false });
        const corpo = new THREE.Group(); S.add(corpo);
        const tr = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 6, 14), fm); tr.scale.set(1.25, 1, 0.72); tr.position.y = 1.15; corpo.add(tr);
        const cb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), fm); cb.position.y = 1.72; corpo.add(cb);
        for (const s of [1, -1]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.55, 4, 8), fm); b.position.set(s * 0.33, 1.15, 0); b.rotation.z = s * 0.12; corpo.add(b); }
        const F = RG.figado(); F.g.scale.setScalar(0.1); F.g.position.set(-0.03, 1.08, 0.04); F.g.rotation.set(0.25, 0.15, -0.12); S.add(F.g);
        const brilho = RG.glowSprite(0x7cc8ff, 0.35, 0); S.add(brilho);
        const R = mulberry32(33), NP = 200, pp = new Float32Array(NP * 3), J = Array.from({ length: NP }, () => [(R() - 0.5) * 3, 0.3 + R() * 2, (R() - 0.5) * 3, R() * 6.28]);
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
        S.add(new THREE.Points(pg, new THREE.PointsMaterial({ map: RG.glowTex(), color: 0x7cc8ff, size: 0.02, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })));
        const v = new THREE.Vector3(), fr = new THREE.Vector3();
        function render(t) {
          for (let i = 0; i < NP; i++) { const [x, y, z, ph] = J[i]; pp[i * 3] = x + 0.05 * Math.sin(t * 0.5 + ph); pp[i * 3 + 1] = y + 0.04 * Math.sin(t * 0.7 + ph); pp[i * 3 + 2] = z; }
          pg.attributes.position.needsUpdate = true;
          // 2/3 somem (fica o lobo direito) → o terço restante cresce de volta até o tamanho normal
          const corta = ease.inOutCubic(range(t, 2.45, 2.85)), volta = ease.inOutSine(range(t, 3.0, 5.0));
          const corte = lerp(lerp(1.6, -0.5, corta), 1.6, volta);
          F.u.corte.value = corte; F.u.forca.value = t < 2.9 ? 3.5 * corta * (1 - range(t, 2.85, 3.0)) : 2.6 * (1 - range(t, 4.8, 5.2));
          F.fantasma.material.opacity = 0.05 + 0.22 * range(t, 2.4, 2.8) * (1 - range(t, 5.0, 5.6));
          fr.set(Math.min(corte, 1.5), 0.15, 0.2); F.g.localToWorld(v.copy(fr)); brilho.position.copy(v);
          brilho.material.opacity = (t > 2.95 ? 0.9 * (1 - range(t, 4.8, 5.2)) : 0) ;
          corpo.children.forEach((o) => (o.material.opacity = 0.12 * (1 - 0.7 * range(t, 1.6, 2.6))));
          // câmera: corpo inteiro → mergulha no fígado e gira devagar em volta dele
          const a = ease.inOutCubic(range(t, 0.2, 2.5)), b = range(t, 2.5, 6.02);
          const ang = lerp(0.0, 0.35, a) + 0.3 * b, dist = lerp(2.9, 0.98, a) - 0.08 * b;
          const L = new THREE.Vector3(lerp(0, -0.03, a), lerp(1.0, 0.95, a), 0.04);
          cam.position.set(L.x + Math.sin(ang) * dist, lerp(1.45, 1.1, a), L.z + Math.cos(ang) * dist);
          cam.lookAt(L);
          st.bloom = 0.5 + 0.3 * range(t, 2.4, 2.6);
          st.draw();
          const c = st.ctx, vv = RG.vis(st); RG.quadro();
          F.g.localToWorld(v.set(-0.9, 0.3, 0.3));
          const pct = Math.round(lerp(33, 100, range(corte, -0.5, 1.5)));
          RG.frase(c, cam, v, "FÍGADO " + pct + "%", ease.outCubic(range(t, 2.6, 2.9)) * vv, { cor: pct >= 100 ? RG.AZUL : RG.LARANJA, tam: 34, dy: 330, dx: -60 });
          F.g.localToWorld(v.set(-1.1, -0.1, 0.4));
          RG.frase(c, cam, v, "SÓ 1/3 BASTA", ease.outCubic(range(t, 5.12, 5.4)) * vv, { cor: RG.LARANJA, tam: 34, dy: 470, dx: 80 });
        }
