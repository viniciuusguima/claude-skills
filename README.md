# claude-skills

Minhas skills pessoais para o Claude Code, separadas por plataforma: `skills/youtube/` e `skills/tiktok/`. Cada pasta dentro delas é uma skill independente.

## YouTube

| Skill | O que faz |
|---|---|
| [criar-canal](skills/youtube/criar-canal/SKILL.md) | `/criar-canal <nome do canal>`: monta um canal novo parecido com um canal de referência. Olha a home da referência (banner, foto, thumbs mais vistas, títulos), define tema, língua, voz, tom e a marca do canal, gera o banner 2560×1440 e a foto de perfil 800×800, escreve prompts para versões ilustradas no Gemini, descrição e palavras-chave, e grava o perfil do canal (`canais/<slug>.md`) que a `recriar-video-youtube` usa em todo vídeo. |
| [recriar-video-youtube](skills/youtube/recriar-video-youtube/SKILL.md) | `/recriar-video-youtube <link>`: recria um vídeo longo do YouTube para qualquer canal criado com a `criar-canal`, na língua escolhida (se o canal ou a língua não vierem junto com o link, a skill pergunta logo de cara): análise com a skill `watch` (plugin `bradautomates/claude-video`), roteiro próprio, vídeo 1920×1080, prompts para gerar as duas thumbnails no Gemini (Nano Banana), título, descrição e tags. Dividida em agentes (analistas, roteirista, animadores por bloco, designer de thumb, revisor). Usa o motor da `recriar-video-tiktok` e os perfis de canal da `criar-canal`. |
| [resumo-marvel](skills/youtube/resumo-marvel/SKILL.md) | Vídeo longo para o YouTube (1920×1080, PT-BR) que resume heróis, vilões e sagas no formato "O ÚNICO resumo de X": roteiro em capítulos, narração pela Cartesia, stills e trailers oficiais, montagem com ffmpeg e capa em grade 3×2. |

Um canal novo começa na `criar-canal`; depois, cada vídeo é um `/recriar-video-youtube <link>`. Os perfis dos canais ficam em [`skills/youtube/criar-canal/canais/`](skills/youtube/criar-canal/canais/).

## TikTok, Reels e Shorts

| Skill | O que faz |
|---|---|
| [recriar-video-tiktok](skills/tiktok/recriar-video-tiktok/SKILL.md) | Recria em PT-BR, do zero, vídeos curtos de motion graphics do TikTok/Reels/Shorts a partir de um link: roteiro próprio, voz neural, trilha, animação em canvas (preto e branco, bonecos sob holofote) e MP4 pronto para postar. |
| [tiktok-similar-channels](skills/tiktok/tiktok-similar-channels/SKILL.md) | Recebe um canal do TikTok e conta quantos canais do mesmo estilo existem e em quais línguas: separa os de mesmo estilo (A), formato parecido (B) e mesmo nicho (C), aponta línguas sem ninguém no formato e salva o relatório em `tiktok-research/`. Funciona sem chave de API, pelo navegador interno do app (busca do TikTok + embed de perfil). Com `SCRAPECREATORS_API_KEY`, usa a API do ScrapeCreators. |
| [universo-simulado](skills/tiktok/universo-simulado/SKILL.md) | Produz do zero um vídeo vertical completo (MP4 1080×1920, 60–75 s, PT-BR) do canal UNIVERSO SIMULADO a partir de uma única ideia: simulação 3D low-poly em primeira pessoa, legendas, trilha e efeitos sintetizados. |

## Mods (plugins)

Mods mudam a própria interface do Claude Code. Cada pasta em `plugins/` é um mod, listado em `.claude-plugin/marketplace.json`.

| Mod | O que faz |
|---|---|
| [painel-uso](plugins/painel-uso/README.md) | Abre sozinho, em todo chat, um painel (no desktop, um Claudezinho em pixel art que ganha um acessório a cada skill usada) com os tokens gastos (chat e agentes), o contexto ocupado, o custo, os agentes iniciados e as skills usadas. `/uso` reabre o painel. |

Instalar num PC novo (no terminal, numa sessão do Claude Code):

```
/plugin install painel-uso --marketplace viniciuusguima/claude-skills
```

Responda `y` para adicionar o marketplace e escolha o escopo de usuário. No app desktop: + ao lado da caixa de mensagem → Plugins → Add marketplace `viniciuusguima/claude-skills` → Add plugin.

## Instalar num PC novo

O Claude Code carrega as skills de `~/.claude/skills/<nome>/`, um nível só: a pasta da plataforma não entra. Clone o repositório e ligue cada skill lá com uma junction (Windows) ou um link simbólico (macOS/Linux), que mantém a skill sincronizada com o repositório. Os comandos abaixo ligam todas as skills de uma vez.

Rode o comando de ligar de novo depois de um `git pull` que traga uma skill nova ou mude uma skill de pasta: ele refaz as ligações antigas, que senão apontam para uma pasta que não existe mais. Se o repositório já está clonado, pule o `gh repo clone`.

**Windows (PowerShell)**:
```powershell
gh repo clone viniciuusguima/claude-skills E:\Projetos\claude-skills
$destino = "$env:USERPROFILE\.claude\skills"
New-Item -ItemType Directory -Force $destino | Out-Null
Get-ChildItem E:\Projetos\claude-skills\skills -Directory | Get-ChildItem -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName "SKILL.md") } | ForEach-Object {
    $link = Join-Path $destino $_.Name
    $atual = Get-Item $link -ErrorAction SilentlyContinue
    if ($atual -and $atual.LinkType -eq "Junction") { $atual.Delete() }   # apaga só a junction, não o conteúdo
    if (Test-Path $link) { "pulei $($_.Name): $link existe e não é uma junction" }
    else { New-Item -ItemType Junction -Path $link -Target $_.FullName | Out-Null; "ligada: $($_.Name)" }
  }
```

**macOS / Linux**:
```bash
gh repo clone viniciuusguima/claude-skills ~/claude-skills
mkdir -p ~/.claude/skills
for d in ~/claude-skills/skills/*/*/; do
  [ -f "$d/SKILL.md" ] || continue
  n=$(basename "$d"); l=~/.claude/skills/$n
  if [ -L "$l" ] || [ ! -e "$l" ]; then ln -sfn "${d%/}" "$l" && echo "ligada: $n"; else echo "pulei $n: $l existe e não é link"; fi
done
```

Abra uma sessão nova do Claude Code e as skills aparecem na lista.

### Dependências da `recriar-video-tiktok`

Valem também para a `recriar-video-youtube` e a `criar-canal`, que usam o motor dela. As duas do YouTube precisam ainda do `yt-dlp` no PATH.

- ffmpeg/ffprobe e Node.js no PATH
- Python com `pip install edge-tts numpy`
- Chrome ou Edge instalado (o render usa o navegador em modo headless)
- `puppeteer-core`: instalado sozinho na primeira vez que a skill cria um projeto (ou `npm i` dentro da pasta da skill)

## Adicionar uma skill nova

1. Crie `skills/<plataforma>/<nome>/SKILL.md` (frontmatter com `name` e `description`). O nome tem que ser único no repositório inteiro, porque em `~/.claude/skills/` as plataformas se misturam.
2. Acrescente uma linha na tabela da plataforma, acima.
3. Rode de novo o comando de ligar, como mostrado acima.
