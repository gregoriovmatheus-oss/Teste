/**
 * presets.js — um preset de estilo por referência (REFERENCIAS.md, R01, R02...).
 * Fonte única: os scripts Python leem o JSON entre PRESETS:INICIO e PRESETS:FIM.
 * Mantenha esse trecho em JSON puro (aspas duplas, sem comentários, sem vírgula sobrando).
 * Uso numa cena: const { PRESETS } = await import("./assets/lib/presets.js"); const P = PRESETS.R01;
 */
export const PRESETS = /* PRESETS:INICIO */ {
  "R01": {
    "nome": "3D maquete, tom cinematográfico",
    "modo": "3d",
    "fundo": "#0b1018",
    "fontes": ["EB Garamond", "Montserrat", "Anton"],
    "paleta": { "texto": "#FFFFFF", "destaque": "#8FCBF2", "status": "#E8B24A", "fundo": "#8D96A2", "geada": "#EEF2F6", "acento": "#D8432F" },
    "legenda": {
      "fonte": "\"EB Garamond\", serif", "estilo": "italic", "peso": 400, "tamanho": 70, "caixa": "none",
      "cor": "#FFFFFF", "numero": "#8FCBF2", "y": 1045, "altura": 150,
      "sombra": "0 0 2px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.65), 0 4px 28px rgba(0,0,0,0.45)",
      "contorno": "",
      "faixa": "radial-gradient(ellipse at 50% 50%, rgba(6,12,22,0.5) 0%, rgba(6,12,22,0.3) 50%, rgba(6,12,22,0) 76%)"
    },
    "hud": {
      "ativo": true, "topo": 290,
      "rotulo": { "fonte": "\"Montserrat\", sans-serif", "peso": 600, "tamanho": 30, "espaco": "0.3em", "cor": "#FFFFFF" },
      "numero": { "fonte": "\"EB Garamond\", serif", "tamanho": 150, "cor": "#FFFFFF", "cor_fim": "#E8B24A" },
      "linha2": { "cor": "#8FCBF2" },
      "status": { "tamanho": 32, "cor": "#E8B24A" }
    },
    "titulo": { "fonte": "\"EB Garamond\", serif", "tamanho": 90, "caixa": "none", "topo": 345 }
  },
  "R02": {
    "nome": "2D flat, tom popular",
    "modo": "2d",
    "fundo": "#3B423F",
    "fontes": ["Anton", "Montserrat"],
    "paleta": { "texto": "#FFFFFF", "destaque": "#F2C94C", "status": "#F2C94C", "fundo": "#3B423F", "pele": "#E8A86B", "chuva": "#C9C27A", "acento": "#D8432F" },
    "legenda": {
      "fonte": "\"Anton\", sans-serif", "estilo": "normal", "peso": 400, "tamanho": 80, "caixa": "uppercase",
      "cor": "#FFFFFF", "numero": "#F2C94C", "y": 1045, "altura": 170,
      "sombra": "5px 5px 0 #000, 0 0 2px #000",
      "contorno": "3px #000",
      "faixa": ""
    },
    "hud": {
      "ativo": false, "topo": 290,
      "rotulo": { "fonte": "\"Montserrat\", sans-serif", "peso": 600, "tamanho": 30, "espaco": "0.2em", "cor": "#FFFFFF" },
      "numero": { "fonte": "\"Anton\", sans-serif", "tamanho": 150, "cor": "#FFFFFF", "cor_fim": "#F2C94C" },
      "linha2": { "cor": "#F2C94C" },
      "status": { "tamanho": 32, "cor": "#F2C94C" }
    },
    "titulo": { "fonte": "\"Anton\", sans-serif", "tamanho": 110, "caixa": "uppercase", "topo": 330 }
  }
} /* PRESETS:FIM */;

export const PADRAO = "R01";
