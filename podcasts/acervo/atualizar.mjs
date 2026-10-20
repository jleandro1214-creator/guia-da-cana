// Monta o acervo de vídeos do Ondas (podcasts/acervo/videos.json).
// Roda sozinho no GitHub (grátis) e junta, para cada podcast da lista:
//  - vídeos do canal no YouTube (feed público do canal, sem chave);
//  - vídeos que o próprio podcast publica no feed dele (MP4, fora do YouTube).
// O acervo vai crescendo: o que já foi encontrado fica guardado.
import fs from "node:fs";
const DIR = new URL(".", import.meta.url).pathname;
const fontes = JSON.parse(fs.readFileSync(DIR + "fontes.json", "utf8")).podcasts;
const ARQ = DIR + "videos.json";
const velho = fs.existsSync(ARQ) ? JSON.parse(fs.readFileSync(ARQ, "utf8")) : { pods: {} };
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "accept-language": "pt-BR,pt;q=0.9", cookie: "CONSENT=YES+1; SOCS=CAI" };
const norm = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const dec = s => (s || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
async function txt(u) { const r = await fetch(u, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error(r.status + " " + u); return r.text(); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function canal(f, antigo) {
  if (antigo && antigo.canal) return antigo.canal;
  try {
    if (f.yt) { const h = await txt("https://www.youtube.com/" + f.yt); const m = h.match(/"(?:externalId|channelId)":"(UC[\w-]{22})"/); if (m) return m[1]; }
    const h = await txt("https://www.youtube.com/results?sp=EgIQAg%253D%253D&search_query=" + encodeURIComponent(f.nome));
    const m = h.match(/"channelRenderer":\{"channelId":"(UC[\w-]{22})"/) || h.match(/"channelId":"(UC[\w-]{22})"/);
    return m ? m[1] : null;
  } catch (e) { console.log("  canal falhou:", e.message); return null; }
}
async function doYouTube(ch) {
  const out = [];
  try {
    const x = await txt("https://www.youtube.com/feeds/videos.xml?channel_id=" + ch);
    for (const e of x.split("<entry>").slice(1)) {
      const id = (e.match(/<yt:videoId>([\w-]{11})</) || [])[1], t = dec((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1]), d = (e.match(/<published>([^<]+)/) || [])[1] || "";
      if (id) out.push({ s: "yt", id, t, d: d.slice(0, 10) });
    }
  } catch (e) { console.log("  feed do YouTube falhou:", e.message); }
  for (const aba of ["videos", "streams"]) {
    try {
      const h = await txt("https://www.youtube.com/channel/" + ch + "/" + aba);
      const re = /"videoId":"([\w-]{11})"[\s\S]{0,1200}?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/g; let m;
      while ((m = re.exec(h))) out.push({ s: "yt", id: m[1], t: JSON.parse('"' + m[2] + '"'), d: "" });
      const re2 = /"contentId":"([\w-]{11})"[\s\S]{0,1500}?"title":\{"content":"((?:[^"\\]|\\.)*)"/g;
      while ((m = re2.exec(h))) out.push({ s: "yt", id: m[1], t: JSON.parse('"' + m[2] + '"'), d: "" });
    } catch (e) { console.log("  aba " + aba + " falhou:", e.message); }
  }
  return out;
}
async function doFeed(f, antigo) {
  const out = []; let itunes = antigo && antigo.itunes, feed = antigo && antigo.feed;
  try {
    if (!feed) {
      const j = JSON.parse(await txt("https://itunes.apple.com/search?media=podcast&country=BR&limit=5&term=" + encodeURIComponent(f.nome)));
      const a = norm(f.nome), r = (j.results || []).find(r => norm(r.collectionName).includes(a) || a.includes(norm(r.collectionName))) || (j.results || [])[0];
      if (r) { itunes = r.collectionId; feed = r.feedUrl; }
    }
    if (feed) {
      const x = await txt(feed);
      for (const it of x.split(/<item[\s>]/).slice(1)) {
        const enc = it.match(/<enclosure[^>]*>/i); if (!enc) continue;
        const url = (enc[0].match(/url="([^"]+)"/i) || [])[1], tp = (enc[0].match(/type="([^"]+)"/i) || [])[1] || "";
        if (!url || !(/^video\//i.test(tp) || /\.(mp4|m4v|mov|webm)(\?|$)/i.test(url))) continue;
        const t = dec((it.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]), d = (it.match(/<pubDate>([^<]+)/i) || [])[1];
        out.push({ s: "mp4", id: dec(url).replace(/^http:/, "https:"), t, d: d ? new Date(d).toISOString().slice(0, 10) : "" });
      }
    }
  } catch (e) { console.log("  feed do podcast falhou:", e.message); }
  return { out, itunes, feed };
}
const pods = {};
for (const f of fontes) {
  const k = norm(f.nome), antigo = velho.pods[k];
  console.log("•", f.nome);
  const ch = await canal(f, antigo);
  const yt = ch ? await doYouTube(ch) : [];
  const fd = await doFeed(f, antigo);
  const visto = new Set(), v = [];
  for (const x of [...fd.out, ...yt, ...((antigo && antigo.v) || [])]) { if (!x.id || !x.t || visto.has(x.id)) continue; visto.add(x.id); v.push(x); }
  v.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
  pods[k] = { nome: f.nome, canal: ch, itunes: fd.itunes || null, feed: fd.feed || null, v: v.slice(0, 600) };
  console.log("  canal:", ch, "| vídeos:", v.length, "(", fd.out.length, "fora do YouTube )");
  await sleep(800);
}
const total = Object.values(pods).reduce((s, p) => s + p.v.length, 0);
fs.writeFileSync(ARQ, JSON.stringify({ atualizado: new Date().toISOString(), total, pods }));
console.log("Total no acervo:", total);
