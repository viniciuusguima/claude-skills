# Garimpo de imagens e trailers

O usuário não quer imagens geradas por IA (ficaram ruins e o Gemini se recusa a gerar personagens Marvel). Só material oficial.

## Stills: wiki da Fandom

As galerias do MCU na Fandom têm stills oficiais em boa resolução. Use a API (o site bloqueia raspagem simples e a busca de imagens do Bing trouxe lixo):

1. Ache a galeria: `https://marvelcinematicuniverse.fandom.com/api.php?action=query&list=search&srsearch=<assunto> gallery&format=json`. Para a DC, `https://dc.fandom.com/api.php` ou a wiki do filme.
2. Liste as imagens da página: `action=parse&page=<Título da página>&prop=images&format=json`.
3. Pegue URL e tamanho: `action=query&titles=File:<nome>|File:<nome>&prop=imageinfo&iiprop=url|size&format=json` (até 50 por chamada).
4. Fique só com imagens **largas** (largura ≥ 1280 e largura > altura) e baixe com o cabeçalho `Referer: https://marvelcinematicuniverse.fandom.com/` (sem ele, o download falha).
5. Salve como `imagens/NN-assunto/NN-assunto-K.ext` (`01-mark-1/01-mark-1-2.jpg`), na ordem dos capítulos, com 3 a 5 por assunto: a montagem usa as irmãs da pasta para variar planos longos.

Monte uma folha de contato para olhar antes de usar (`ffmpeg -i "imagens/01-mark-1/%*" ...` não funciona com nomes mistos; use Pillow para colar miniaturas) e apague imagem errada, com marca d'água grande ou de outro filme.

## Trailers: yt-dlp

`yt-dlp` e `ffmpeg` já estão instalados (winget). Baixe só trailers e teasers de canais oficiais (Marvel Entertainment, Marvel Brasil, Sony Pictures, Warner Bros.):

```bash
yt-dlp -f "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080]" -o "cenas/01 - Homem de Ferro (2008) - Trailer.%(ext)s" "<url>"
```

- Nome: `NN - Filme (ano) - Trailer.mp4`, numerado na ordem cronológica dos filmes. A marcação `[CENA 01]` acha o arquivo pelo número.
- Para achar a URL, busque na web "<filme> official trailer" e confira no resultado se o canal é oficial.

## Depois do garimpo

Troque no `roteiro.md` cada `[IMG: …]` e `[CENA: …]` pelo arquivo escolhido (`[IMG 01-mark-1-2]`, `[CENA 01]`) e mantenha a descrição como nota na mesma linha. Se a narração já foi gerada, rode `narrar.py roteiro.md --refazer-montagem`: a voz vem do cache e só o rascunho é refeito.
