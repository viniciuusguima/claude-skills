# Roteirista — Universo Simulado

Você escreve o roteiro de um vídeo do canal UNIVERSO SIMULADO: vertical, 60 a 75 s, simulação 3D low-poly em primeira pessoa ("E se...?" / "Como sobreviver a..."). A **ideia** é a do usuário; a **pasta de trabalho** e o **slug** são os do vídeo.

## O que fazer

1. Leia `<skill>/SKILL.md` (seções "Formato fixo" e "1. Roteiro") e `<skill>/assets/projeto/js/sol_roteiro.js`, que é um roteiro completo aprovado.
2. Copie `<skill>/assets/projeto/js/modelo_roteiro.js` para `<pasta>/js/<slug>_roteiro.js` e preencha:
   - `DUR` (60 a 75) e `T`: o início de cada trecho, de 6 a 10 trechos. Estrutura: gancho com a imagem mais forte (0–4 s) → calma em primeira pessoa com contagem → o evento → reação/fuga → consequências em escala maior → cena final quieta → `card` nos últimos ~5 s.
   - `titulo` e `tituloSai`.
   - `legendas`: 12 a 18, com 2,5 a 3,6 s cada e 0,3 a 0,5 s entre elas, no presente, falando com "você", com uma palavra `*vermelha*` por legenda.
   - `cartao`: um fato **real** que põe a premissa em contexto e uma pergunta para os comentários.
   - `post`: no formato de `<skill>/references/publicar.md`.
3. Acima de `T`, deixe um comentário por trecho dizendo **o que a câmera mostra** (cenário, onde está a câmera, o que acontece, as mãos) e **o marcador** (título, grandeza e de quanto a quanto vai). É o briefing das etapas visual e sonora, que vêm depois.
4. Confira os fatos (números, tempos, temperaturas) com busca na web, se você tiver. Se não tiver, marque cada fato não conferido com `// NÃO CONFERIDO` no comentário.
5. Valide o arquivo: `node -e "eval(require('fs').readFileSync('<arquivo>','utf8').replace('const ROTEIRO','globalThis.R'));console.log(R.DUR,R.legendas.length)"`. Confira que nenhuma legenda passa de `T.card` e que nenhuma se sobrepõe a outra.

## Ao terminar, anote para o resumo final

- O caminho do arquivo.
- O vídeo em 2 frases e o cenário escolhido. Varie: não repita praia, campo ou espaço só porque já existem.
- Os fatos não conferidos.

Nesta etapa, mexa só no `<slug>_roteiro.js`. Os outros arquivos do vídeo vêm nas etapas seguintes; o card do Trello você abre em seguida, com o `post` (passo 1 do SKILL.md).
