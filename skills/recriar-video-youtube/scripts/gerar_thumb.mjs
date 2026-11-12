// Renderiza as thumbnails do projeto (thumb*.html -> PNG 1280x720) no Chrome/Edge headless.
// Rode dentro da pasta do projeto (ou passe --projeto CAMINHO).
//
//   node <skill>/scripts/gerar_thumb.mjs [--titulo "Título del video"]
//        -> saida/thumb_a.png, saida/thumb_b.png ... (uma por thumb*.html)
//        -> build/thumb_previa.png: cada thumb em tamanho grande e nos tamanhos do feed (fundo escuro
//           e claro), ao lado da thumb original. É essa imagem que se abre com Read para conferir.
//   node <skill>/scripts/gerar_thumb.mjs --quadro 12.5,48
//        -> build/quadro_12.5.png, build/quadro_48.png: quadros do próprio vídeo (1920x1080) para
//           usar como imagem da thumb. Precisa de timeline.js e cenas.js.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MOTOR = path.resolve(SKILL, "..", "recriar-video-tiktok");
let puppeteer;
try {
  const mod = createRequire(path.join(MOTOR, "package.json"))("puppeteer-core");
  puppeteer = mod.default ?? mod;
} catch {
  console.error(`puppeteer-core não encontrado. Rode \`npm i\` em ${MOTOR}.`); process.exit(1);
}

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const RAIZ = path.resolve(arg("projeto", "."));
const W = 1280, H = 720, LIMITE = 2 * 1024 * 1024;   // o YouTube aceita thumbnails de até 2 MB

const NAVEGADORES = [
  process.env.NAVEGADOR,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium",
].filter(Boolean);
const exe = NAVEGADORES.find(p => fs.existsSync(p));
if (!exe) { console.error("Nenhum Chrome/Edge encontrado. Defina NAVEGADOR=caminho/do/executavel."); process.exit(1); }

fs.mkdirSync(path.join(RAIZ, "build"), { recursive: true });
fs.mkdirSync(path.join(RAIZ, "saida"), { recursive: true });
// perfil separado do render.mjs, para os dois poderem rodar ao mesmo tempo
const browser = await puppeteer.launch({
  executablePath: exe, headless: true, userDataDir: path.join(RAIZ, "build", "perfil-thumb"),
  args: ["--force-device-scale-factor=1", "--no-first-run", "--no-default-browser-check", "--allow-file-access-from-files"],
});
const page = await browser.newPage();
const erros = [];
page.on("pageerror", e => erros.push(e.message));
const url = arquivo => pathToFileURL(path.join(RAIZ, arquivo)).href;
const sair = async codigo => { await browser.close(); process.exit(codigo); };

// ---------- quadros do vídeo ----------
const quadros = arg("quadro", null);
if (quadros) {
  if (!fs.existsSync(path.join(RAIZ, "timeline.js"))) {
    console.error(`timeline.js não encontrado em ${RAIZ}. Rode gerar_audio.py antes.`); await sair(1);
  }
  await page.goto(url("index.html") + "?render=1", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const total = await page.evaluate(() => TIMELINE.total);
  for (const t of quadros.split(",").map(Number)) {
    if (!(t >= 0 && t <= total)) { console.error(`quadro ${t}: fora do vídeo (0 a ${total.toFixed(1)} s)`); continue; }
    const b64 = await page.evaluate(t => {
      window.renderFrame(t);
      return document.getElementById("c").toDataURL("image/png").split(",")[1];
    }, t);
    const destino = path.join(RAIZ, "build", `quadro_${t}.png`);
    fs.writeFileSync(destino, Buffer.from(b64, "base64"));
    console.log("quadro:", destino);
  }
  if (erros.length) console.error("Erros na página:\n" + erros.join("\n"));
  await sair(erros.length ? 1 : 0);
}

// ---------- thumbnails ----------
const arquivos = fs.readdirSync(RAIZ).filter(f => /^thumb.*\.html$/i.test(f)).sort();
if (!arquivos.length) { console.error(`nenhum thumb*.html em ${RAIZ}`); await sair(1); }

await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
const prontas = [];
let avisos = 0;
for (const arquivo of arquivos) {
  const nome = path.basename(arquivo, path.extname(arquivo));
  await page.goto(url(arquivo), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const problemas = await page.evaluate((W, H) => {
    const p = [];
    for (const i of document.images) if (!i.complete || !i.naturalWidth) p.push(`imagem não carregou: ${i.getAttribute("src")}`);
    const d = document.documentElement;
    if (d.scrollWidth > W || d.scrollHeight > H) p.push(`o conteúdo passa de ${W}x${H} (${d.scrollWidth}x${d.scrollHeight})`);
    return p;
  }, W, H);
  const png = path.join(RAIZ, "saida", `${nome}.png`);
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: W, height: H } });
  let final = png, kb = fs.statSync(png).size / 1024;
  if (fs.statSync(png).size > LIMITE) {   // PNG pesado demais para o YouTube: entrega em JPG
    final = path.join(RAIZ, "saida", `${nome}.jpg`);
    await page.screenshot({ path: final, type: "jpeg", quality: 92, clip: { x: 0, y: 0, width: W, height: H } });
    fs.unlinkSync(png);
    kb = fs.statSync(final).size / 1024;
  }
  prontas.push({ nome, arquivo: path.basename(final) });
  console.log(`thumb: ${final} (${kb.toFixed(0)} KB)`);
  for (const p of problemas) { console.error(`  AVISO ${arquivo}: ${p}`); avisos++; }
}

// ---------- prévia: como cada thumb aparece no feed ----------
const titulo = arg("titulo", "Título del video: así se ve la miniatura en el feed");
const original = fs.existsSync(path.join(RAIZ, "referencia", "thumb_original.jpg")) ? "../referencia/thumb_original.jpg" : null;
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cartao = (src, fundo, cor, larg) => `
  <div class="cartao" style="background:${fundo};color:${cor};width:${larg + 24}px">
    <img src="${src}" width="${larg}" height="${Math.round(larg * 9 / 16)}">
    <div class="tit" style="font-size:${larg > 200 ? 15 : 12}px">${esc(titulo)}</div>
  </div>`;
const linha = (rotulo, src) => `
  <h2>${esc(rotulo)}</h2>
  <div class="linha">
    <img class="grande" src="${src}" width="640" height="360">
    ${cartao(src, "#0f0f0f", "#f1f1f1", 320)}${cartao(src, "#ffffff", "#0f0f0f", 320)}
    ${cartao(src, "#0f0f0f", "#f1f1f1", 168)}${cartao(src, "#ffffff", "#0f0f0f", 168)}
  </div>`;
const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; padding: 20px; background: #2a2a2a; color: #ddd; font-family: 'Segoe UI', Arial, sans-serif; width: 1560px; }
  h2 { font-size: 18px; margin: 18px 0 8px; }
  .linha { display: flex; gap: 14px; align-items: flex-start; }
  .grande { display: block; }
  .cartao { padding: 12px; border-radius: 10px; }
  .cartao img { display: block; border-radius: 8px; object-fit: cover; }
  .tit { margin-top: 8px; font-weight: 600; line-height: 1.25; max-height: 2.5em; overflow: hidden; }
</style>
${prontas.map(p => linha(p.nome, `../saida/${p.arquivo}`)).join("")}
${original ? linha("ORIGINAL (referência, não copiar)", original) : ""}`;
const previaHtml = path.join(RAIZ, "build", "thumb_previa.html");
fs.writeFileSync(previaHtml, html, "utf8");
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(previaHtml).href, { waitUntil: "load" });
const previa = path.join(RAIZ, "build", "thumb_previa.png");
await page.screenshot({ path: previa, fullPage: true });
console.log("prévia:", previa);
if (erros.length) console.error("Erros na página:\n" + erros.join("\n"));
await sair(erros.length || avisos ? 1 : 0);
