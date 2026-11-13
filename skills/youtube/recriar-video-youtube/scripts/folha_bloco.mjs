// Folha de conferência de UM bloco de cenas, sem tocar em cenas.js nem no perfil dos outros.
// Serve para ver o trabalho de um bloco sem juntar nem renderizar o vídeo todo.
// Rode dentro da pasta do projeto (ou passe --projeto CAMINHO).
//
//   node <skill>/scripts/folha_bloco.mjs 02_contexto                      -> build/folha_02_contexto.png
//   node <skill>/scripts/folha_bloco.mjs 02_contexto --fracs 0.2,0.5,0.9  (momentos de cada cena; padrão 0.35,0.85)
//   node <skill>/scripts/folha_bloco.mjs 02_contexto --cenas radar,caida  (só essas cenas, em quadros maiores)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// o motor (skill recriar-video-tiktok) traz o puppeteer
const MOTOR = [
  process.env.MOTOR_DIR,
  path.resolve(SKILL, "..", "..", "tiktok", "recriar-video-tiktok"),   // no repositório: skills/youtube/ -> skills/tiktok/
  path.resolve(SKILL, "..", "recriar-video-tiktok"),                   // skills lado a lado em ~/.claude/skills
  path.join(os.homedir(), ".claude", "skills", "recriar-video-tiktok"),
].filter(Boolean).find(p => fs.existsSync(path.join(p, "package.json")));
if (!MOTOR) { console.error("skill recriar-video-tiktok não encontrada. Defina MOTOR_DIR=caminho."); process.exit(1); }
let puppeteer;
try {
  const mod = createRequire(path.join(MOTOR, "package.json"))("puppeteer-core");
  puppeteer = mod.default ?? mod;
} catch {
  console.error(`puppeteer-core não encontrado. Rode \`npm i\` em ${MOTOR}.`); process.exit(1);
}

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const RAIZ = path.resolve(arg("projeto", "."));
const bloco = process.argv[2];
if (!bloco || bloco.startsWith("--")) { console.error("uso: node folha_bloco.mjs <bloco> [--fracs 0.35,0.85] [--cenas id1,id2]"); process.exit(1); }
for (const f of ["timeline.js", "motor.js", `cenas/${bloco}.js`]) {
  if (!fs.existsSync(path.join(RAIZ, f))) { console.error(`${f} não encontrado em ${RAIZ}`); process.exit(1); }
}
const fracs = arg("fracs", "0.35,0.85").split(",").map(Number);
const so = arg("cenas", null)?.split(",") ?? null;
const comum = fs.existsSync(path.join(RAIZ, "cenas", "00_comum.js")) && bloco !== "00_comum";

// página só deste bloco: mesmo motor e mesma timeline, mas as cenas vêm direto de cenas/<bloco>.js
const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">
<script src="../timeline.js"></script>
<script src="../motor.js"></script>
<script>window.BLOCOS = []; window.COMUM = {}; window.BLOCO = f => BLOCOS.push(f);</script>
${comum ? '<script src="../cenas/00_comum.js"></script>' : ""}
<script src="../cenas/${bloco}.js"></script>
<script>
  Motor.cenas(M => Object.assign({}, ...BLOCOS.map(f => f(M))));
  window.folha = (bloco, fracs, so) => {
    const cs = TIMELINE.cenas.map((c, i) => ({ c, i }))
      .filter(({ c }) => (c.bloco || "01_video") === bloco && (!so || so.includes(c.id)));
    const n = cs.length * fracs.length;
    if (!n) return null;
    const cw = n <= 8 ? 960 : 640, ch = Math.round(cw * Motor.H / Motor.W);
    const cols = Math.min(fracs.length * (n <= 8 ? 1 : 2), n), rows = Math.ceil(n / cols);
    const out = document.createElement("canvas"); out.width = cols * cw; out.height = rows * ch;
    const og = out.getContext("2d"); og.fillStyle = "#300"; og.fillRect(0, 0, out.width, out.height);
    const off = document.createElement("canvas"); off.width = Motor.W; off.height = Motor.H;
    const offg = off.getContext("2d");
    let j = 0;
    cs.forEach(({ c, i }) => fracs.forEach(f => {
      const ini = i === 0 ? 0 : c.inicio, t = ini + (c.fim - ini) * f;
      Motor.render(offg, t);
      const x = (j % cols) * cw, y = Math.floor(j / cols) * ch;
      og.drawImage(off, x, y, cw - 3, ch - 3);
      og.fillStyle = "yellow"; og.font = "20px sans-serif";
      og.fillText(i + 1 + ". " + c.id + "  " + t.toFixed(1) + "s", x + 8, y + 24);
      j++;
    }));
    return { png: out.toDataURL("image/png"), cenas: cs.map(({ c }) => c.id) };
  };
</script>`;
fs.mkdirSync(path.join(RAIZ, "build"), { recursive: true });
const pagina = path.join(RAIZ, "build", `bloco_${bloco}.html`);
fs.writeFileSync(pagina, html, "utf8");

const NAVEGADORES = [
  process.env.NAVEGADOR,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium",
].filter(Boolean);
const exe = NAVEGADORES.find(p => fs.existsSync(p));
if (!exe) { console.error("Nenhum Chrome/Edge encontrado. Defina NAVEGADOR=caminho/do/executavel."); process.exit(1); }

// um perfil por bloco, separado do render.mjs: a conferência de um bloco não disputa o navegador com o render
const browser = await puppeteer.launch({
  executablePath: exe, headless: true, userDataDir: path.join(RAIZ, "build", `perfil-${bloco}`),
  args: ["--force-device-scale-factor=1", "--no-first-run", "--no-default-browser-check", "--allow-file-access-from-files"],
});
const page = await browser.newPage();
const erros = [];
page.on("pageerror", e => erros.push(e.message));
page.on("console", m => { if (m.type() === "error") erros.push(m.text()); });
await page.goto(pathToFileURL(pagina).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
let r = null;
if (!erros.length) {
  try { r = await page.evaluate((b, f, s) => window.folha(b, f, s), bloco, fracs, so); }
  catch (e) { erros.push(e.message); }
}
await browser.close();
if (erros.length) { console.error("Erros de JavaScript:\n" + [...new Set(erros)].join("\n")); process.exit(1); }
if (!r) { console.error(`nenhuma cena do bloco "${bloco}" na timeline${so ? ` com os ids ${so}` : ""}. Confira o campo "bloco" no roteiro.json.`); process.exit(1); }
const destino = path.join(RAIZ, "build", `folha_${bloco}.png`);
fs.writeFileSync(destino, Buffer.from(r.png.split(",")[1], "base64"));
console.log(`folha: ${destino}  (${r.cenas.length} cenas: ${r.cenas.join(", ")})`);
