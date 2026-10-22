"""Baixa as fotos das culturas do Wikimedia Commons e salva dentro do app."""
import json, re, io, html, urllib.request, urllib.parse, pathlib, time
from PIL import Image

PASTA = pathlib.Path(__file__).parent
DADOS = (PASTA.parent / "dados.js").read_text(encoding="utf-8")
bloco = DADOS.split("const FOTOS = {", 1)[1].split("};", 1)[0]
FOTOS = dict(re.findall(r'(\w+):"([^"]+)"', bloco))
UA = {"User-Agent": "TabelaPeriodicaDoCampo/1.0 (https://jleandro1214-creator.github.io/guia-da-cana/tabela-periodica/)"}

def pegar(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def limpa(t):
    return html.unescape(re.sub(r"<[^>]+>", "", t or "")).strip()

creditos, falhas = {}, []
for cid, arq in FOTOS.items():
    try:
        q = urllib.parse.urlencode({"action": "query", "format": "json", "prop": "imageinfo",
            "iiprop": "url|extmetadata", "iiurlwidth": "960", "titles": "File:" + arq})
        info = json.loads(pegar("https://commons.wikimedia.org/w/api.php?" + q))
        pag = next(iter(info["query"]["pages"].values()))
        ii = pag["imageinfo"][0]
        img = Image.open(io.BytesIO(pegar(ii.get("thumburl") or ii["url"]))).convert("RGB")
        img.thumbnail((640, 640))
        img.save(PASTA / f"{cid}.webp", "WEBP", quality=72, method=6)
        m = ii.get("extmetadata", {})
        creditos[cid] = {"arquivo": arq, "autor": limpa(m.get("Artist", {}).get("value"))[:120],
                         "licenca": limpa(m.get("LicenseShortName", {}).get("value")),
                         "pagina": ii.get("descriptionurl", "")}
        print("ok", cid)
    except Exception as e:
        falhas.append(f"{cid}: {arq} -> {e}")
        print("FALHOU", cid, e)
    time.sleep(1)

(PASTA / "creditos.json").write_text(json.dumps(creditos, ensure_ascii=False, indent=1), encoding="utf-8")
(PASTA / "falhas.txt").write_text("\n".join(falhas) + "\n", encoding="utf-8")
