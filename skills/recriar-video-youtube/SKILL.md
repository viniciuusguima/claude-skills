---
name: recriar-video-youtube
description: Recria em espanhol, do zero, um vídeo longo do YouTube (horizontal, 3 a 10 min) para o canal Bitácora de Vuelo a partir de um link — assiste ao original com a skill watch (plugin claude-video), analisa a thumbnail e o título, escreve um roteiro próprio em espanhol, gera narração neural, anima em canvas, renderiza o MP4 1920×1080 e escreve os prompts da thumbnail para o Gemini (Nano Banana), o título, a descrição com capítulos e as tags. O trabalho é dividido entre agentes (analista de vídeo, analista de thumb, roteirista, animadores por bloco, designer de thumb, revisor). Use sempre que o usuário mandar um link do YouTube (youtube.com/watch, youtu.be) pedindo para "fazer esse vídeo", "recriar", "fazer igual em espanhol", "vídeo para o Bitácora de Vuelo", ou pedir só a thumbnail, o título ou a análise de um vídeo do YouTube para esse canal, mesmo que não diga "skill". Para Shorts, TikTok e Reels (vídeo curto vertical em português) use recriar-video-tiktok.
---

# Recriar vídeo do YouTube em espanhol (canal Bitácora de Vuelo)

A entrega tem três partes, todas em espanhol:

- `saida/<slug>.mp4`: 1920×1080, 30 fps, narração neural, trilha sintetizada, animação em canvas, tudo gerado por código.
- `saida/thumb_prompts.md`: dois prompts (A e B) com que o usuário gera no Gemini (Nano Banana) as thumbnails 1280×720, anexando a thumb original e as fotos dele como referência. O que ele gerar volta como `saida/thumb_a.png` e `saida/thumb_b.png`, para escolher ou testar uma contra a outra no YouTube.
- `saida/post.txt`: título, descrição com capítulos e tags.

Nada do original entra no vídeo: nem imagem, nem áudio, nem frase. O original é a referência de tema, estrutura e ritmo. Na thumbnail, a original entra só como anexo de referência no Gemini, e o prompt pede um desenho novo.

Caminhos usados abaixo:

- `<skill>`: a pasta desta skill.
- `<motor>`: `<skill>/../recriar-video-tiktok`. O motor de animação, a voz, a trilha e o render moram lá e são os mesmos dos vídeos curtos. Leia `<motor>/references/motor.md` quando precisar da API.
- `<watch>`: o `watch.py` da skill watch. `python <skill>/scripts/referencia_youtube.py --onde-watch` imprime o caminho.

Antes de tudo leia `canal.md`: idioma, voz, tom, identidade visual e o que ainda falta decidir sobre o canal.

## Você é o orquestrador

Você conversa com o usuário, roda os scripts, despacha os agentes e confere o que eles devolvem. O trabalho pesado de cada etapa fica com um agente, por dois motivos: os quadros do vídeo e as folhas de conferência são dezenas de imagens que encheriam o seu contexto, e várias etapas não dependem uma da outra e andam ao mesmo tempo.

| Agente | Brief | Lê | Escreve | Roda junto com |
|---|---|---|---|---|
| Analista de vídeo | `agentes/analista-video.md` | o link (via watch) | `referencia/analise.md`, `referencia/transcricao.txt` | analista de thumb |
| Analista de thumb | `agentes/analista-thumb.md` | thumb e título originais, thumbs do canal, `referencia/fotos/` | `referencia/thumb_analise.md` | analista de vídeo |
| Roteirista | `agentes/guionista.md` | as duas análises, `canal.md` | `roteiro.json`, `saida/post.txt` | — |
| Animador (um por bloco) | `agentes/animador.md` | `roteiro.json`, `timeline.js`, o bloco dele | `cenas/<bloco>.js` | os outros animadores |
| Designer de thumb | `agentes/disenador-thumb.md` | `referencia/thumb_analise.md`, `saida/post.txt`, `referencia/fotos/` | `saida/thumb_prompts.md` | o render final |
| Revisor | `agentes/revisor.md` | tudo o que vai ser publicado | `build/revision.md` | — |

**Como despachar**: ferramenta Agent, tipo `general-purpose`, com este prompt (preencha os caminhos absolutos; agentes paralelos vão na mesma mensagem):

```
Leia <skill>/agentes/<papel>.md e faça o que ele pede.
Projeto: <pasta do projeto>
Skill: <skill>   Motor: <motor>   Watch: <watch>
Link: <url do vídeo original>
<o que é só desta vez: o bloco, o trecho do vídeo, um pedido do usuário>
```

O agente não vê esta conversa. O que ele precisa saber e não está no brief nem nos arquivos do projeto tem que ir nesse prompt. O retorno dele é um resumo; o trabalho está nos arquivos, e é neles que você confere antes de seguir.

## Antes de começar: combine com o usuário

Pergunte só o que não estiver claro no pedido; para o resto, use o padrão e diga qual usou.

| Decisão | Padrão |
|---|---|
| Duração | a do original, até 8 min. Original mais longo: condensar para 6 a 8 min e avisar |
| Voz | a de `canal.md` |
| Roteiro | **próprio**, no mesmo tema e estrutura do original |
| Pasta | `E:/Projetos/bitacora-de-vuelo/<slug-curto-do-tema>` |
| Fotos para a thumb | peça logo na primeira mensagem: fotos do assunto (o avião, o lugar) e o print da thumb do canal de referência. Ele salva em `<projeto>/referencia/fotos/`; o que vier colado no chat você descreve no prompt do designer de thumb. Sem fotos, o prompt usa só a thumb original |

Sobre o roteiro: o visual, a voz e a música já saem originais. O texto é o que mais pesa em direitos autorais, e reaproveitá-lo prende o canal ao conteúdo de outra pessoa. O padrão é um roteiro novo com a mesma mensagem central. Se o usuário pedir uma adaptação fiel, faça, e lembre em uma linha de dar crédito ao canal original na descrição.

Se `canal.md` ainda tiver itens em "A definir", resolva-os com o usuário agora, numa pergunta só, e grave as respostas no arquivo. Isso acontece uma vez, no primeiro vídeo.

## Fluxo

Cada vídeo também é um **card** no quadro do Trello do usuário, com a etiqueta do canal. Leia `references/publicar.md` antes do passo 2.

### 0. Preparar
```bash
python <skill>/scripts/novo_projeto.py E:/Projetos/bitacora-de-vuelo/<slug>
python <skill>/scripts/referencia_youtube.py "<url>" --projeto E:/Projetos/bitacora-de-vuelo/<slug> --canal 12
```
O primeiro cria a pasta (motor, `roteiro.json`, `cenas/`, dois modelos de thumbnail) e confere as dependências. O segundo grava `referencia/meta.json`, a thumbnail original e a grade com as thumbs mais vistas do canal de referência.

Confira a skill watch antes de despachar o analista, porque um agente não consegue fazer perguntas ao usuário:
```bash
python "<pasta do watch.py>/setup.py" --json
```
Se `first_run` for `true`, abra o `SKILL.md` da watch (uma pasta acima de `scripts/`) e faça o "Step 2" com o usuário: é lá que ele escolhe o motor (Gemini ou local) e o nível de detalhe. Se a watch não estiver instalada, veja "Quando algo foge do padrão".

### 1. Analisar (dois agentes ao mesmo tempo)
Despache o **analista de vídeo** e o **analista de thumb** na mesma mensagem. Vídeo com mais de 10 min: um analista de vídeo por trecho de 8 min, cada um com `Trecho: 0:00-8:00` no prompt.

Ao voltar, leia `referencia/analise.md` e `referencia/thumb_analise.md` inteiros. Se o analista avisou que faltou evidência (sem legenda, vídeo bloqueado), decida com o usuário antes de escrever em cima de uma análise furada.

### 2. Roteiro
Despache o **roteirista**. Ele devolve `roteiro.json` (cenas agrupadas em blocos) e `saida/post.txt` com três opções de título.

Mostre ao usuário, em poucas linhas: o título recomendado, a promessa do vídeo, a lista de blocos e a duração estimada. Um vídeo longo custa caro para refazer, então espere o ok dele aqui, a menos que ele tenha pedido para fazer direto. Abra o **card** em ✍️ Roteiro.

### 3. Voz, trilha e esqueleto das cenas
Mova o **card** para 🎬 Produção.
```bash
cd E:/Projetos/bitacora-de-vuelo/<slug>
python <motor>/scripts/gerar_audio.py        # voz por cena -> timeline.js, legendas.srt, build/narracao.wav
python <motor>/scripts/gerar_trilha.py       # pad ambiente + ducking -> build/trilha_final.wav
python <skill>/scripts/juntar_cenas.py --esqueleto   # cria cenas/<bloco>.js com a duração e o texto de cada cena
```
Confira a duração total impressa por `gerar_audio.py`. Se passou do combinado em mais de 10%, peça ao roteirista para cortar antes de animar: cortar depois joga fora cenas prontas.

### 4. Animar (um agente por bloco, ao mesmo tempo)
Se o vídeo tem um objeto que aparece em vários blocos (o avião, um mapa, um painel), escreva você mesmo `cenas/00_comum.js` antes de despachar, para todos desenharem igual. O formato está no topo de `<skill>/scripts/juntar_cenas.py`.

Despache um **animador** por bloco, com `Bloco: <nome>` no prompt, até cinco por vez. Cada um escreve só o arquivo dele e confere o próprio trabalho com `folha_bloco.mjs`, que não mexe em nada compartilhado.

### 5. Conferir o conjunto
Mova o **card** para 🔍 Revisão.
```bash
python <skill>/scripts/juntar_cenas.py --estrito                       # cenas/*.js -> cenas.js; acusa cena faltando
node <motor>/scripts/render.mjs --folha build/folha.png --fracs 0.85   # um quadro de cada cena do vídeo inteiro
```
Abra `build/folha.png` com Read. Os animadores já olharam cada bloco por dentro; o que só aparece aqui é a costura: blocos vizinhos com cara de vídeos diferentes, o mesmo objeto desenhado de dois jeitos, um bloco muito mais vazio que os outros. Ajuste pequeno, faça você no `cenas/<bloco>.js` e junte de novo; bloco para refazer, devolva ao animador com o que precisa mudar.

### 6. Renderizar, e a thumbnail em paralelo
Dispare o render em segundo plano (leva cerca de 1 min por minuto de vídeo) e, na mesma mensagem, despache o **designer de thumb**:
```bash
node <motor>/scripts/render.mjs              # -> saida/<slug>.mp4
```
Enquanto os dois trabalham, feche `saida/post.txt`: escolha o título com o usuário se ele ainda não escolheu e cole os capítulos impressos por
```bash
python <skill>/scripts/juntar_cenas.py --capitulos
```
Quando o designer voltar, mande `saida/thumb_prompts.md` ao usuário com `SendUserFile` e peça para ele gerar as duas no Gemini e salvar como `saida/thumb_a.png` e `saida/thumb_b.png`. O vídeo segue sem esperar por isso; quando as imagens chegarem, confira-as como em "Conferir a imagem gerada" de `references/thumb.md`.

Quando o render terminar, confira o resultado de verdade:
```bash
ffmpeg -v error -i saida/<slug>.mp4 -vf "fps=1/15,scale=480:-1,tile=6x6" -frames:v 1 build/conferencia.png
ffmpeg -i saida/<slug>.mp4 -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness"
```
O volume deve ficar perto de -15 LUFS.

### 7. Revisão de olhos frescos
Despache o **revisor**. Ele não participou de nada, e é por isso que serve: lê o espanhol como um falante nativo leria, olha a thumbnail no tamanho do feed e confere se título, thumbnail e os primeiros 30 s contam a mesma história. O usuário fala português e não vai pegar um espanhol torto sozinho, então esta etapa não é opcional.

Leia `build/revision.md`. Corrija tudo o que estiver como **bloqueante** (texto de cena: `roteiro.json` → passos 3, 5 e 6 de novo, só a voz das cenas alteradas é regerada) e use o seu critério no resto.

### 8. Entregar
Copie o MP4, os prompts e as thumbnails que o usuário já gerou para a pasta do canal no Drive, pegue os links e mova o **card** para 📱 Pronto para postar (`references/publicar.md`).

Mande o MP4 com `SendUserFile` e, na mensagem, nesta ordem:
1. **Título**, **descrição** e **tags** em blocos de código separados, para copiar com um clique.
2. Qual thumbnail (A ou B) você recomenda e por quê, em uma frase; se ele ainda não gerou, lembre que os prompts estão no Drive.
3. Em poucas linhas: duração, voz, se o roteiro é próprio ou adaptado, o que o revisor apontou e ficou sem corrigir, que você não ouviu o áudio (vale assistir uma vez) e como mudar uma frase (editar `roteiro.json` → passos 3, 5 e 6).
4. O link do **card**.

## Pedidos parciais

- **Só a thumbnail** de um vídeo que já existe: passo 0, analista de thumb, designer de thumb.
- **Só a análise** de um vídeo: passos 0 e 1, e entregue as duas análises resumidas.
- **Ajuste num vídeo pronto**: edite o que mudou e refaça só os passos que dependem disso.

## Quando algo foge do padrão

- **Watch não instalada**: é o plugin `watch` do repositório `bradautomates/claude-video`. Com o ok do usuário, instale você mesmo com `claude plugin marketplace add bradautomates/claude-video` e `claude plugin install watch@claude-video`. Não precisa de sessão nova: os agentes chamam o `watch.py` pelo caminho, que `referencia_youtube.py --onde-watch` já encontra. Na primeira vez o usuário escolhe o motor (passo 0); com Gemini, abra `~/.config/watch/.env` no Bloco de Notas para ele colar a chave, que nunca passa pelo chat. Se ele preferir não instalar, analise pelo navegador embutido como em `<motor>/references/extracao.md` (seção YouTube) e avise que a análise visual fica mais rasa.
- **Watch falha ao baixar (erro 403)**: atualize o yt-dlp (`winget upgrade --id yt-dlp.yt-dlp`) e tente uma vez. Não use cookies do navegador sem o usuário pedir.
- **Gemini falha**: a watch não troca de motor sozinha. Diga ao usuário o erro e ofereça rodar com `--engine local`.
- **Vídeo original com pessoa falando para a câmera ou feito de filmagens**: a skill produz no estilo animado. Avise e siga; a análise e o roteiro funcionam igual.
- **Vídeo com mais de 10 min de resultado**: o motor nasceu para vídeos de 1 min. Acima de umas 120 cenas, renderize primeiro um trecho (`--de 0 --ate 60 --saida build/trecho.mp4`) para confirmar que voz, trilha e imagem estão em ordem antes de gastar o render inteiro.
- **edge-tts falha** (`NoAudioReceived`): rede ou texto vazio. Tente de novo.
- **`roteiro.json` com erro "Unexpected UTF-8 BOM"**: o arquivo foi salvo pelo PowerShell com BOM. Regrave com a ferramenta Write.
- **Usuário quer outro canal ou outro idioma**: esta skill é do Bitácora de Vuelo. O que muda de um canal para outro está em `canal.md` e `references/publicar.md`.
