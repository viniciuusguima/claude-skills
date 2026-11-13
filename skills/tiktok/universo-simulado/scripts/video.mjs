// Roda um vídeo do Universo Simulado no Chrome/Edge headless, sem abrir o navegador do app.
// Rode na pasta de trabalho (onde estão server.py e <slug>.html) ou passe --projeto CAMINHO.
//
//   node <skill>/scripts/video.mjs checar   <slug>                          erros de console e renderAt de 0 ao fim a cada 0,25 s
//   node <skill>/scripts/video.mjs folha    <slug> nome=t1,t2,... [...]     uma folha de quadros por argumento -> debug/<nome>.png
//   node <skill>/scripts/video.mjs som      <slug>                          duração, NaN e volume (dB RMS) de cada segundo
//   node <skill>/scripts/video.mjs exportar <slug> [arquivo.mp4]            exporta o MP4 e confere com ffprobe
//
// Sai com código 1 se algo falhar, para quem chamou perceber sem ler tudo.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const RAIZ = path.resolve(opt("projeto", "."));
const [cmd, slug, ...resto] = args;
const USO = "uso: video.mjs <checar|folha|som|exportar> <slug> [...]";
if (!cmd || !slug) { console.error(USO); process.exit(2); }
if (!fs.existsSync(path.join(RAIZ, "server.py"))) { console.error(`server.py não encontrado em ${RAIZ}`); process.exit(2); }
if (!fs.existsSync(path.join(RAIZ, `${slug}.html`))) { console.error(`${slug}.html não encontrado em ${RAIZ}`); process.exit(2); }

const NAVEGADORES = [
  process.env.NAVEGADOR,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium",
  "/usr/bin/google-chrome-stable", "/usr/bin/chromium-browser", "/snap/bin/chromium", "/usr/bin/microsoft-edge",
].filter(Boolean);
const exe = NAVEGADORES.find(p => fs.existsSync(p));
if (!exe) { console.error("Nenhum Chrome/Edge encontrado. Defina NAVEGADOR=caminho/do/executavel."); process.exit(2); }

const portaLivre = () => new Promise(r => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const espera = ms => new Promise(r => setTimeout(r, ms));

const porta = await portaLivre();
const servidor = spawn(process.platform === "win32" ? "python" : "python3", ["server.py", String(porta)], { cwd: RAIZ, stdio: "ignore" });
let browser;
const fim = async code => { try { await browser?.close(); } catch { } servidor.kill(); process.exit(code); };
process.on("SIGINT", () => fim(130));

try {
  const base = `http://127.0.0.1:${porta}`;
  for (let i = 0; ; i++) { try { if ((await fetch(base + "/server.py")).ok) break; } catch { } if (i > 50) throw new Error("o servidor local não subiu"); await espera(100); }

  browser = await puppeteer.launch({
    executablePath: exe, headless: true, protocolTimeout: 600000,
    userDataDir: path.join(os.tmpdir(), "universo-simulado-headless"), // perfil próprio: não briga com o navegador aberto do usuário
    args: ["--no-first-run", "--no-default-browser-check", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 540, height: 1000 });
  const erros = [];
  page.on("pageerror", e => erros.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) erros.push(m.text()); });
  page.on("response", r => { if (r.status() >= 400 && !r.url().endsWith("/favicon.ico")) erros.push(`${r.status()} ao carregar ${r.url()}`); });
  await page.goto(`${base}/${slug}.html`, { waitUntil: "load", timeout: 120000 });
  try { await page.waitForFunction("window.__ready === true", { timeout: 60000 }); }
  catch { console.error("A página não ficou pronta (window.__ready).\n" + erros.join("\n")); await fim(1); }
  const info = await page.evaluate(() => ({ DUR: +document.getElementById("seek").max, T: typeof ROTEIRO !== "undefined" ? ROTEIRO.T : {} })); // vídeos antigos não têm ROTEIRO
  let falhou = erros.length > 0;
  if (erros.length) console.error("Erros ao carregar:\n  " + erros.join("\n  "));

  if (cmd === "checar") {
    const ruins = await page.evaluate(async DUR => {
      const out = [];
      for (let t = 0; t < DUR; t += 0.25) {
        try { renderAt(Math.min(t, DUR - 1e-4)); } catch (e) { out.push(`${t.toFixed(2)} s: ${e.message}`); if (out.length > 20) break; }
        if (Math.round(t * 4) % 20 === 0) await new Promise(r => setTimeout(r, 0));
      }
      return out;
    }, info.DUR);
    console.log(`duração ${info.DUR} s; trechos: ${Object.entries(info.T).map(([k, v]) => `${k}=${v}`).join(" ")}`);
    if (ruins.length) { falhou = true; console.error("renderAt falhou em:\n  " + ruins.join("\n  ")); }
    if (erros.length) falhou = true;
    console.log(falhou ? "checagem: COM ERROS" : "checagem: ok, nenhum erro de 0 ao fim");
  } else if (cmd === "folha") {
    if (!resto.length) { console.error("folha precisa de pelo menos um nome=t1,t2,..."); await fim(2); }
    for (const a of resto) {
      const [nome, ts] = a.split("=");
      const tempos = (ts || "").split(",").map(Number).filter(x => Number.isFinite(x));
      if (!nome || !tempos.length) { console.error(`argumento inválido: ${a}`); falhou = true; continue; }
      const st = await page.evaluate((t, n) => snap(t, n), tempos, nome);
      if (st !== 200) { console.error(`folha ${nome}: o servidor respondeu ${st}`); falhou = true; }
      else console.log(`folha: ${path.join(RAIZ, "debug", nome + ".png")}`);
    }
    if (erros.length > 0) { falhou = true; console.error("Erros durante as folhas:\n  " + erros.join("\n  ")); }
  } else if (cmd === "som") {
    const r = await page.evaluate(() => {
      const a = synthNow(), sr = a.sr, seg = [];
      let nan = 0;
      for (let s = 0; s * sr < a.N; s++) {
        let acc = 0, n = 0;
        for (let i = s * sr; i < Math.min(a.N, (s + 1) * sr); i++) { const l = a.L[i], rr = a.R[i]; if (!Number.isFinite(l) || !Number.isFinite(rr)) { nan++; continue; } acc += l * l + rr * rr; n += 2; }
        seg.push(n ? 10 * Math.log10(acc / n + 1e-12) : -120);
      }
      let peak = 0; for (let i = 0; i < a.N; i++) peak = Math.max(peak, Math.abs(a.L[i]), Math.abs(a.R[i]));
      return { dur: a.N / sr, nan, seg, peak };
    });
    console.log(`duração do áudio ${r.dur.toFixed(2)} s (vídeo ${info.DUR} s), pico ${r.peak.toFixed(3)}, amostras NaN ${r.nan}`);
    console.log("dB RMS por segundo:");
    for (let i = 0; i < r.seg.length; i += 10) console.log(`  ${String(i).padStart(3)} s: ` + r.seg.slice(i, i + 10).map(v => v.toFixed(0).padStart(4)).join(" "));
    const mudos = r.seg.map((v, i) => [i, v]).filter(([i, v]) => v < -45 && i < info.DUR - 1).map(([i]) => i);
    const problemas = [];
    if (r.nan) problemas.push(`${r.nan} amostras NaN`);
    if (Math.abs(r.dur - info.DUR) > 0.1) problemas.push("duração do áudio diferente da do vídeo");
    if (mudos.length) problemas.push(`segundos quase mudos (< −45 dB): ${mudos.join(", ")}`);
    if (problemas.length) { falhou = true; console.error("atenção: " + problemas.join("; ")); }
    console.log("referência: ambiente −30 a −22 dB, impactos −14 a −8 dB.");
  } else if (cmd === "exportar") {
    const nome = resto[0] || `${slug}.mp4`;
    await page.evaluate(n => { exportVideo(n); }, nome);
    let ultimo = -1, X;
    const t0 = Date.now();
    for (; ;) {
      await espera(2000);
      X = await page.evaluate(() => ({ ...window.__exp }));
      const pct = Math.floor(X.frame / X.total * 10);
      if (X.state === "running" && pct !== ultimo) { ultimo = pct; console.log(`  quadros ${X.frame}/${X.total}`); }
      if (X.state === "done" || X.state === "error") break;
      if (Date.now() - t0 > 30 * 60000) { X = { state: "error", msg: "passou de 30 min" }; break; }
    }
    if (X.state === "error") { falhou = true; console.error("exportação falhou: " + X.msg); }
    else {
      const arq = path.join(RAIZ, nome);
      console.log(`exportado: ${arq} (${(fs.statSync(arq).size / 1048576).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
      try {
        const p = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", arq]).toString());
        const v = p.streams.find(s => s.codec_type === "video"), au = p.streams.find(s => s.codec_type === "audio"), d = +p.format.duration;
        console.log(`ffprobe: ${v?.width}x${v?.height}, ${d.toFixed(2)} s, áudio ${au ? "sim" : "NÃO"}`);
        if (!v || v.width !== 1080 || v.height !== 1920 || !au || Math.abs(d - info.DUR) > 0.3) { falhou = true; console.error("o arquivo não bate com o esperado (1080x1920, com áudio, duração do roteiro)"); }
      } catch (e) { console.log("ffprobe indisponível; confira o arquivo de outro jeito."); }
    }
    if (erros.length) { falhou = true; console.error("Erros durante a exportação:\n  " + erros.join("\n  ")); }
  } else { console.error(USO); falhou = true; }
  await fim(falhou ? 1 : 0);
} catch (e) {
  console.error(String(e && e.stack || e));
  await fim(1);
}
