---
name: recriar-video-youtube
description: Recria do zero um vídeo longo do YouTube (horizontal, 3 a 10 min) a partir de um link, para qualquer canal do usuário criado com a skill criar-canal e na língua que ele escolher — pergunta logo de cara o canal e a língua quando o pedido não diz, assiste ao original com a skill watch (plugin claude-video), analisa a thumbnail e o título, escreve um roteiro próprio, gera narração neural, anima em canvas, renderiza o MP4 1920×1080 e escreve os prompts da thumbnail para o Gemini (Nano Banana), o título, a descrição com capítulos e as tags. O trabalho é feito em etapas, sem agentes (análise do vídeo e da thumb, roteiro, animação por bloco, prompts de thumb, revisão). Use sempre que o usuário mandar um link do YouTube (youtube.com/watch, youtu.be) pedindo para "fazer esse vídeo", "recriar", "fazer igual em espanhol" (ou em outra língua), "vídeo para o canal X", ou pedir só a thumbnail, o título ou a análise de um vídeo do YouTube, mesmo que não diga "skill". Para criar um canal novo (banner, foto, perfil) use criar-canal. Para Shorts, TikTok e Reels (vídeo curto vertical) use recriar-video-tiktok.
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

Canal e língua ficam gravados no projeto (`canal`, `idioma` e `voz` em `roteiro.json`) e valem para todas as etapas.

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

## Como o trabalho se divide

Você faz todo o trabalho nesta sessão, sem agentes: conversa com o usuário, roda os scripts e segue, em cada etapa, o roteiro curto de `etapas/`. Não use a ferramenta Agent neste fluxo. Os quadros do vídeo e as folhas de conferência são dezenas de imagens, então abra-os aos poucos (uns dez por vez) e anote o que cada lote mostrou antes de abrir o próximo, para o contexto não estourar.

| Etapa | Roteiro | Lê | Escreve |
|---|---|---|---|
| Analista de vídeo | `etapas/analista-video.md` | o link (via watch) | `referencia/analise.md`, `referencia/transcricao.txt` |
| Analista de thumb | `etapas/analista-thumb.md` | thumb e título originais, thumbs do canal de origem, `referencia/fotos/`, o perfil | `referencia/thumb_analise.md` |
| Roteirista | `etapas/guionista.md` | as duas análises, o perfil, `references/linguas.md` | `roteiro.json`, `saida/post.txt` |
| Animador (um bloco de cada vez) | `etapas/animador.md` | `roteiro.json`, `timeline.js`, o bloco, o perfil | `cenas/<bloco>.js` |
| Designer de thumb | `etapas/disenador-thumb.md` | `referencia/thumb_analise.md`, `saida/post.txt`, `referencia/fotos/`, o perfil | `saida/thumb_prompts.md` |
| Revisor | `etapas/revisor.md` | tudo o que vai ser publicado | `build/revision.md` |

Os roteiros de `etapas/` usam `<projeto>`, `<skill>`, `<motor>`, `<watch>`, `<canal>` e `<url>` (o link do vídeo original) com o mesmo sentido desta skill, e a língua é a do projeto. Ao fim de cada etapa, confira os arquivos que ela escreveu antes de seguir.

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

Confira a skill watch antes de analisar o vídeo, porque a primeira configuração depende de uma escolha do usuário:
```bash
python "<pasta do watch.py>/setup.py" --json
```
Se `first_run` for `true`, abra o `SKILL.md` da watch (uma pasta acima de `scripts/`) e faça o "Step 2" com o usuário: é lá que ele escolhe o motor (Gemini ou local) e o nível de detalhe. Se a watch não estiver instalada, veja "Quando algo foge do padrão".

### 1. Analisar
Siga `etapas/analista-video.md` e depois `etapas/analista-thumb.md`. Vídeo com mais de 10 min: analise um trecho de 8 min por vez (`0:00-8:00`, `8:00-16:00`...), com um arquivo de análise por trecho.

Ao terminar, releia `referencia/analise.md` e `referencia/thumb_analise.md` inteiros. Se a análise registrou que faltou evidência (sem legenda, vídeo bloqueado), decida com o usuário antes de escrever em cima de uma análise furada.

### 2. Roteiro
Siga `etapas/guionista.md`. Ele produz `roteiro.json` (cenas agrupadas em blocos) e `saida/post.txt` com três opções de título.

Mostre ao usuário, em poucas linhas: o título recomendado, a promessa do vídeo, a lista de blocos e a duração estimada. Um vídeo longo custa caro para refazer, então espere o ok dele aqui, a menos que ele tenha pedido para fazer direto. Abra o **card** em ✍️ Roteiro.

### 3. Voz, trilha e esqueleto das cenas
Mova o **card** para 🎬 Produção.
```bash
cd <projeto>
python <motor>/scripts/gerar_audio.py        # voz por cena -> timeline.js, legendas.srt, build/narracao.wav
python <motor>/scripts/gerar_trilha.py       # pad ambiente + ducking -> build/trilha_final.wav
python <skill>/scripts/juntar_cenas.py --esqueleto   # cria cenas/<bloco>.js com a duração e o texto de cada cena
```
Confira a duração total impressa por `gerar_audio.py`. Se passou do combinado em mais de 10%, corte o roteiro antes de animar (`etapas/guionista.md`): cortar depois joga fora cenas prontas.

### 4. Animar (um bloco de cada vez)
Se o vídeo tem um objeto que aparece em vários blocos (um avião, um mapa, um painel), escreva `cenas/00_comum.js` antes de animar, para todos os blocos desenharem igual. O formato está no topo de `<skill>/scripts/juntar_cenas.py`.

Siga `etapas/animador.md` para cada bloco, na ordem do vídeo. Cada bloco escreve só o arquivo dele e é conferido com `folha_bloco.mjs`, que não mexe em nada compartilhado. Anote o que a folha de um bloco mostrou antes de abrir a do próximo.

### 5. Conferir o conjunto
Mova o **card** para 🔍 Revisão.
```bash
python <skill>/scripts/juntar_cenas.py --estrito                       # cenas/*.js -> cenas.js; acusa cena faltando
node <motor>/scripts/render.mjs --folha build/folha.png --fracs 0.85   # um quadro de cada cena do vídeo inteiro
```
Abra `build/folha.png` com Read. Cada bloco já foi conferido por dentro; o que só aparece aqui é a costura: blocos vizinhos com cara de vídeos diferentes, o mesmo objeto desenhado de dois jeitos, um bloco muito mais vazio que os outros. Ajuste pequeno, edite o `cenas/<bloco>.js` e junte de novo; bloco para refazer, volte a `etapas/animador.md` com o que precisa mudar.

### 6. Renderizar, e a thumbnail enquanto isso
Dispare o render em segundo plano (leva cerca de 1 min por minuto de vídeo) e, enquanto ele roda, siga `etapas/disenador-thumb.md`:
```bash
node <motor>/scripts/render.mjs              # -> saida/<slug>.mp4
```
Ainda com o render rodando, feche `saida/post.txt`: escolha o título com o usuário se ele ainda não escolheu e cole os capítulos impressos por
```bash
python <skill>/scripts/juntar_cenas.py --capitulos
```
Quando os prompts estiverem prontos, mande `saida/thumb_prompts.md` ao usuário com `SendUserFile` e peça para ele gerar as duas no Gemini e salvar como `saida/thumb_a.png` e `saida/thumb_b.png`. O vídeo segue sem esperar por isso; quando as imagens chegarem, confira-as como em "Conferir a imagem gerada" de `references/thumb.md`.

Quando o render terminar, confira o resultado de verdade:
```bash
ffmpeg -v error -i saida/<slug>.mp4 -vf "fps=1/15,scale=480:-1,tile=6x6" -frames:v 1 build/conferencia.png
ffmpeg -i saida/<slug>.mp4 -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness"
```
O volume deve ficar perto de -15 LUFS.

### 7. Revisão final
Siga `etapas/revisor.md`, como quem vê o vídeo pela primeira vez: leia o texto como um falante nativo da língua do vídeo leria, olhe a thumbnail no tamanho do feed e confira se título, thumbnail e os primeiros 30 s contam a mesma história. O usuário fala português: num vídeo em outra língua ele não vai pegar um erro sozinho, e num vídeo em português esta revisão continua sendo o que pega o fato sem apoio e a promessa que o vídeo não paga. Esta etapa não é opcional.

Leia `build/revision.md`. Corrija tudo o que estiver como **bloqueante** (texto de cena: `roteiro.json` → passos 3, 5 e 6 de novo, só a voz das cenas alteradas é regerada) e use o seu critério no resto.

### 8. Entregar
Copie o MP4, os prompts e as thumbnails que o usuário já gerou para a pasta do canal no Drive, pegue os links e mova o **card** para 📱 Pronto para postar (`references/publicar.md`).

Mande o MP4 com `SendUserFile` e, na mensagem, nesta ordem:
1. **Título**, **descrição** e **tags** em blocos de código separados, para copiar com um clique.
2. Qual thumbnail (A ou B) você recomenda e por quê, em uma frase; se ele ainda não gerou, lembre que os prompts estão no Drive.
3. Em poucas linhas: canal, duração, língua e voz, se o roteiro é próprio ou adaptado, o que o revisor apontou e ficou sem corrigir, que você não ouviu o áudio (vale assistir uma vez) e como mudar uma frase (editar `roteiro.json` → passos 3, 5 e 6).
4. O link do **card**.

## Pedidos parciais

- **Só a thumbnail** de um vídeo que já existe: passo 0, analista de thumb, designer de thumb.
- **Só a análise** de um vídeo: passos 0 e 1, e entregue as duas análises resumidas.
- **Ajuste num vídeo pronto**: edite o que mudou e refaça só os passos que dependem disso.

## Quando algo foge do padrão

- **Watch não instalada**: é o plugin `watch` do repositório `bradautomates/claude-video`. Com o ok do usuário, instale você mesmo com `claude plugin marketplace add bradautomates/claude-video` e `claude plugin install watch@claude-video`. Não precisa de sessão nova: o `watch.py` é chamado pelo caminho, que `referencia_youtube.py --onde-watch` já encontra. Na primeira vez o usuário escolhe o motor (passo 0); com Gemini, abra `~/.config/watch/.env` no Bloco de Notas para ele colar a chave, que nunca passa pelo chat. Se ele preferir não instalar, analise pelo navegador embutido como em `<motor>/references/extracao.md` (seção YouTube) e avise que a análise visual fica mais rasa.
- **Watch falha ao baixar (erro 403)**: atualize o yt-dlp (`winget upgrade --id yt-dlp.yt-dlp`) e tente uma vez. Não use cookies do navegador sem o usuário pedir.
- **Gemini falha**: a watch não troca de motor sozinha. Diga ao usuário o erro e ofereça rodar com `--engine local`.
- **Motor não encontrado**: a skill recriar-video-tiktok precisa estar instalada também (veja o README do repositório). `--onde-motor` diz onde procurou.
- **Vídeo original com pessoa falando para a câmera ou feito de filmagens**: a skill produz no estilo animado. Avise e siga; a análise e o roteiro funcionam igual.
- **Vídeo com mais de 10 min de resultado**: o motor nasceu para vídeos de 1 min. Acima de umas 120 cenas, renderize primeiro um trecho (`--de 0 --ate 60 --saida build/trecho.mp4`) para confirmar que voz, trilha e imagem estão em ordem antes de gastar o render inteiro.
- **edge-tts falha** (`NoAudioReceived`): rede ou texto vazio. Tente de novo.
- **`roteiro.json` com erro "Unexpected UTF-8 BOM"**: o arquivo foi salvo pelo PowerShell com BOM. Regrave com a ferramenta Write.
- **Usuário quer trocar a língua de um vídeo já começado**: mude `idioma` e `voz` em `roteiro.json` (valores de `references/linguas.md` ou do perfil), refaça o roteiro com a língua nova e siga do passo 2 em diante. A análise do passo 1 continua valendo.
- **Usuário quer o mesmo vídeo em outro canal**: é um projeto novo, na pasta do outro canal; a análise do passo 1 pode ser copiada de um projeto para o outro.
