/*META {"imports": ["pausa"], "rotulos": [], "D0": 6.05} */
        // f09 — a ampulheta pessoal no asfalto molhado, escorrendo enquanto a chuva está parada em volta.
        //       Um grão acende (1 dia a menos), depois cai uma rajada (1 ano). A câmera sobe e revela o protagonista e a multidão congelada.
        const st = T.createToyStage(canvas, { fov: 40, ceu: ["#1a2336", "#b0735a"], nevoa: [14, 140], corNevoa: "#4b4f60", nuvens: 0, exposicao: 1.05 });
        const S = st.scene, cam = st.cam;
        const R = PAUSA.ruaChuva(S, st);
        const TM = 1.17; R.update(0, TM, { k: 1 });
        const [px, , pz] = PAUSA.PROTA;
        R.p.group.position.set(px, 0, pz); R.p.group.rotation.y = -Math.PI / 2 + 0.2;
        const AM = PAUSA.ampulheta(), s = 0.36; AM.scale.setScalar(s); AM.position.set(px - 0.3, 1.15 * s + 0.12, pz - 2.0); S.add(AM);
        const luzA = new THREE.PointLight(0xff9a50, 4, 4, 1.5); luzA.position.set(px - 0.3, 0.4, pz - 2.0); S.add(luzA);
        function render(t) {
          const k = 0.3 + 0.04 * t + 0.16 * ease.inOutSine(range(t, 2.4, 3.2));
          AM.set(k, t, 1);
          R.p.setIdade(0.25 * range(t, 3.3, 6.0)); R.p.pose(t, {});
          st.bloom = 0.8;
          const e = ease.inOutSine(range(t, 0, 6.05)), up = ease.inOutCubic(range(t, 2.9, 6.05));
          const a = lerp(-0.5, 0.5, e), d = lerp(1.25, 4.6, up);
          const cx = px - 0.3, cz = pz - 2.0;
          cam.position.set(cx + Math.sin(a) * d, lerp(0.42, 2.1, up), cz - Math.cos(a) * d);
          cam.lookAt(cx, lerp(0.38, 1.0, up), lerp(cz, cz + 1.2, up));
          st.sol(0, 20, 50);
          st.draw();
          const c = st.ctx;
          const [ax, ay] = PAUSA.proj(AM.localToWorld(new THREE.Vector3(0, -0.45, 0)), cam);
          PAUSA.tag(c, ax, ay, ax + (ax < 540 ? 200 : -200), ay - 380, [["UM DIA PAUSADO", PAUSA.LARANJA], ["−1 dia", "#fff"]], { a: PAUSA.vis(t, 1.1, 2.3), cor: PAUSA.LARANJA });
          PAUSA.tag(c, ax, ay, ax + (ax < 540 ? 200 : -200), ay - 380, [["UM ANO PAUSADO", PAUSA.LARANJA], ["−365 dias", "#fff"]], { a: PAUSA.vis(t, 2.4, 3.6), cor: PAUSA.LARANJA });
          const v = PAUSA.vis(t, 3.3, 6.05);
          PAUSA.painel(c, 290, 1360, "VOCÊ", "+1 ano", { a: v, cor: PAUSA.LARANJA, tam: 70 });
          PAUSA.painel(c, 790, 1360, "TODOS OS OUTROS", "+0 s", { a: v * range(t, 4.6, 4.9), cor: PAUSA.AZUL, tam: 70 });
        }
