# claude-skills

Minhas skills pessoais para o Claude Code. Cada pasta em `skills/` é uma skill independente.

## Skills

| Skill | O que faz |
|---|---|
| [recriar-video-tiktok](skills/recriar-video-tiktok/SKILL.md) | Recria em PT-BR, do zero, vídeos curtos de motion graphics do TikTok/Reels/Shorts a partir de um link: roteiro próprio, voz neural, trilha, animação em canvas (preto e branco, bonecos sob holofote) e MP4 pronto para postar. |
| [recriar-video-youtube](skills/recriar-video-youtube/SKILL.md) | Recria em espanhol, para o canal Bitácora de Vuelo, um vídeo longo do YouTube a partir de um link: análise com a skill `watch` (plugin `bradautomates/claude-video`), roteiro próprio, vídeo 1920×1080, prompts para gerar as duas thumbnails no Gemini (Nano Banana), título, descrição e tags. Dividida em agentes (analistas, roteirista, animadores por bloco, designer de thumb, revisor). Usa o motor da `recriar-video-tiktok`, que precisa estar na pasta ao lado. |
| [resumo-marvel](skills/resumo-marvel/SKILL.md) | Vídeo longo para o YouTube (1920×1080, PT-BR) que resume heróis, vilões e sagas no formato "O ÚNICO resumo de X": roteiro em capítulos, narração pela Cartesia, stills e trailers oficiais, montagem com ffmpeg e capa em grade 3×2. |
| [universo-simulado](skills/universo-simulado/SKILL.md) | Produz do zero um vídeo vertical completo (MP4 1080×1920, 60–75 s, PT-BR) do canal UNIVERSO SIMULADO a partir de uma única ideia: simulação 3D low-poly em primeira pessoa, legendas, trilha e efeitos sintetizados. |

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

O Claude Code carrega as skills de `~/.claude/skills/<nome>/`. Clone o repositório e copie (ou
ligue) a pasta da skill para lá.

**Windows (PowerShell)**: uma junction mantém a skill sincronizada com o repositório:
```powershell
gh repo clone viniciuusguima/claude-skills E:\Projetos\claude-skills
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\recriar-video-tiktok" -Target "E:\Projetos\claude-skills\skills\recriar-video-tiktok"
```

**macOS / Linux**:
```bash
gh repo clone viniciuusguima/claude-skills ~/claude-skills
ln -s ~/claude-skills/skills/recriar-video-tiktok ~/.claude/skills/recriar-video-tiktok
```

Abra uma sessão nova do Claude Code e a skill aparece na lista.

### Dependências da `recriar-video-tiktok`

- ffmpeg/ffprobe e Node.js no PATH
- Python com `pip install edge-tts numpy`
- Chrome ou Edge instalado (o render usa o navegador em modo headless)
- `puppeteer-core`: instalado sozinho na primeira vez que a skill cria um projeto (ou `npm i` dentro da pasta da skill)

## Adicionar uma skill nova

1. Crie `skills/<nome>/SKILL.md` (frontmatter com `name` e `description`).
2. Acrescente uma linha na tabela acima.
3. Ligue a pasta em `~/.claude/skills/` como mostrado acima.
