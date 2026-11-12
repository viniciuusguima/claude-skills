// Extrai dados de um perfil do TikTok (tiktok.com/@handle) já aberto no navegador.
// Uso: cole o conteúdo deste arquivo na ferramenta de JavaScript do navegador.
// Para pegar mais vídeos, defina antes: window.__TT_SCROLLS = 3  (padrão: 1).
// Retorna { handle, nickname, bio, link, language, followers, likes, videoCount, createTime, videos: [...] }.
await (async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const toNum = (s) => {
    if (!s) return null;
    const m = String(s).replace(/,/g, '').trim().match(/^([\d.]+)\s*([KMB])?/i);
    if (!m) return null;
    const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1;
    return Math.round(parseFloat(m[1]) * mult);
  };

  for (let i = 0; i < 20 && !document.querySelector('a[href*="/video/"], a[href*="/photo/"]'); i++) await sleep(500);
  const scrolls = window.__TT_SCROLLS ?? 1;
  for (let i = 0; i < scrolls; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(2000);
  }

  let user = {}, stats = {};
  try {
    const raw = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__')?.textContent;
    const ui = JSON.parse(raw).__DEFAULT_SCOPE__['webapp.user-detail']?.userInfo || {};
    user = ui.user || {};
    stats = ui.stats || {};
  } catch (e) { /* perfil sem dados de reidratação: segue só com o DOM */ }

  const handle = user.uniqueId || (location.pathname.match(/@([^/]+)/) || [])[1];
  const seen = new Set();
  const videos = [];
  for (const a of document.querySelectorAll('a[href*="/video/"], a[href*="/photo/"]')) {
    if (seen.has(a.href) || !a.href.includes(`@${handle}`)) continue;
    seen.add(a.href);
    // O alt da miniatura traz "legenda #hashtags created by X with som".
    const alt = a.querySelector('img')?.alt || '';
    const caption = alt.replace(/\s*created by .*$/i, '').trim();
    videos.push({
      url: a.href,
      views: toNum(a.innerText.trim().split('\n').pop()),
      caption: caption.slice(0, 300),
      hashtags: (caption.match(/#[\p{L}\p{N}_]+/gu) || []).map((h) => h.toLowerCase()),
    });
  }

  return {
    handle,
    nickname: user.nickname || document.querySelector('[data-e2e="user-subtitle"]')?.innerText || null,
    bio: user.signature ?? document.querySelector('[data-e2e="user-bio"]')?.innerText ?? null,
    link: user.bioLink?.link || null,
    language: user.language || null, // idioma do app da conta; confirme pelas legendas
    verified: user.verified ?? null,
    followers: stats.followerCount ?? toNum(document.querySelector('[data-e2e="followers-count"]')?.innerText),
    likes: stats.heartCount ?? toNum(document.querySelector('[data-e2e="likes-count"]')?.innerText),
    videoCount: stats.videoCount ?? null,
    createTime: user.createTime ? new Date(user.createTime * 1000).toISOString().slice(0, 10) : null,
    videos,
  };
})()
