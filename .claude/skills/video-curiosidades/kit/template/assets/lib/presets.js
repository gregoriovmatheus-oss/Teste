/**
 * presets.js — um preset de estilo por referência (REFERENCIAS.md, "Escolha por tema").
 * Fonte única: os scripts Python leem o JSON entre PRESETS:INICIO e PRESETS:FIM.
 * Mantenha esse trecho em JSON puro (aspas duplas, sem comentários, sem vírgula sobrando).
 * Campos: modo (3d usa modelos/cena-3d.html, 2d usa cena-2d.html), fundo, fontes (só as de assets/fonts),
 *   paleta, legenda (fonte, tamanho, caixa, sombra, contorno, faixa, y), hud (ativo e estilo), titulo, blocos sugeridos.
 * Uso numa cena: const { PRESETS } = await import("./assets/lib/presets.js"); const P = PRESETS.R01;
 */
export const PRESETS = /* PRESETS:INICIO */ {
  "R01": {
    "nome": "3D maquete, tom cinematográfico",
    "modo": "3d",
    "fundo": "#0b1018",
    "fontes": [
      "EB Garamond",
      "Montserrat",
      "Anton"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#8FCBF2",
      "status": "#E8B24A",
      "fundo": "#8D96A2",
      "geada": "#EEF2F6",
      "acento": "#D8432F"
    },
    "legenda": {
      "fonte": "\"EB Garamond\", serif",
      "estilo": "italic",
      "peso": 400,
      "tamanho": 70,
      "caixa": "none",
      "cor": "#FFFFFF",
      "numero": "#8FCBF2",
      "y": 1045,
      "altura": 150,
      "sombra": "0 0 2px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.65), 0 4px 28px rgba(0,0,0,0.45)",
      "contorno": "",
      "faixa": "radial-gradient(ellipse at 50% 50%, rgba(6,12,22,0.5) 0%, rgba(6,12,22,0.3) 50%, rgba(6,12,22,0) 76%)"
    },
    "hud": {
      "ativo": true,
      "topo": 290,
      "rotulo": {
        "fonte": "\"Montserrat\", sans-serif",
        "peso": 600,
        "tamanho": 30,
        "espaco": "0.3em",
        "cor": "#FFFFFF"
      },
      "numero": {
        "fonte": "\"EB Garamond\", serif",
        "tamanho": 150,
        "cor": "#FFFFFF",
        "cor_fim": "#E8B24A"
      },
      "linha2": {
        "cor": "#8FCBF2"
      },
      "status": {
        "tamanho": 32,
        "cor": "#E8B24A"
      }
    },
    "titulo": {
      "fonte": "\"EB Garamond\", serif",
      "tamanho": 90,
      "caixa": "none",
      "topo": 345
    },
    "blocos": [
      "globe",
      "city",
      "particles",
      "shockwave",
      "counter"
    ]
  },
  "R03": {
    "nome": "formas abstratas 3D (tech, IA)",
    "modo": "3d",
    "fundo": "#1E1A33",
    "fontes": [
      "Montserrat",
      "Anton"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#B05CF0",
      "fundo": "#1E1A33",
      "violeta": "#7B3FE4",
      "lilas": "#B05CF0",
      "laranja": "#F07A3A",
      "azul": "#3E7BFA"
    },
    "legenda": {
      "fonte": "\"Montserrat\", sans-serif",
      "estilo": "normal",
      "peso": 600,
      "tamanho": 60,
      "caixa": "none",
      "cor": "#FFFFFF",
      "numero": "#F07A3A",
      "y": 1045,
      "altura": 170,
      "sombra": "0 0 2px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.65), 0 4px 28px rgba(0,0,0,0.45)",
      "contorno": "",
      "faixa": ""
    },
    "hud": {
      "ativo": false,
      "topo": 290,
      "rotulo": {
        "fonte": "\"Montserrat\", sans-serif",
        "peso": 600,
        "tamanho": 30,
        "espaco": "0.2em",
        "cor": "#FFFFFF"
      },
      "numero": {
        "fonte": "\"Montserrat\", sans-serif",
        "tamanho": 150,
        "cor": "#FFFFFF",
        "cor_fim": "#B05CF0"
      },
      "linha2": {
        "cor": "#B05CF0"
      },
      "status": {
        "tamanho": 32,
        "cor": "#B05CF0"
      }
    },
    "titulo": {
      "fonte": "\"Montserrat\", sans-serif",
      "tamanho": 84,
      "caixa": "none",
      "topo": 660
    },
    "blocos": [
      "primitives",
      "kinetic"
    ]
  },
  "R07": {
    "nome": "tipografia cinética (gancho, listas, números)",
    "modo": "2d",
    "fundo": "#000000",
    "fontes": [
      "Anton",
      "Montserrat"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#FFE600",
      "fundo": "#000000",
      "amarelo": "#FFE600",
      "vermelho": "#E8312A",
      "azul": "#4A90E2"
    },
    "legenda": {
      "fonte": "\"Anton\", sans-serif",
      "estilo": "normal",
      "peso": 400,
      "tamanho": 90,
      "caixa": "uppercase",
      "cor": "#FFFFFF",
      "numero": "#FFE600",
      "y": 1045,
      "altura": 170,
      "sombra": "4px 0 0 #E8312A, -4px 0 0 #4A90E2, 0 6px 0 #000",
      "contorno": "",
      "faixa": ""
    },
    "hud": {
      "ativo": false,
      "topo": 290,
      "rotulo": {
        "fonte": "\"Montserrat\", sans-serif",
        "peso": 600,
        "tamanho": 30,
        "espaco": "0.2em",
        "cor": "#FFFFFF"
      },
      "numero": {
        "fonte": "\"Anton\", sans-serif",
        "tamanho": 150,
        "cor": "#FFFFFF",
        "cor_fim": "#FFE600"
      },
      "linha2": {
        "cor": "#FFE600"
      },
      "status": {
        "tamanho": 32,
        "cor": "#FFE600"
      }
    },
    "titulo": {
      "fonte": "\"Anton\", sans-serif",
      "tamanho": 140,
      "caixa": "uppercase",
      "topo": 330
    },
    "blocos": [
      "kinetic",
      "counter"
    ],
    "nota": "Também serve como camada: importe blocks/kinetic.js em cena de qualquer preset."
  },
  "R08": {
    "nome": "laboratório de vidro (química, biologia)",
    "modo": "3d",
    "fundo": "#0E0E12",
    "fontes": [
      "Montserrat",
      "EB Garamond"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#FFB020",
      "fundo": "#0E0E12",
      "laranja": "#FFB020",
      "ciano": "#3EC8FF",
      "vidro": "#DDEBF2"
    },
    "legenda": {
      "fonte": "\"Montserrat\", sans-serif",
      "estilo": "normal",
      "peso": 600,
      "tamanho": 60,
      "caixa": "none",
      "cor": "#FFFFFF",
      "numero": "#FFB020",
      "y": 1045,
      "altura": 170,
      "sombra": "0 0 2px rgba(0,0,0,0.9), 0 0 18px rgba(62,200,255,0.35), 0 2px 12px rgba(0,0,0,0.7)",
      "contorno": "",
      "faixa": ""
    },
    "hud": {
      "ativo": false,
      "topo": 290,
      "rotulo": {
        "fonte": "\"Montserrat\", sans-serif",
        "peso": 600,
        "tamanho": 30,
        "espaco": "0.2em",
        "cor": "#FFFFFF"
      },
      "numero": {
        "fonte": "\"Montserrat\", sans-serif",
        "tamanho": 150,
        "cor": "#FFFFFF",
        "cor_fim": "#3EC8FF"
      },
      "linha2": {
        "cor": "#3EC8FF"
      },
      "status": {
        "tamanho": 32,
        "cor": "#3EC8FF"
      }
    },
    "titulo": {
      "fonte": "\"Montserrat\", sans-serif",
      "tamanho": 80,
      "caixa": "none",
      "topo": 660
    },
    "blocos": [
      "particles",
      "primitives"
    ],
    "nota": "Vidro (transmission) só em 1 a 3 objetos: é pesado sem GPU."
  },
  "R11": {
    "nome": "3D low-poly ilustrado, personagem com emoção (principal)",
    "modo": "3d",
    "fundo": "#14100C",
    "fontes": [
      "Anton",
      "Montserrat"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#F5C518",
      "alerta": "#E8463A",
      "fundo": "#14100C",
      "luz_fria": "#6E8FB8",
      "pele": "#B0785A",
      "jaqueta": "#D9A21E",
      "contorno": "#120C08"
    },
    "legenda": {
      "fonte": "\"Anton\", sans-serif",
      "estilo": "normal",
      "peso": 400,
      "tamanho": 96,
      "caixa": "uppercase",
      "cor": "#FFFFFF",
      "numero": "#F5C518",
      "y": 1110,
      "altura": 150,
      "sombra": "0 4px 0 #000, 0 0 3px #000, 0 6px 18px rgba(0,0,0,0.6)",
      "contorno": "3px #000",
      "faixa": ""
    },
    "hud": {
      "ativo": true,
      "topo": 230,
      "rotulo": {
        "fonte": "\"Anton\", sans-serif",
        "peso": 400,
        "tamanho": 44,
        "espaco": "0.04em",
        "cor": "#FFFFFF"
      },
      "numero": {
        "fonte": "\"Anton\", sans-serif",
        "tamanho": 44,
        "cor": "#A8D8E8",
        "cor_fim": "#F05A4A"
      },
      "linha2": {
        "cor": "#F05A4A"
      },
      "status": {
        "tamanho": 32,
        "cor": "#F05A4A"
      }
    },
    "titulo": {
      "fonte": "\"Anton\", sans-serif",
      "tamanho": 72,
      "caixa": "uppercase",
      "topo": 230
    },
    "blocos": [
      "toy",
      "animals"
    ],
    "nota": "flatShading + geometria de baixa subdivisão, contorno por casco invertido fino, luz fria de cima e quente na pele. HUD de barras no canto superior esquerdo."
  },
  "R10": {
    "nome": "cinema 3D realista + doc (HUD mono, legenda Inter)",
    "modo": "3d",
    "fundo": "#0b1018",
    "fontes": [
      "EB Garamond",
      "Montserrat",
      "Anton"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#8FCBF2",
      "status": "#E8B24A",
      "fundo": "#8D96A2",
      "geada": "#EEF2F6",
      "acento": "#D8432F"
    },
    "legenda": {
      "fonte": "\"EB Garamond\", serif",
      "estilo": "italic",
      "peso": 400,
      "tamanho": 70,
      "caixa": "none",
      "cor": "#FFFFFF",
      "numero": "#8FCBF2",
      "y": 1045,
      "altura": 150,
      "sombra": "0 0 2px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.65), 0 4px 28px rgba(0,0,0,0.45)",
      "contorno": "",
      "faixa": "radial-gradient(ellipse at 50% 50%, rgba(6,12,22,0.5) 0%, rgba(6,12,22,0.3) 50%, rgba(6,12,22,0) 76%)"
    },
    "hud": {
      "ativo": true,
      "topo": 290,
      "rotulo": {
        "fonte": "\"Montserrat\", sans-serif",
        "peso": 600,
        "tamanho": 30,
        "espaco": "0.3em",
        "cor": "#FFFFFF"
      },
      "numero": {
        "fonte": "\"EB Garamond\", serif",
        "tamanho": 150,
        "cor": "#FFFFFF",
        "cor_fim": "#E8B24A"
      },
      "linha2": {
        "cor": "#8FCBF2"
      },
      "status": {
        "tamanho": 32,
        "cor": "#E8B24A"
      }
    },
    "titulo": {
      "fonte": "\"EB Garamond\", serif",
      "tamanho": 90,
      "caixa": "none",
      "topo": 345
    },
    "blocos": [
      "globe",
      "city",
      "particles",
      "shockwave",
      "counter"
    ],
    "nota": "toy.js createToyStage (PBR, grão, vinheta, bloom); doc.py aplica HUD/legenda doc."
  }
} /* PRESETS:FIM */;

export const PADRAO = "R01";
