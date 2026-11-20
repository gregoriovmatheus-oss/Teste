/*META {"imports": ["pausa"], "rotulos": [{"de": 0.1, "ate": 1.95, "texto": "<span class=\"k\">A FÍSICA</span><br>A física <span class=\"y\">cobra caro</span>"}], "D0": 6.53} */
        // f03 — diagrama da luz: fótons viajando do poste até o olho. Com o tempo parado, eles param no caminho
        //       (3,1 s) e nenhum chega ao olho: a cena escurece (4,2 s em diante).
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#05070d", "#101827"], nevoa: [14, 70], corNevoa: "#080b14", nuvens: 0, exposicao: 1.1 });
        const S = st.scene, cam = st.cam;
        st.key.castShadow = false; st.key.intensity = 0.6; st.hemi.intensity = 0.35; st.rim.color.set(0x7cc8ff); st.rim.intensity = 1.2;
        const chao = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x0b0e15, roughness: 0.18, metalness: 0.6 }));
        chao.rotation.x = -Math.PI / 2; S.add(chao);
        const grade = new THREE.GridHelper(60, 60, 0x24405e, 0x152234); grade.position.y = 0.01; grade.material.transparent = true; grade.material.opacity = 0.5; S.add(grade);
        const P = PAUSA.poste(); P.position.set(-5.5, 0, 0); S.add(P);
        const L = new THREE.Vector3(-3.75, 7.5, 0);
        const O = PAUSA.olho(); O.position.set(4.6, 2.3, 0.4); O.scale.setScalar(0.95); O.lookAt(L); S.add(O);
        const lampLuz = new THREE.PointLight(0xffd59a, 30, 25, 1.6); lampLuz.position.copy(L); S.add(lampLuz);
        const ch = PAUSA.chuva(S, { n: 1400, seed: 33, caixa: [-12, 12, 0, 12, -14, 6] }); ch.update(1.17, 1); ch.mat.uniforms.uA.value = 0.5;
        // fótons: pacotes de onda (ponto brilhante + rastro ondulado) ao longo do feixe poste -> olho
        const NF = 46, NR = 14, F = PAUSA.pontos(S, NF * NR, { tam: 1, atenua: 300 });
        const rr = mulberry32(303), FO = Array.from({ length: NF }, () => [rr(), (rr() - 0.5) * 0.5, (rr() - 0.5) * 0.5, rr() * 6.28]);
        const Eye = O.position.clone(), dir = Eye.clone().sub(L), Lc = dir.length(); dir.normalize();
        const up = new THREE.Vector3(0, 1, 0).cross(dir).normalize(), p = new THREE.Vector3();
        const TS = 3.1;
        function render(t) {
          const te = PAUSA.tMundo(t, TS, 0.28), vk = 1 - range(t, TS, TS + 0.6);
          for (let i = 0; i < NF; i++) {
            const [u0, oy, oz, ph] = FO[i];
            const u = (u0 + te * 0.42) % 1;
            for (let j = 0; j < NR; j++) {
              const uj = u - j * 0.012 * (0.25 + 0.75 * vk), id = i * NR + j;
              const w = Math.sin(uj * Lc * 9 + ph) * 0.12;
              p.copy(L).addScaledVector(dir, uj * Lc).addScaledVector(up, w + oy * 0.4); p.z += oz * 0.5;
              F.P.set([p.x, p.y, p.z], id * 3);
              const head = j === 0 ? 1 : 0.55 * (1 - j / NR);
              F.Z[id] = j === 0 ? 0.55 : 0.22; F.A[id] = uj > 0.02 && uj < 0.985 ? head : 0;
              F.C.set(j === 0 ? [1, 0.93, 0.75] : [0.49, 0.78, 1], id * 3);
            }
          }
          F.sync();
          // olho recebendo luz (íris acesa) até o tempo parar
          const recebe = vk, escuro = ease.inOutSine(range(t, 4.2, 6.0));
          O.iris.material.emissiveIntensity = 0.15 + 1.2 * recebe;
          lampLuz.intensity = 30 * (1 - escuro * 0.9);
          st.hemi.intensity = 0.35 * (1 - escuro); st.rim.intensity = 1.2 * (1 - escuro * 0.8);
          st.bloom = 0.85;
          // câmera: plano lateral que desliza ao longo do feixe até ficar atrás do olho
          const e = ease.inOutSine(range(t, 0, 6.53));
          cam.position.set(lerp(-3.5, 6.8, e), lerp(5.2, 3.0, e), lerp(16, 6.2, e));
          cam.lookAt(lerp(-0.5, 1.5, e), lerp(4.4, 3.8, e), 0);
          st.sol(0, 0, 20);
          st.draw(S, cam, escuro > 0 ? { cor: "#020306", a: escuro * 0.72 } : null);
          const c = st.ctx;
          const mid = L.clone().addScaledVector(dir, Lc * 0.5), [mx, my] = PAUSA.proj(mid, cam);
          const vel = t < 3.71 ? "300.000 km/s" : "0 km/s";
          PAUSA.tag(c, mx, my, mx - 40 > 540 ? 600 : 560, 560, [["LUZ", PAUSA.AZUL], [vel, t < 3.71 ? "#fff" : PAUSA.LARANJA]], { a: PAUSA.vis(t, 3.0, 6.53) });
          const [ex, ey] = PAUSA.proj(Eye, cam);
          PAUSA.tag(c, ex, ey, Math.min(ex + 30, 760), Math.min(ey + 330, 1400), [["SEUS OLHOS", PAUSA.LARANJA], ["0 fótons", "#fff"]], { a: PAUSA.vis(t, 4.6, 6.53), cor: PAUSA.LARANJA });
        }
