# Extrair a referência do vídeo

Objetivo: sair com (1) a transcrição com tempos e (2) uma noção visual de cada trecho. Você não
baixa o vídeo; só lê a página e olha os quadros.

## TikTok (vt.tiktok.com / tiktok.com)

1. Abra o link no navegador embutido (`mcp__Claude_Browser__navigate`). O link curto redireciona
   para `tiktok.com/@autor/video/<id>`; anote autor e id em `referencia/notas.md`.
2. Pode aparecer onboarding ("Skip") e depois um modal pedindo login/data de nascimento. **Não preencha
   nada.** A legenda e o vídeo continuam acessíveis por JavaScript por trás do modal.
3. Legenda automática (ASR) a partir do JSON da página:
   ```js
   const d = JSON.parse(document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__').textContent);
   const s = JSON.stringify(d);
   const m = s.match(/subtitleInfos\":\[\{[^\]]*?\"Url\":\"([^\"]+)\"/);
   m ? await (await fetch(JSON.parse('"' + m[1] + '"'))).text() : 'sem legenda';
   ```
   Retorna WEBVTT com tempos. Salve em `referencia/legenda.txt`. Se houver mais de um idioma em
   `subtitleInfos`, prefira o original.
   Descrição e hashtags do post original (servem de base para o título e as # em PT):
   ```js
   const desc = (JSON.stringify(d).match(/"itemStruct":\{.*?"desc":"((?:[^"\\]|\\.)*)"/) || [])[1];
   const tags = [...new Set((JSON.stringify(d).match(/"hashtagName":"([^"]+)"/g) || []).map(s => s.split(':"')[1].slice(0, -1)))];
   ({ desc, tags })
   ```
   Se vier vazio, `get_page_text` mostra a descrição e as hashtags logo abaixo do nome do autor.
   Anote os dois em `referencia/notas.md`.
4. Quadros: o `<video>` da página toca mesmo com o modal. Toque acelerado, capture miniaturas e mostre
   numa grade por cima da página para tirar um screenshot:
   ```js
   const v = document.querySelector('video'); v.muted = true; v.currentTime = 0; v.playbackRate = 2;
   window.quadros = []; await v.play();
   await new Promise(res => { let prox = 0; const tick = () => {
     if (v.currentTime >= prox) { const c = document.createElement('canvas'); c.width = 480; c.height = 270;
       c.getContext('2d').drawImage(v, 0, 0, 480, 270); quadros.push([Math.round(v.currentTime), c]); prox += 2.5; }
     (v.ended || v.currentTime > v.duration - 0.5) ? res() : requestAnimationFrame(tick); };
     tick(); setTimeout(res, 60000); });
   window.pagina = p => { let c = document.getElementById('dbgc'); c?.remove(); c = document.createElement('canvas');
     c.id = 'dbgc'; c.width = 1440; c.height = 1080; Object.assign(c.style, { position: 'fixed', left: 0, top: 0,
     width: '800px', height: '600px', zIndex: 2147483647, background: '#000' }); document.body.appendChild(c);
     const g = c.getContext('2d'); quadros.slice(p * 12, p * 12 + 12).forEach(([t, q], i) => {
       const x = (i % 3) * 480, y = Math.floor(i / 3) * 270; g.drawImage(q, x, y);
       g.fillStyle = 'yellow'; g.font = '22px sans-serif'; g.fillText(t + 's', x + 6, y + 24); }); };
   pagina(0); quadros.length
   ```
   Depois `computer` → `screenshot`, depois `pagina(1)` e outro screenshot, até cobrir tudo. Ajuste
   `480×270` para `270×480` (e a grade) se o vídeo for vertical (`v.videoWidth < v.videoHeight`).
   Recrie o canvas a cada página (como acima); reaproveitar o mesmo às vezes deixa o screenshot desatualizado.
5. Ao terminar, remova o overlay (`document.getElementById('dbgc')?.remove()`) e libere a memória (`window.quadros = null`).

## Instagram Reels / YouTube Shorts

- **YouTube**: a transcrição costuma estar em "Mostrar transcrição" na descrição; leia com
  `get_page_text`. O `<video>` funciona igual ao do TikTok para os quadros.
- **Instagram**: geralmente exige login para o vídeo. Não faça login; peça ao usuário a transcrição
  (ou um print) e trabalhe a partir disso.

## O que anotar em `referencia/notas.md`

- Autor, link, duração, formato (horizontal/vertical).
- Tabela `tempo → frase → o que aparece na tela`. É o mapa para escolher as metáforas visuais das
  suas cenas (você não precisa copiar, mas ajuda a manter o mesmo ritmo).
- Estilo: paleta, tipo de personagem, ritmo de cortes, se tem legenda queimada, música.
