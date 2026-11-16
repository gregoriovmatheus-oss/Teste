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
  "R02": {
    "nome": "2D flat, tom popular",
    "modo": "2d",
    "fundo": "#3B423F",
    "fontes": [
      "Anton",
      "Montserrat"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#F2C94C",
      "status": "#F2C94C",
      "fundo": "#3B423F",
      "pele": "#E8A86B",
      "chuva": "#C9C27A",
      "acento": "#D8432F"
    },
    "legenda": {
      "fonte": "\"Anton\", sans-serif",
      "estilo": "normal",
      "peso": 400,
      "tamanho": 80,
      "caixa": "uppercase",
      "cor": "#FFFFFF",
      "numero": "#F2C94C",
      "y": 1045,
      "altura": 170,
      "sombra": "5px 5px 0 #000, 0 0 2px #000",
      "contorno": "3px #000",
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
        "cor_fim": "#F2C94C"
      },
      "linha2": {
        "cor": "#F2C94C"
      },
      "status": {
        "tamanho": 32,
        "cor": "#F2C94C"
      }
    },
    "titulo": {
      "fonte": "\"Anton\", sans-serif",
      "tamanho": 110,
      "caixa": "uppercase",
      "topo": 330
    },
    "blocos": [
      "counter",
      "kinetic"
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
  "R04": {
    "nome": "diorama de massinha (geografia, lugares)",
    "modo": "3d",
    "fundo": "#111111",
    "fontes": [
      "Anton",
      "Montserrat"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#F08A3C",
      "fundo": "#111111",
      "laranja": "#F08A3C",
      "turquesa": "#3FB6C8",
      "verde": "#7CC54A",
      "vermelho": "#E5463A",
      "creme": "#F3D9A4"
    },
    "legenda": {
      "fonte": "\"Anton\", sans-serif",
      "estilo": "normal",
      "peso": 400,
      "tamanho": 76,
      "caixa": "uppercase",
      "cor": "#FFFFFF",
      "numero": "#F08A3C",
      "y": 1045,
      "altura": 170,
      "sombra": "4px 4px 0 #000, 0 0 2px #000",
      "contorno": "2px #000",
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
        "cor_fim": "#F08A3C"
      },
      "linha2": {
        "cor": "#F08A3C"
      },
      "status": {
        "tamanho": 32,
        "cor": "#F08A3C"
      }
    },
    "titulo": {
      "fonte": "\"Anton\", sans-serif",
      "tamanho": 104,
      "caixa": "uppercase",
      "topo": 330
    },
    "blocos": [
      "tiles",
      "city",
      "counter"
    ]
  },
  "R05": {
    "nome": "personagem 3D cartoon (reação, corpo)",
    "modo": "3d",
    "fundo": "#8CC7D8",
    "fontes": [
      "Anton",
      "Montserrat"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#F2B53A",
      "fundo": "#8CC7D8",
      "pele": "#F2B48A",
      "camiseta": "#F2B53A",
      "tijolo": "#D9583B"
    },
    "legenda": {
      "fonte": "\"Anton\", sans-serif",
      "estilo": "normal",
      "peso": 400,
      "tamanho": 80,
      "caixa": "uppercase",
      "cor": "#FFFFFF",
      "numero": "#F2B53A",
      "y": 1045,
      "altura": 170,
      "sombra": "5px 5px 0 #000, 0 0 2px #000",
      "contorno": "3px #000",
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
        "cor_fim": "#F2B53A"
      },
      "linha2": {
        "cor": "#F2B53A"
      },
      "status": {
        "tamanho": 32,
        "cor": "#F2B53A"
      }
    },
    "titulo": {
      "fonte": "\"Anton\", sans-serif",
      "tamanho": 110,
      "caixa": "uppercase",
      "topo": 330
    },
    "blocos": [
      "city",
      "counter"
    ],
    "nota": "Personagem à mão: esferas e cápsulas de massinha (maqueteMaterial). Qualidade da referência só com geração paga."
  },
  "R06": {
    "nome": "2D flat explicativo roxo (sociedade, trabalho)",
    "modo": "2d",
    "fundo": "#1B1747",
    "fontes": [
      "Anton",
      "Montserrat"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#9B8CFF",
      "fundo": "#1B1747",
      "roxo": "#6C4BF0",
      "lilas": "#9B8CFF"
    },
    "legenda": {
      "fonte": "\"Anton\", sans-serif",
      "estilo": "normal",
      "peso": 400,
      "tamanho": 80,
      "caixa": "uppercase",
      "cor": "#FFFFFF",
      "numero": "#9B8CFF",
      "y": 1045,
      "altura": 170,
      "sombra": "5px 5px 0 #000, 0 0 2px #000",
      "contorno": "3px #000",
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
        "cor_fim": "#9B8CFF"
      },
      "linha2": {
        "cor": "#9B8CFF"
      },
      "status": {
        "tamanho": 32,
        "cor": "#9B8CFF"
      }
    },
    "titulo": {
      "fonte": "\"Anton\", sans-serif",
      "tamanho": 104,
      "caixa": "uppercase",
      "topo": 330
    },
    "blocos": [
      "counter",
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
  "R09": {
    "nome": "anime cel-shaded (personagens, histórias)",
    "modo": "3d",
    "fundo": "#3A7BD5",
    "fontes": [
      "EB Garamond",
      "Anton",
      "Montserrat"
    ],
    "paleta": {
      "texto": "#FFFFFF",
      "destaque": "#FF5A5F",
      "fundo": "#3A7BD5",
      "ceu_alto": "#3A7BD5",
      "ceu_baixo": "#FFC88A",
      "contorno": "#1A1A2E",
      "brilho": "#FFF4D6"
    },
    "legenda": {
      "fonte": "\"EB Garamond\", serif",
      "estilo": "italic",
      "peso": 400,
      "tamanho": 70,
      "caixa": "none",
      "cor": "#FFFFFF",
      "numero": "#FFF4D6",
      "y": 1045,
      "altura": 150,
      "sombra": "0 0 2px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.65), 0 4px 28px rgba(0,0,0,0.45)",
      "contorno": "",
      "faixa": "radial-gradient(ellipse at 50% 50%, rgba(6,12,22,0.5) 0%, rgba(6,12,22,0.3) 50%, rgba(6,12,22,0) 76%)"
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
        "cor_fim": "#FF5A5F"
      },
      "linha2": {
        "cor": "#FFF4D6"
      },
      "status": {
        "tamanho": 32,
        "cor": "#FF5A5F"
      }
    },
    "titulo": {
      "fonte": "\"Anton\", sans-serif",
      "tamanho": 110,
      "caixa": "uppercase",
      "topo": 330
    },
    "blocos": [
      "toy",
      "animals",
      "globe"
    ],
    "nota": "MeshToonMaterial de 3 tons + contorno por casco invertido (toy.js/animals.js). Legenda igual à R01."
  }
} /* PRESETS:FIM */;

export const PADRAO = "R01";
