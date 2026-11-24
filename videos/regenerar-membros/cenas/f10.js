/*META {"imports": ["regen"], "css": "    [data-composition-id=\"f10\"] .rot-t { font-family: \"Inter\", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }\n    [data-composition-id=\"f10\"] .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }\n    [data-composition-id=\"f10\"] .rot-t .r { font-weight: 800; color: #ff8a4c; }\n    [data-composition-id=\"f10\"] .rot-t .k { font-family: \"JetBrains Mono\", monospace; font-weight: 600; font-size: 28px; letter-spacing: 0.3em; color: #7cc8ff; margin-bottom: 18px; -webkit-text-stroke: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }\n    [data-composition-id=\"f10\"] .rot-t .n { font-family: \"JetBrains Mono\", monospace; font-weight: 600; color: #7cc8ff; }\n", "rotulos": [{"de": 1.9, "ate": 2.8, "texto": "Um <span class=\"y\">freio</span> forte"}], "D0": 5.46} */
        const RG = REGEN;
        const st = T.createToyStage(canvas, { fov: 38, ceu: ["#04070d", "#101c2c"], nevoa: [4, 14], corNevoa: "#060a12", nuvens: 0, exposicao: 1.08 });
        const S = st.scene, cam = st.cam;
        st.hemi.intensity = 0.55; st.key.intensity = 2.6; st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.8; st.sol(0, 0, 3, 1);
        const grade = new THREE.GridHelper(12, 48, 0x1f4a6a, 0x13283c); S.add(grade);
        // braço: o contorno (mapa) já está lá; a pele cresce e para exatamente no contorno
        const BR = RG.braco(); BR.g.position.set(0, 2.72, 0); S.add(BR.g);
        BR.mats.mP.color.set(0xd49a78);
        const mm = new THREE.MeshBasicMaterial({ color: 0x7cc8ff, wireframe: true, transparent: true, opacity: 0.28, depthWrite: false, fog: false });
        BR.pele.children.forEach((o) => { const w = new THREE.Mesh(o.geometry, mm); w.scale.copy(o.scale).multiplyScalar(1.03); BR.g.add(w); });
        // painel com a alavanca do "freio" e duas lâmpadas
        const pn = new THREE.Group(); pn.position.set(0.75, 1.0, 0.1); pn.rotation.y = -0.35; S.add(pn);
        const base = new THREE.Mesh(T.roundBox(0.34, 0.5, 0.12, 0.03), T.M(0x2a2e36, 0.4, { metalness: 0.6 })); pn.add(base);
        const piv = new THREE.Group(); piv.position.set(0, -0.05, 0.07); pn.add(piv);
        const hast = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 10), T.M(0xc8ccd2, 0.25, { metalness: 0.9 })); hast.position.y = 0.11; piv.add(hast);
        const bola = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), T.M(0xd83a2a, 0.3)); bola.position.y = 0.23; piv.add(bola);
        const lv = RG.emiss(0x3aff8a, 0.2), lr = RG.emiss(0xff4a2a, 0.2);
        const lamV = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), lv); lamV.position.set(-0.09, 0.18, 0.07); pn.add(lamV);
        const lamR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), lr); lamR.position.set(0.09, 0.18, 0.07); pn.add(lamR);
        const gV = RG.glowSprite(0x3aff8a, 0.3, 0); gV.position.copy(lamV.position); pn.add(gV);
        const gR = RG.glowSprite(0xff4a2a, 0.3, 0); gR.position.copy(lamR.position); pn.add(gR);
        const v = new THREE.Vector3(), CV = new THREE.Color(0x3aff8a), CR = new THREE.Color(0xff4a2a);
        function render(t) {
          const liga = range(t, 2.86, 3.0), desliga = range(t, 4.01, 4.15);
          piv.rotation.z = lerp(0.6, -0.6, ease.outBack(liga)) + 1.2 * ease.outBack(desliga) - 0.0;
          const on = liga * (1 - desliga);
          lv.color.copy(CV).multiplyScalar(0.2 + 2.8 * on); gV.material.opacity = 0.9 * on;
          lr.color.copy(CR).multiplyScalar(0.2 + 2.8 * desliga); gR.material.opacity = 0.9 * desliga;
          // cresce só com o freio aberto e para no contorno, sem passar
          const k = lerp(0.42, 1.0, ease.inOutSine(range(t, 2.9, 4.0)));
          BR.set({ osso: 1, musculo: 1, nervo: 1, pele: k, peleOp: 1.0 });
          BR.mats.mP.userData.u.forca.value = 2.4 * on;
          mm.opacity = 0.28 + 0.25 * desliga * Math.max(0, Math.sin((t - 4.01) * 9)) * (1 - range(t, 4.6, 5.0));
          // câmera: perto do antebraço e do painel, girando devagar
          const e = ease.inOutSine(range(t, 0, 5.46));
          cam.position.set(lerp(1.9, 1.3, e), lerp(1.65, 1.35, e), lerp(2.3, 2.6, e)); cam.lookAt(lerp(0.3, 0.28, e), lerp(0.85, 0.75, e), 0);
          st.bloom = 0.5 + 0.3 * Math.max(on, desliga);
          st.draw();
          const c = st.ctx, vv = RG.vis(st); RG.quadro();
          pn.localToWorld(v.copy(lamV.position)); RG.frase(c, cam, v, "LIGA", ease.outCubic(range(t, 2.84, 3.05)) * vv, { cor: "#3aff8a", tam: 36, dy: 300, dx: -60 });
          pn.localToWorld(v.copy(lamR.position)); RG.frase(c, cam, v, "DESLIGA NA HORA CERTA", ease.outCubic(range(t, 4.0, 4.2)) * vv, { cor: RG.LARANJA, tam: 30, dy: 420, dx: -60 });
        }
