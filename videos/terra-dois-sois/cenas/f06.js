/*META {"imports": ["terra", "doissois"], "rotulos": [{"de": 1.6, "ate": 3.7, "top": 600, "texto": "<span class=\"k\">MESMO LADO</span><br>a noite <span class=\"y\">existe</span>"}, {"de": 4.0, "ate": 6.16, "texto": "<span class=\"k\">LADOS OPOSTOS</span><br>a noite some <span class=\"y\">por meses</span>"}], "D0": 6.16} */
        const DS = DOISSOIS;
        await DS.fontes();
        const st = T.createToyStage(canvas, { fov: 40, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 61, n: 4500, via: 0.45 }));
        // diagrama (fora de escala): Sol amarelo no centro, órbita da Terra, anã vermelha longe (norte)
        const RO = 4.6, PV = new THREE.Vector3(0, 0, -12);
        const SA = DS.estrela(S, { r: 0.85, tipo: "amarelo", halo: 7 });
        const SV = DS.estrela(S, { r: 0.45, tipo: "vermelho", halo: 9, pos: PV.toArray() });
        S.add(DS.anel(RO, 0x7cc8ff, 0.55, 0.025));
        const E = await DS.terraDupla({ raio: 0.62, seg: 64 }); S.add(E.group); E.u.atmo.value = 1.3;
        const AY = DS.seta(0xffd27a), AR = DS.seta(0xff6a4a); S.add(AY.group, AR.group);
        const ep = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
        function render(t) {
          SA.set(1, t); SV.set(1, t * 1.2);
          // Terra: ao sul do Sol (os dois sóis do mesmo lado) -> meia volta -> entre os dois (lados opostos)
          const th = Math.PI * ease.inOutCubic(range(t, 2.75, 4.3));
          ep.set(Math.sin(th) * RO * 0.999, 0, Math.cos(th) * RO); E.group.position.copy(ep);
          E.earth.rotation.y = t * 0.9;
          E.u.s1.value.copy(ep).negate(); E.u.s2.value.copy(PV).sub(ep);
          E.u.c1.value.set(1.05, 1.0, 0.92); E.u.c2.value.set(0.95, 0.32, 0.18);
          // setas de luz: de cada sol até a Terra
          d.copy(ep).normalize(); a.copy(d).multiplyScalar(1.1); b.copy(ep).addScaledVector(d, -0.85); AY.apontar(a, b, 0.05, 0.9);
          d.copy(ep).sub(PV).normalize(); a.copy(PV).addScaledVector(d, 0.7); b.copy(ep).addScaledVector(d, -0.85); AR.apontar(a, b, 0.05, 0.9);
          // câmera alta em órbita lenta
          const e = ease.inOutSine(range(t, 0, 6.16)), ang = lerp(0.55, -0.15, e);
          cam.position.set(Math.sin(ang) * 15, lerp(15, 13, e), Math.cos(ang) * 15 + 3);
          cam.lookAt(0, -6.2, -2.4);
          st.bloom = 0.8;
          st.draw();
          const c = st.ctx;
          // marcadores no próprio diagrama (acima da faixa dos títulos)
          const [x1, y1] = DS.proj(ep.clone().add(new THREE.Vector3(0, 0, 1.25)), cam);
          if (t < 2.7) DS.txt(c, "NOITE", x1, Math.min(y1 + 20, 1000), { tam: 30, cor: DS.AZUL, a: range(t, 2.15, 2.4) * (1 - range(t, 2.5, 2.7)) });
          if (t > 4.6) DS.txt(c, "SEM NOITE", x1, Math.max(640, Math.min(y1 - 130, 1000)), { tam: 30, cor: DS.LARANJA, a: range(t, 5.0, 5.3) });
        }
