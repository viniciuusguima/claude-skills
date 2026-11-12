// Extrai resultados de uma página de busca do TikTok (tiktok.com/search/user?q=... ou /search/video?q=...).
// Uso: cole o conteúdo deste arquivo na ferramenta de JavaScript do navegador, com a aba já na página de busca.
// Para carregar mais resultados, defina antes: window.__TT_SCROLLS = 4  (padrão: 2 rolagens de ~2s cada).
// Retorna { kind, query, count, results: [...] }.
await (async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const toNum = (s) => {
    if (!s) return null;
    const m = String(s).replace(/,/g, '').trim().match(/^([\d.]+)\s*([KMB])?/i);
    if (!m) return null;
    const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1;
    return Math.round(parseFloat(m[1]) * mult);
  };

  // Espera a lista aparecer e os cards terminarem de renderizar (a página carrega em etapas:
  // o contêiner surge antes dos números de seguidores e das legendas).
  for (let i = 0; i < 30; i++) {
    const users = document.querySelector('[data-e2e="search-user-results"]');
    const videos = document.querySelector('[data-e2e="search_video-item-list"]');
    if (users && /followers/i.test(users.innerText)) break;
    if (videos && videos.querySelector('[data-e2e="search-card-user-unique-id"]')) break;
    if (/no results found/i.test(document.body.innerText)) break;
    await sleep(500);
  }
  await sleep(500);
  const scrolls = window.__TT_SCROLLS ?? 2;
  for (let i = 0; i < scrolls; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(2000);
  }

  const url = new URL(location.href);
  const query = url.searchParams.get('q');
  const blocked = /log in|captcha|verify to continue/i.test(document.title) && !document.querySelector('[data-e2e^="search"]');

  if (url.pathname.includes('/search/user')) {
    const box = document.querySelector('[data-e2e="search-user-results"]');
    const results = [...(box?.children || [])].map((el) => {
      const a = el.matches('a') ? el : el.querySelector('a[href^="/@"]');
      const ps = [...el.querySelectorAll('p')].map((p) => p.innerText.trim()).filter((t) => t && t !== '·');
      const iF = ps.findIndex((t) => /^followers$/i.test(t));
      const iL = ps.findIndex((t) => /^likes$/i.test(t));
      return {
        handle: (a?.getAttribute('href') || '').replace(/^\/@/, '').split(/[/?]/)[0],
        nickname: ps[0] || null,
        followers: iF > 0 ? toNum(ps[iF - 1]) : null,
        likes: iL > 0 ? toNum(ps[iL - 1]) : null,
      };
    }).filter((r) => r.handle);
    return { kind: 'users', query, blocked, count: results.length, results };
  }

  // Busca de vídeos (ou aba "Top"): agrupa por card de vídeo.
  const links = [...document.querySelectorAll('a[href*="/video/"], a[href*="/photo/"]')];
  const seen = new Set();
  const results = [];
  for (const a of links) {
    if (seen.has(a.href)) continue;
    seen.add(a.href);
    let card = a;
    for (let i = 0; i < 8 && card && !card.querySelector('[data-e2e="search-card-user-unique-id"]'); i++) card = card.parentElement;
    // O @ vem da URL do vídeo; o card mostra só o nome de exibição.
    const handle = (a.href.match(/@([^/?]+)/) || [])[1] || null;
    const name = card?.querySelector('[data-e2e="search-card-user-unique-id"]')?.innerText.trim() || null;
    const caption = (card?.querySelector('[data-e2e="search-card-video-caption"]')?.innerText.trim()
      || a.querySelector('img')?.alt || '').replace(/\s*created by .*$/i, '');
    const views = card?.querySelector('[data-e2e="video-views"]')?.innerText.trim();
    results.push({ handle, name, url: a.href, views: toNum(views), caption: caption.slice(0, 300) });
  }
  return { kind: 'videos', query, blocked, count: results.length, results };
})()
