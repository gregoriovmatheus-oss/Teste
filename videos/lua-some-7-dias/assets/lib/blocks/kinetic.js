/**
 * kinetic.js — tipografia cinética (R07) em HTML + GSAP, sem Three. Serve de camada sobre qualquer preset.
 *
 *   import { kinetic } from "./assets/lib/blocks/kinetic.js";   // dentro do buildReady ou num <script type="module">
 *   kinetic(tl, document.querySelector('[data-composition-id="fNN"]') ?? root, {
 *     em: 0.2, ate: 2.6, topo: 520,
 *     linhas: [
 *       { texto: "TOP 3", tamanho: 200, cor: "#FFE600" },
 *       { texto: "COISAS QUE", tamanho: 90 },
 *       { texto: "CONGELAM", tamanho: 150, caixa: "#E8312A" },  // caixa chapada atrás
 *     ],
 *   });
 * Para usar sem import (cena 2D comum), copie a função para o <script> da cena.
 * tl = a timeline GSAP pausada da cena (window.__timelines[id]); tudo é seekável.
 * rgb: true faz o deslocamento vermelho/azul na entrada. Fica entre y 168 e 1000 (a legenda vem depois).
 */
export function kinetic(tl, container, {
  em = 0, ate = null, topo = 520, linhas = [], rgb = true, passo = 0.12,
  fonte = '"Anton", sans-serif', cor = "#FFFFFF",
} = {}) {
  const box = document.createElement("div");
  box.className = "kt";
  box.setAttribute("data-layout-ignore", "");
  box.style.cssText = `position:absolute;left:90px;right:180px;top:${topo}px;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;`;
  const els = linhas.map((l) => {
    const d = document.createElement("div");
    d.textContent = l.texto;
    d.style.cssText = `font-family:${l.fonte || fonte};font-size:${l.tamanho || 110}px;line-height:0.95;text-transform:uppercase;` +
      `color:${l.cor || cor};white-space:nowrap;padding:0 18px;` + (l.caixa ? `background:${l.caixa};` : "") +
      (l.vertical ? "writing-mode:vertical-rl;" : "");
    box.appendChild(d);
    return d;
  });
  container.appendChild(box);
  const RGB = "6px 0 0 rgba(232,49,42,0.9), -6px 0 0 rgba(74,144,226,0.9)";
  els.forEach((d, i) => {
    const t = em + i * passo;
    tl.fromTo(d, { opacity: 0, scale: 1.35, y: 30, textShadow: rgb ? RGB : "none" },
      { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: "power4.out", immediateRender: true }, t);
    if (rgb) tl.to(d, { textShadow: "0px 0 0 rgba(232,49,42,0), 0px 0 0 rgba(74,144,226,0)", duration: 0.18, ease: "power2.out" }, t + 0.12);
  });
  if (ate != null) tl.to(els, { opacity: 0, y: -20, duration: 0.15, stagger: 0.03, ease: "power2.in" }, ate);
  return box;
}
