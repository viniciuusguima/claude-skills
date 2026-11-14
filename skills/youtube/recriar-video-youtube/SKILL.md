---
name: recriar-video-youtube
description: Recria do zero um vídeo longo do YouTube (horizontal, 3 a 10 min) a partir de um link, para qualquer canal do usuário criado com a skill criar-canal e na língua que ele escolher — pergunta logo de cara o canal e a língua quando o pedido não diz, assiste ao original com a skill watch (plugin claude-video), analisa a thumbnail e o título, escreve um roteiro próprio, gera narração neural, anima em canvas, renderiza o MP4 1920×1080 e escreve os prompts da thumbnail para o Gemini (Nano Banana), o título, a descrição com capítulos e as tags. Tudo é feito pelo próprio Claude da conversa, SEM subagentes (a Agent tool não é usada); os briefs em agentes/ servem de guia de cada etapa. Use sempre que o usuário mandar um link do YouTube (youtube.com/watch, youtu.be) pedindo para "fazer esse vídeo", "recriar", "fazer igual em espanhol" (ou em outra língua), "vídeo para o canal X", ou pedir só a thumbnail, o título ou a análise de um vídeo do YouTube, mesmo que não diga "skill". Para criar um canal novo (banner, foto, perfil) use criar-canal. Para Shorts, TikTok e Reels (vídeo curto vertical) use recriar-video-tiktok.
argument-hint: "<link do YouTube> [canal] [língua]"
---

# Recriar vídeo do YouTube

## Primeiro de tudo: o canal e a língua

Cada vídeo é de um canal do usuário e sai numa língua que ele escolhe. Os dois podem vir junto com o link (ex.: `/recriar-video-youtube https://youtu.be/... bitacora de vuelo espanhol`).

Os canais são os perfis em `<skill>/../criar-canal/canais/*.md`, criados pela skill criar-canal. Liste-os antes de perguntar.

- **O pedido diz o canal e a língua**: use e siga.
- **Falta um dos dois (ou os dois)**: antes de qualquer outra coisa (script, as outras perguntas), pergunte só o que falta, numa chamada de `AskUserQuestion`: "Para qual canal é o vídeo?" (uma opção por perfil) e "Em que língua vai ser o vídeo?" (a primeira opção é a língua principal do canal, se ele já foi escolhido; depois Espanhol, Português, Inglês; outra língua ele digita em "Other"). Sem a ferramenta, pergunte no chat. Espere a resposta. Não deduza a língua pela do vídeo original.
- **O canal não tem perfil** (ou não existe nenhum): o vídeo depende dele (voz, tom, marca das thumbs, Trello, Drive). Diga isso e ofereça criar agora com a skill criar-canal (`/criar-canal <nome>`); volte para o vídeo quando o perfil existir.
- **Ajuste num vídeo que já existe**: canal e língua estão nos campos `canal` e `idioma` de `roteiro.json`; não pergunte de novo.

Com os dois definidos:
- `<canal>`: o perfil do canal, `<skill>/../criar-canal/canais/<slug-do-canal>.md`. Leia inteiro: tom, identidade visual, marca nas thumbs, metáforas visuais, pasta dos projetos, Trello e Drive, e o que ainda está "A definir".
- A língua: código, variante, voz e tratamento em `references/linguas.md`; se o perfil tem uma exceção para essa língua (outra voz, outro tratamento), vale a do perfil. Língua fora da tabela: siga o que `linguas.md` diz para esse caso antes de criar o projeto.

Canal e língua ficam gravados no projeto (`canal`, `idioma` e `voz` em `roteiro.json`) e valem em todas as etapas.

A entrega tem três partes, todas na língua do vídeo:

- `saida/<slug>.mp4`: 1920×1080, 30 fps, narração neural, trilha sintetizada, animação em canvas, tudo gerado por código.
- `saida/thumb_prompts.md`: dois prompts (A e B) com que o usuário gera no Gemini (Nano Banana) as thumbnails 1280×720, anexando a thumb original e as fotos dele como referência. O que ele gerar volta como `saida/thumb_a.png` e `saida/thumb_b.png`, para escolher ou testar uma contra a outra no YouTube.
- `saida/post.txt`: título, descrição com capítulos e tags.

Nada do original entra no vídeo: nem imagem, nem áudio, nem frase. O original é a referência de tema, estrutura e ritmo. Na thumbnail, a original entra só como anexo de referência no Gemini, e o prompt pede um desenho novo.

Caminhos usados abaixo:

- `<skill>`: a pasta desta skill.
- `<projeto>`: `<pasta dos projetos do canal>/<slug-curto-do-tema>`. A pasta dos projetos está no perfil (ex.: `E:/Projetos/bitacora-de-vuelo/`).
- `<motor>`: a skill recriar-video-tiktok. O motor de animação, a voz, a trilha e o render moram lá e são os mesmos dos vídeos curtos. `python <skill>/scripts/referencia_youtube.py --onde-motor` imprime o caminho. Leia `<motor>/references/motor.md` quando precisar da API.
- `<watch>`: o `watch.py` da skill watch. `python <skill>/scripts/referencia_youtube.py --onde-watch` imprime o caminho.

## Regra: SEM agentes

**Não use a ferramenta Agent nem subagentes, em nenhuma etapa** (decisão do usuário). Você mesmo faz cada etapa da tabela abaixo, na ordem do fluxo, lendo o brief em `agentes/<etapa>.md` como guia do que fazer e do formato do que escrever. Os arquivos de saída são os mesmos. Para não encher o contexto: leia quadros e folhas de conferência só em lotes pequenos (ou em escala reduzida) e anime um bloco por vez. As etapas andam em sequência (o render pode seguir em segundo plano com `run_in_background`).

| Etapa | Brief (guia) | Lê | Escreve |
|---|---|---|---|
| Analisar o vídeo | `agentes/analista-video.md` | o link (via watch) | `referencia/analise.md`, `referencia/transcricao.txt` |
| Analisar a thumb | `agentes/analista-thumb.md` | thumb e título originais, thumbs do canal de origem, `referencia/fotos/`, o perfil | `referencia/thumb_analise.md` |
| Roteiro | `agentes/guionista.md` | as duas análises, o perfil, `references/linguas.md` | `roteiro.json`, `saida/post.txt` |
| Animar (um bloco por vez) | `agentes/animador.md` | `roteiro.json`, `timeline.js`, o bloco da vez, o perfil | `cenas/<bloco>.js` |
| Prompts da thumb | `agentes/disenador-thumb.md` | `referencia/thumb_analise.md`, `saida/post.txt`, `referencia/fotos/`, o perfil | `saida/thumb_prompts.md` |
| Revisão | `agentes/revisor.md` | tudo o que vai ser publicado | `build/revision.md` |

**Como executar uma etapa**: leia `<skill>/agentes/<etapa>.md`, faça o que ele pede com os caminhos do projeto, do motor e do watch, e grave os arquivos de saída. Sem agente separado, a "revisão de olhos frescos" (passo 7) é uma releitura crítica sua, feita depois de um intervalo de trabalho, relendo só os arquivos publicáveis e o `roteiro.json`, como falante nativo da língua do vídeo.

## Estilo visual: o do vídeo original (não o preto e branco do motor)

O vídeo recriado **copia o estilo do original**: a técnica (cartoon 2D plano, filmagem, mapas...), a paleta, os cenários e as cartelas. Só os personagens, os desenhos exatos, a pintura, os números e os nomes são nossos. O branco sobre preto do motor (a regra de paleta de `<motor>/references/motor.md`) é o modo antigo e **só vale se o usuário pedir esse estilo**.

- Antes de animar, leia "Estilo visual" de `referencia/analise.md` e abra uns 20 quadros de `referencia/watch/*/frames/` numa folha só (`ffmpeg -framerate 1 -i frames/frame_%04d.jpg -vf scale=480:-1,tile=5x5 -frames:v 1 build/original_folha.png`). Escreva um `referencia/estilo.md` curto: paleta em hex aproximado, cenários que se repetem, personagem recorrente, tipografia, o que aparece na tela em cada tipo de cena.
- Ligue o modo colorido do motor no projeto: `python <skill>/scripts/modo_cor.py <projeto>` e, no topo de `cenas/00_comum.js`, `M.modoCor(true)`. Nesse modo cada cena pinta o próprio fundo, com corte seco entre cenas.
- Em caso de dúvida sobre o estilo, pergunte ao usuário **antes** de animar, não depois de renderizar.

## Antes de começar: combine com o usuário

Pergunte só o que não estiver claro no pedido; para o resto, use o padrão e diga qual usou.

| Decisão | Padrão |
|---|---|
| Duração | a do original, até 8 min. Original mais longo: condensar para 6 a 8 min e avisar |
| Voz | a da língua em `references/linguas.md`, ou a exceção do perfil |
| Roteiro | **próprio**, no mesmo tema e estrutura do original |
| Pasta | `<pasta dos projetos do canal>/<slug-curto-do-tema>`. Se o mesmo tema já foi feito em outra língua, acrescente o código ao slug (`-en`), para os arquivos de um não sobrescreverem os do outro no Drive |
| Fotos para a thumb | peça logo na primeira mensagem: fotos do assunto (o objeto, o lugar) e o print da thumb do canal de origem. Ele salva em `<projeto>/referencia/fotos/`; o que vier colado no chat você descreve no prompt do designer de thumb. Sem fotos, o prompt usa só a thumb original |

Sobre o roteiro: o visual, a voz e a música já saem originais. O texto é o que mais pesa em direitos autorais, e reaproveitá-lo prende o canal ao conteúdo de outra pessoa. O padrão é um roteiro novo com a mesma mensagem central. Se o usuário pedir uma adaptação fiel, faça, e lembre em uma linha de dar crédito ao canal original na descrição.

Se o perfil do canal ainda tiver itens em "A definir", resolva-os com o usuário agora, numa pergunta só, e grave as respostas no perfil. Isso acontece uma vez por canal.

## Fluxo

Cada vídeo também é um **card** no quadro do Trello do usuário, com a etiqueta do canal. Leia `references/publicar.md` antes do passo 2.

### 0. Preparar
```bash
python <skill>/scripts/novo_projeto.py <projeto> --canal <slug-do-canal> --idioma <código> --voz <voz>
python <skill>/scripts/referencia_youtube.py "<url>" --projeto <projeto> --canal 12
```
O primeiro cria a pasta (motor, `roteiro.json` com o canal, a língua e a voz, `cenas/`, dois modelos de thumbnail) e confere as dependências. O segundo grava `referencia/meta.json`, a thumbnail original e a grade com as thumbs mais vistas do canal de onde o original veio.

Confira a skill watch antes de analisar:
```bash
python "<pasta do watch.py>/setup.py" --json
```
Se `first_run` for `true`, não pergunte nada ao usuário: a configuração inicial da watch já está decidida e é respondida pelo prompt fixo de `agentes/analista-video.md` (detalhe `balanced`, só legenda, sem transcrição de fala, `none`). Se a watch não estiver instalada, veja "Quando algo foge do padrão".

A watch é sempre chamada pela ferramenta Skill (`watch:watch`) com o prompt de `agentes/analista-video.md`:
```
Use the watch skill on <link> in the folder I shared.
For setup, choose balanced detail and captions only (none).
Summarize what is visible, with timestamps.
```

### 1. Analisar
Siga `agentes/analista-video.md` (watch) e `agentes/analista-thumb.md` você mesmo. Na análise do vídeo, **veja todos os frames que a watch extraiu**, sem amostrar. Vídeo com mais de 10 min: analise por trechos de 8 min (`--start/--end`).

Escreva `referencia/analise.md` e `referencia/thumb_analise.md`. Se faltou evidência (sem legenda, vídeo bloqueado), decida com o usuário antes de escrever em cima de uma análise furada.

### 2. Roteiro
Siga `agentes/guionista.md` você mesmo e escreva `roteiro.json` (cenas agrupadas em blocos) e `saida/post.txt` com três opções de título.

Mostre ao usuário, em poucas linhas: o título recomendado, a promessa do vídeo, a lista de blocos e a duração estimada. Um vídeo longo custa caro para refazer, então espere o ok dele aqui, a menos que ele tenha pedido para fazer direto. Abra o **card** em ✍️ Roteiro.

### 3. Voz, trilha e esqueleto das cenas
Mova o **card** para 🎬 Produção.
```bash
cd <projeto>
python <motor>/scripts/gerar_audio.py        # voz por cena -> timeline.js, legendas.srt, build/narracao.wav
python <motor>/scripts/gerar_trilha.py       # pad ambiente + ducking -> build/trilha_final.wav
python <skill>/scripts/juntar_cenas.py --esqueleto   # cria cenas/<bloco>.js com a duração e o texto de cada cena
```
Confira a duração total impressa por `gerar_audio.py`. Se passou do combinado em mais de 10%, corte cenas do roteiro antes de animar: cortar depois joga fora cenas prontas.

### 4. Animar (um bloco por vez)
Se o vídeo tem um objeto que aparece em vários blocos (um avião, um mapa, um painel), escreva primeiro `cenas/00_comum.js`, para todos os blocos desenharem igual. O formato está no topo de `<skill>/scripts/juntar_cenas.py`.

Siga `agentes/animador.md` para cada bloco, um de cada vez: escreva `cenas/<bloco>.js` e confira com `folha_bloco.mjs` antes de passar ao próximo.

### 5. Conferir o conjunto
Mova o **card** para 🔍 Revisão.
```bash
python <skill>/scripts/juntar_cenas.py --estrito                       # cenas/*.js -> cenas.js; acusa cena faltando
node <motor>/scripts/render.mjs --folha build/folha.png --fracs 0.85   # um quadro de cada cena do vídeo inteiro
```
Abra `build/folha.png` com Read. Você já olhou cada bloco por dentro; o que só aparece aqui é a costura: blocos vizinhos com cara de vídeos diferentes, o mesmo objeto desenhado de dois jeitos, um bloco muito mais vazio que os outros. Ajuste em `cenas/<bloco>.js` e junte de novo.

### 6. Renderizar, e a thumbnail em paralelo
Dispare o render em segundo plano (leva cerca de 1 min por minuto de vídeo) e, enquanto roda, siga `agentes/disenador-thumb.md` você mesmo:
```bash
node <motor>/scripts/render.mjs              # -> saida/<slug>.mp4
```
Também enquanto o render roda, feche `saida/post.txt`: escolha o título com o usuário se ele ainda não escolheu e cole os capítulos impressos por
```bash
python <skill>/scripts/juntar_cenas.py --capitulos
```
Quando `saida/thumb_prompts.md` estiver pronto, mande `saida/thumb_prompts.md` ao usuário com `SendUserFile` e peça para ele gerar as duas no Gemini e salvar como `saida/thumb_a.png` e `saida/thumb_b.png`. O vídeo segue sem esperar por isso; quando as imagens chegarem, confira-as como em "Conferir a imagem gerada" de `references/thumb.md`.

Quando o render terminar, confira o resultado de verdade:
```bash
ffmpeg -v error -i saida/<slug>.mp4 -vf "fps=1/15,scale=480:-1,tile=6x6" -frames:v 1 build/conferencia.png
ffmpeg -i saida/<slug>.mp4 -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness"
```
O volume deve ficar perto de -15 LUFS.

### 7. Revisão de olhos frescos
Siga `agentes/revisor.md` você mesmo, com distanciamento: leia o texto como um falante nativo da língua do vídeo leria, olhe a thumbnail no tamanho do feed e confira se título, thumbnail e os primeiros 30 s contam a mesma história. O usuário fala português: num vídeo em outra língua ele não vai pegar um erro sozinho, e num vídeo em português a revisão continua sendo quem pega o fato sem apoio e a promessa que o vídeo não paga. Esta etapa não é opcional. Grave em `build/revision.md`.

Leia `build/revision.md`. Corrija tudo o que estiver como **bloqueante** (texto de cena: `roteiro.json` → passos 3, 5 e 6 de novo, só a voz das cenas alteradas é regerada) e use o seu critério no resto.

### 8. Entregar
Antes de subir, arrume o Drive: o que já está em ✅ Publicado no Trello sai da pasta do canal e vai para "<Nome do canal> - Postados" (seção "Arrumar o Drive" de `references/publicar.md`). Depois copie o MP4, os prompts e as thumbnails que o usuário já gerou para a pasta do canal, pegue os links e mova o **card** para 📱 Pronto para postar.

Mande o MP4 com `SendUserFile` e, na mensagem, nesta ordem:
1. **Título**, **descrição** e **tags** em blocos de código separados, para copiar com um clique.
2. Qual thumbnail (A ou B) você recomenda e por quê, em uma frase; se ele ainda não gerou, lembre que os prompts estão no Drive.
3. Em poucas linhas: canal, duração, língua e voz, se o roteiro é próprio ou adaptado, o que o revisor apontou e ficou sem corrigir, que você não ouviu o áudio (vale assistir uma vez) e como mudar uma frase (editar `roteiro.json` → passos 3, 5 e 6).
4. O link do **card**.

## Pedidos parciais

- **Só a thumbnail** de um vídeo que já existe: passo 0, análise de thumb, prompts de thumb.
- **Só a análise** de um vídeo: passos 0 e 1, e entregue as duas análises resumidas.
- **Ajuste num vídeo pronto**: edite o que mudou e refaça só os passos que dependem disso.

## Quando algo foge do padrão

- **Watch não instalada**: é o plugin `watch` do repositório `bradautomates/claude-video`. Com o ok do usuário, instale você mesmo com `claude plugin marketplace add bradautomates/claude-video` e `claude plugin install watch@claude-video`. Não precisa de sessão nova: o `watch.py` é chamado pelo caminho, que `referencia_youtube.py --onde-watch` já encontra. A configuração inicial já é a do prompt fixo (passo 0), sem perguntar ao usuário. Se ele pedir o motor Gemini, abra `~/.config/watch/.env` no Bloco de Notas para ele colar a chave, que nunca passa pelo chat. Se ele preferir não instalar, analise pelo navegador embutido como em `<motor>/references/extracao.md` (seção YouTube) e avise que a análise visual fica mais rasa.
- **Watch falha ao baixar (erro 403)**: atualize o yt-dlp (`winget upgrade --id yt-dlp.yt-dlp`) e tente uma vez. Não use cookies do navegador sem o usuário pedir.
- **Gemini falha**: a watch não troca de motor sozinha. Diga ao usuário o erro e ofereça rodar com `--engine local`.
- **Motor não encontrado**: a skill recriar-video-tiktok precisa estar instalada também (veja o README do repositório). `--onde-motor` diz onde procurou.
- **Vídeo original com pessoa falando para a câmera ou feito de filmagens**: a skill produz no estilo animado. Avise e siga; a análise e o roteiro funcionam igual.
- **Vídeo com mais de 10 min de resultado**: o motor nasceu para vídeos de 1 min. Acima de umas 120 cenas, renderize primeiro um trecho (`--de 0 --ate 60 --saida build/trecho.mp4`) para confirmar que voz, trilha e imagem estão em ordem antes de gastar o render inteiro.
- **edge-tts falha** (`NoAudioReceived`): rede ou texto vazio. Tente de novo.
- **`roteiro.json` com erro "Unexpected UTF-8 BOM"**: o arquivo foi salvo pelo PowerShell com BOM. Regrave com a ferramenta Write.
- **Usuário quer trocar a língua de um vídeo já começado**: mude `idioma` e `voz` em `roteiro.json` (valores de `references/linguas.md` ou do perfil), reescreva o roteiro na língua nova e refaça do passo 2 em diante. A análise do passo 1 continua valendo.
- **Usuário quer o mesmo vídeo em outro canal**: é um projeto novo, na pasta do outro canal; a análise do passo 1 pode ser copiada de um projeto para o outro.


## Regra do usuário: a thumbnail/capa SEGUE A THUMB DO VÍDEO ORIGINAL
Baixe a thumb do original (`yt-dlp --skip-download --write-thumbnail --convert-thumbnails jpg -o <pasta>/referencia/thumb_dl/thumb <link>`), abra com Read e replique o MESMO layout (divisão da tela, posição/cor/tipografia dos textos, quantidade de elementos), com elementos e textos nossos (nunca pixels do original). Na skill `recriar-video`, `scripts/gerar_thumb.py --modelo dividida|grade|titulo|quadro0 --ref` já faz isso e grava `build/thumb_comparacao.png` (original | nova) para conferir com Read. Vertical (TikTok/Short): a capa é o quadro t=0, que já deve ter texto na tela. Thumb genérica (quadro + título embaixo) fora do layout do original é errada.
