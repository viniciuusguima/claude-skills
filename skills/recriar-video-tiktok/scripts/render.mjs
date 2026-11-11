// Renderiza o projeto no Chrome/Edge headless.
// Rode dentro da pasta do projeto (ou passe --projeto CAMINHO).
//
//   node <skill>/scripts/render.mjs                         -> saida/<pasta>.mp4 (vídeo final, 30 fps)
//   node <skill>/scripts/render.mjs --de 20 --ate 30 --saida build/trecho.mp4
//   node <skill>/scripts/render.mjs --folha build/folha.png [--fracs 0.3,0.85]
//        -> PNG com um quadro de cada cena (para conferir com a ferramenta Read)
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const RAIZ = path.resolve(arg("projeto", "."));
if (!fs.existsSync(path.join(RAIZ, "timeline.js"))) {
  console.error(`timeline.js não encontrado em ${RAIZ}. Rode gerar_audio.py antes.`); process.exit(1);
}
const FPS = +arg("fps", 30);

const NAVEGADORES = [
  process.env.NAVEGADOR,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium",
].filter(Boolean);
const exe = NAVEGADORES.find(p => fs.existsSync(p));
if (!exe) { console.error("Nenhum Chrome/Edge encontrado. Defina NAVEGADOR=caminho/do/executavel."); process.exit(1); }

// perfil próprio evita conflito com o navegador do usuário aberto
const browser = await puppeteer.launch({
  executablePath: exe, headless: true, userDataDir: path.join(RAIZ, "build", "perfil-navegador"),
  args: ["--force-device-scale-factor=1", "--no-first-run", "--no-default-browser-check", "--allow-file-access-from-files"],
});
const page = await browser.newPage();
const erros = [];
page.on("pageerror", e => erros.push(e.message));
page.on("console", m => { if (m.type() === "error") erros.push(m.text()); });
await page.goto(pathToFileURL(path.join(RAIZ, "index.html")).href + "?render=1", { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const { W, H, total } = await page.evaluate(() => ({ W: Motor.W, H: Motor.H, total: TIMELINE.total }));
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
if (erros.length) { console.error("Erros na página:\n" + erros.join("\n")); await browser.close(); process.exit(1); }

const folha = arg("folha", null);
if (folha) {
  const fracs = arg("fracs", "0.85").split(",").map(Number);
  const b64 = await page.evaluate(f => window.renderFolha(f), fracs);
  const destino = path.resolve(RAIZ, folha);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, Buffer.from(b64.split(",")[1], "base64"));
  await browser.close();
  if (erros.length) console.error("Erros durante o render:\n" + erros.join("\n"));
  console.log("folha:", destino);
  process.exit(erros.length ? 1 : 0);
}

const SAIDA = path.resolve(RAIZ, arg("saida", `saida/${path.basename(RAIZ)}.mp4`));
fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
const de = +arg("de", 0), ate = Math.min(+arg("ate", total), total);
const n = Math.ceil((ate - de) * FPS);
const audio = path.join(RAIZ, "build", "trilha_final.wav");
const comAudio = fs.existsSync(audio);

const ff = spawn("ffmpeg", [
  "-y", "-v", "error",
  "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  ...(comAudio ? ["-ss", String(de), "-t", String(ate - de), "-i", audio, "-map", "0:v", "-map", "1:a"] : []),
  "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-tune", "animation",
  ...(comAudio ? ["-c:a", "aac", "-b:a", "192k", "-shortest"] : []),
  "-movflags", "+faststart", SAIDA,
], { stdio: ["pipe", "inherit", "inherit"] });

const t0 = Date.now();
for (let f = 0; f < n; f++) {
  const t = de + f / FPS;
  const b64 = await page.evaluate(t => {
    window.renderFrame(t);
    return document.getElementById("c").toDataURL("image/jpeg", 0.95).split(",")[1];
  }, t);
  if (!ff.stdin.write(Buffer.from(b64, "base64"))) await new Promise(r => ff.stdin.once("drain", r));
  if (f % 150 === 0) {
    const el = (Date.now() - t0) / 1000;
    console.log(`quadro ${f}/${n} (${t.toFixed(1)}s) · restante ~${((el / (f + 1)) * (n - f - 1)).toFixed(0)}s`);
  }
}
ff.stdin.end();
await new Promise(r => ff.on("close", r));
await browser.close();
if (erros.length) console.error("Erros durante o render:\n" + erros.join("\n"));
console.log("pronto:", SAIDA);
