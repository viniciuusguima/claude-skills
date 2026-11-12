// Renderiza o banner e a foto de perfil do canal (banner*.html e avatar*.html -> PNG) no Chrome/Edge headless.
// Rode dentro da pasta de identidade do canal (ou passe --pasta CAMINHO).
//
//   node <skill>/scripts/gerar_identidade.mjs
//     -> banner.png (2560x1440) e avatar.png (800x800), um PNG por arquivo HTML, na mesma pasta
//     -> previa.png: o banner como aparece na TV, no computador e no celular, com as áreas de corte
//        marcadas, e a foto nos círculos do tamanho real, em fundo escuro e claro. Se existirem
//        referencia/banner.jpg e referencia/avatar.jpg, o canal de referência aparece embaixo, igual.
//        É essa imagem que se abre com Read para conferir.
//
// Elementos com o atributo data-seguro (o nome do canal, o texto) têm que caber na área que todo
// aparelho mostra: 1546x423 no centro do banner, e o círculo da foto. O script avisa quando não cabem.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// o puppeteer vem do motor dos vídeos (skill recriar-video-tiktok)
const MOTOR = [
  process.env.MOTOR_DIR,
  path.resolve(SKILL, "..", "..", "tiktok", "recriar-video-tiktok"),   // no repositório: skills/youtube/ -> skills/tiktok/
  path.resolve(SKILL, "..", "recriar-video-tiktok"),                   // skills lado a lado em ~/.claude/skills
  path.join(os.homedir(), ".claude", "skills", "recriar-video-tiktok"),
].filter(Boolean).find(p => fs.existsSync(path.join(p, "package.json")));
if (!MOTOR) { console.error("skill recriar-video-tiktok não encontrada (é dela o puppeteer). Defina MOTOR_DIR=caminho."); process.exit(1); }
let puppeteer;
try {
  const mod = createRequire(path.join(MOTOR, "package.json"))("puppeteer-core");
  puppeteer = mod.default ?? mod;
} catch {
  console.error(`puppeteer-core não encontrado. Rode \`npm i\` em ${MOTOR}.`); process.exit(1);
}

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const RAIZ = path.resolve(arg("pasta", "."));
const TIPOS = {
  banner: { w: 2560, h: 1440, limite: 6 * 1024 * 1024 },   // limites de upload do YouTube
  avatar: { w: 800, h: 800, limite: 4 * 1024 * 1024 },
};

const NAVEGADORES = [
  process.env.NAVEGADOR,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium",
].filter(Boolean);
const exe = NAVEGADORES.find(p => fs.existsSync(p));
if (!exe) { console.error("Nenhum Chrome/Edge encontrado. Defina NAVEGADOR=caminho/do/executavel."); process.exit(1); }

const arquivos = fs.readdirSync(RAIZ).filter(f => /^(banner|avatar).*\.html$/i.test(f)).sort();
if (!arquivos.length) { console.error(`nenhum banner*.html ou avatar*.html em ${RAIZ}`); process.exit(1); }

fs.mkdirSync(path.join(RAIZ, "build"), { recursive: true });
const browser = await puppeteer.launch({
  executablePath: exe, headless: true, userDataDir: path.join(RAIZ, "build", "perfil"),
  args: ["--force-device-scale-factor=1", "--no-first-run", "--no-default-browser-check", "--allow-file-access-from-files"],
});
const page = await browser.newPage();
const erros = [];
page.on("pageerror", e => erros.push(e.message));

const prontas = { banner: [], avatar: [] };
let avisos = 0;
for (const arquivo of arquivos) {
  const nome = path.basename(arquivo, ".html");
  const tipo = nome.toLowerCase().startsWith("banner") ? "banner" : "avatar";
  const { w, h, limite } = TIPOS[tipo];
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(RAIZ, arquivo)).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const problemas = await page.evaluate((tipo, w, h) => {
    const p = [];
    for (const i of document.images) if (!i.complete || !i.naturalWidth) p.push(`imagem não carregou: ${i.getAttribute("src")}`);
    const d = document.documentElement;
    if (d.scrollWidth > w || d.scrollHeight > h) p.push(`o conteúdo passa de ${w}x${h} (${d.scrollWidth}x${d.scrollHeight})`);
    for (const el of document.querySelectorAll("[data-seguro]")) {
      const r = el.getBoundingClientRect();
      const rotulo = el.id ? `#${el.id}` : el.tagName.toLowerCase();
      if (tipo === "banner") {
        const x0 = (w - 1546) / 2, y0 = (h - 423) / 2;
        if (r.left < x0 || r.right > x0 + 1546 || r.top < y0 || r.bottom > y0 + 423)
          p.push(`${rotulo} sai da área segura 1546x423 (está em ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)})`);
      } else {
        const fora = [[r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom]]
          .some(([x, y]) => Math.hypot(x - w / 2, y - h / 2) > w / 2 - 20);
        if (fora) p.push(`${rotulo} encosta na borda do círculo: o YouTube corta a foto em círculo`);
      }
    }
    return p;
  }, tipo, w, h);
  const png = path.join(RAIZ, `${nome}.png`);
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: w, height: h } });
  let final = png;
  if (fs.statSync(png).size > limite) {   // pesado demais para o YouTube: entrega em JPG
    final = path.join(RAIZ, `${nome}.jpg`);
    await page.screenshot({ path: final, type: "jpeg", quality: 92, clip: { x: 0, y: 0, width: w, height: h } });
    fs.unlinkSync(png);
  }
  prontas[tipo].push({ nome, arquivo: path.basename(final) });
  console.log(`${tipo}: ${final} (${(fs.statSync(final).size / 1024).toFixed(0)} KB)`);
  for (const p of problemas) { console.error(`  AVISO ${arquivo}: ${p}`); avisos++; }
}

// ---------- prévia: o banner e a foto como o público vê ----------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const recorte = (src, largura, mostra) => {   // um recorte de altura 423 no centro do banner, como a página mostra
  const s = largura / mostra;
  return `<div class="recorte" style="width:${largura}px;height:${Math.round(423 * s)}px;
    background-image:url('${src}');background-size:${2560 * s}px ${1440 * s}px"></div>`;
};
const circulo = (src, d, fundo) =>
  `<div class="circ" style="background:${fundo}"><img src="${src}" width="${d}" height="${d}"></div>`;
const bloco = (rotulo, banner, avatar) => `
  <h2>${esc(rotulo)}</h2>
  ${banner ? `<div class="linha">
    <div><div class="leg">TV: o banner inteiro. Faixas: computador (2560x423), tablet (1855x423) e a área segura (1546x423)</div>
      <div class="tv"><img src="${banner}" width="960" height="540"><i class="f1"></i><i class="f2"></i><i class="f3"></i></div></div>
    <div><div class="leg">Computador</div>${recorte(banner, 600, 2560)}
      <div class="leg" style="margin-top:14px">Celular</div>${recorte(banner, 360, 1546)}</div>
  </div>` : ""}
  ${avatar ? `<div class="linha"><div class="leg">Foto: 160, 98 e 40 px, em fundo escuro e claro</div></div>
  <div class="linha">${[160, 98, 40].map(d => circulo(avatar, d, "#0f0f0f")).join("")}
    ${[160, 98, 40].map(d => circulo(avatar, d, "#ffffff")).join("")}</div>` : ""}`;

const ref = f => fs.existsSync(path.join(RAIZ, "referencia", f)) ? `referencia/${f}` : null;
const pares = Math.max(prontas.banner.length, prontas.avatar.length);
let corpo = "";
for (let i = 0; i < pares; i++) {
  const b = prontas.banner[i], a = prontas.avatar[i];
  corpo += bloco([b?.nome, a?.nome].filter(Boolean).join(" + "), b && b.arquivo, a && a.arquivo);
}
if (ref("banner.jpg") || ref("avatar.jpg")) corpo += bloco("REFERÊNCIA (não copiar)", ref("banner.jpg"), ref("avatar.jpg"));

const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; padding: 20px; background: #2a2a2a; color: #ddd; font-family: 'Segoe UI', Arial, sans-serif; width: 1640px; }
  h2 { font-size: 18px; margin: 22px 0 8px; }
  .linha { display: flex; gap: 24px; align-items: flex-start; margin-bottom: 10px; }
  .leg { font-size: 13px; color: #aaa; margin-bottom: 6px; }
  .tv { position: relative; width: 960px; height: 540px; }
  .tv img { display: block; }
  .tv i { position: absolute; top: ${540 / 2 - 423 * 0.375 / 2}px; height: ${423 * 0.375}px; border: 2px dashed; box-sizing: border-box; }
  .tv .f1 { left: 0; width: 960px; border-color: #4fc3f7; }
  .tv .f2 { left: ${(960 - 1855 * 0.375) / 2}px; width: ${1855 * 0.375}px; border-color: #ffb74d; }
  .tv .f3 { left: ${(960 - 1546 * 0.375) / 2}px; width: ${1546 * 0.375}px; border-color: #ef5350; }
  .recorte { background-position: center; background-repeat: no-repeat; border-radius: 12px; }
  .circ { padding: 14px; border-radius: 10px; }
  .circ img { display: block; border-radius: 50%; object-fit: cover; }
</style>
<base href="${pathToFileURL(RAIZ + path.sep).href}">
${corpo}`;
const previaHtml = path.join(RAIZ, "build", "previa.html");
fs.writeFileSync(previaHtml, html, "utf8");
await page.setViewport({ width: 1680, height: 900, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(previaHtml).href, { waitUntil: "load" });
const previa = path.join(RAIZ, "previa.png");
await page.screenshot({ path: previa, fullPage: true });
console.log("prévia:", previa);
if (erros.length) console.error("Erros na página:\n" + erros.join("\n"));
await browser.close();
process.exit(erros.length || avisos ? 1 : 0);
