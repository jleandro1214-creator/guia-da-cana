/* Daninhas da Cana — aplicativo (roda 100% no aparelho; sem servidor) */
"use strict";
const $ = (s, el=document)=> el.querySelector(s);
const $$ = (s, el=document)=> [...el.querySelectorAll(s)];
const esc = s=> String(s ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s=> String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const nf = d=> new Intl.NumberFormat("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
const fmt = (x,d=1)=> (x===null||x===undefined||!isFinite(x)) ? "—" : nf(d).format(x);
function num(s){ if(s===undefined||s===null) return NaN; s=String(s).trim().replace(/\s/g,""); if(!s) return NaN;
  if(s.includes(",")) s=s.replace(/\./g,"").replace(",","."); return Number(s); }
const hojeISO = ()=> new Date().toISOString().slice(0,10);
const dataBR = iso=> iso ? iso.split("-").reverse().join("/") : "—";
function toast(t){ const el=$("#toast"); el.textContent=t; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>el.hidden=true,2200); }
const LS = { get(k,d){ try{ const v=localStorage.getItem("dan:"+k); return v===null?d:JSON.parse(v); }catch(_){ return d; } },
             set(k,v){ try{ localStorage.setItem("dan:"+k,JSON.stringify(v)); }catch(_){} } };

/* ---------- Banco local (IndexedDB) ---------- */
const IDB = {
  db:null,
  open(){ if(this.db) return Promise.resolve(this.db);
    return new Promise((ok,err)=>{ const r=indexedDB.open("danCampo",1);
      r.onupgradeneeded=()=>{ const d=r.result; ["vistorias","aplicacoes"].forEach(s=>{ if(!d.objectStoreNames.contains(s)) d.createObjectStore(s,{keyPath:"id"}); });
        if(!d.objectStoreNames.contains("fotos")) d.createObjectStore("fotos"); };
      r.onsuccess=()=>{ this.db=r.result; ok(this.db); }; r.onerror=()=>err(r.error); }); },
  async all(s){ const d=await this.open(); return new Promise(ok=>{ const q=d.transaction(s).objectStore(s).getAll(); q.onsuccess=()=>ok(q.result||[]); q.onerror=()=>ok([]); }); },
  async get(s,k){ const d=await this.open(); return new Promise(ok=>{ const q=d.transaction(s).objectStore(s).get(k); q.onsuccess=()=>ok(q.result??null); q.onerror=()=>ok(null); }); },
  async put(s,v,k){ const d=await this.open(); return new Promise((ok,err)=>{ const t=d.transaction(s,"readwrite"); k===undefined?t.objectStore(s).put(v):t.objectStore(s).put(v,k); t.oncomplete=()=>ok(); t.onerror=()=>err(t.error); }); },
  async del(s,k){ const d=await this.open(); return new Promise(ok=>{ const t=d.transaction(s,"readwrite"); t.objectStore(s).delete(k); t.oncomplete=()=>ok(); t.onerror=()=>ok(); }); }
};
/* Fotos de referência tiradas pelo usuário em cada daninha (versão anterior do app) */
const FotosDan = {
  open(){ return new Promise((ok,err)=>{ const r=indexedDB.open("daninhasFotos",1); r.onupgradeneeded=()=>r.result.createObjectStore("f"); r.onsuccess=()=>ok(r.result); r.onerror=()=>err(r.error); }); },
  async get(k){ try{ const d=await this.open(); return await new Promise(ok=>{ const q=d.transaction("f").objectStore("f").get(k); q.onsuccess=()=>ok(q.result||null); q.onerror=()=>ok(null); }); }catch(_){ return null; } },
  async put(k,v){ const d=await this.open(); return new Promise(ok=>{ const t=d.transaction("f","readwrite"); v===null?t.objectStore("f").delete(k):t.objectStore("f").put(v,k); t.oncomplete=()=>ok(); t.onerror=()=>ok(); }); }
};
(async()=>{ const old=await FotosDan.get("colonião"); if(old && !(await FotosDan.get("coloniao"))){ await FotosDan.put("coloniao",old); await FotosDan.put("colonião",null); } })();
const fotoURL={};
async function loadFoto(id){ const b=await FotosDan.get(id); if(fotoURL[id]) URL.revokeObjectURL(fotoURL[id]); fotoURL[id]=b?URL.createObjectURL(b):null; return fotoURL[id]; }
async function reduz(file,max=1280){ try{ const bmp=await createImageBitmap(file); const k=Math.min(1,max/Math.max(bmp.width,bmp.height));
  const c=document.createElement("canvas"); c.width=Math.round(bmp.width*k); c.height=Math.round(bmp.height*k);
  c.getContext("2d").drawImage(bmp,0,0,c.width,c.height); return await new Promise(ok=>c.toBlob(b=>ok(b||file),"image/jpeg",.82)); }catch(_){ return file; } }

/* ---------- Dados auxiliares ---------- */
const W = id=> DANINHAS.find(d=>d.id===id);
const SOLO_TXT={arenoso:"Arenoso",medio:"Textura média",argiloso:"Argiloso"};
const CANA_TXT={planta:"Cana-planta",soca:"Cana-soca"};
const STATUS = {bula:["ok","✓ Conferido na bula"], referencia:["ref","ⓘ Referência técnica — sem fonte conferida"], pendente:["pend","⚠ Pendente de validação"]};
const badge = (st, extra="")=> `<span class="badge ${STATUS[st][0]}">${STATUS[st][1]}${extra}</span>`;
const soloBadge = n=> `<span class="badge ${NIVEL_SOLO[n][0]}">${NIVEL_SOLO[n][1]}</span>`;
function soloLinha(h){ if(!F.solo||!h.porSolo) return ""; const r=h.porSolo[F.solo];
  return `<div class="soloLin">${soloBadge(r.n)} <span>${esc(SOLO_TXT[F.solo])}: ${esc(r.t)}</span></div>`; }
function soloCampos(h){ return `<div class="solos">${Object.entries(SOLOS).map(([k,so])=>{ const r=h.porSolo[k];
  return `<div class="solo n-${r.n}${F.solo===k?" sel":""}"><div class="sh"><b>${so.ic} ${esc(so.nome)}</b>${soloBadge(r.n)}</div><div class="sa">${esc(so.argila)}</div><p>${esc(r.t)}</p></div>`; }).join("")}</div>`; }
const moaBadges = h=> h.moa.map(g=>`<span class="badge moa" title="${esc(MECANISMOS[g].nome)}">Grupo ${g}</span>`).join(" ");
function refImg(f,alt){ return `<img src="${f.t}" data-alt="${f.s}" data-zoom="${f.s}" alt="${esc(alt)}" loading="lazy" onerror="if(this.dataset.alt){this.src=this.dataset.alt;this.dataset.alt='';}else{const s=this.closest('.slide');if(s)s.classList.add('falhou');this.remove();}">`; }
function thumbOf(w){ const u=fotoURL[w.id]; const r=(REF[w.id]||[])[0]; return `<div class="thumb">${w.ic}${u?`<img src="${u}" alt="">`:(r?`<img src="${r.t}" alt="" loading="lazy" onerror="this.remove()">`:"")}</div>`; }
const favs = ()=> LS.get("favs",[]);
function toggleFav(k){ const f=favs(); const i=f.indexOf(k); i>=0?f.splice(i,1):f.push(k); LS.set("favs",f); return i<0; }

/* Filtros agronômicos (não presumir: começam "Não informado") */
const F = Object.assign({solo:"",cana:"",modal:""}, LS.get("filtros",{}));
const saveF = ()=> LS.set("filtros",F);

/* Dose de um produto para uma daninha, conforme filtros conhecidos */
function doseHTML(hk, wid){
  const h=HERBICIDAS[hk];
  const solos = F.solo ? [F.solo] : ["arenoso","medio","argiloso"];
  const canas = F.cana ? [F.cana] : ["planta","soca"];
  if(solos.length===1 && canas.length===1){
    const r=h.dose(wid,solos[0],canas[0]);
    return r.na ? {na:true, html:`<div class="nota">⛔ ${esc(r.na)}</div>`} : {na:false, html:`<div class="dose">${r.d} <small>${r.u}</small></div>${r.n?`<div class="nota">${esc(r.n)}</div>`:""}`};
  }
  let rows=""; let algum=false;
  canas.forEach(c=> solos.forEach(s=>{ const r=h.dose(wid,s,c); if(!r.na) algum=true;
    rows+=`<tr><td>${CANA_TXT[c]}</td><td>${SOLO_TXT[s]}</td><td>${r.na?`<span style="color:var(--warn)">não indicado</span>`:`<b>${r.d}</b> ${r.u}`}</td></tr>`; }));
  return {na:!algum, html:`<div class="tw"><table class="t"><tr><th>Cana</th><th>Solo</th><th>Dose (bula)</th></tr>${rows}</table></div><div class="nota">Informe o solo e o tipo de cana para ver uma dose só.</div>`};
}
function herbCard(hk, wid){
  const h=HERBICIDAS[hk], d=doseHTML(hk,wid);
  return `<div class="herb${d.na?" na":""}"><div class="top"><div><h5><a href="#/herbicida/${hk}">${esc(h.comercial)}</a></h5><div class="ref">${esc(h.ia)} · ${esc(h.conc)} · ${esc(h.modalidade)}</div></div>${moaBadges(h)}</div>${d.html}${soloLinha(h)}</div>`;
}
function passaModal(h){ if(!F.modal) return true; return F.modal==="pre" ? /pré/i.test(h.modalidade) : /pós/i.test(h.modalidade); }

/* ---------- Roteador ---------- */
const ROTAS = {};
let rotaAtual="";
function go(h){ location.hash=h; }
async function render(){
  const h=location.hash.replace(/^#/,"")||"/"; const [_,r,...a]=h.split("/");
  const nome = r||"home"; rotaAtual=nome;
  $$("nav.bottom a").forEach(x=> x.classList.toggle("on", x.dataset.r===({daninha:"identificar",herbicida:"herbicidas",manejo:"identificar",vistoria:"monitor",talhao:"monitor",aplicacoes:"monitor",aplicacao:"monitor",relatorios:"monitor",mapa:"monitor"}[nome]||nome)));
  const fn = ROTAS[nome] || ROTAS.home;
  $("#main").innerHTML = await fn(...a.map(decodeURIComponent));
  if(fn.after) await fn.after(...a.map(decodeURIComponent));
  if(!render.keepScroll) scrollTo({top:0,behavior:"instant"}); render.keepScroll=false;
}
addEventListener("hashchange", render);

/* ---------- Busca geral ---------- */
$("#q").addEventListener("input", ()=>{ if(rotaAtual!=="busca"){ go("#/busca"); } else { render.keepScroll=true; render(); } });
ROTAS.busca = ()=>{
  const q=norm($("#q").value.trim());
  if(!q) return `<div class="vazio">Digite o nome popular, nome científico, ingrediente ativo, nome comercial ou mecanismo de ação.</div>`;
  const gm=q.match(/^(?:grupo|g)\s*(\d+)$/); const gq=gm?gm[1]:null;
  const ws=gq?[]:DANINHAS.filter(w=> norm(w.nome+" "+w.sci+" "+w.fam+" "+w.ident.join(" ")).includes(q));
  const hs=Object.entries(HERBICIDAS).filter(([k,h])=> gq ? h.moa.includes(gq) : norm(h.comercial+" "+h.ia+" "+h.titular+" "+h.moa.map(g=>MECANISMOS[g].nome).join(" ")).includes(q));
  const ms=Object.entries(MECANISMOS).filter(([g,m])=> gq ? g===gq : norm(m.nome+" "+m.ex).includes(q));
  if(!ws.length && !hs.length && !ms.length) return `<div class="vazio">Nada encontrado para "<b>${esc($("#q").value)}</b>".<br>Tente outro nome ou parte da palavra.</div>`;
  return `${ws.length?`<h2 class="tit">Daninhas (${ws.length})</h2>`+ws.map(itemDan).join(""):""}
    ${hs.length?`<h2 class="tit">Herbicidas (${hs.length})</h2>`+hs.map(([k,h])=>itemHerb(k,h)).join(""):""}
    ${ms.length?`<h2 class="tit">Mecanismos de ação</h2>`+ms.map(([g,m])=>`<div class="card"><b>Grupo ${g} — ${esc(m.nome)}</b><div class="nota">Exemplos: ${esc(m.ex)}</div><div class="nota">Produtos no guia: ${Object.entries(HERBICIDAS).filter(([,h])=>h.moa.includes(g)).map(([k,h])=>`<a href="#/herbicida/${k}">${esc(h.comercial)}</a>`).join(", ")||"—"}</div></div>`).join(""):""}`;
};
const itemDan = w=> `<a class="item" href="#/daninha/${w.id}">${thumbOf(w)}<div class="t"><h4>${esc(w.nome)}</h4><p class="sci">${esc(w.sci)}</p><p>${w.cat.map(c=>CATEGORIAS[c]).join(" · ")}</p></div><div class="chev">›</div></a>`;
const itemHerb = (k,h)=> `<a class="item" href="#/herbicida/${k}"><div class="thumb">🧪</div><div class="t"><h4>${esc(h.comercial)}</h4><p>${esc(h.ia)} · ${esc(h.modalidade)}</p><p>${h.moa.map(g=>"Grupo "+g).join(" + ")} · ${h.alvos.length} daninha(s) no guia</p>${F.solo&&h.porSolo?`<p style="margin-top:4px">${soloBadge(h.porSolo[F.solo].n)}</p>`:""}</div><div class="chev">›</div></a>`;

/* ---------- Início ---------- */
ROTAS.home = async ()=>{
  const f=favs(); const pend=(await IDB.all("vistorias")).filter(v=>v.revisita && v.revisita<=hojeISO()).length;
  return `<div class="grid">
    <a class="mod" href="#/identificar"><span class="e">🔍</span><b>Identificar daninhas</b><small>Busca, categorias, características e fichas</small></a>
    <a class="mod" href="#/manejo"><span class="e">🧭</span><b>Consultar manejo</b><small>Solo, fase do canavial e manejo integrado</small></a>
    <a class="mod" href="#/herbicidas"><span class="e">🧪</span><b>Herbicidas</b><small>Produtos, ingredientes, mecanismos e bulas</small></a>
    <a class="mod" href="#/calc"><span class="e">🧮</span><b>Calculadoras</b><small>Calda, produto e capacidade operacional</small></a>
    <a class="mod" href="#/monitor"><span class="e">📋</span><b>Monitoramento</b><small>Vistorias por fazenda e talhão${pend?` · <b style="color:var(--warn)">${pend} revisita(s) vencida(s)</b>`:""}</small></a>
    <a class="mod" href="#/relatorios"><span class="e">📊</span><b>Resultados e relatórios</b><small>Aplicações, eficácia, indicadores e exportação</small></a>
  </div>
  ${f.length?`<h2 class="tit" style="margin-top:20px">⭐ Favoritos</h2>`+f.map(k=>{ const [t,id]=k.split(":"); return t==="d"&&W(id)?itemDan(W(id)):(t==="h"&&HERBICIDAS[id]?itemHerb(id,HERBICIDAS[id]):""); }).join(""):""}
  <div class="info" style="margin-top:18px">Dados técnicos: versão <b>${DADOS_VERSAO}</b>, revisados em ${DADOS_REVISAO}. ${esc(DADOS_RESPONSAVEL)}.</div>`;
};

/* ---------- Identificar ---------- */
const VISUAL = {trep:["🌀 Trepadeira",["corda"]], quina:["🔺 Caule triangular",["tiririca"]], leite:["🥛 Solta leite",["leiteiro"]], azul:["🔵 Flor azul",["trapoeraba"]],
  touceira:["🌾 Forma touceira",["coloniao","amargoso"]], tapete:["🟩 Rasteira / tapete",["braquiaria","colchao","gramaseda","trapoeraba"]], dedos:["✋ Cacho em dedos",["colchao","gramaseda"]], gancho:["🪝 Semente gruda",["picao"]]};
let catSel = LS.get("catSel",""), visSel = "";
ROTAS.identificar = ()=>{
  let ws=DANINHAS.filter(w=>(!catSel||w.cat.includes(catSel)) && (!visSel||VISUAL[visSel][1].includes(w.id)));
  return `<h2 class="tit">Identificar daninhas</h2>
    <div class="info"><b>Identificação por foto (inteligência artificial):</b> ainda não disponível. Depende de um serviço externo de reconhecimento de imagem que precisa ser contratado e configurado. Por enquanto, use as características abaixo e confira na ficha.</div>
    <span class="lb">Categoria</span>
    <div class="chips">${[["","Todas"],...Object.entries(CATEGORIAS)].map(([k,t])=>`<button class="chip${catSel===k?" on":""}" data-cat="${k}">${t}</button>`).join("")}</div>
    <span class="lb">O que você vê no campo?</span>
    <div class="chips">${Object.entries(VISUAL).map(([k,v])=>`<button class="chip${visSel===k?" on":""}" data-vis="${k}">${v[0]}</button>`).join("")}</div>
    ${ws.length? ws.map(itemDan).join("") : `<div class="vazio">Nenhuma daninha do guia com essa combinação.<br>Tire uma foto e valide com o agrônomo.</div>`}`;
};
ROTAS.identificar.after = ()=>{
  $$("[data-cat]").forEach(b=> b.onclick=()=>{ catSel=b.dataset.cat; LS.set("catSel",catSel); render.keepScroll=true; render(); });
  $$("[data-vis]").forEach(b=> b.onclick=()=>{ visSel = visSel===b.dataset.vis ? "" : b.dataset.vis; render.keepScroll=true; render(); });
};

/* ---------- Ficha da daninha ---------- */
function filtrosHTML(){
  const seg=(id,opts,val)=>`<div class="seg" id="${id}">${opts.map(([v,t])=>`<button data-v="${v}" class="${val===v?"on":""}">${t}</button>`).join("")}</div>`;
  return `<span class="lb">Tipo de solo</span>${seg("fSolo",[["","Não informado"],["arenoso","Arenoso"],["medio","Médio"],["argiloso","Argiloso"]],F.solo)}${F.solo?`<p class="nota">${SOLOS[F.solo].ic} <b>${esc(SOLOS[F.solo].nome)}</b>: ${esc(SOLOS[F.solo].argila)}. ${esc(SOLOS[F.solo].obs)}</p>`:""}
    <span class="lb">Fase do canavial</span>${seg("fCana",[["","Não informado"],["planta","Cana-planta"],["soca","Cana-soca"]],F.cana)}
    <span class="lb">Modalidade</span>${seg("fModal",[["","Todas"],["pre","Pré-emergência"],["pos","Pós-emergência"]],F.modal)}`;
}
function ligaFiltros(){ [["fSolo","solo"],["fCana","cana"],["fModal","modal"]].forEach(([id,k])=> $$(`#${id} button`).forEach(b=> b.onclick=()=>{ F[k]=b.dataset.v; saveF(); render.keepScroll=true; render(); })); }
ROTAS.daninha = async (id)=>{
  const w=W(id); if(!w) return `<div class="vazio">Daninha não encontrada.</div>`;
  await loadFoto(id);
  const hs=Object.entries(HERBICIDAS).filter(([k,h])=>h.alvos.includes(id) && passaModal(h));
  const cards=hs.map(([k])=>({k,c:herbCard(k,id),na:doseHTML(k,id).na})).sort((a,b)=>a.na-b.na);
  const fv=favs().includes("d:"+id);
  return `<div class="card ficha">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><h2 class="tit" style="margin:0">${esc(w.nome)}</h2><p class="sub" style="margin:2px 0 8px"><i>${esc(w.sci)}</i> · ${esc(w.fam)}</p></div>
      <button class="fav${fv?" on":""}" id="favBtn">${fv?"★ Favorito":"☆ Favoritar"}</button></div>
    <div class="galeria">${fotoURL[id]?`<figure class="slide"><img src="${fotoURL[id]}" data-zoom="${fotoURL[id]}" alt="Sua foto"><figcaption>📷 Sua foto do campo (guardada só neste celular)</figcaption></figure>`:""}
      ${(REF[id]||[]).map(f=>`<figure class="slide">${refImg(f,f.c)}<figcaption>${esc(f.c)} · Foto de referência, <a href="${f.p}" target="_blank" rel="noopener">Wikimedia Commons</a> (licença livre)</figcaption></figure>`).join("")}</div>
    <p class="nota">Toque na foto para ampliar. Arraste para o lado para ver mais.</p>
    <div class="btns noprint"><label class="btn sec" for="cam">📷 ${fotoURL[id]?"Trocar minha foto":"Fotografar no campo"}</label><label class="btn sec" for="gal">🖼️ Galeria</label>
      ${fotoURL[id]?`<button class="btn sec" id="delFoto" type="button">Remover minha foto</button>`:""}</div>
    <input type="file" accept="image/*" capture="environment" id="cam" class="vh"><input type="file" accept="image/*" id="gal" class="vh">
    <h4>Como identificar</h4><ul>${w.ident.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>
    <h4>Dados agronômicos ${badge("referencia")}</h4>
    <dl><dt>Categorias</dt><dd>${w.cat.map(c=>CATEGORIAS[c]).join(", ")}</dd><dt>Ciclo</dt><dd>${esc(w.ciclo)}</dd><dt>Propagação</dt><dd>${esc(w.prop)}</dd>
      <dt>Ocorrência</dt><dd>${esc(w.epoca)}</dd><dt>Monitorar</dt><dd>${esc(w.monitorar)}</dd><dt>Competição</dt><dd>${esc(w.competicao)}</dd>
      <dt>Dificuldade</dt><dd>${esc(w.dificuldade)}</dd><dt>Resistência</dt><dd>${esc(w.resistencia)}</dd></dl>
    <h4>Manejo integrado</h4><ul>${w.mip.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>
  </div>
  <div class="card"><h3>Herbicidas com esta daninha na bula</h3>
    <p class="sub">A lista mostra produtos cuja bula cita esta planta. Os filtros ajustam a dose, mas <b>não</b> indicam sozinhos que o produto é adequado para a sua área.</p>
    ${filtrosHTML()}
    ${cards.length?cards.map(x=>x.c).join(""):`<div class="vazio">Nenhum produto do guia para essa modalidade.</div>`}
  </div>
  <div class="aviso"><b>Atenção:</b> doses das bulas dos produtos citados. Outro produto com o mesmo ingrediente pode ter outra concentração e outra bula. Aplique sempre com receituário agronômico.</div>
  <div class="btns noprint"><a class="btn wa" id="waBtn" href="#" target="_blank" rel="noopener">📤 Enviar no WhatsApp</a></div>`;
};
ROTAS.daninha.after = async (id)=>{
  const w=W(id); if(!w) return;
  ligaFiltros();
  $("#favBtn").onclick=()=>{ const on=toggleFav("d:"+id); toast(on?"Adicionado aos favoritos":"Removido dos favoritos"); render.keepScroll=true; render(); };
  const onFile=async e=>{ const f=e.target.files[0]; if(!f) return; await FotosDan.put(id, await reduz(f)); toast("Foto guardada"); render.keepScroll=true; render(); };
  $("#cam").onchange=onFile; $("#gal").onchange=onFile;
  const del=$("#delFoto"); if(del) del.onclick=async()=>{ await FotosDan.put(id,null); render.keepScroll=true; render(); };
  const linhas=[`*Daninhas da Cana* — ${w.nome} (${w.sci})`, `Solo: ${F.solo?SOLO_TXT[F.solo]:"não informado"} · ${F.cana?CANA_TXT[F.cana]:"fase não informada"}`, "", "_Produtos com esta daninha na bula:_"];
  Object.entries(HERBICIDAS).filter(([k,h])=>h.alvos.includes(id)&&passaModal(h)).forEach(([k,h])=>{
    if(F.solo&&F.cana){ const r=h.dose(id,F.solo,F.cana); linhas.push(`• ${h.comercial} (${h.ia}): ${r.na?"não indicado — "+r.na:r.d+" "+r.u}`); }
    else linhas.push(`• ${h.comercial} (${h.ia})`); });
  linhas.push("","Doses de bula. Confirmar com receituário agronômico.");
  const txt=linhas.join("\n"); const wa=$("#waBtn"); wa.href="https://wa.me/?text="+encodeURIComponent(txt);
  wa.onclick=async ev=>{ try{ const b=await FotosDan.get(id);
    if(b&&navigator.canShare){ const file=new File([b],id+".jpg",{type:"image/jpeg"}); if(navigator.canShare({files:[file]})){ ev.preventDefault(); await navigator.share({text:txt,files:[file]}); return; } }
    if(navigator.share){ ev.preventDefault(); await navigator.share({text:txt}); } }catch(_){} };
};

/* ---------- Consultar manejo ---------- */
let manejoDan = LS.get("manejoDan","");
ROTAS.manejo = ()=>{
  const w=W(manejoDan);
  return `<h2 class="tit">Consultar manejo</h2>
  <p class="sub">Escolha a daninha e informe só o que você sabe da área. Campo não informado não é presumido.</p>
  <div class="card"><span class="lb" style="margin-top:0">Daninha</span>
    <select class="f" id="mDan"><option value="">Escolha…</option>${DANINHAS.map(d=>`<option value="${d.id}"${d.id===manejoDan?" selected":""}>${esc(d.nome)}</option>`).join("")}</select>
    ${filtrosHTML()}
    <span class="lb">Condições da área (opcional, para registro)</span>
    <div class="fields">
      <div><label class="lb" for="cPal">Palhada</label><select class="f" id="cPal"><option value="">Não informado</option><option>Sem palhada</option><option>Pouca</option><option>Média</option><option>Muita</option></select></div>
      <div><label class="lb" for="cEpoca">Época</label><select class="f" id="cEpoca"><option value="">Não informado</option><option>Seca</option><option>Chuvosa</option></select></div>
      <div><label class="lb" for="cUmid">Umidade do solo</label><select class="f" id="cUmid"><option value="">Não informado</option><option>Seco</option><option>Úmido</option><option>Encharcado</option></select></div>
      <div><label class="lb" for="cEst">Estádio da daninha</label><select class="f" id="cEst"><option value="">Não informado</option><option>Pré-emergência</option><option>Até 4 folhas</option><option>Perfilhando</option><option>Adulta / florescendo</option></select></div>
    </div></div>
  ${w?`<div class="card"><h3>${esc(w.nome)}: manejo integrado</h3><ul>${w.mip.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>
      <p class="nota"><b>Quando monitorar:</b> ${esc(w.monitorar)}. <b>Resistência:</b> ${esc(w.resistencia)}</p>
      <div id="avisosCond"></div></div>
    <div class="card"><h3>Opções químicas registradas</h3>
      ${Object.entries(HERBICIDAS).filter(([k,h])=>h.alvos.includes(w.id)&&passaModal(h)).map(([k])=>herbCard(k,w.id)).join("")||`<div class="vazio">Nenhuma opção no guia para esta modalidade.</div>`}
      <p class="nota">Varie o mecanismo de ação (grupo) entre as aplicações do mesmo talhão.</p></div>
    <a class="btn sec full" href="#/daninha/${w.id}">Abrir ficha completa</a>`
  :`<div class="vazio">Escolha uma daninha para ver as opções.</div>`}`;
};
ROTAS.manejo.after = ()=>{
  ligaFiltros();
  $("#mDan").onchange=e=>{ manejoDan=e.target.value; LS.set("manejoDan",manejoDan); render.keepScroll=true; render(); };
  const cond=LS.get("cond",{}); ["cPal","cEpoca","cUmid","cEst"].forEach(id=>{ const el=$("#"+id); el.value=cond[id]||""; el.onchange=()=>{ cond[id]=el.value; LS.set("cond",cond); avisos(); }; });
  function avisos(){ const box=$("#avisosCond"); if(!box) return; const a=[];
    if(cond.cEst==="Adulta / florescendo") a.push("Daninha adulta: as bulas de pós indicam plantas pequenas. A eficácia tende a cair; considere manejo mecânico/catação e a reavaliação.");
    if(cond.cUmid==="Seco") a.push("Solo seco: pré-emergentes precisam de umidade para ativar. Confira na bula a janela de aplicação.");
    if(cond.cPal==="Muita") a.push("Muita palhada: parte do produto pode ficar retida. Confira na bula se há indicação para aplicação sobre palha.");
    if(cond.cEst==="Pré-emergência" && F.modal==="pos") a.push("Você marcou daninha em pré-emergência e filtro de pós-emergência.");
    box.innerHTML=a.map(t=>`<div class="alerta">${esc(t)}</div>`).join(""); }
  avisos();
};

/* ---------- Herbicidas ---------- */
let moaSel="";
ROTAS.herbicidas = ()=>{
  const hs=Object.entries(HERBICIDAS).filter(([k,h])=>(!moaSel||h.moa.includes(moaSel)) && passaModal(h));
  return `<h2 class="tit">Herbicidas</h2><p class="sub">Cada ficha é de <b>um produto comercial</b>, com a dose da bula dele. Toque para ver a ficha completa.</p>
    <span class="lb">Mecanismo de ação</span>
    <div class="chips"><button class="chip${!moaSel?" on":""}" data-moa="">Todos</button>${Object.entries(MECANISMOS).map(([g,m])=>`<button class="chip${moaSel===g?" on":""}" data-moa="${g}">Grupo ${g}</button>`).join("")}</div>
    ${moaSel?`<div class="info">Grupo ${moaSel}: ${esc(MECANISMOS[moaSel].nome)}</div>`:""}
    <span class="lb">Tipo de solo</span><div class="seg" id="fSolo">${[["","Todos"],["arenoso","Arenoso"],["medio","Médio"],["argiloso","Argiloso"]].map(([v,t])=>`<button data-v="${v}" class="${F.solo===v?"on":""}">${t}</button>`).join("")}</div>
    ${F.solo?`<p class="nota">${SOLOS[F.solo].ic} ${esc(SOLOS[F.solo].argila)}. Cada produto mostra a restrição da bula para este solo.</p>`:""}
    <span class="lb">Modalidade</span><div class="seg" id="fModal">${[["","Todas"],["pre","Pré"],["pos","Pós"]].map(([v,t])=>`<button data-v="${v}" class="${F.modal===v?"on":""}">${t}</button>`).join("")}</div><div style="height:12px"></div>
    ${hs.map(([k,h])=>itemHerb(k,h)).join("")||`<div class="vazio">Nenhum produto com esse filtro.</div>`}`;
};
ROTAS.herbicidas.after = ()=>{
  $$("[data-moa]").forEach(b=> b.onclick=()=>{ moaSel=b.dataset.moa; render.keepScroll=true; render(); });
  $$("#fModal button").forEach(b=> b.onclick=()=>{ F.modal=b.dataset.v; saveF(); render.keepScroll=true; render(); });
  $$("#fSolo button").forEach(b=> b.onclick=()=>{ F.solo=b.dataset.v; saveF(); render.keepScroll=true; render(); });
};
ROTAS.herbicida = (k)=>{
  const h=HERBICIDAS[k]; if(!h) return `<div class="vazio">Produto não encontrado.</div>`;
  const fv=favs().includes("h:"+k);
  const linhas=(rot,val)=>`<dt>${rot}</dt><dd>${val}</dd>`;
  return `<div class="card ficha">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><h2 class="tit" style="margin:0">${esc(h.comercial)}</h2>
      <button class="fav${fv?" on":""}" id="favBtn">${fv?"★ Favorito":"☆ Favoritar"}</button></div>
    <p style="margin:8px 0">${badge(h.status," em "+h.conferido)} ${moaBadges(h)}</p>
    <dl>${linhas("Ingrediente ativo",esc(h.ia))}${linhas("Concentração",esc(h.conc))}${linhas("Formulação",esc(h.form))}
      ${linhas("Titular",h.titular==="não conferido"?`<span class="badge pend">não conferido</span>`:esc(h.titular))}
      ${linhas("Registro MAPA",h.registro==="não conferido"?`<span class="badge pend">não conferido</span>`:esc(h.registro))}
      ${linhas("Mecanismo",h.moa.map(g=>`Grupo ${g} — ${esc(MECANISMOS[g].nome)}`).join("<br>"))}
      ${linhas("Modalidade",esc(h.modalidade))}${linhas("Cultura","Cana-de-açúcar")}</dl>
    <h4>Daninhas do guia citadas na bula</h4><p>${h.alvos.map(a=>`<a href="#/daninha/${a}">${esc(W(a).nome)}</a>`).join(", ")}</p>
    <h4>Dose da bula por solo e fase</h4>
    <div class="tw"><table class="t"><tr><th>Fase</th><th>Arenoso</th><th>Médio</th><th>Argiloso</th></tr>
      ${["planta","soca"].map(c=>`<tr><td>${CANA_TXT[c]}</td>${["arenoso","medio","argiloso"].map(s=>{ const r=h.dose(h.alvos[0],s,c); return `<td>${r.na?`<span style="color:var(--warn)">não indicado</span>`:`<b>${r.d}</b> ${r.u}`}</td>`; }).join("")}</tr>`).join("")}</table></div>
    <p class="nota">Dose da tabela calculada para "${esc(W(h.alvos[0]).nome)}". Algumas bulas variam a dose por espécie: veja na ficha de cada daninha.</p>
    <h4>Restrição por tipo de solo</h4>
    ${soloCampos(h)}
    <p class="nota">Faixas de argila usuais nas bulas; confira na bula deste produto se ela usa outras faixas. Use a análise de solo do talhão (argila e matéria orgânica) para escolher a linha certa.</p>
    <h4>Restrições e condições da bula</h4><ul>${h.restricoes.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>
    <h4>Segurança</h4><ul><li>Use os EPIs indicados na bula e no receituário.</li><li>Respeite as faixas de segurança e as condições de vento, temperatura e umidade para evitar deriva.</li><li>Dados de seletividade, EPI e intervalos não listados aqui: <b>consulte a bula completa</b>.</li></ul>
    <h4>Fonte</h4><p>${esc(h.fonte)} — <a href="${h.link}" target="_blank" rel="noopener">abrir bula</a><br><span class="nota">Conferido em ${h.conferido}. A bula pode ter sido atualizada depois: confira a versão vigente no AGROFIT/MAPA.</span></p>
  </div>`;
};
ROTAS.herbicida.after = (k)=>{ const b=$("#favBtn"); if(b) b.onclick=()=>{ const on=toggleFav("h:"+k); toast(on?"Adicionado aos favoritos":"Removido dos favoritos"); render.keepScroll=true; render(); }; };

/* ---------- Calculadoras ---------- */
const CALCS = [
  {id:"calda", t:"Área e volume de calda", inputs:[["area","Área a tratar","ha"],["vol","Volume de calda","L/ha"],["tq","Capacidade nominal do tanque","L"],["util","Volume útil do tanque","L"]],
    run(v){ const e=[], av=[];
      if(!(v.area>0)) e.push("Informe a área."); if(!(v.vol>0)) e.push("Informe o volume de calda.");
      const util = v.util>0 ? v.util : v.tq; if(!(util>0)) e.push("Informe a capacidade do tanque.");
      if(e.length) return {e};
      if(v.util>0 && v.tq>0 && v.util>v.tq) av.push("O volume útil está maior que a capacidade nominal do tanque.");
      if(v.vol<30 || v.vol>800) av.push("Volume de calda fora do comum para aplicação terrestre. Confira a bula e a calibração.");
      const tot=v.area*v.vol, ab=Math.ceil(tot/util), aTq=util/v.vol;
      return {r:[["Volume total de calda",fmt(tot,0)+" L",1],["Abastecimentos",fmt(ab,0)],["Área por tanque",fmt(aTq,2)+" ha"]], av,
        f:`Total = ${fmt(v.area,2)} ha × ${fmt(v.vol,0)} L/ha · Abastecimentos = total ÷ ${fmt(util,0)} L (arredondado para cima) · Área por tanque = ${fmt(util,0)} ÷ ${fmt(v.vol,0)}`}; } },
  {id:"prod", t:"Quantidade de produto", inputs:[["dose","Dose da bula (já validada)",""],["area","Área a tratar","ha"],["vol","Volume de calda (para % v/v ou por tanque)","L/ha"],["util","Volume útil do tanque (opcional)","L"]], unit:true,
    run(v,u){ const e=[], av=[];
      if(!(v.dose>0)) e.push("Informe a dose da bula."); if(!(v.area>0)) e.push("Informe a área.");
      if(u==="pct" && !(v.vol>0)) e.push("Dose em % v/v exige o volume de calda por hectare.");
      if(e.length) return {e};
      let porHa, un, base;
      if(u==="pct"){ porHa=v.dose/100*v.vol; un="L"; base=`${fmt(v.dose,2)}% × ${fmt(v.vol,0)} L/ha`; }
      else { porHa=v.dose; un={Lha:"L",mLha:"mL",kgha:"kg",gha:"g"}[u]; base=`${fmt(v.dose,3)} ${un}/ha`; }
      const tot=porHa*v.area; const r=[["Produto total",(un==="mL"&&tot>=1000)?fmt(tot/1000,2)+" L":(un==="g"&&tot>=1000)?fmt(tot/1000,2)+" kg":fmt(tot,2)+" "+un,1],["Por hectare",fmt(porHa,porHa<10?3:1)+" "+un+"/ha"]];
      if(v.util>0 && v.vol>0){ const pt=porHa*(v.util/v.vol); r.push(["Por tanque cheio",fmt(pt,2)+" "+un]); }
      if((u==="Lha"&&v.dose>10)||(u==="kgha"&&v.dose>10)) av.push("Dose alta para essa unidade. Confira se não é mL/ha ou g/ha.");
      if((u==="mLha"||u==="gha")&&v.dose<5) av.push("Dose muito baixa para essa unidade. Confira se não é L/ha ou kg/ha.");
      return {r,av,f:`Total = ${base} × ${fmt(v.area,2)} ha${v.util>0&&v.vol>0?` · Por tanque = dose/ha × (${fmt(v.util,0)} L ÷ ${fmt(v.vol,0)} L/ha)`:""}. Não converte ingrediente ativo em produto comercial.`}; } },
  {id:"cap", t:"Capacidade operacional", inputs:[["area","Área planejada","ha"],["larg","Largura de trabalho","m"],["vel","Velocidade","km/h"],["ef","Eficiência de campo","%"],["hdia","Tempo disponível por dia","h"],["vol","Volume de calda","L/ha"],["util","Volume útil do tanque","L"],["parada","Tempo médio por abastecimento","min"]],
    defaults:{ef:"70"},
    run(v){ const e=[], av=[];
      if(!(v.area>0)) e.push("Informe a área."); if(!(v.larg>0)) e.push("Informe a largura de trabalho."); if(!(v.vel>0)) e.push("Informe a velocidade."); if(!(v.ef>0&&v.ef<=100)) e.push("Eficiência entre 1 e 100%.");
      if(e.length) return {e};
      if(v.vel>25) av.push("Velocidade alta para pulverização terrestre. Confira.");
      const cce=v.larg*v.vel/10*(v.ef/100); let horas=v.area/cce; const r=[["Capacidade efetiva",fmt(cce,2)+" ha/h",1],["Horas de aplicação",fmt(horas,1)+" h"]];
      let fx=`Capacidade = ${fmt(v.larg,1)} m × ${fmt(v.vel,1)} km/h ÷ 10 × ${fmt(v.ef,0)}% · Horas = ${fmt(v.area,1)} ha ÷ capacidade`;
      if(v.vol>0 && v.util>0){ const ab=Math.ceil(v.area*v.vol/v.util); r.push(["Abastecimentos",fmt(ab,0)]);
        if(v.parada>0){ const hp=ab*v.parada/60; horas+=hp; r.push(["Tempo de abastecimento",fmt(hp,1)+" h"],["Tempo total",fmt(horas,1)+" h"]); fx+=` · Abastecimento = ${fmt(ab,0)} × ${fmt(v.parada,0)} min`; } }
      if(v.hdia>0){ r.push(["Dias de operação",fmt(horas/v.hdia,1)+" dia(s)"]); }
      return {r,av,f:fx+". Premissas: largura e eficiência constantes; não considera deslocamentos entre talhões."}; } }
];
ROTAS.calc = ()=> `<h2 class="tit">Calculadoras</h2><p class="sub">Para planejar e conferir. O resultado não é recomendação agronômica: confira a bula, a calibração e as condições reais.</p>
  ${CALCS.map(c=>{ const sv=LS.get("calc:"+c.id,{}); return `<div class="card" id="c-${c.id}"><h3>${c.t}</h3>
    ${c.unit?`<label class="lb" for="${c.id}-u">Unidade da dose</label><select class="f" id="${c.id}-u">${[["Lha","L/ha"],["mLha","mL/ha"],["kgha","kg/ha"],["gha","g/ha"],["pct","% v/v (da calda)"]].map(([v,t])=>`<option value="${v}"${sv.u===v?" selected":""}>${t}</option>`).join("")}</select>`:""}
    <div class="fields">${c.inputs.map(([k,l,u])=>`<div><label class="lb" for="${c.id}-${k}">${l}</label><div class="inp"><input id="${c.id}-${k}" inputmode="decimal" value="${esc(sv[k]??(c.defaults||{})[k]??"")}"><span class="un" data-un="${k}">${u}</span></div></div>`).join("")}</div>
    <div class="out"></div></div>`; }).join("")}`;
ROTAS.calc.after = ()=>{
  CALCS.forEach(c=>{ const box=$("#c-"+c.id), out=$(".out",box);
    const go=()=>{ const v={}, raw={}; c.inputs.forEach(([k])=>{ raw[k]=$(`#${c.id}-${k}`).value; v[k]=num(raw[k]); });
      let u; if(c.unit){ u=$(`#${c.id}-u`).value; raw.u=u; const lab={Lha:"L/ha",mLha:"mL/ha",kgha:"kg/ha",gha:"g/ha",pct:"%"}[u]; $(`[data-un="dose"]`,box).textContent=lab; }
      LS.set("calc:"+c.id,raw);
      const tem=c.inputs.some(([k])=>raw[k]&&raw[k].trim()); if(!tem){ out.innerHTML=""; return; }
      const res=c.run(v,u);
      if(res.e){ out.innerHTML=`<div class="res">${res.e.map(t=>`<div class="r"><span>⚠ ${esc(t)}</span></div>`).join("")}</div>`; return; }
      out.innerHTML=`<div class="res">${res.r.map(([a,b,m])=>`<div class="r${m?" main":""}"><span>${a}</span><b>${b}</b></div>`).join("")}</div>
        ${res.av.map(t=>`<div class="alerta">${esc(t)}</div>`).join("")}<div class="formula">Fórmula: ${res.f}</div>`; };
    $$("input,select",box).forEach(el=> el.addEventListener("input",go)); go(); });
};

/* ---------- Fazendas ---------- */
const fazNome = c=> (typeof FAZENDAS!=="undefined" && FAZENDAS[c]) || "";
function ligaFazenda(codEl, fazEl, hintEl){
  const byName={}; Object.entries(FAZENDAS).forEach(([c,n])=>{ (byName[n.toUpperCase()] ||= []).push(c); });
  codEl.addEventListener("input",()=>{ const c=codEl.value.replace(/\D/g,""); if(c!==codEl.value) codEl.value=c; const n=FAZENDAS[c];
    if(n){ fazEl.value=n; hintEl.textContent="✓ "+c+" — "+n; } else hintEl.textContent = c.length>=5 ? "Código não encontrado" : ""; });
  fazEl.addEventListener("input",()=>{ const cs=byName[fazEl.value.trim().toUpperCase()]; if(cs&&cs.length===1){ codEl.value=cs[0]; hintEl.textContent="✓ "+cs[0]+" — "+fazEl.value; } });
}
(function(){ const dl=$("#listaFazendas"); if(typeof FAZENDAS!=="undefined") dl.innerHTML=Object.entries(FAZENDAS).map(([c,n])=>`<option value="${esc(n)}">${c}</option>`).join(""); })();
const chaveTalhao = r=> (r.cod||r.faz||"?")+"|"+(r.talhao||"?");

/* ---------- Monitoramento ---------- */
ROTAS.monitor = async ()=>{
  const vs=(await IDB.all("vistorias")).sort((a,b)=>(b.data||"").localeCompare(a.data||"")||b.id-a.id);
  const grupos={}; vs.forEach(v=>{ (grupos[chaveTalhao(v)] ||= []).push(v); });
  const hoje=hojeISO();
  return `<h2 class="tit">Monitoramento</h2>
    <div class="btns" style="margin-top:0"><a class="btn" href="#/vistoria/nova">➕ Nova vistoria</a><a class="btn sec" href="#/aplicacoes">💧 Aplicações</a><a class="btn sec" href="#/mapa">📍 Pontos</a></div>
    <p class="sub" style="margin-top:12px">Tudo fica salvo neste celular, mesmo sem internet. Faça backup em Relatórios.</p>
    ${Object.keys(grupos).length?Object.entries(grupos).map(([k,l])=>{ const u=l[0]; const venc=l.some(v=>v.revisita&&v.revisita<=hoje&&v===u);
      return `<a class="item" href="#/talhao/${encodeURIComponent(k)}"><div class="thumb">🗺️</div><div class="t"><h4>${esc(u.faz||u.cod||"Fazenda?")} · Talhão ${esc(u.talhao||"?")}</h4>
        <p>${l.length} vistoria(s) · última ${dataBR(u.data)} · ${esc(u.nivel||"")}</p>${venc?`<p style="color:var(--warn);font-weight:700">Revisita vencida (${dataBR(u.revisita)})</p>`:""}</div><div class="chev">›</div></a>`; }).join("")
      : `<div class="vazio">Nenhuma vistoria registrada ainda.<br>Toque em <b>Nova vistoria</b> para começar.</div>`}`;
};
const NIVEIS=["Baixo","Médio","Alto","Muito alto"], DISTR=["Localizada","Em reboleiras","Em faixas","Generalizada"];
ROTAS.vistoria = async (id)=>{
  const v = id && id!=="nova" ? await IDB.get("vistorias",Number(id)) : null;
  const ult = LS.get("ultVist",{});
  const d = v || {data:hojeISO(), cod:ult.cod||"", faz:ult.faz||"", talhao:ult.talhao||"", resp:ult.resp||"", cana:ult.cana||"", solo:ult.solo||"", argila:ult.argila||""};
  const opt=(arr,val)=>`<option value="">Não informado</option>`+arr.map(x=>`<option${x===val?" selected":""}>${esc(x)}</option>`).join("");
  return `<h2 class="tit">${v?"Editar vistoria":"Nova vistoria"}</h2>
  <form class="card" id="fv" autocomplete="off">
    <div class="fields">
      <div><label class="lb" for="v-data">Data</label><input class="f" type="date" id="v-data" value="${esc(d.data)}" required></div>
      <div><label class="lb" for="v-resp">Responsável</label><input class="f" id="v-resp" value="${esc(d.resp||"")}"></div>
      <div><label class="lb" for="v-cod">Código fazenda</label><input class="f" id="v-cod" inputmode="numeric" value="${esc(d.cod||"")}"></div>
      <div><label class="lb" for="v-faz">Fazenda</label><input class="f" id="v-faz" list="listaFazendas" value="${esc(d.faz||"")}"></div>
      <div class="full"><span class="nota" id="v-hint"></span></div>
      <div><label class="lb" for="v-talhao">Talhão</label><input class="f" id="v-talhao" value="${esc(d.talhao||"")}" required></div>
      <div><label class="lb" for="v-var">Variedade</label><input class="f" id="v-var" value="${esc(d.variedade||"")}"></div>
      <div><label class="lb" for="v-cana">Tipo de canavial</label><select class="f" id="v-cana">${opt(["Cana-planta","Cana-soca"],d.cana)}</select></div>
      <div><label class="lb" for="v-idade">Idade / estádio da cana</label><input class="f" id="v-idade" value="${esc(d.idade||"")}" placeholder="ex.: 3 meses"></div>
      <div><label class="lb" for="v-solo">Tipo de solo</label><select class="f" id="v-solo"><option value="">Não informado</option>${Object.entries(SOLOS).map(([k,so])=>`<option value="${k}"${d.solo===k?" selected":""}>${esc(so.nome)}</option>`).join("")}</select></div>
      <div><label class="lb" for="v-argila">Argila (%) da análise</label><input class="f" id="v-argila" inputmode="decimal" value="${esc(d.argila||"")}" placeholder="opcional"></div>
      <div class="full"><span class="nota" id="v-soloHint"></span></div>
      <div class="full"><label class="lb" for="v-esp">Espécie identificada</label><select class="f" id="v-esp"><option value="">Escolha…</option>${DANINHAS.map(w=>`<option value="${w.id}"${w.id===d.esp?" selected":""}>${esc(w.nome)}</option>`).join("")}<option value="outra"${d.esp==="outra"?" selected":""}>Outra / não identificada</option></select></div>
      <div class="full" id="v-outraBox" ${d.esp==="outra"?"":"hidden"}><label class="lb" for="v-outra">Qual?</label><input class="f" id="v-outra" value="${esc(d.outra||"")}"></div>
      <div><label class="lb" for="v-estd">Estádio da daninha</label><select class="f" id="v-estd">${opt(["Plântula","Até 4 folhas","Perfilhando / ramificando","Florescendo","Com sementes"],d.estd)}</select></div>
      <div><label class="lb" for="v-nivel">Nível de infestação</label><select class="f" id="v-nivel">${opt(NIVEIS,d.nivel)}</select></div>
      <div class="full"><label class="lb" for="v-dist">Distribuição na área</label><select class="f" id="v-dist">${opt(DISTR,d.dist)}</select></div>
      <div class="full"><label class="lb" for="v-obs">Observações</label><textarea class="f" id="v-obs">${esc(d.obs||"")}</textarea></div>
      <div><label class="lb" for="v-acomp">Precisa acompanhar?</label><select class="f" id="v-acomp">${opt(["Sim","Não"],d.acomp)}</select></div>
      <div><label class="lb" for="v-revisita">Nova vistoria em</label><input class="f" type="date" id="v-revisita" value="${esc(d.revisita||"")}"></div>
    </div>
    <span class="lb">Fotos</span><div id="v-fotos" class="btns" style="margin-top:0"></div>
    <div class="btns"><label class="btn sec" for="v-cam">📷 Tirar foto</label><label class="btn sec" for="v-gal">🖼️ Galeria</label>
      <button type="button" class="btn sec" id="v-gps">📍 ${d.lat?"Local marcado ✓":"Marcar local (GPS)"}</button></div>
    <input type="file" accept="image/*" capture="environment" id="v-cam" class="vh"><input type="file" accept="image/*" id="v-gal" class="vh" multiple>
    <p class="nota" id="v-gpsTxt">${d.lat?`Local: ${fmt(d.lat,6)}, ${fmt(d.lon,6)} (±${fmt(d.prec,0)} m)`:"GPS é opcional. A vistoria pode ser salva sem local."}</p>
    <div class="btns"><button class="btn" type="submit">💾 Salvar vistoria</button>${v?`<button class="btn sec" type="button" id="v-del">Excluir</button>`:""}</div>
  </form>`;
};
ROTAS.vistoria.after = async (id)=>{
  const ant = id && id!=="nova" ? await IDB.get("vistorias",Number(id)) : null;
  const rec = ant ? {...ant} : {id:Date.now(), fotos:[]};
  ligaFazenda($("#v-cod"),$("#v-faz"),$("#v-hint"));
  $("#v-esp").onchange=e=> $("#v-outraBox").hidden = e.target.value!=="outra";
  const soloHint=()=>{ const a=num($("#v-argila").value), sel=$("#v-solo").value; const h=$("#v-soloHint"); if(!(a>=0&&a<=100)){ h.textContent=sel?SOLOS[sel].argila:""; return; }
    const c=a<15?"arenoso":a<=35?"medio":"argiloso";
    h.textContent = `${fmt(a,0)}% de argila corresponde a ${SOLOS[c].nome.toLowerCase()} pelas faixas usuais.` + (sel&&sel!==c?" Confira o tipo de solo marcado.":"") + (a<10?" Abaixo de 10%: Alion não pode ser usado em cana-planta.":""); };
  $("#v-argila").addEventListener("input",soloHint); $("#v-solo").addEventListener("change",soloHint); soloHint();
  const fotosBox=$("#v-fotos");
  async function showFotos(){ fotosBox.innerHTML=""; for(const k of rec.fotos){ const b=await IDB.get("fotos",k); if(!b) continue; const u=URL.createObjectURL(b);
      const fig=document.createElement("div"); fig.innerHTML=`<img src="${u}" data-zoom="${u}" alt="Foto da vistoria" style="width:96px;height:96px;object-fit:cover;border-radius:10px;display:block"><button type="button" class="btn sec" style="padding:4px 8px;font-size:13px;margin-top:4px">Remover</button>`;
      fig.querySelector("button").onclick=async()=>{ rec.fotos=rec.fotos.filter(x=>x!==k); await IDB.del("fotos",k); showFotos(); };
      fotosBox.appendChild(fig); } }
  showFotos();
  const addF=async e=>{ for(const f of e.target.files){ const k="v"+rec.id+"-"+Date.now()+Math.random().toString(36).slice(2,6); await IDB.put("fotos",await reduz(f,1600),k); rec.fotos.push(k); } e.target.value=""; showFotos(); };
  $("#v-cam").onchange=addF; $("#v-gal").onchange=addF;
  $("#v-gps").onclick=()=>{ if(!navigator.geolocation){ $("#v-gpsTxt").textContent="Este aparelho não oferece GPS ao app."; return; }
    $("#v-gpsTxt").textContent="Buscando sinal de GPS…";
    navigator.geolocation.getCurrentPosition(p=>{ rec.lat=p.coords.latitude; rec.lon=p.coords.longitude; rec.prec=p.coords.accuracy;
      $("#v-gpsTxt").textContent=`Local: ${fmt(rec.lat,6)}, ${fmt(rec.lon,6)} (±${fmt(rec.prec,0)} m)`; $("#v-gps").textContent="📍 Local marcado ✓"; },
      err=>{ $("#v-gpsTxt").textContent = err.code===1 ? "Permissão de localização negada. A vistoria pode ser salva sem local." : "Não foi possível obter o GPS agora. Tente de novo em área aberta."; },
      {enableHighAccuracy:true,timeout:20000,maximumAge:0}); };
  /* rascunho automático: não perder o que foi digitado */
  const form=$("#fv"); const campos=["data","resp","cod","faz","talhao","var","cana","idade","solo","argila","esp","outra","estd","nivel","dist","obs","acomp","revisita"];
  const ler=()=>{ const o={}; campos.forEach(c=>o[c]=$("#v-"+c).value.trim()); return o; };
  if(!ant){ const r=LS.get("rascVist",null); if(r){ campos.forEach(c=>{ if(r[c]) $("#v-"+c).value=r[c]; }); $("#v-outraBox").hidden=$("#v-esp").value!=="outra"; } }
  form.addEventListener("input",()=>{ if(!ant) LS.set("rascVist",ler()); });
  form.onsubmit=async e=>{ e.preventDefault(); const o=ler();
    if(!o.talhao){ toast("Informe o talhão"); $("#v-talhao").focus(); return; }
    if(!o.esp){ toast("Escolha a espécie"); $("#v-esp").focus(); return; }
    Object.assign(rec,{data:o.data,resp:o.resp,cod:o.cod,faz:o.faz||fazNome(o.cod),talhao:o.talhao,variedade:o.var,cana:o.cana,idade:o.idade,solo:o.solo,argila:o.argila,esp:o.esp,outra:o.outra,estd:o.estd,nivel:o.nivel,dist:o.dist,obs:o.obs,acomp:o.acomp,revisita:o.revisita,alterado:new Date().toISOString()});
    if(!rec.criado) rec.criado=rec.alterado;
    await IDB.put("vistorias",rec); LS.set("rascVist",null); LS.set("ultVist",{cod:o.cod,faz:rec.faz,talhao:o.talhao,resp:o.resp,cana:o.cana,solo:o.solo,argila:o.argila});
    toast("Vistoria salva"); go("#/talhao/"+encodeURIComponent(chaveTalhao(rec))); };
  const del=$("#v-del"); if(del) del.onclick=async()=>{ if(del.dataset.ok!=="1"){ del.dataset.ok="1"; del.textContent="Toque de novo para excluir"; return; }
    for(const k of rec.fotos) await IDB.del("fotos",k); await IDB.del("vistorias",rec.id); toast("Vistoria excluída"); go("#/monitor"); };
};
const nomeEsp = v=> v.esp==="outra" ? (v.outra||"Outra") : (W(v.esp)?.nome||v.esp||"—");
ROTAS.talhao = async (k)=>{
  const vs=(await IDB.all("vistorias")).filter(v=>chaveTalhao(v)===k).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  const as=(await IDB.all("aplicacoes")).filter(a=>chaveTalhao(a)===k).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  if(!vs.length && !as.length) return `<div class="vazio">Sem registros para este talhão.</div>`;
  const u=vs[0]||as[0];
  const alertas=alertasTalhao(as);
  return `<h2 class="tit">${esc(u.faz||u.cod)} · Talhão ${esc(u.talhao)}</h2><p class="sub">${u.cod?"Código "+esc(u.cod)+" · ":""}${vs.length} vistoria(s), ${as.length} aplicação(ões)${(vs.find(v=>v.solo)||{}).solo?" · Solo: "+esc(SOLOS[vs.find(v=>v.solo).solo].nome)+(vs.find(v=>v.solo).argila?" ("+esc(vs.find(v=>v.solo).argila)+"% argila)":""):""}</p>
    ${alertas.map(t=>`<div class="alerta">${t}</div>`).join("")}
    <div class="btns" style="margin-top:0"><a class="btn" href="#/vistoria/nova">➕ Vistoria</a><a class="btn sec" href="#/aplicacao/nova">💧 Aplicação</a></div>
    <h3 style="margin:18px 0 8px">Histórico de infestação</h3>
    ${vs.length?`<div class="tw card" style="padding:8px"><table class="t"><tr><th>Data</th><th>Espécie</th><th>Estádio</th><th>Nível</th><th>Distribuição</th></tr>
      ${vs.map(v=>`<tr><td><a href="#/vistoria/${v.id}">${dataBR(v.data)}</a></td><td>${esc(nomeEsp(v))}</td><td>${esc(v.estd||"—")}</td><td>${esc(v.nivel||"—")}</td><td>${esc(v.dist||"—")}</td></tr>`).join("")}</table></div>`:`<p class="nota">Sem vistorias.</p>`}
    <h3 style="margin:18px 0 8px">Aplicações</h3>
    ${as.length?`<div class="tw card" style="padding:8px"><table class="t"><tr><th>Data</th><th>Produto</th><th>Grupo</th><th>Resultado</th></tr>
      ${as.map(a=>`<tr><td><a href="#/aplicacao/${a.id}">${dataBR(a.data)}</a></td><td>${esc(a.produto)}</td><td>${esc((a.moa||[]).join(" + ")||"—")}</td><td>${esc(a.resultado||"—")}${a.falha==="Sim"?" ⚠":""}</td></tr>`).join("")}</table></div>`:`<p class="nota">Sem aplicações.</p>`}`;
};

/* ---------- Aplicações e alertas de resistência ---------- */
function alertasTalhao(as){
  const a=[], ord=[...as].sort((x,y)=>(x.data||"").localeCompare(y.data||""));
  if(ord.length>=2){ const ult=ord.slice(-3); Object.keys(MECANISMOS).forEach(g=>{ let seq=0; for(let i=ord.length-1;i>=0;i--){ if((ord[i].moa||[]).includes(g)) seq++; else break; }
      if(seq>=2) a.push(`🔁 <b>Grupo ${g}</b> (${esc(MECANISMOS[g].nome)}) usado em <b>${seq} aplicações seguidas</b> neste talhão. Indicador para investigação: considere diversificar o mecanismo.`); }); }
  const falhas=as.filter(x=>x.falha==="Sim").length;
  if(falhas>=2) a.push(`⚠ <b>${falhas} falhas de controle</b> registradas neste talhão. Falhas têm várias causas (dose, momento, chuva, calibração) e não comprovam resistência. Se a suspeita continuar, peça avaliação técnica.`);
  return a;
}
ROTAS.aplicacoes = async ()=>{
  const as=(await IDB.all("aplicacoes")).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  return `<h2 class="tit">Histórico de aplicações</h2><div class="btns" style="margin-top:0"><a class="btn" href="#/aplicacao/nova">➕ Registrar aplicação</a></div><div style="height:12px"></div>
    ${as.length?as.map(a=>`<a class="item" href="#/aplicacao/${a.id}"><div class="thumb">💧</div><div class="t"><h4>${esc(a.produto)}</h4><p>${dataBR(a.data)} · ${esc(a.faz||a.cod)} · Talhão ${esc(a.talhao)}</p><p>${a.area?fmt(a.area,1)+" ha · ":""}${esc(a.resultado||"resultado não avaliado")}</p></div><div class="chev">›</div></a>`).join("")
      :`<div class="vazio">Nenhuma aplicação registrada.</div>`}`;
};
ROTAS.aplicacao = async (id)=>{
  const a = id && id!=="nova" ? await IDB.get("aplicacoes",Number(id)) : null;
  const ult=LS.get("ultVist",{}); const d=a||{data:hojeISO(),cod:ult.cod||"",faz:ult.faz||"",talhao:ult.talhao||"",resp:ult.resp||""};
  const opt=(arr,val)=>`<option value="">Não informado</option>`+arr.map(x=>`<option${x===val?" selected":""}>${esc(x)}</option>`).join("");
  const inp=(id,l,val,extra="")=>`<div><label class="lb" for="a-${id}">${l}</label><input class="f" id="a-${id}" value="${esc(val??"")}" ${extra}></div>`;
  return `<h2 class="tit">${a?"Editar aplicação":"Registrar aplicação"}</h2>
  <form class="card" id="fa" autocomplete="off"><div class="fields">
    <div><label class="lb" for="a-data">Data</label><input class="f" type="date" id="a-data" value="${esc(d.data)}"></div>
    ${inp("resp","Responsável",d.resp)}${inp("cod","Código fazenda",d.cod,'inputmode="numeric"')}${inp("faz","Fazenda",d.faz,'list="listaFazendas"')}
    <div class="full"><span class="nota" id="a-hint"></span></div>
    ${inp("talhao","Talhão",d.talhao)}${inp("area","Área tratada (ha)",d.area!=null?String(d.area).replace(".",","):"",'inputmode="decimal"')}
    <div class="full"><label class="lb" for="a-prodSel">Produto comercial</label><select class="f" id="a-prodSel"><option value="">Escolha…</option>${Object.entries(HERBICIDAS).map(([k,h])=>`<option value="${k}"${d.prodK===k?" selected":""}>${esc(h.comercial)} (${esc(h.ia)})</option>`).join("")}<option value="outro"${d.prodK==="outro"?" selected":""}>Outro produto</option></select></div>
    <div class="full" id="a-outroBox" ${d.prodK==="outro"?"":"hidden"}><div class="fields">${inp("outro","Nome comercial",d.prodK==="outro"?d.produto:"")}${inp("ia","Ingrediente ativo",d.prodK==="outro"?d.ia:"")}
      <div class="full"><label class="lb">Mecanismo (grupo)</label><div class="chips" id="a-moa">${Object.keys(MECANISMOS).map(g=>`<button type="button" class="chip${(d.prodK==="outro"&&(d.moa||[]).includes(g))?" on":""}" data-g="${g}">Grupo ${g}</button>`).join("")}</div></div></div></div>
    ${inp("dose","Dose usada",d.dose,'placeholder="ex.: 2,0 L/ha"')}${inp("calda","Volume de calda (L/ha)",d.calda,'inputmode="decimal"')}
    <div><label class="lb" for="a-modal">Modalidade</label><select class="f" id="a-modal">${opt(["Pré-emergência","Pós-emergência","Jato dirigido","Catação"],d.modal)}</select></div>
    ${inp("equip","Equipamento",d.equip)}
    ${inp("clima","Condições do tempo",d.clima,'placeholder="vento, umidade, chuva…"')}${inp("estCana","Estádio da cana",d.estCana)}
    ${inp("estDan","Estádio das daninhas",d.estDan)}${inp("custo","Custo (R$/ha, opcional)",d.custo,'inputmode="decimal"')}
    <div><label class="lb" for="a-resultado">Resultado observado</label><select class="f" id="a-resultado">${opt(["Bom (acima de 80%)","Regular (60 a 80%)","Ruim (abaixo de 60%)"],d.resultado)}</select></div>
    <div><label class="lb" for="a-falha">Falha de controle?</label><select class="f" id="a-falha">${opt(["Sim","Não"],d.falha)}</select></div>
    <div><label class="lb" for="a-avalData">Data da avaliação</label><input class="f" type="date" id="a-avalData" value="${esc(d.avalData||"")}"></div>
    <div class="full"><label class="lb" for="a-obs">Observações</label><textarea class="f" id="a-obs">${esc(d.obs||"")}</textarea></div>
  </div><div id="a-alertas"></div>
  <div class="btns"><button class="btn" type="submit">💾 Salvar aplicação</button>${a?`<button class="btn sec" type="button" id="a-del">Excluir</button>`:""}</div></form>`;
};
ROTAS.aplicacao.after = async (id)=>{
  const ant = id && id!=="nova" ? await IDB.get("aplicacoes",Number(id)) : null;
  const rec = ant?{...ant}:{id:Date.now()};
  ligaFazenda($("#a-cod"),$("#a-faz"),$("#a-hint"));
  let moaOutro = ant&&ant.prodK==="outro" ? [...(ant.moa||[])] : [];
  $("#a-prodSel").onchange=e=>{ $("#a-outroBox").hidden=e.target.value!=="outro"; checa(); };
  $$("#a-moa .chip").forEach(b=> b.onclick=()=>{ const g=b.dataset.g; moaOutro.includes(g)?moaOutro=moaOutro.filter(x=>x!==g):moaOutro.push(g); b.classList.toggle("on"); checa(); });
  async function checa(){ const pk=$("#a-prodSel").value; const moa= pk==="outro"?moaOutro:(HERBICIDAS[pk]?.moa||[]);
    const k=($("#a-cod").value||$("#a-faz").value||"?")+"|"+($("#a-talhao").value||"?");
    const hist=(await IDB.all("aplicacoes")).filter(x=>chaveTalhao(x)===k && x.id!==rec.id);
    const sim=[...hist,{data:$("#a-data").value,moa,falha:$("#a-falha").value}];
    $("#a-alertas").innerHTML=alertasTalhao(sim).map(t=>`<div class="alerta">${t}</div>`).join(""); }
  ["a-talhao","a-cod","a-data","a-falha"].forEach(i=> $("#"+i).addEventListener("change",checa)); checa();
  $("#fa").onsubmit=async e=>{ e.preventDefault(); const g=i=>$("#a-"+i).value.trim(); const pk=g("prodSel");
    if(!g("talhao")){ toast("Informe o talhão"); return; } if(!pk){ toast("Escolha o produto"); return; }
    if(pk==="outro" && !g("outro")){ toast("Informe o nome do produto"); return; }
    const h=HERBICIDAS[pk];
    Object.assign(rec,{data:g("data"),resp:g("resp"),cod:g("cod"),faz:g("faz")||fazNome(g("cod")),talhao:g("talhao"),area:num(g("area"))||null,prodK:pk,
      produto:h?h.comercial:g("outro"),ia:h?h.ia:g("ia"),moa:h?h.moa:moaOutro,dose:g("dose"),calda:g("calda"),modal:g("modal"),equip:g("equip"),clima:g("clima"),
      estCana:g("estCana"),estDan:g("estDan"),custo:num(g("custo"))||null,resultado:g("resultado"),falha:g("falha"),avalData:g("avalData"),obs:g("obs"),alterado:new Date().toISOString()});
    if(!rec.criado) rec.criado=rec.alterado;
    await IDB.put("aplicacoes",rec); toast("Aplicação salva"); go("#/talhao/"+encodeURIComponent(chaveTalhao(rec))); };
  const del=$("#a-del"); if(del) del.onclick=async()=>{ if(del.dataset.ok!=="1"){ del.dataset.ok="1"; del.textContent="Toque de novo para excluir"; return; } await IDB.del("aplicacoes",rec.id); toast("Aplicação excluída"); go("#/aplicacoes"); };
};

/* ---------- Pontos de ocorrência (sem mapa inventado) ---------- */
ROTAS.mapa = async ()=>{
  const vs=(await IDB.all("vistorias")).filter(v=>v.lat);
  return `<h2 class="tit">Pontos de ocorrência</h2>
    <div class="info">Mostra só os pontos que você marcou com GPS nas vistorias. Os limites dos talhões não aparecem porque o app ainda não tem esses dados. Para um mapa completo, é preciso o arquivo de contorno dos talhões (KML/shapefile) da usina.</div>
    ${vs.length?vs.sort((a,b)=>(b.data||"").localeCompare(a.data||"")).map(v=>`<a class="item" href="https://www.google.com/maps?q=${v.lat},${v.lon}" target="_blank" rel="noopener"><div class="thumb">📍</div><div class="t"><h4>${esc(nomeEsp(v))} · ${esc(v.nivel||"")}</h4><p>${esc(v.faz||v.cod)} · Talhão ${esc(v.talhao)} · ${dataBR(v.data)}</p><p>${fmt(v.lat,5)}, ${fmt(v.lon,5)} — abrir no Google Maps</p></div></a>`).join("")
      :`<div class="vazio">Nenhuma vistoria com local marcado.</div>`}`;
};

/* ---------- Relatórios ---------- */
let rel = {de:"", ate:""};
ROTAS.relatorios = async ()=>{
  const dentro=x=> (!rel.de||x.data>=rel.de) && (!rel.ate||x.data<=rel.ate);
  const vs=(await IDB.all("vistorias")).filter(dentro), as=(await IDB.all("aplicacoes")).filter(dentro);
  const talhoes=new Set(vs.map(chaveTalhao)); const freq={}; vs.forEach(v=>{ const n=nomeEsp(v); freq[n]=(freq[n]||0)+1; });
  const top=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const altos=vs.filter(v=>v.nivel==="Alto"||v.nivel==="Muito alto");
  const pend=(await IDB.all("vistorias")).filter(v=>v.revisita&&v.revisita<=hojeISO());
  const falhas=as.filter(a=>a.falha==="Sim");
  const comCusto=as.filter(a=>a.custo>0&&a.area>0); const custoTot=comCusto.reduce((s,a)=>s+a.custo*a.area,0); const areaC=comCusto.reduce((s,a)=>s+a.area,0);
  return `<h2 class="tit">Resultados e relatórios</h2>
  <div class="card noprint"><div class="fields"><div><label class="lb" for="r-de">De</label><input class="f" type="date" id="r-de" value="${rel.de}"></div><div><label class="lb" for="r-ate">Até</label><input class="f" type="date" id="r-ate" value="${rel.ate}"></div></div></div>
  <div class="stat"><div><b>${talhoes.size}</b><span>talhões vistoriados</span></div><div><b>${vs.length}</b><span>vistorias</span></div>
    <div><b>${as.length}</b><span>aplicações</span></div><div><b>${falhas.length}</b><span>falhas de controle</span></div>
    <div><b>${pend.length}</b><span>revisitas vencidas</span></div><div><b>${comCusto.length?"R$ "+fmt(custoTot/areaC,2):"—"}</b><span>custo médio/ha ${comCusto.length?`(${comCusto.length} aplicação[ões] com custo)`:"(sem custos informados)"}</span></div></div>
  <div class="card" style="margin-top:14px"><h3>Espécies mais frequentes</h3>${top.length?`<table class="t">${top.map(([n,c])=>`<tr><td>${esc(n)}</td><td style="text-align:right"><b>${c}</b> vistoria(s)</td></tr>`).join("")}</table>`:`<p class="nota">Sem vistorias no período.</p>`}</div>
  <div class="card"><h3>Infestação alta ou muito alta</h3>${altos.length?`<table class="t">${altos.map(v=>`<tr><td>${dataBR(v.data)}</td><td>${esc(v.faz||v.cod)} · ${esc(v.talhao)}</td><td>${esc(nomeEsp(v))}</td></tr>`).join("")}</table>`:`<p class="nota">Nenhuma.</p>`}</div>
  <div class="card"><h3>Revisitas vencidas</h3>${pend.length?`<table class="t">${pend.map(v=>`<tr><td>${dataBR(v.revisita)}</td><td><a href="#/talhao/${encodeURIComponent(chaveTalhao(v))}">${esc(v.faz||v.cod)} · ${esc(v.talhao)}</a></td></tr>`).join("")}</table>`:`<p class="nota">Nenhuma.</p>`}</div>
  ${comCusto.length?`<div class="card"><h3>Custos informados</h3><p>Total: <b>R$ ${fmt(custoTot,2)}</b> em ${fmt(areaC,1)} ha. Só entram aplicações com custo e área preenchidos.</p></div>`:""}
  <div class="card noprint"><h3>Exportar e backup</h3>
    <div class="btns"><button class="btn sec" id="x-vcsv">📄 Vistorias (Excel/CSV)</button><button class="btn sec" id="x-acsv">📄 Aplicações (Excel/CSV)</button>
      <button class="btn sec" id="x-pdf">🖨️ Relatório em PDF</button><button class="btn sec" id="x-bkp">💾 Backup completo</button><label class="btn sec" for="x-imp">♻️ Restaurar backup</label></div>
    <input type="file" id="x-imp" accept="application/json,.json" class="vh">
    <p class="nota">O PDF abre a tela de impressão do celular: escolha "Salvar como PDF". O backup leva vistorias, aplicações e fotos. Guarde o arquivo no Drive ou mande para você no WhatsApp.</p></div>
  <div class="info"><b>Ainda não disponível:</b> sincronização automática entre celulares, área administrativa com login e mapa com contorno dos talhões. Esses recursos dependem de um servidor e de um banco de dados online, que ainda não foram configurados. Hoje, cada celular guarda os próprios registros, e o backup é o jeito de passar os dados para outro aparelho.</div>`;
};
function baixa(nome, conteudo, tipo){ const b=new Blob([conteudo],{type:tipo}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=nome; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); }
function csv(linhas){ return "﻿"+linhas.map(l=>l.map(c=>{ const s=String(c??""); return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(";")).join("\n"); }
ROTAS.relatorios.after = ()=>{
  $("#r-de").onchange=e=>{ rel.de=e.target.value; render.keepScroll=true; render(); }; $("#r-ate").onchange=e=>{ rel.ate=e.target.value; render.keepScroll=true; render(); };
  $("#x-vcsv").onclick=async()=>{ const vs=await IDB.all("vistorias");
    baixa(`vistorias_${hojeISO()}.csv`, csv([["Data","Código","Fazenda","Talhão","Responsável","Variedade","Tipo de cana","Idade","Tipo de solo","Argila %","Espécie","Estádio daninha","Nível","Distribuição","Acompanhar","Nova vistoria","Latitude","Longitude","Observações"],
      ...vs.map(v=>[v.data,v.cod,v.faz,v.talhao,v.resp,v.variedade,v.cana,v.idade,v.solo?SOLOS[v.solo].nome:"",v.argila||"",nomeEsp(v),v.estd,v.nivel,v.dist,v.acomp,v.revisita,v.lat??"",v.lon??"",v.obs])]),"text/csv"); };
  $("#x-acsv").onclick=async()=>{ const as=await IDB.all("aplicacoes");
    baixa(`aplicacoes_${hojeISO()}.csv`, csv([["Data","Código","Fazenda","Talhão","Produto","Ingrediente ativo","Grupos","Dose","Calda L/ha","Área ha","Modalidade","Equipamento","Tempo","Estádio cana","Estádio daninhas","Responsável","Resultado","Falha","Data avaliação","Custo R$/ha","Observações"],
      ...as.map(a=>[a.data,a.cod,a.faz,a.talhao,a.produto,a.ia,(a.moa||[]).join("+"),a.dose,a.calda,a.area??"",a.modal,a.equip,a.clima,a.estCana,a.estDan,a.resp,a.resultado,a.falha,a.avalData,a.custo??"",a.obs])]),"text/csv"); };
  $("#x-pdf").onclick=()=> window.print();
  $("#x-bkp").onclick=async()=>{ const fotos={}; const d=await IDB.open();
    const keys=await new Promise(ok=>{ const q=d.transaction("fotos").objectStore("fotos").getAllKeys(); q.onsuccess=()=>ok(q.result); q.onerror=()=>ok([]); });
    for(const k of keys){ const b=await IDB.get("fotos",k); if(b) fotos[k]=await new Promise(ok=>{ const r=new FileReader(); r.onload=()=>ok(r.result); r.readAsDataURL(b); }); }
    baixa(`backup_daninhas_${hojeISO()}.json`, JSON.stringify({app:"daninhas-da-cana",versao:1,gerado:new Date().toISOString(),vistorias:await IDB.all("vistorias"),aplicacoes:await IDB.all("aplicacoes"),fotos}),"application/json"); toast("Backup gerado"); };
  $("#x-imp").onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
    try{ const j=JSON.parse(await f.text()); if(j.app!=="daninhas-da-cana") throw 0;
      let nv=0, na=0, conf=0;
      for(const v of j.vistorias||[]){ const ex=await IDB.get("vistorias",v.id); if(ex && (ex.alterado||"")>(v.alterado||"")){ conf++; continue; } await IDB.put("vistorias",v); nv++; }
      for(const a of j.aplicacoes||[]){ const ex=await IDB.get("aplicacoes",a.id); if(ex && (ex.alterado||"")>(a.alterado||"")){ conf++; continue; } await IDB.put("aplicacoes",a); na++; }
      for(const [k,u] of Object.entries(j.fotos||{})){ if(!(await IDB.get("fotos",k))){ const b=await (await fetch(u)).blob(); await IDB.put("fotos",b,k); } }
      toast(`Restaurado: ${nv} vistorias, ${na} aplicações${conf?` (${conf} mais recentes mantidas)`:""}`); render(); }
    catch(_){ toast("Arquivo de backup inválido"); } e.target.value=""; };
};

/* ---------- Ampliar foto ---------- */
document.addEventListener("click", e=>{ const im=e.target.closest("img[data-zoom]"); if(!im) return; const z=$("#zoom"); $("img",z).src=im.dataset.zoom.startsWith("blob:")?im.dataset.zoom:im.currentSrc||im.src; z.hidden=false; });
$("#zoom").addEventListener("click", ()=> $("#zoom").hidden=true);

/* ---------- Off-line e instalação ---------- */
function updateOffline(){ $("#offlineBadge").classList.toggle("show",!navigator.onLine); }
addEventListener("online",updateOffline); addEventListener("offline",updateOffline); updateOffline();
if("serviceWorker" in navigator){ addEventListener("load",()=> navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).catch(()=>{})); }
if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{});
let deferredInstall=null; const installBtn=$("#openInstall"), sheet=$("#installSheet");
const INST_KEY="instalado:dan"; let jaInst=false; try{ jaInst=localStorage.getItem(INST_KEY)==="1"; }catch(_){}
if((matchMedia("(display-mode: standalone)").matches||navigator.standalone===true) && jaInst) installBtn.hidden=true;
addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredInstall=e; });
installBtn.addEventListener("click",async()=>{
  if(deferredInstall){ deferredInstall.prompt(); const r=await deferredInstall.userChoice; deferredInstall=null; if(r&&r.outcome==="accepted") installBtn.hidden=true; return; }
  if(matchMedia("(display-mode: standalone)").matches) $("#instTxt").innerHTML=`Esta tela abriu <b>dentro de outro app</b>. Abra o <b>Chrome pelo ícone dele</b>, digite <b style="word-break:break-all">${esc(location.href.split("#")[0])}</b> e toque em Instalar app.`;
  sheet.hidden=false; });
$("#closeInstall").addEventListener("click",()=> sheet.hidden=true);
sheet.addEventListener("click",e=>{ if(e.target===sheet) sheet.hidden=true; });
addEventListener("appinstalled",()=>{ installBtn.hidden=true; try{ localStorage.setItem(INST_KEY,"1"); }catch(_){} });

render();
