# claude-skills

Minhas skills pessoais para o Claude Code. Cada pasta em `skills/` é uma skill independente.

## Skills

| Skill | O que faz |
|---|---|
| [recriar-video-tiktok](skills/recriar-video-tiktok/SKILL.md) | Recria em PT-BR, do zero, vídeos curtos de motion graphics do TikTok/Reels/Shorts a partir de um link: roteiro próprio, voz neural, trilha, animação em canvas (preto e branco, bonecos sob holofote) e MP4 pronto para postar. |

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
