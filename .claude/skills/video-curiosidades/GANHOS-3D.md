# 100 ganhos rumo ao 3D cinematográfico (lowpoly.js)

Status em 23/11: **48 feitos** ✅ e 52 na fila ⏳. Prévias em `videos/_previa-anima/folha-anima*.jpg`.

## Personagem: corpo e movimento
1. ✅ Esqueleto: quadril, coluna, pescoço e cabeça.
2. ✅ Braço com ombro, cotovelo e pulso.
3. ✅ Dedos com 2 falanges.
4. ✅ Polegar articulado.
5. ✅ `alcancar`: IK de 2 ossos, para a mão ir a um ponto exato.
6. ✅ Polo do cotovelo, para dobrar de forma natural.
7. ✅ `pontoCabeca`: alvos na boca, bochecha, testa, topo e nuca.
8. ✅ Ciclo de caminhada: quadril, joelho, pé, braços opostos, sobe e desce, torção.
9. ✅ Abas da jaqueta balançando.
10. ✅ Respiração no peito e nos ombros.
11. ✅ Balanço do peso parado.
12. ✅ Micromovimento da cabeça.
13. ✅ 10 poses: sentado, mão no rosto, mãos na cabeça, apontar, susto, espreguiçar, encolhido, pensativo, comemorar, deitado.
14. ✅ Transição suave entre poses.
15. ✅ `olharPara`: a cabeça e o tronco viram para um ponto.
16. ✅ Silhueta em V: peito largo e cintura fina, sem barriga de balão.
17. ⏳ Correr (ciclo próprio, com fase aérea).
18. ⏳ Sentar e levantar animados, com antecipação.
19. ⏳ Deitar e acordar animados.
20. ⏳ Virar o corpo no lugar, com passos.
21. ⏳ Mola na cabeça e no cabelo (atraso e volta ao parar).
22. ⏳ Pés presos ao chão (IK nas pernas, sem escorregar).
23. ⏳ Pegar e soltar objeto (anexar ao pulso).
24. ⏳ Cair ou tropeçar.
25. ⏳ Tremer (frio, medo).
26. ⏳ Gestos de fala: mãos acompanhando a fala.
27. ⏳ Abraço e aperto de mão entre dois personagens.
28. ⏳ Easing de antecipação e overshoot em todas as poses.

## Personagem: rosto
29. ✅ 12 expressões, com mistura entre duas.
30. ✅ Pálpebra que fecha de verdade.
31. ✅ Pálpebra de baixo que sobe no sorriso.
32. ✅ Bochechas que sobem.
33. ✅ Rugas de raiva e dor.
34. ✅ Boca com maxilar, dentes de cima e de baixo e língua.
35. ✅ Cantos da boca (sorriso e tristeza).
36. ✅ Piscadas em tempo variável, às vezes duplas.
37. ✅ Fala procedural.
38. ✅ Lip-sync com `palavras.json` (vogais abertas e redondas).
39. ⏳ Sacadas dos olhos (olhadinhas rápidas).
40. ⏳ Pupila que dilata no medo.
41. ⏳ Lágrima e suor.
42. ⏳ Nariz franzido (nojo).
43. ⏳ Sobrancelha assimétrica (dúvida).
44. ⏳ Rubor nas bochechas.
45. ⏳ Bocejo.
46. ⏳ Microexpressões aleatórias.

## Personagem: aparência
47. ✅ Pele com luz atravessando (SSS falso) e borda quente.
48. ✅ Figurante: mesmo esqueleto, 10× mais leve.
49. ⏳ Variedade de rosto: nariz, queixo, olhos e idade por seed.
50. ⏳ Mulheres: cabelo longo melhor, rosto mais fino, sem barba.
51. ⏳ Crianças e idosos (proporções).
52. ⏳ Roupas: camiseta, jaleco, pijama, casaco de inverno, uniforme.
53. ⏳ Acessórios: óculos, boné, mochila, cachecol.
54. ⏳ Cabelo com mais mechas e brilho.
55. ⏳ Brilho úmido nos olhos (2º reflexo).
56. ⏳ Sapatos com sola e cadarço.
57. ⏳ Tecido com textura e sheen.

## Bichos
58. ✅ Urso: respira, dorme e anda.
59. ✅ Lêmure: respira, enrola e mexe a cauda.
60. ⏳ Cachorro e gato.
61. ⏳ Pássaro voando (ciclo de asa).
62. ⏳ Peixe e baleia nadando.
63. ⏳ Rosto expressivo nos bichos.

## Câmera
64. ✅ `focar`: foco automático e rack focus.
65. ✅ `camMao`: câmera na mão.
66. ⏳ Trilhos: dolly, órbita, grua e push-in, com easing.
67. ⏳ Zoom de lente (mudar fov) com dolly zoom.
68. ⏳ Desfoque de movimento na câmera rápida.
69. ⏳ Plano-sequência com troca de foco entre 2 rostos.
70. ⏳ Regra dos terços automática para o rosto.

## Luz
71. ✅ 6 presets: noite, pôr do sol, interior, dramática, dia, frio.
72. ✅ Raios de luz (god rays) a partir de `st.sol`.
73. ⏳ Luzes práticas: abajur, tela de celular no rosto, vela.
74. ⏳ Luz piscando (raio, sirene, TV).
75. ⏳ Sombra de janela projetada (gobo).
76. ⏳ Reflexo no chão molhado (espelho falso).
77. ⏳ Luz de preenchimento que acompanha o rosto.

## Pós-produção
78. ✅ Oclusão de ambiente (sombra de contato).
79. ✅ Névoa por profundidade.
80. ✅ Bloom em 2 raios, com halação quente.
81. ✅ Aberração cromática nas bordas.
82. ✅ Bokeh anamórfico (oval).
83. ✅ Bokeh realçado nos pontos de luz.
84. ✅ Split-tone: sombras frias, luzes quentes.
85. ✅ Curva S de contraste.
86. ✅ Grão mais forte nas sombras.
87. ✅ Vinheta oval.
88. ⏳ LUTs por clima (sépia, pesadelo, sonho).
89. ⏳ Distorção de lente (barril leve).
90. ⏳ Flare de lente no sol e nos faróis.
91. ⏳ Exposição que respira (adaptação de olho).

## Ambiente e efeitos
92. ✅ Poeira, neve e partículas no ar.
93. ⏳ Chuva com respingos.
94. ⏳ Fumaça e vapor volumétricos falsos.
95. ⏳ Fogo e brasas.
96. ⏳ Água: superfície com reflexo e ondas.
97. ⏳ Vegetação balançando com o vento.
98. ⏳ Kit de cenário: quarto, cozinha, hospital, rua, laboratório.
99. ⏳ Céu com gradiente, nuvens e estrelas.
100. ⏳ Teste de desempenho: render de cena "cinema" abaixo de 4 s por quadro.
