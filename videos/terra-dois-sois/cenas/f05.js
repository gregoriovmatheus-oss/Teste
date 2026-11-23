/*META {"imports": ["terra", "doissois"], "rotulos": [{"de": 1.05, "ate": 2.6, "texto": "<span class=\"y\">pequeno</span> e <span class=\"y\">distante</span>"}, {"de": 2.65, "ate": 4.95, "texto": "só <span class=\"y\">um pouco</span> a mais<br>de luz e calor"}], "D0": 4.95} */
        const DS = DOISSOIS;
        await DS.fontes();
        const st = T.createToyStage(canvas, { fov: 40, ceu: "#000000", nevoa: null, nuvens: 0, exposicao: 1.0 });
        const S = st.scene, cam = st.cam;
        S.environment = null; st.hemi.intensity = 0; st.key.intensity = 0; st.rim.intensity = 0; st.key.castShadow = false;
        S.add(TERRA.createCeu({ seed: 52, n: 4500, via: 0.55 }));
        const E = await DS.terraDupla({ raio: 1 }); S.add(E.group); E.aim(-50, -10);
        E.u.s1.value.set(-1, 0.3, 0.55);   // o nosso Sol fica fora do quadro, à esquerda e atrás
        const PV = new THREE.Vector3(4, 24, -70);
        const SV = DS.estrela(S, { r: 0.9, tipo: "vermelho", halo: 7, pos: PV.toArray() });
        E.u.s2.value.copy(PV);
        const F = DS.feixe(S, 0xff6a40);
        // régua tracejada Terra -> anã vermelha
        const pts = []; for (let i = 0; i < 40; i++) { const s = DS.brilho(0x7cc8ff, 0.35, "disco"); S.add(s); pts.push(s); }
        const v = new THREE.Vector3();
        function render(t) {
          SV.set(1, t);
          const reg = range(t, 1.84, 2.5), luz = ease.inOutSine(range(t, 2.55, 3.9));
          pts.forEach((s, i) => { const k = 0.06 + 0.94 * i / 40; v.lerpVectors(new THREE.Vector3(0.6, 1.1, -0.4), PV, k * 0.92); s.position.copy(v); s.material.opacity = (k < reg ? 1 : 0) * 0.55 * (1 - luz * 0.6) * (1 - range(k, 0.75, 0.95)); s.scale.setScalar(0.12 + k * 0.6); });
          F.de(PV, E.group.position, 2.2, luz * 0.45, t);
          E.u.c1.value.set(1.05, 1.0, 0.92); E.u.c2.value.set(0.55, 0.16, 0.08).multiplyScalar(0.12 + 0.35 * luz);
          E.earth.rotation.y = -(-50 + 90) * Math.PI / 180 + t * 0.04;
          // da Terra, olhando a anã vermelha lá longe; zoom lento até ela
          const e = ease.inOutSine(range(t, 0, 4.95));
          cam.fov = lerp(42, 36, e); cam.updateProjectionMatrix();
          cam.position.set(lerp(0.4, 0.6, e), lerp(0.5, 0.65, e), lerp(3.4, 3.0, e));
          cam.lookAt(lerp(1.2, 1.8, e), lerp(3.0, 5.0, e), -40);
          st.bloom = 0.75;
          st.draw();
        }
