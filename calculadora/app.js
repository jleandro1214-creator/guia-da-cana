/* Calculadora da Cana — aplicativo (versão 2). Roda 100% no aparelho, sem servidor. */
"use strict";
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>[...el.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const fmt=(x,d=1)=>nfx(x,d);
const num=parseNum;
const hojeISO=()=>{ const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
const dataBR=iso=> iso ? iso.slice(0,10).split("-").reverse().join("/") : "—";
const dataHora=iso=> iso ? new Date(iso).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}) : "—";
const uid=()=> Date.now()*1000+Math.floor(Math.random()*1000);
function toast(t){ const el=$("#toast"); el.textContent=t; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>el.hidden=true,2600); }
const LS={ get(k,d){ try{ const v=localStorage.getItem("calc:"+k); return v===null?d:JSON.parse(v); }catch(_){ return d; } },
           set(k,v){ try{ localStorage.setItem("calc:"+k,JSON.stringify(v)); }catch(_){} } };

/* ---------- Banco local compartilhado do Guia da Cana (mesmo endereço = mesmo banco no aparelho) ---------- */
const STORES={fazendas:"cod",talhoes:"id",equipamentos:"cod",calculos:"id",abastecimentos:"id",colheitas:"id",planos:"id"};
const DB={ db:null,
  open(){ if(this.db) return Promise.resolve(this.db); return new Promise((ok,err)=>{ const r=indexedDB.open("guiaCana",1);
    r.onupgradeneeded=()=>{ const d=r.result; Object.entries(STORES).forEach(([s,k])=>{ if(!d.objectStoreNames.contains(s)) d.createObjectStore(s,{keyPath:k}); }); };
    r.onsuccess=()=>{ this.db=r.result; ok(this.db); }; r.onerror=()=>err(r.error); }); },
  async all(s){ const d=await this.open(); return new Promise(ok=>{ const q=d.transaction(s).objectStore(s).getAll(); q.onsuccess=()=>ok(q.result||[]); q.onerror=()=>ok([]); }); },
  async get(s,k){ const d=await this.open(); return new Promise(ok=>{ const q=d.transaction(s).objectStore(s).get(k); q.onsuccess=()=>ok(q.result??null); q.onerror=()=>ok(null); }); },
  async put(s,v){ const d=await this.open(); return new Promise((ok,err)=>{ const t=d.transaction(s,"readwrite"); t.objectStore(s).put(v); t.oncomplete=()=>ok(); t.onerror=()=>err(t.error); }); },
  async del(s,k){ const d=await this.open(); return new Promise(ok=>{ const t=d.transaction(s,"readwrite"); t.objectStore(s).delete(k); t.oncomplete=()=>ok(); t.onerror=()=>ok(); }); } };
const carimbo=r=>{ const agora=new Date().toISOString(); if(!r.criado) r.criado=agora; r.alterado=agora; return r; };

/* ---------- Fazenda e talhão ativos (mesmos campos da versão 1) ---------- */
const ctx=Object.assign({cod:"",faz:"",tal:""}, LS.get("local",{}));
const talId=(cod,tal)=> `${cod||"?"}|${String(tal||"").trim().toUpperCase()}`;
let TALHOES=[], EQUIP=[];
async function recarregaCadastros(){ TALHOES=await DB.all("talhoes"); EQUIP=await DB.all("equipamentos"); atualizaListas(); }
function atualizaListas(){
  $("#listaTalhoes").innerHTML=TALHOES.filter(t=>!ctx.cod||t.cod===ctx.cod).map(t=>`<option value="${esc(t.talhao)}">${t.area?fmt(t.area,2)+" ha":""}</option>`).join("");
  $("#listaEquip").innerHTML=EQUIP.map(e=>`<option value="${esc(e.cod)}">${esc(e.nome||"")}</option>`).join("");
}
const talhaoAtual=()=> TALHOES.find(t=>t.id===talId(ctx.cod,ctx.tal))||null;
function mostraCtx(){
  const t=talhaoAtual(), el=$("#ctxInfo");
  if(!ctx.tal){ el.innerHTML = ctx.faz ? `Fazenda ${esc(ctx.cod?ctx.cod+" — ":"")}${esc(ctx.faz)}` : "Informe a fazenda e o talhão para salvar os cálculos por área."; return; }
  el.innerHTML = t ? `✓ Talhão cadastrado: ${t.area?fmt(t.area,2)+" ha":"sem área"}${t.tipo?" · "+esc(t.tipo):""}${t.variedade?" · "+esc(t.variedade):""}`
                   : `Talhão ${esc(ctx.tal)} não cadastrado · <a href="#/cad/talhoes">cadastrar</a>`;
}
(function(){
  const cod=$("#codigo"), faz=$("#fazenda"), tal=$("#talhao");
  $("#listaFazendas").innerHTML=Object.entries(FAZENDAS).map(([c,n])=>`<option value="${esc(n)}">${c}</option>`).join("");
  const byName={}; Object.entries(FAZENDAS).forEach(([c,n])=>{ (byName[n.toUpperCase()] ||= []).push(c); });
  cod.value=ctx.cod; faz.value=ctx.faz; tal.value=ctx.tal;
  const salva=()=>{ ctx.cod=cod.value.trim(); ctx.faz=faz.value.trim(); ctx.tal=tal.value.trim(); LS.set("local",ctx); atualizaListas(); mostraCtx(); if(rota.nome==="m") atualizaAreaBtns(); };
  cod.addEventListener("input",()=>{ const c=cod.value.replace(/\D/g,""); if(c!==cod.value) cod.value=c; if(FAZENDAS[c]) faz.value=FAZENDAS[c]; salva(); });
  faz.addEventListener("input",()=>{ const cs=byName[faz.value.trim().toUpperCase()]; if(cs&&cs.length===1) cod.value=cs[0]; salva(); });
  tal.addEventListener("input",salva);
})();
const fazNome=c=> FAZENDAS[c]||"";

/* ---------- Roteador ---------- */
const ROTAS={}; const rota={nome:"",args:[]};
const go=h=>{ location.hash=h; };
async function render(){
  const h=location.hash.replace(/^#/,"")||"/"; const [_,r,...a]=h.split("/");
  rota.nome=r||"home"; rota.args=a.map(decodeURIComponent);
  const map={m:"m",hist:"hist",h:"hist",painel:"painel",registros:"registros",plan:"registros",abast:"registros",colh:"registros",cad:"registros",rel:"registros"};
  $$("nav.bottom a").forEach(x=> x.classList.toggle("on", x.dataset.r===(map[rota.nome]||rota.nome)));
  const fn=ROTAS[rota.nome]||ROTAS.home;
  $("#main").innerHTML=await fn(...rota.args);
  if(fn.after) await fn.after(...rota.args);
  if(!render.keep) scrollTo({top:0,behavior:"instant"}); render.keep=false;
}
addEventListener("hashchange",render);

/* ---------- Início ---------- */
ROTAS.home=async()=>{
  const planos=await DB.all("planos"); const pend=planos.filter(p=>!p.exec && p.data<=hojeISO()).length;
  const nh=(await DB.all("calculos")).length;
  return `<div class="sec-t" style="margin-top:4px">Cálculos</div>
  <div class="grid">${Object.entries(MODULOS).map(([k,m])=>`<a class="mod" href="#/m/${k}"><span class="e">${m.ic}</span><b>${m.nome}</b><small>${m.desc}</small></a>`).join("")}
    <a class="mod" href="#/hist"><span class="e">🗂️</span><b>Histórico de cálculos</b><small>${nh} cálculo(s) salvo(s) com memória</small></a></div>
  <div class="sec-t">Gestão</div>
  <div class="grid">
    <a class="mod" href="#/plan"><span class="e">📅</span><b>Planejamento diário</b><small>Plano x execução${pend?` · <b style="color:var(--warn)">${pend} pendente(s)</b>`:""}</small></a>
    <a class="mod" href="#/abast"><span class="e">⛽</span><b>Abastecimentos</b><small>Diesel por máquina, custo e consumo</small></a>
    <a class="mod" href="#/colh"><span class="e">🚜</span><b>Registros de colheita</b><small>Área, toneladas, horas e paradas</small></a>
    <a class="mod" href="#/painel"><span class="e">📊</span><b>Painel gerencial</b><small>Indicadores com filtros</small></a>
    <a class="mod" href="#/cad/talhoes"><span class="e">🗺️</span><b>Cadastros</b><small>Fazendas, talhões e equipamentos</small></a>
    <a class="mod" href="#/rel"><span class="e">📤</span><b>Relatórios e backup</b><small>PDF, Excel/CSV e cópia de segurança</small></a></div>
  <div class="info" style="margin-top:16px">Versão das fórmulas: <b>${CALC_VERSAO}</b>. Os dados ficam <b>só neste aparelho</b> — não há servidor de sincronização. Faça backup em Relatórios.</div>`;
};
ROTAS.registros=()=>`<h2 class="tit">Registros</h2><p class="sub">Tudo fica salvo no aparelho, mesmo sem internet.</p>
  <a class="item" href="#/plan"><div class="ic">📅</div><div class="t"><h4>Planejamento diário</h4><p>Metas do dia e o que foi realizado</p></div><div class="chev">›</div></a>
  <a class="item" href="#/abast"><div class="ic">⛽</div><div class="t"><h4>Abastecimentos de diesel</h4><p>Consumo e custo por equipamento</p></div><div class="chev">›</div></a>
  <a class="item" href="#/colh"><div class="ic">🚜</div><div class="t"><h4>Registros de colheita</h4><p>Planejado x realizado por talhão</p></div><div class="chev">›</div></a>
  <a class="item" href="#/cad/talhoes"><div class="ic">🗺️</div><div class="t"><h4>Cadastros</h4><p>Fazendas, talhões e equipamentos</p></div><div class="chev">›</div></a>
  <a class="item" href="#/rel"><div class="ic">📤</div><div class="t"><h4>Relatórios e backup</h4><p>Exportar PDF, CSV e cópia de segurança</p></div><div class="chev">›</div></a>`;

/* ---------- Módulos de cálculo ---------- */
const MODS=Object.keys(MODULOS);
let edicao=null;   /* {modo:"editar"|"duplicar", rec} */
function inputHTML(c,i,raw){
  const id=`${c.id}-${i.id}`, val=raw[i.id]??i.def??"";
  if(i.kind==="sel"){
    let opts=i.opts||[], labs=i.optLabels||opts;
    if(i.dyn){ const G=UNIDADES[raw.g||"area"]; opts=Object.keys(G.u); labs=Object.values(G.u).map(x=>x[0]); }
    const v = (i.dyn && !opts.includes(val)) ? (i.dyn==="de"?opts[0]:opts[1]||opts[0]) : val;
    return `<div class="${i.full?"full":""}"><label class="lb" for="${id}">${i.label}</label><select class="f" id="${id}" data-k="${i.id}">${i.opt&&!i.dyn?`<option value="">Não informado</option>`:""}${opts.map((o,n)=>`<option value="${esc(o)}"${o===v?" selected":""}>${esc(labs[n])}</option>`).join("")}</select></div>`;
  }
  if(i.kind==="txt") return `<div class="${i.full?"full":""}"><label class="lb" for="${id}">${i.label}${i.unit?` (${i.unit})`:""}</label><input class="f" id="${id}" data-k="${i.id}" value="${esc(val)}" autocomplete="off"></div>`;
  return `<div class="${i.full?"full":""}"><label class="lb" for="${id}">${i.label}${i.opt?" <small>(opcional)</small>":""}</label><div class="inp"><input id="${id}" data-k="${i.id}" inputmode="decimal" autocomplete="off" value="${esc(val)}"><span class="un">${i.unit||""}</span></div></div>`;
}
function resultadoHTML(c,out,quando){
  if(!out) return "";
  if(out.err) return `<div class="res">${out.err.map(t=>`<div class="erro">⚠ ${esc(t)}</div>`).join("")}</div>`;
  return `<div class="res">${out.rows.map(r=>`<div class="r${r.main?" main":""}"><span>${esc(r.label)}</span><b>${typeof r.val==="number"?fmt(r.val,r.dec):esc(r.val)}${r.unit?" "+esc(r.unit):""}</b></div>`).join("")}
    ${out.tag?`<div><span class="tag ${out.tag[1]}">${esc(out.tag[0])}</span></div>`:""}</div>
    ${(out.warn||[]).map(t=>`<div class="alerta">${esc(t)}</div>`).join("")}
    <details class="mem"><summary>Memória de cálculo</summary><ol>${out.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
      ${out.prem&&out.prem.length?`<b style="font-size:14px">Premissas</b><ul>${out.prem.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>`:""}
      <p style="font-size:13.5px;color:var(--soft);margin:6px 0 0">${quando?`Calculado em ${dataHora(quando)}`:""}${ctx.tal||ctx.faz?` · ${esc(ctx.faz||ctx.cod)}${ctx.tal?" / talhão "+esc(ctx.tal):""}`:""}</p></details>`;
}
ROTAS.m=(mod)=>{
  if(!MODULOS[mod]) mod="campo";
  const cs=CALCS.filter(c=>c.mod===mod);
  return `<nav class="tabs" id="tabs">${MODS.map(k=>`<a href="#/m/${k}" class="${k===mod?"on":""}">${MODULOS[k].ic} ${MODULOS[k].nome}</a>`).join("")}</nav>
    ${edicao?`<div class="edit-bar">${edicao.modo==="editar"?"✏️ Editando o cálculo salvo de "+dataHora(edicao.rec.quando)+". Ao salvar, a versão anterior fica guardada.":"📄 Cópia de um cálculo salvo. Ao salvar, vira um registro novo."} <button class="btn sec peq" id="cancEd" type="button">Cancelar</button></div>`:""}
    <div class="view" id="view">${cs.map(c=>{ const raw = (edicao&&edicao.rec.tipo===c.id) ? edicao.rec.raw : LS.get(c.id,{});
      return `<article class="calc" id="calc-${c.id}"><h3>${c.title}</h3><p class="desc">${c.desc}</p>
        <div class="fields">${c.inputs.map(i=>inputHTML(c,i,raw)).join("")}</div>
        <div class="out"></div>
        <div class="btns"><button class="btn" data-act="salvar" type="button">💾 Salvar</button><button class="btn sec" data-act="limpar" type="button">Limpar</button>
          <span data-area></span><a class="btn wa" data-act="wa" href="#" target="_blank" rel="noopener">📤 WhatsApp</a></div>
        <div class="salvarBox" hidden></div></article>`; }).join("")}</div>`;
};
const ultimo={};
function lerRaw(c){ const raw={}; c.inputs.forEach(i=>{ const el=$(`#${c.id}-${i.id}`); raw[i.id]=el?el.value:""; }); return raw; }
function textoWA(c,raw,out){
  const L=[`*Calculadora da Cana* — ${c.title}`,`Data: ${new Date().toLocaleString("pt-BR")}`,`Fazenda: ${ctx.cod?ctx.cod+" - ":""}${ctx.faz||"—"}`,`Talhão: ${ctx.tal||"—"}`,"","_Dados:_"];
  c.inputs.forEach(i=>{ const s=String(raw[i.id]||"").trim(); if(s) L.push(`• ${i.label}: ${i.kind==="sel"&&i.dyn?(UNIDADES[raw.g]?.u[s]?.[0]||s):s}${i.unit&&i.kind!=="sel"?" "+i.unit:""}`); });
  L.push("","_Resultado:_"); out.rows.forEach(r=>L.push(`• ${r.label}: ${typeof r.val==="number"?fmt(r.val,r.dec):r.val} ${r.unit||""}`)); if(out.tag) L.push("• "+out.tag[0]);
  L.push("","_Memória:_"); out.steps.forEach(s=>L.push("  "+s)); return L.join("\n");
}
function atualizaAreaBtns(){
  const t=talhaoAtual();
  CALCS.forEach(c=>{ const box=$(`#calc-${c.id} [data-area]`); if(!box) return; const ai=c.inputs.find(i=>i.area);
    box.innerHTML = (ai && t && t.area>0) ? `<button class="btn sec" type="button" data-usararea="${ai.id}">📐 Usar área do talhão (${fmt(t.area,2)} ha)</button>` : "";
    const b=box.querySelector("button"); if(b) b.onclick=()=>{ const el=$(`#${c.id}-${ai.id}`); el.value=String(t.area).replace(".",","); el.dispatchEvent(new Event("input",{bubbles:true})); toast("Área do talhão aplicada — confira o valor"); }; });
}
ROTAS.m.after=(mod)=>{
  if(!MODULOS[mod]) mod="campo";
  const cancel=$("#cancEd"); if(cancel) cancel.onclick=()=>{ edicao=null; render(); };
  CALCS.filter(c=>c.mod===mod).forEach(c=>{
    const box=$("#calc-"+c.id), out=$(".out",box), wa=$('[data-act="wa"]',box);
    const run=()=>{ const raw=lerRaw(c); if(!(edicao&&edicao.rec.tipo===c.id)) LS.set(c.id,raw);
      const tem=c.inputs.some(i=>i.kind!=="sel" && String(raw[i.id]||"").trim() && String(raw[i.id]).trim()!==String(i.def??"")) || c.id==="unid"&&String(raw.x||"").trim();
      if(!tem && !(edicao&&edicao.rec.tipo===c.id)){ out.innerHTML=`<div class="res"><span style="color:var(--soft);font-size:15px">Preencha os campos para ver o resultado.</span></div>`; ultimo[c.id]=null; wa.style.display="none"; return; }
      const res=calcular(c,raw); const quando=new Date().toISOString(); ultimo[c.id]=res.err?null:{raw,out:res,quando};
      out.innerHTML=resultadoHTML(c,res,quando);
      wa.style.display=res.err?"none":""; if(!res.err) wa.href="https://wa.me/?text="+encodeURIComponent(textoWA(c,raw,res)); };
    box.addEventListener("input",e=>{ if(e.target.dataset.k==="g"){ const G=UNIDADES[e.target.value]; const ks=Object.keys(G.u);
        [["de",0],["para",1]].forEach(([k,n])=>{ const s=$(`#${c.id}-${k}`); s.innerHTML=ks.map((u,j)=>`<option value="${u}"${j===n?" selected":""}>${esc(G.u[u][0])}</option>`).join(""); }); }
      run(); });
    $('[data-act="limpar"]',box).onclick=()=>{ c.inputs.forEach(i=>{ const el=$(`#${c.id}-${i.id}`); if(i.kind==="sel"&&!i.dyn) el.value=i.def??""; else if(i.kind!=="sel") el.value=i.def??""; }); run(); };
    wa.onclick=async ev=>{ if(!ultimo[c.id]){ ev.preventDefault(); return; } if(navigator.share){ ev.preventDefault(); try{ await navigator.share({text:textoWA(c,ultimo[c.id].raw,ultimo[c.id].out)}); }catch(_){} } };
    $('[data-act="salvar"]',box).onclick=()=>abrirSalvar(c,box);
    run(); });
  atualizaAreaBtns();
  /* arrastar para trocar de módulo */
  const i=MODS.indexOf(mod); let sx=0,sy=0,st=0,on=false,hz=null; const v=$("#view");
  $("#main").ontouchstart=e=>{ on=e.touches.length===1 && !e.target.closest("input,select,textarea,details,nav.tabs"); if(!on) return; sx=e.touches[0].clientX; sy=e.touches[0].clientY; st=Date.now(); hz=null; };
  $("#main").ontouchmove=e=>{ if(!on) return; const dx=e.touches[0].clientX-sx, dy=e.touches[0].clientY-sy; if(hz===null&&(Math.abs(dx)>5||Math.abs(dy)>5)) hz=Math.abs(dx)>Math.abs(dy)*0.9; if(hz) v.style.transform=`translateX(${((dx>0&&i===0)||(dx<0&&i===MODS.length-1))?dx*0.25:dx}px)`; };
  $("#main").ontouchend=e=>{ if(!on) return; on=false; v.style.transform=""; const dx=e.changedTouches[0].clientX-sx, fast=Math.abs(dx)/Math.max(1,Date.now()-st)>0.2;
    if(!hz||(Math.abs(dx)<28&&!(fast&&Math.abs(dx)>12))) return; const j=dx<0?i+1:i-1; if(j<0||j>=MODS.length) return; go("#/m/"+MODS[j]); };
};
function abrirSalvar(c,box){
  const u=ultimo[c.id], sb=$(".salvarBox",box);
  if(!u){ toast("Corrija os dados antes de salvar"); return; }
  if(!ctx.tal && !ctx.faz) toast("Dica: informe fazenda e talhão no topo para achar o cálculo depois");
  const ed=edicao&&edicao.rec.tipo===c.id&&edicao.modo==="editar" ? edicao.rec : null;
  sb.hidden=false;
  sb.innerHTML=`<div class="card" style="margin:12px 0 0;background:var(--tint)"><b>Conferir antes de salvar</b>
    <p style="margin:6px 0;font-size:15px">${esc(ctx.faz||ctx.cod||"Sem fazenda")} · Talhão ${esc(ctx.tal||"—")} · ${u.out.rows.filter(r=>r.main).map(r=>`${esc(r.label)}: <b>${typeof r.val==="number"?fmt(r.val,r.dec):esc(r.val)} ${esc(r.unit)}</b>`).join(" · ")}</p>
    <div class="fields"><div><label class="lb" for="sv-resp-${c.id}">Responsável</label><input class="f" id="sv-resp-${c.id}" value="${esc(ed?ed.resp:LS.get("resp",""))}"></div>
      <div class="full"><label class="lb" for="sv-obs-${c.id}">Observações</label><textarea class="f" id="sv-obs-${c.id}">${esc(ed?ed.obs:"")}</textarea></div></div>
    <div class="btns"><button class="btn" type="button" data-ok>✔ ${ed?"Salvar alteração":"Salvar no histórico"}</button><button class="btn sec" type="button" data-canc>Voltar</button></div></div>`;
  $("[data-canc]",sb).onclick=()=>{ sb.hidden=true; };
  $("[data-ok]",sb).onclick=async()=>{
    const resp=$(`#sv-resp-${c.id}`).value.trim(), obs=$(`#sv-obs-${c.id}`).value.trim(); LS.set("resp",resp);
    const base={tipo:c.id,titulo:c.title,mod:c.mod,cod:ctx.cod,faz:ctx.faz||fazNome(ctx.cod),talhao:ctx.tal,resp,obs,quando:u.quando,raw:u.raw,
      rows:u.out.rows.map(r=>({label:r.label,val:r.val,unit:r.unit,dec:r.dec,main:r.main})),steps:u.out.steps,prem:u.out.prem||[],warn:u.out.warn||[],tag:u.out.tag||null,versaoFormulas:CALC_VERSAO};
    let rec;
    if(ed){ const ant=await DB.get("calculos",ed.id); const {versoes,...snap}=ant; rec={...ant,...base,versoes:[...(ant.versoes||[]),{...snap,substituidoEm:new Date().toISOString()}],versao:(ant.versao||1)+1}; }
    else rec={id:uid(),...base,versao:1,versoes:[]};
    await DB.put("calculos",carimbo(rec)); edicao=null; toast(ed?"Alteração salva (versão anterior guardada)":"Cálculo salvo no histórico"); go("#/h/"+rec.id);
  };
  sb.scrollIntoView({behavior:"smooth",block:"nearest"});
}

/* ---------- Histórico de cálculos ---------- */
const filH=Object.assign({mod:"",de:"",ate:"",q:""},LS.get("filH",{}));
ROTAS.hist=async()=>{
  let hs=(await DB.all("calculos")).sort((a,b)=>b.quando.localeCompare(a.quando));
  hs=hs.filter(h=>(!filH.mod||h.mod===filH.mod)&&(!filH.de||h.quando.slice(0,10)>=filH.de)&&(!filH.ate||h.quando.slice(0,10)<=filH.ate)&&(!filH.q||norm(`${h.cod} ${h.faz} ${h.talhao} ${h.titulo} ${h.resp}`).includes(norm(filH.q))));
  return `<h2 class="tit">Histórico de cálculos</h2>
    <div class="chips">${[["","Todos"],...MODS.map(k=>[k,MODULOS[k].nome])].map(([k,t])=>`<button class="chip${filH.mod===k?" on":""}" data-mod="${k}">${t}</button>`).join("")}</div>
    <div class="card"><div class="fields"><div class="full"><label class="lb" for="hq">Fazenda, talhão, cálculo ou responsável</label><input class="f" id="hq" value="${esc(filH.q)}" type="search"></div>
      <div><label class="lb" for="hde">De</label><input class="f" type="date" id="hde" value="${filH.de}"></div><div><label class="lb" for="hate">Até</label><input class="f" type="date" id="hate" value="${filH.ate}"></div></div></div>
    ${hs.length?hs.map(h=>{ const m=h.rows.find(r=>r.main)||h.rows[0]; return `<a class="item" href="#/h/${h.id}"><div class="ic">${MODULOS[h.mod]?.ic||"🧮"}</div><div class="t"><h4>${esc(h.titulo)}</h4>
      <p>${dataHora(h.quando)} · ${esc(h.faz||h.cod||"sem fazenda")}${h.talhao?" / "+esc(h.talhao):""}</p><p>${m?esc(m.label)+": <b>"+(typeof m.val==="number"?fmt(m.val,m.dec):esc(m.val))+" "+esc(m.unit)+"</b>":""}${h.versao>1?` · <span class="tag mid">v${h.versao}</span>`:""}</p></div><div class="chev">›</div></a>`; }).join("")
      :`<div class="vazio">Nenhum cálculo salvo com esses filtros.<br>Use o botão <b>💾 Salvar</b> em qualquer cálculo.</div>`}`;
};
ROTAS.hist.after=()=>{
  $$("[data-mod]").forEach(b=>b.onclick=()=>{ filH.mod=b.dataset.mod; LS.set("filH",filH); render.keep=true; render(); });
  $("#hq").oninput=e=>{ filH.q=e.target.value; LS.set("filH",filH); clearTimeout(ROTAS.hist.t); ROTAS.hist.t=setTimeout(async()=>{ render.keep=true; await render(); const q=$("#hq"); q.focus(); q.setSelectionRange(q.value.length,q.value.length); },350); };
  $("#hde").onchange=e=>{ filH.de=e.target.value; LS.set("filH",filH); render.keep=true; render(); };
  $("#hate").onchange=e=>{ filH.ate=e.target.value; LS.set("filH",filH); render.keep=true; render(); };
};
function memoriaHTML(h){
  const c=CALCS.find(x=>x.id===h.tipo);
  const entradas=(c?c.inputs:[]).filter(i=>String(h.raw[i.id]??"").trim()).map(i=>{ let v=h.raw[i.id]; if(i.dyn) v=UNIDADES[h.raw.g]?.u[v]?.[0]||v; if(i.id==="g") v=UNIDADES[v]?.nome||v; return `<tr><td>${esc(i.label)}</td><td class="n">${esc(v)} ${i.kind!=="sel"?esc(i.unit||""):""}</td></tr>`; }).join("");
  return `<dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:8px 0 12px;font-size:15.5px">
      <dt style="color:var(--soft);font-weight:700">Operação</dt><dd style="margin:0">${esc(h.titulo)}</dd>
      <dt style="color:var(--soft);font-weight:700">Fazenda</dt><dd style="margin:0">${esc(h.cod?h.cod+" — ":"")}${esc(h.faz||"—")}</dd>
      <dt style="color:var(--soft);font-weight:700">Talhão</dt><dd style="margin:0">${esc(h.talhao||"—")}</dd>
      <dt style="color:var(--soft);font-weight:700">Data e hora</dt><dd style="margin:0">${dataHora(h.quando)}</dd>
      <dt style="color:var(--soft);font-weight:700">Responsável</dt><dd style="margin:0">${esc(h.resp||"—")}</dd>
      <dt style="color:var(--soft);font-weight:700">Fórmulas</dt><dd style="margin:0">versão ${esc(h.versaoFormulas||"—")}</dd></dl>
    <h4 style="margin:10px 0 4px">Valores informados</h4><table class="t">${entradas}</table>
    <h4 style="margin:14px 0 4px">Fórmula e etapas</h4><ol style="padding-left:22px;line-height:1.5;font-variant-numeric:tabular-nums">${h.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
    <h4 style="margin:14px 0 4px">Resultado</h4><table class="t">${h.rows.map(r=>`<tr><td>${r.main?"<b>":""}${esc(r.label)}${r.main?"</b>":""}</td><td class="n"><b>${typeof r.val==="number"?fmt(r.val,r.dec):esc(r.val)}</b> ${esc(r.unit)}</td></tr>`).join("")}</table>
    ${h.tag?`<p><span class="tag ${h.tag[1]}">${esc(h.tag[0])}</span></p>`:""}
    ${h.warn&&h.warn.length?h.warn.map(t=>`<div class="alerta">${esc(t)}</div>`).join(""):""}
    ${h.prem&&h.prem.length?`<h4 style="margin:14px 0 4px">Premissas</h4><ul style="padding-left:22px">${h.prem.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>`:""}
    ${h.obs?`<h4 style="margin:14px 0 4px">Observações</h4><p>${esc(h.obs)}</p>`:""}`;
}
ROTAS.h=async(id)=>{
  const h=await DB.get("calculos",Number(id)); if(!h) return `<div class="vazio">Cálculo não encontrado.</div>`;
  return `<div class="printonly"><h2>Calculadora da Cana — memória de cálculo</h2><p>Relatório gerado em ${new Date().toLocaleString("pt-BR")}</p></div>
  <div class="card"><h2 class="tit" style="margin:0">${esc(h.titulo)}</h2><p class="sub" style="margin:4px 0 0">Registro nº ${h.id} · versão ${h.versao||1}${h.versao>1?` · alterado em ${dataHora(h.alterado)}`:""}</p>${memoriaHTML(h)}</div>
  ${(h.versoes||[]).length?`<div class="card"><h3>Versões anteriores (${h.versoes.length})</h3>${h.versoes.slice().reverse().map((v,n)=>`<details class="mem"><summary>Versão de ${dataHora(v.quando)} — substituída em ${dataHora(v.substituidoEm)}</summary>${memoriaHTML(v)}</details>`).join("")}</div>`:""}
  <div class="btns"><button class="btn" id="hEd">✏️ Editar</button><button class="btn sec" id="hDup">📄 Duplicar</button><button class="btn sec" id="hPrint">🖨️ PDF</button>
    <a class="btn wa" id="hWa" href="#" target="_blank" rel="noopener">📤 WhatsApp</a><button class="btn sec" id="hDel">🗑️ Excluir</button></div>`;
};
ROTAS.h.after=async(id)=>{
  const h=await DB.get("calculos",Number(id)); if(!h) return; const c=CALCS.find(x=>x.id===h.tipo);
  const abrir=modo=>{ edicao={modo,rec:h}; if(modo==="editar"||modo==="duplicar"){ ctx.cod=h.cod||""; ctx.faz=h.faz||""; ctx.tal=h.talhao||""; $("#codigo").value=ctx.cod; $("#fazenda").value=ctx.faz; $("#talhao").value=ctx.tal; LS.set("local",ctx); mostraCtx(); } go("#/m/"+h.mod); setTimeout(()=>{ const el=$("#calc-"+h.tipo); if(el) el.scrollIntoView({block:"start"}); },120); };
  $("#hEd").onclick=()=>abrir("editar"); $("#hDup").onclick=()=>abrir("duplicar"); $("#hPrint").onclick=()=>print();
  if(c){ const t=textoWA(c,h.raw,{rows:h.rows,tag:h.tag,steps:h.steps}); $("#hWa").href="https://wa.me/?text="+encodeURIComponent(t); }
  const del=$("#hDel"); del.onclick=async()=>{ if(del.dataset.ok!=="1"){ del.dataset.ok="1"; del.textContent="Toque de novo para confirmar"; return; } await DB.del("calculos",h.id); toast("Cálculo excluído"); go("#/hist"); };
};

/* ---------- Formulário genérico de registros ---------- */
function campo(f,rec){
  const id="r-"+f.k, v=rec[f.k]??f.def??"";
  const lab=`<label class="lb" for="${id}">${f.l}${f.u?` (${f.u})`:""}${f.req?" *":""}</label>`;
  let ctl;
  if(f.t==="sel") ctl=`<select class="f" id="${id}"><option value="">Não informado</option>${f.o.map(o=>`<option${o===v?" selected":""}>${esc(o)}</option>`).join("")}</select>`;
  else if(f.t==="area") ctl=`<textarea class="f" id="${id}">${esc(v)}</textarea>`;
  else ctl=`<input class="f" id="${id}" type="${f.t==="date"?"date":f.t==="time"?"time":"text"}" ${f.t==="num"?'inputmode="decimal"':""} ${f.list?`list="${f.list}"`:""} value="${esc(f.t==="num"&&typeof v==="number"?String(v).replace(".",","):v)}" autocomplete="off">`;
  return `<div class="${f.full?"full":""}">${lab}${ctl}</div>`;
}
function lerCampos(fs){ const o={}, err=[];
  fs.forEach(f=>{ const s=$("#r-"+f.k).value.trim();
    if(f.t==="num"){ if(!s){ o[f.k]=null; if(f.req) err.push(`Preencha: ${f.l}.`); return; } const x=num(s); if(!isFinite(x)) err.push(`${f.l}: número inválido.`); else if(x<0) err.push(`${f.l} não pode ser negativo.`); o[f.k]=x; }
    else { o[f.k]=s; if(f.req&&!s) err.push(`Preencha: ${f.l}.`); } });
  return {o,err}; }
const LOC=[{k:"cod",l:"Código fazenda"},{k:"faz",l:"Fazenda",list:"listaFazendas"},{k:"talhao",l:"Talhão",list:"listaTalhoes",req:true}];
function ligaLocal(){ const c=$("#r-cod"), f=$("#r-faz"); if(!c||!f) return;
  c.addEventListener("input",()=>{ const k=c.value.replace(/\D/g,""); c.value=k; if(FAZENDAS[k]) f.value=FAZENDAS[k]; }); }
function prefLocal(r){ return Object.assign({cod:ctx.cod,faz:ctx.faz,talhao:ctx.tal},r); }
async function formRegistro({store,id,titulo,campos,depois,voltar,calc}){
  const rec = id&&id!=="novo" ? await DB.get(store,Number(id)) : null;
  const r = rec || prefLocal({data:hojeISO(),resp:LS.get("resp","")});
  return {html:`<h2 class="tit">${rec?"Editar":"Novo"}: ${titulo}</h2><form class="card" id="fr" autocomplete="off"><div class="fields">${campos.map(f=>campo(f,r)).join("")}</div>
    <div id="frCalc"></div><div class="btns"><button class="btn" type="submit">💾 Salvar</button>${rec?`<button class="btn sec" type="button" id="frDup">📄 Duplicar</button><button class="btn sec" type="button" id="frDel">🗑️ Excluir</button>`:""}<a class="btn sec" href="${voltar}">Voltar</a></div></form>`,
    after:()=>{ ligaLocal(); const form=$("#fr");
      const atualiza=()=>{ if(!calc) return; const {o}=lerCampos(campos); $("#frCalc").innerHTML=calc(o); }; form.addEventListener("input",atualiza); atualiza();
      form.onsubmit=async e=>{ e.preventDefault(); const {o,err}=lerCampos(campos); if(err.length){ toast(err[0]); return; }
        const novo=carimbo({...(rec||{id:uid()}),...o,faz:o.faz||fazNome(o.cod)}); if(o.resp) LS.set("resp",o.resp);
        await DB.put(store,novo); toast("Salvo neste aparelho"); go(depois(novo)); };
      const dup=$("#frDup"); if(dup) dup.onclick=async()=>{ const {o}=lerCampos(campos); const n=carimbo({...o,id:uid(),data:hojeISO()}); await DB.put(store,n); toast("Cópia criada"); go(voltar.replace("#","#")+"/"+n.id); };
      const del=$("#frDel"); if(del) del.onclick=async()=>{ if(del.dataset.ok!=="1"){ del.dataset.ok="1"; del.textContent="Toque de novo para excluir"; return; } await DB.del(store,rec.id); toast("Excluído"); go(voltar); }; }};
}
const resBox=rows=> rows.length?`<div class="res">${rows.map(([a,b,m])=>`<div class="r${m?" main":""}"><span>${a}</span><b>${b}</b></div>`).join("")}</div>`:"";

/* ---------- Abastecimentos de diesel ---------- */
const CAMPOS_AB=[{k:"data",l:"Data",t:"date",req:true},{k:"equip",l:"Equipamento (código)",list:"listaEquip",req:true},...LOC,
  {k:"oper",l:"Operação",list:"listaOper"},{k:"resp",l:"Responsável"},{k:"h0",l:"Horímetro inicial",u:"h",t:"num"},{k:"h1",l:"Horímetro final",u:"h",t:"num"},
  {k:"litros",l:"Litros abastecidos",u:"L",t:"num",req:true},{k:"preco",l:"Preço do diesel",u:"R$/L",t:"num"},{k:"area",l:"Área trabalhada",u:"ha",t:"num"},{k:"obs",l:"Observações",t:"area",full:true}];
function metAb(a){ const hs=(a.h0!=null&&a.h1!=null&&a.h1>a.h0)?a.h1-a.h0:null; return {hs, lh:hs?a.litros/hs:null, lha:a.area>0?a.litros/a.area:null, custo:a.preco>0?a.litros*a.preco:null}; }
ROTAS.abast=async(id)=>{
  if(id){ const f=await formRegistro({store:"abastecimentos",id,titulo:"abastecimento",campos:CAMPOS_AB,voltar:"#/abast",depois:()=>"#/abast",
      calc:o=>{ const m=metAb(o); const rows=[]; if(o.h0!=null&&o.h1!=null&&o.h1<=o.h0) return `<div class="alerta">O horímetro final precisa ser maior que o inicial.</div>`;
        if(m.hs) rows.push(["Horas",fmt(m.hs,1)+" h"],["Consumo por hora",fmt(m.lh,1)+" L/h",1]); if(m.lha) rows.push(["Consumo por hectare",fmt(m.lha,1)+" L/ha"]);
        if(m.custo) rows.push(["Custo",`R$ ${fmt(m.custo,2)}`]); if(m.custo&&m.hs) rows.push(["Custo por hora",`R$ ${fmt(m.custo/m.hs,2)}`]); if(m.custo&&o.area>0) rows.push(["Custo por hectare",`R$ ${fmt(m.custo/o.area,2)}`]);
        const eq=EQUIP.find(e=>e.cod===o.equip); let av=""; if(eq&&eq.padraoLh>0&&m.lh&&m.lh>eq.padraoLh*1.15) av=`<div class="alerta">Acima do padrão do equipamento (${fmt(eq.padraoLh,1)} L/h). Antes de concluir, considere operação, carga, terreno e conferência do horímetro.</div>`;
        return resBox(rows)+av; }});
    ROTAS.abast.after=f.after; return f.html; }
  ROTAS.abast.after=null;
  const as=(await DB.all("abastecimentos")).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  const porEq={}; as.forEach(a=>{ const e=(porEq[a.equip] ||= {l:0,lh:0,h:0,area:0,lArea:0,custo:0,n:0}); const m=metAb(a); e.n++; e.l+=a.litros||0; if(m.hs){ e.h+=m.hs; e.lh+=a.litros; } if(a.area>0){ e.area+=a.area; e.lArea+=a.litros; } if(m.custo) e.custo+=m.custo; });
  return `<h2 class="tit">Abastecimentos de diesel</h2><div class="btns" style="margin-top:0"><a class="btn" href="#/abast/novo">➕ Novo abastecimento</a><a class="btn sec" href="#/cad/equip">🚜 Equipamentos</a></div>
    ${Object.keys(porEq).length?`<div class="card" style="margin-top:14px"><h3>Por equipamento</h3><div class="tw"><table class="t"><tr><th>Equip.</th><th>Litros</th><th>L/h</th><th>Padrão</th><th>L/ha</th><th>Custo</th></tr>
      ${Object.entries(porEq).map(([k,e])=>{ const eq=EQUIP.find(x=>x.cod===k); const lh=e.h?e.lh/e.h:null; const alto=eq&&eq.padraoLh>0&&lh&&lh>eq.padraoLh*1.15;
        return `<tr><td>${esc(k)}${eq&&eq.nome?`<br><small>${esc(eq.nome)}</small>`:""}</td><td class="n">${fmt(e.l,0)}</td><td class="n">${lh?fmt(lh,1):"—"}${alto?" ⚠":""}</td><td class="n">${eq&&eq.padraoLh?fmt(eq.padraoLh,1):"—"}</td><td class="n">${e.area?fmt(e.lArea/e.area,1):"—"}</td><td class="n">${e.custo?"R$ "+fmt(e.custo,0):"—"}</td></tr>`; }).join("")}</table></div>
      <p style="font-size:13.5px;color:var(--soft)">⚠ = mais de 15% acima do padrão cadastrado. É um sinal para conferir, não prova de ineficiência: operação, carga, terreno e qualidade dos dados mudam o consumo.</p></div>`:""}
    ${as.length?as.map(a=>{ const m=metAb(a); return `<a class="item" href="#/abast/${a.id}"><div class="ic">⛽</div><div class="t"><h4>${esc(a.equip)} · ${fmt(a.litros,0)} L</h4><p>${dataBR(a.data)} · ${esc(a.faz||a.cod||"")}${a.talhao?" / "+esc(a.talhao):""}${a.oper?" · "+esc(a.oper):""}</p><p>${m.lh?fmt(m.lh,1)+" L/h":""}${m.lha?" · "+fmt(m.lha,1)+" L/ha":""}${m.custo?" · R$ "+fmt(m.custo,2):""}</p></div><div class="chev">›</div></a>`; }).join("")
      :`<div class="vazio">Nenhum abastecimento registrado.</div>`}`;
};

/* ---------- Registros de colheita ---------- */
const CAMPOS_CO=[{k:"data",l:"Data",t:"date",req:true},...LOC,{k:"equipe",l:"Frente / equipe"},{k:"equip",l:"Colhedora (código)",list:"listaEquip"},{k:"resp",l:"Responsável"},
  {k:"ap",l:"Área planejada",u:"ha",t:"num"},{k:"ac",l:"Área colhida",u:"ha",t:"num",req:true},{k:"tp",l:"Toneladas previstas",u:"t",t:"num"},{k:"tr",l:"Toneladas colhidas",u:"t",t:"num"},
  {k:"orig",l:"Origem das toneladas",t:"sel",o:["Pesagem (balança)","Estimativa"]},{k:"hp",l:"Horas produtivas",u:"h",t:"num"},{k:"hpar",l:"Horas paradas",u:"h",t:"num"},{k:"motivo",l:"Motivo das paradas"},{k:"obs",l:"Observações",t:"area",full:true}];
function metCo(c){ return {tch:c.tr>0&&c.ac>0?c.tr/c.ac:null, pa:c.ap>0?c.ac/c.ap*100:null, pt:c.tp>0&&c.tr>0?c.tr/c.tp*100:null, hah:c.hp>0?c.ac/c.hp:null, th:c.hp>0&&c.tr>0?c.tr/c.hp:null}; }
ROTAS.colh=async(id)=>{
  if(id){ const f=await formRegistro({store:"colheitas",id,titulo:"registro de colheita",campos:CAMPOS_CO,voltar:"#/colh",depois:()=>"#/colh",
      calc:o=>{ const m=metCo(o), rows=[]; if(m.pa!=null) rows.push(["Execução da área",fmt(m.pa,1)+" %",1]); if(m.tch) rows.push([`TCH ${o.orig==="Pesagem (balança)"?"(pesagem)":"(estimado)"}`,fmt(m.tch,1)+" t/ha"]);
        if(m.pt!=null) rows.push(["Execução das toneladas",fmt(m.pt,1)+" %"],["Realizado − previsto",fmt(o.tr-o.tp,0)+" t"]); if(m.hah) rows.push(["Área por hora",fmt(m.hah,2)+" ha/h"]); if(m.th) rows.push(["Toneladas por hora",fmt(m.th,1)+" t/h"]);
        if(o.hp>0&&o.hpar!=null) rows.push(["Aproveitamento do tempo",fmt(o.hp/(o.hp+o.hpar)*100,1)+" %"]); return resBox(rows); }});
    ROTAS.colh.after=f.after; return f.html; }
  ROTAS.colh.after=null;
  const cs=(await DB.all("colheitas")).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  return `<h2 class="tit">Registros de colheita</h2><div class="btns" style="margin-top:0"><a class="btn" href="#/colh/novo">➕ Novo registro</a></div><div style="height:12px"></div>
    ${cs.length?cs.map(c=>{ const m=metCo(c); return `<a class="item" href="#/colh/${c.id}"><div class="ic">🚜</div><div class="t"><h4>${esc(c.faz||c.cod)} · Talhão ${esc(c.talhao)}</h4><p>${dataBR(c.data)} · ${fmt(c.ac,1)} ha colhidos${c.tr?` · ${fmt(c.tr,0)} t ${c.orig==="Pesagem (balança)"?"(pesagem)":"(estimativa)"}`:""}</p><p>${m.tch?"TCH "+fmt(m.tch,1):""}${m.pa!=null?" · meta área "+fmt(m.pa,0)+"%":""}${c.hpar?" · "+fmt(c.hpar,1)+" h paradas":""}</p></div><div class="chev">›</div></a>`; }).join("")
      :`<div class="vazio">Nenhum registro de colheita.</div>`}`;
};

/* ---------- Planejamento diário ---------- */
const CAMPOS_PL=[{k:"data",l:"Data",t:"date",req:true},...LOC,{k:"oper",l:"Operação",list:"listaOper",req:true},{k:"equip",l:"Equipamento",list:"listaEquip"},{k:"resp",l:"Responsável"},
  {k:"meta",l:"Meta",t:"num"},{k:"metaU",l:"Unidade da meta",t:"sel",o:["ha","t"]},{k:"ini",l:"Início previsto",t:"time"},{k:"fim",l:"Término previsto",t:"time"},{k:"recursos",l:"Recursos necessários",full:true},{k:"obs",l:"Observações",t:"area",full:true},
  {k:"_sep",l:"— Execução (preencha depois) —"},
  {k:"iniR",l:"Início real",t:"time"},{k:"fimR",l:"Término real",t:"time"},{k:"areaR",l:"Área realizada",u:"ha",t:"num"},{k:"prodR",l:"Produção realizada",u:"t",t:"num"},
  {k:"diesel",l:"Diesel consumido",u:"L",t:"num"},{k:"parada",l:"Tempo de parada",u:"h",t:"num"},{k:"motivo",l:"Motivo das paradas"},{k:"pend",l:"Pendências",full:true},{k:"obsEnc",l:"Observações do encarregado",t:"area",full:true}];
const minutos=t=>{ if(!t) return null; const [h,m]=t.split(":").map(Number); return h*60+m; };
function metPl(p){ const real = p.metaU==="t" ? p.prodR : p.areaR; const exec=[p.iniR,p.fimR,p.areaR,p.prodR,p.diesel].some(x=>x!=null&&x!==""); const pc=p.meta>0&&real!=null?real/p.meta*100:null;
  const dPrev=(minutos(p.fim)!=null&&minutos(p.ini)!=null)?minutos(p.fim)-minutos(p.ini):null, dReal=(minutos(p.fimR)!=null&&minutos(p.iniR)!=null)?minutos(p.fimR)-minutos(p.iniR):null;
  return {real,exec,pc,dPrev,dReal,status: exec?"Executado":(p.data<hojeISO()?"Pendente":"Planejado")}; }
ROTAS.plan=async(id)=>{
  if(id){ const campos=CAMPOS_PL.filter(f=>f.k!=="_sep");
    const f=await formRegistro({store:"planos",id,titulo:"planejamento",campos,voltar:"#/plan",depois:()=>"#/plan",
      calc:o=>{ const m=metPl(o), rows=[]; if(m.pc!=null) rows.push(["Cumprimento da meta",fmt(m.pc,1)+" %",1],["Realizado − meta",fmt(m.real-o.meta,1)+" "+(o.metaU||"")]);
        if(m.dPrev!=null&&m.dReal!=null) rows.push(["Duração prevista x real",`${fmt(m.dPrev/60,1)} h x ${fmt(m.dReal/60,1)} h`]); if(o.diesel>0&&o.areaR>0) rows.push(["Diesel por hectare",fmt(o.diesel/o.areaR,1)+" L/ha"]);
        if(o.meta>0&&!o.metaU) return `<div class="alerta">Escolha a unidade da meta (ha ou t) para comparar com o realizado.</div>`; return resBox(rows); }});
    f.html=f.html.replace(`<div class=""><label class="lb" for="r-iniR">`,`<div class="full"><b style="color:var(--accent-strong)">Execução — preencha depois da operação</b></div><div class=""><label class="lb" for="r-iniR">`);
    ROTAS.plan.after=f.after; return f.html; }
  ROTAS.plan.after=null;
  const ps=(await DB.all("planos")).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  return `<h2 class="tit">Planejamento diário</h2><div class="btns" style="margin-top:0"><a class="btn" href="#/plan/novo">➕ Planejar operação</a></div><div style="height:12px"></div>
    ${ps.length?ps.map(p=>{ const m=metPl(p); return `<a class="item" href="#/plan/${p.id}"><div class="ic">${m.status==="Executado"?"✅":m.status==="Pendente"?"⏳":"📅"}</div><div class="t"><h4>${esc(p.oper)} · ${esc(p.faz||p.cod)} / ${esc(p.talhao)}</h4>
      <p>${dataBR(p.data)} · <b style="color:${m.status==="Pendente"?"var(--warn)":"inherit"}">${m.status}</b>${p.equip?" · "+esc(p.equip):""}</p><p>Meta ${p.meta!=null?fmt(p.meta,1)+" "+esc(p.metaU||""):"—"}${m.pc!=null?` · cumprido <b>${fmt(m.pc,0)}%</b>`:""}</p></div><div class="chev">›</div></a>`; }).join("")
      :`<div class="vazio">Nenhuma operação planejada.</div>`}`;
};

/* ---------- Cadastros ---------- */
ROTAS.cad=async(aba="talhoes",id)=>{
  const tabs=`<div class="chips">${[["talhoes","🗺️ Talhões"],["fazendas","🏡 Fazendas"],["equip","🚜 Equipamentos"]].map(([k,t])=>`<a class="chip${aba===k?" on":""}" href="#/cad/${k}">${t}</a>`).join("")}</div>`;
  if(aba==="fazendas"){ const fs=await DB.all("fazendas"); const ed=id?fs.find(f=>f.cod===id):null; const r=ed||{cod:ctx.cod,nome:ctx.faz};
    return `<h2 class="tit">Cadastros</h2>${tabs}<p class="sub">As ${Object.keys(FAZENDAS).length} fazendas da planilha já estão disponíveis pelo código. Aqui você acrescenta região, responsável e observações.</p>
    <form class="card" id="fz"><div class="fields"><div><label class="lb" for="fz-cod">Código *</label><input class="f" id="fz-cod" inputmode="numeric" value="${esc(r.cod||"")}"></div>
      <div><label class="lb" for="fz-nome">Nome *</label><input class="f" id="fz-nome" value="${esc(r.nome||"")}"></div><div><label class="lb" for="fz-reg">Unidade / região</label><input class="f" id="fz-reg" value="${esc(r.regiao||"")}"></div>
      <div><label class="lb" for="fz-resp">Responsável</label><input class="f" id="fz-resp" value="${esc(r.resp||"")}"></div><div class="full"><label class="lb" for="fz-obs">Observações</label><textarea class="f" id="fz-obs">${esc(r.obs||"")}</textarea></div></div>
      <div class="btns"><button class="btn" type="submit">💾 Salvar fazenda</button></div></form>
    ${fs.map(f=>`<a class="item" href="#/cad/fazendas/${encodeURIComponent(f.cod)}"><div class="ic">🏡</div><div class="t"><h4>${esc(f.cod)} — ${esc(f.nome)}</h4><p>${esc([f.regiao,f.resp].filter(Boolean).join(" · ")||"sem detalhes")}</p></div><div class="chev">›</div></a>`).join("")}`; }
  if(aba==="equip"){ const es=await DB.all("equipamentos"); const ed=id?es.find(e=>e.cod===id):null; const r=ed||{};
    return `<h2 class="tit">Cadastros</h2>${tabs}
    <form class="card" id="eq"><div class="fields"><div><label class="lb" for="eq-cod">Código *</label><input class="f" id="eq-cod" value="${esc(r.cod||"")}" ${ed?"readonly":""}></div>
      <div><label class="lb" for="eq-nome">Nome / modelo</label><input class="f" id="eq-nome" value="${esc(r.nome||"")}"></div><div><label class="lb" for="eq-tipo">Tipo</label><input class="f" id="eq-tipo" value="${esc(r.tipo||"")}" placeholder="trator, colhedora…"></div>
      <div><label class="lb" for="eq-plh">Padrão de consumo (L/h)</label><input class="f" id="eq-plh" inputmode="decimal" value="${r.padraoLh!=null?String(r.padraoLh).replace(".",","):""}"></div>
      <div class="full"><label class="lb" for="eq-obs">Observações</label><textarea class="f" id="eq-obs">${esc(r.obs||"")}</textarea></div></div>
      <p style="font-size:13.5px;color:var(--soft)">O padrão de consumo é definido pelo gestor e serve só de referência para alertas.</p>
      <div class="btns"><button class="btn" type="submit">💾 Salvar equipamento</button>${ed?`<button class="btn sec" type="button" id="eqDel">Excluir</button>`:""}</div></form>
    ${es.map(e=>`<a class="item" href="#/cad/equip/${encodeURIComponent(e.cod)}"><div class="ic">🚜</div><div class="t"><h4>${esc(e.cod)}${e.nome?" — "+esc(e.nome):""}</h4><p>${esc(e.tipo||"")}${e.padraoLh?" · padrão "+fmt(e.padraoLh,1)+" L/h":""}</p></div><div class="chev">›</div></a>`).join("")}`; }
  const ts=(await DB.all("talhoes")).sort((a,b)=>a.id.localeCompare(b.id)); const ed=id?ts.find(t=>t.id===id):null;
  const r=ed||{cod:ctx.cod,talhao:ctx.tal};
  return `<h2 class="tit">Cadastros</h2>${tabs}
    <form class="card" id="tl"><div class="fields"><div><label class="lb" for="tl-cod">Código fazenda *</label><input class="f" id="tl-cod" inputmode="numeric" value="${esc(r.cod||"")}" ${ed?"readonly":""}></div>
      <div><label class="lb" for="tl-tal">Talhão *</label><input class="f" id="tl-tal" value="${esc(r.talhao||"")}" ${ed?"readonly":""}></div><div class="full"><span class="lb" id="tl-faz">${esc(fazNome(r.cod)||"")}</span></div>
      <div><label class="lb" for="tl-area">Área (ha)</label><input class="f" id="tl-area" inputmode="decimal" value="${r.area!=null?String(r.area).replace(".",","):""}"></div>
      <div><label class="lb" for="tl-var">Variedade</label><input class="f" id="tl-var" value="${esc(r.variedade||"")}"></div>
      <div><label class="lb" for="tl-tipo">Tipo de canavial</label><select class="f" id="tl-tipo"><option value="">Não informado</option>${["Cana-planta","Cana-soca"].map(o=>`<option${o===r.tipo?" selected":""}>${o}</option>`).join("")}</select></div>
      <div><label class="lb" for="tl-data">Plantio / último corte</label><input class="f" type="date" id="tl-data" value="${esc(r.dataRef||"")}"></div>
      <div class="full"><label class="lb" for="tl-est">Estágio / ciclo</label><input class="f" id="tl-est" value="${esc(r.estagio||"")}" placeholder="ex.: 2º corte"></div>
      <div class="full"><label class="lb" for="tl-obs">Observações operacionais</label><textarea class="f" id="tl-obs">${esc(r.obs||"")}</textarea></div></div>
      <div class="btns"><button class="btn" type="submit">💾 ${ed?"Salvar alteração":"Cadastrar talhão"}</button>${ed?`<button class="btn sec" type="button" id="tlDel">Excluir</button><a class="btn sec" href="#/cad/talhoes">Novo</a>`:""}</div></form>
    <input class="f" id="tl-busca" type="search" placeholder="Buscar talhão ou fazenda" style="margin-bottom:10px">
    <div id="tl-lista">${ts.map(t=>`<a class="item" data-busca="${esc(norm(t.id+" "+fazNome(t.cod)))}" href="#/cad/talhoes/${encodeURIComponent(t.id)}"><div class="ic">🗺️</div><div class="t"><h4>${esc(fazNome(t.cod)||t.cod)} · Talhão ${esc(t.talhao)}</h4><p>${t.area?fmt(t.area,2)+" ha":"sem área"}${t.tipo?" · "+esc(t.tipo):""}${t.variedade?" · "+esc(t.variedade):""}</p></div><div class="chev">›</div></a>`).join("")||`<div class="vazio">Nenhum talhão cadastrado.</div>`}</div>`;
};
ROTAS.cad.after=async(aba="talhoes",id)=>{
  if(aba==="fazendas"){ const c=$("#fz-cod"); c.oninput=()=>{ c.value=c.value.replace(/\D/g,""); if(FAZENDAS[c.value]&&!$("#fz-nome").value) $("#fz-nome").value=FAZENDAS[c.value]; };
    $("#fz").onsubmit=async e=>{ e.preventDefault(); const cod=c.value.trim(), nome=$("#fz-nome").value.trim(); if(!cod||!nome){ toast("Preencha código e nome"); return; }
      const ant=await DB.get("fazendas",cod); await DB.put("fazendas",carimbo({...(ant||{}),cod,nome,regiao:$("#fz-reg").value.trim(),resp:$("#fz-resp").value.trim(),obs:$("#fz-obs").value.trim()})); toast(ant?"Fazenda atualizada":"Fazenda cadastrada"); go("#/cad/fazendas"); render(); }; return; }
  if(aba==="equip"){ $("#eq").onsubmit=async e=>{ e.preventDefault(); const cod=$("#eq-cod").value.trim().toUpperCase(); if(!cod){ toast("Preencha o código"); return; }
      const ant=await DB.get("equipamentos",cod); if(ant&&!id){ toast("Já existe um equipamento com esse código — abri para editar"); go("#/cad/equip/"+encodeURIComponent(cod)); return; }
      const p=num($("#eq-plh").value); await DB.put("equipamentos",carimbo({...(ant||{}),cod,nome:$("#eq-nome").value.trim(),tipo:$("#eq-tipo").value.trim(),padraoLh:isFinite(p)&&p>0?p:null,obs:$("#eq-obs").value.trim()}));
      await recarregaCadastros(); toast("Equipamento salvo"); go("#/cad/equip"); };
    const d=$("#eqDel"); if(d) d.onclick=async()=>{ if(d.dataset.ok!=="1"){ d.dataset.ok="1"; d.textContent="Toque de novo para excluir"; return; } await DB.del("equipamentos",id); await recarregaCadastros(); go("#/cad/equip"); }; return; }
  const c=$("#tl-cod"); c.oninput=()=>{ c.value=c.value.replace(/\D/g,""); $("#tl-faz").textContent=fazNome(c.value)||(c.value.length>=5?"Código não encontrado na planilha":""); };
  $("#tl-busca").oninput=e=>{ const q=norm(e.target.value); $$("#tl-lista .item").forEach(a=>a.hidden=q&&!a.dataset.busca.includes(q)); };
  $("#tl").onsubmit=async e=>{ e.preventDefault(); const cod=c.value.trim(), tal=$("#tl-tal").value.trim(); if(!cod||!tal){ toast("Preencha código da fazenda e talhão"); return; }
    const tid=talId(cod,tal), ant=await DB.get("talhoes",tid); if(ant&&!id){ toast("Talhão já cadastrado — abri para editar"); go("#/cad/talhoes/"+encodeURIComponent(tid)); return; }
    const a=num($("#tl-area").value); if($("#tl-area").value.trim()&&!(a>0)){ toast("Área inválida"); return; }
    await DB.put("talhoes",carimbo({...(ant||{}),id:tid,cod,talhao:tal.toUpperCase(),area:a>0?a:null,variedade:$("#tl-var").value.trim(),tipo:$("#tl-tipo").value,dataRef:$("#tl-data").value,estagio:$("#tl-est").value.trim(),obs:$("#tl-obs").value.trim()}));
    await recarregaCadastros(); mostraCtx(); toast(ant?"Talhão atualizado":"Talhão cadastrado"); go("#/cad/talhoes"); };
  const d=$("#tlDel"); if(d) d.onclick=async()=>{ if(d.dataset.ok!=="1"){ d.dataset.ok="1"; d.textContent="Toque de novo para excluir"; return; } await DB.del("talhoes",id); await recarregaCadastros(); mostraCtx(); go("#/cad/talhoes"); };
};

/* ---------- Painel gerencial ---------- */
const filP=Object.assign({de:"",ate:"",cod:"",tal:"",oper:"",equip:"",resp:""},LS.get("filP",{}));
const passa=r=> (!filP.de||(r.data||"")>=filP.de)&&(!filP.ate||(r.data||"")<=filP.ate)&&(!filP.cod||r.cod===filP.cod)&&(!filP.tal||norm(r.talhao)===norm(filP.tal))
  &&(!filP.oper||norm(r.oper||"")===norm(filP.oper))&&(!filP.equip||norm(r.equip||"")===norm(filP.equip))&&(!filP.resp||norm(r.resp||"").includes(norm(filP.resp)));
ROTAS.painel=async()=>{
  const ps=(await DB.all("planos")).filter(passa), cs=(await DB.all("colheitas")).filter(passa), as=(await DB.all("abastecimentos")).filter(passa);
  const soma=(arr,f)=>arr.reduce((s,x)=>s+(f(x)||0),0);
  const haPlan=soma(ps.filter(p=>p.metaU==="ha"),p=>p.meta)+soma(cs,c=>c.ap), haReal=soma(ps.filter(p=>p.metaU==="ha"),p=>p.areaR)+soma(cs,c=>c.ac);
  const tPes=soma(cs.filter(c=>c.orig==="Pesagem (balança)"),c=>c.tr), tEst=soma(cs.filter(c=>c.orig!=="Pesagem (balança)"),c=>c.tr);
  const aPes=soma(cs.filter(c=>c.orig==="Pesagem (balança)"&&c.tr>0),c=>c.ac);
  const lAb=soma(as,a=>a.litros), lPl=soma(ps,p=>p.diesel), litros=lAb+lPl;
  const abArea=as.filter(a=>a.area>0), lha=abArea.length?soma(abArea,a=>a.litros)/soma(abArea,a=>a.area):null;
  const custo=soma(as.filter(a=>a.preco>0),a=>a.litros*a.preco), semPreco=as.filter(a=>!(a.preco>0)).length;
  const horas=soma(as,a=>metAb(a).hs)+soma(cs,c=>c.hp), parada=soma(cs,c=>c.hpar)+soma(ps,p=>p.parada);
  const pend=ps.filter(p=>metPl(p).status==="Pendente");
  const porOp={}; ps.forEach(p=>{ const o=(porOp[p.oper+"|"+(p.metaU||"")] ||= {oper:p.oper,u:p.metaU,meta:0,real:0,n:0}); o.n++; o.meta+=p.meta||0; const m=metPl(p); o.real+=m.real||0; });
  const opts=(arr,k)=>[...new Set(arr.map(x=>x[k]).filter(Boolean))].sort();
  const todos=[...(await DB.all("planos")),...(await DB.all("abastecimentos")),...(await DB.all("colheitas"))];
  return `<div class="printonly"><h2>Calculadora da Cana — painel gerencial</h2><p>Gerado em ${new Date().toLocaleString("pt-BR")}</p></div>
  <h2 class="tit">Painel gerencial</h2>
  <details class="card noprint" ${Object.values(filP).some(Boolean)?"open":""}><summary style="font-weight:700;color:var(--accent-strong)">Filtros${Object.values(filP).some(Boolean)?" (ativos)":""}</summary>
    <div class="fields" style="margin-top:10px"><div><label class="lb" for="p-de">De</label><input class="f" type="date" id="p-de" value="${filP.de}"></div><div><label class="lb" for="p-ate">Até</label><input class="f" type="date" id="p-ate" value="${filP.ate}"></div>
      <div><label class="lb" for="p-cod">Código fazenda</label><input class="f" id="p-cod" inputmode="numeric" value="${esc(filP.cod)}"></div><div><label class="lb" for="p-tal">Talhão</label><input class="f" id="p-tal" value="${esc(filP.tal)}"></div>
      <div><label class="lb" for="p-oper">Operação</label><select class="f" id="p-oper"><option value="">Todas</option>${opts(todos,"oper").map(o=>`<option${o===filP.oper?" selected":""}>${esc(o)}</option>`).join("")}</select></div>
      <div><label class="lb" for="p-equip">Equipamento</label><select class="f" id="p-equip"><option value="">Todos</option>${opts(todos,"equip").map(o=>`<option${o===filP.equip?" selected":""}>${esc(o)}</option>`).join("")}</select></div>
      <div class="full"><label class="lb" for="p-resp">Responsável</label><input class="f" id="p-resp" value="${esc(filP.resp)}"></div></div>
    <div class="btns"><button class="btn sec" id="p-limpa" type="button">Limpar filtros</button></div></details>
  <div class="stat">
    <div><b>${fmt(haPlan,1)} ha</b><span>planejados</span></div><div><b>${fmt(haReal,1)} ha</b><span>realizados</span></div>
    <div><b>${haPlan>0?fmt(haReal/haPlan*100,0)+"%":"—"}</b><span>execução das áreas</span>${haPlan>0?"":"<i>sem metas em ha</i>"}</div>
    <div><b>${fmt(tPes,0)} t</b><span>produção pesada</span>${tEst?`<i>+ ${fmt(tEst,0)} t estimadas (não somadas)</i>`:""}</div>
    <div><b>${aPes>0?fmt(tPes/aPes,1):"—"}</b><span>TCH médio (só pesagem)</span></div>
    <div><b>${fmt(litros,0)} L</b><span>diesel registrado</span></div>
    <div><b>${lha!=null?fmt(lha,1):"—"}</b><span>L/ha (abastecimentos com área)</span></div>
    <div><b>${custo?"R$ "+fmt(custo,0):"—"}</b><span>custo de diesel</span>${semPreco?`<i>${semPreco} abastecimento(s) sem preço</i>`:""}</div>
    <div><b>${fmt(horas,1)} h</b><span>horas trabalhadas</span></div><div><b>${fmt(parada,1)} h</b><span>tempo de parada</span></div>
    <div><b style="color:${pend.length?"var(--warn)":"inherit"}">${pend.length}</b><span>atividades pendentes</span></div>
    <div><b>${ps.length+cs.length+as.length}</b><span>registros no filtro</span></div></div>
  ${Object.keys(porOp).length?`<div class="card" style="margin-top:14px"><h3>Planejado x realizado por operação</h3><div class="tw"><table class="t"><tr><th>Operação</th><th>Planos</th><th>Meta</th><th>Realizado</th><th>%</th></tr>
    ${Object.values(porOp).map(o=>`<tr><td>${esc(o.oper)}</td><td class="n">${o.n}</td><td class="n">${fmt(o.meta,1)} ${esc(o.u||"")}</td><td class="n">${fmt(o.real,1)}</td><td class="n">${o.meta>0?fmt(o.real/o.meta*100,0)+"%":"—"}</td></tr>`).join("")}</table></div></div>`:""}
  ${pend.length?`<div class="card"><h3>Pendentes</h3>${pend.map(p=>`<a class="item" href="#/plan/${p.id}"><div class="ic">⏳</div><div class="t"><h4>${esc(p.oper)} · ${esc(p.faz||p.cod)} / ${esc(p.talhao)}</h4><p>${dataBR(p.data)}</p></div></a>`).join("")}</div>`:""}
  <div class="info">Os indicadores usam só o que foi registrado neste aparelho. Toneladas estimadas aparecem separadas das pesadas. Campos sem dados mostram "—".</div>
  <div class="btns noprint"><button class="btn sec" id="p-print">🖨️ Imprimir / PDF (A4)</button></div>`;
};
ROTAS.painel.after=()=>{
  ["de","ate","cod","tal","oper","equip","resp"].forEach(k=>{ const el=$("#p-"+k); el.onchange=()=>{ filP[k]=el.value.trim(); LS.set("filP",filP); render.keep=true; render(); }; });
  $("#p-limpa").onclick=()=>{ Object.keys(filP).forEach(k=>filP[k]=""); LS.set("filP",filP); render(); };
  $("#p-print").onclick=()=>print();
};

/* ---------- Relatórios, exportação e backup ---------- */
function baixa(nome,conteudo,tipo){ const b=new Blob([conteudo],{type:tipo}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=nome; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); }
function csv(linhas){ return "﻿"+linhas.map(l=>l.map(c=>{ let s=c==null?"":String(typeof c==="number"?String(c).replace(".",","):c); return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(";")).join("\n"); }
const EXPORT={
  calculos:{nome:"historico_calculos",cab:["Registro","Data e hora","Módulo","Cálculo","Código","Fazenda","Talhão","Responsável","Dados informados","Resultados","Versão","Observações"],
    lin:h=>[h.id,dataHora(h.quando),MODULOS[h.mod]?.nome,h.titulo,h.cod,h.faz,h.talhao,h.resp,Object.entries(h.raw).filter(([,v])=>String(v).trim()).map(([k,v])=>k+"="+v).join(" | "),h.rows.map(r=>`${r.label}: ${typeof r.val==="number"?fmt(r.val,r.dec):r.val} ${r.unit}`).join(" | "),h.versao||1,h.obs]},
  abastecimentos:{nome:"abastecimentos_diesel",cab:["Data","Equipamento","Código","Fazenda","Talhão","Operação","Responsável","Horímetro ini","Horímetro fim","Horas","Litros","L/h","Área ha","L/ha","Preço R$/L","Custo R$","Observações"],
    lin:a=>{ const m=metAb(a); return [a.data,a.equip,a.cod,a.faz,a.talhao,a.oper,a.resp,a.h0,a.h1,m.hs,a.litros,m.lh&&+m.lh.toFixed(2),a.area,m.lha&&+m.lha.toFixed(2),a.preco,m.custo&&+m.custo.toFixed(2),a.obs]; }},
  colheitas:{nome:"registros_colheita",cab:["Data","Código","Fazenda","Talhão","Frente","Colhedora","Responsável","Área planejada","Área colhida","t previstas","t colhidas","Origem","TCH","Horas produtivas","Horas paradas","Motivo","Observações"],
    lin:c=>{ const m=metCo(c); return [c.data,c.cod,c.faz,c.talhao,c.equipe,c.equip,c.resp,c.ap,c.ac,c.tp,c.tr,c.orig,m.tch&&+m.tch.toFixed(2),c.hp,c.hpar,c.motivo,c.obs]; }},
  planos:{nome:"planejamento_diario",cab:["Data","Código","Fazenda","Talhão","Operação","Equipamento","Responsável","Meta","Unidade","Início prev.","Fim prev.","Início real","Fim real","Área real","Produção real","Diesel L","Parada h","Motivo","Pendências","Status","% meta","Observações","Obs. encarregado"],
    lin:p=>{ const m=metPl(p); return [p.data,p.cod,p.faz,p.talhao,p.oper,p.equip,p.resp,p.meta,p.metaU,p.ini,p.fim,p.iniR,p.fimR,p.areaR,p.prodR,p.diesel,p.parada,p.motivo,p.pend,m.status,m.pc!=null?+m.pc.toFixed(1):"",p.obs,p.obsEnc]; }},
  talhoes:{nome:"cadastro_talhoes",cab:["Código","Fazenda","Talhão","Área ha","Variedade","Tipo","Plantio/corte","Estágio","Observações"],lin:t=>[t.cod,fazNome(t.cod),t.talhao,t.area,t.variedade,t.tipo,t.dataRef,t.estagio,t.obs]}
};
ROTAS.rel=async()=>{
  let est=""; try{ const e=await navigator.storage.estimate(); est=`Espaço usado pelo app: ${fmt(e.usage/1048576,1)} MB de ${fmt(e.quota/1048576,0)} MB disponíveis para o navegador.`; }catch(_){}
  let pers=null; try{ pers=await navigator.storage.persisted(); }catch(_){}
  const cont={}; for(const s of Object.keys(STORES)) cont[s]=(await DB.all(s)).length;
  return `<h2 class="tit">Relatórios e backup</h2>
  <div class="card"><h3>Exportar para Excel (CSV)</h3><p class="sub">Abre no Excel e no Google Planilhas. Os nomes dos arquivos trazem o conteúdo e a data.</p>
    <div class="btns">${Object.entries(EXPORT).map(([k,e])=>`<button class="btn sec" data-csv="${k}">📄 ${e.nome.replace(/_/g," ")} (${cont[k]})</button>`).join("")}</div></div>
  <div class="card"><h3>Relatórios em PDF (A4)</h3><p class="sub">Use o painel (consolidado, com filtros de período) ou abra um cálculo no histórico (individual, com memória de cálculo) e toque em PDF. A tela de impressão do celular tem a opção "Salvar como PDF".</p>
    <div class="btns"><a class="btn sec" href="#/painel">📊 Abrir painel</a><a class="btn sec" href="#/hist">🗂️ Abrir histórico</a></div></div>
  <div class="card"><h3>Cópia de segurança</h3><p class="sub">Leva cadastros, cálculos, abastecimentos, colheitas e planejamentos. Guarde no Drive ou mande para você no WhatsApp.</p>
    <div class="btns"><button class="btn" id="bk">💾 Gerar backup</button><label class="btn sec" for="rs">♻️ Restaurar backup</label></div><input type="file" id="rs" accept=".json,application/json" hidden></div>
  <div class="info"><b>Onde ficam os dados:</b> só neste celular, dentro do navegador. ${est} ${pers===true?"O armazenamento está marcado como persistente.":pers===false?"O navegador pode apagar os dados se faltar espaço: faça backup com frequência.":""}<br><br>
    <b>Ainda não existe:</b> sincronização entre celulares, login e permissões por usuário. Isso exige um servidor e um banco de dados online (por exemplo Firebase ou Supabase), que precisam ser contratados e configurados. O GitHub Pages hospeda só os arquivos do app.<br><br>
    <b>Integração com o Guia da Cana:</b> o cadastro de fazendas e talhões fica num banco local chamado "guiaCana", no mesmo endereço dos outros apps. Assim, os apps do Guia no mesmo celular e no mesmo navegador podem usar o mesmo cadastro. A ligação com o Daninhas da Cana é a próxima etapa.</div>`;
};
ROTAS.rel.after=()=>{
  $$("[data-csv]").forEach(b=>b.onclick=async()=>{ const k=b.dataset.csv, e=EXPORT[k]; const rs=await DB.all(k); if(!rs.length){ toast("Nada para exportar"); return; } baixa(`${e.nome}_${hojeISO()}.csv`,csv([e.cab,...rs.map(e.lin)]),"text/csv"); });
  $("#bk").onclick=async()=>{ const d={app:"calculadora-da-cana",versao:2,gerado:new Date().toISOString(),valores:{}}; for(const s of Object.keys(STORES)) d[s]=await DB.all(s);
    CALCS.forEach(c=>{ d.valores[c.id]=LS.get(c.id,{}); }); baixa(`backup_calculadora_${hojeISO()}.json`,JSON.stringify(d),"application/json"); toast("Backup gerado"); };
  $("#rs").onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
    try{ const j=JSON.parse(await f.text()); if(j.app!=="calculadora-da-cana") throw 0; let n=0, mant=0;
      for(const [s,key] of Object.entries(STORES)){ for(const r of j[s]||[]){ const ex=await DB.get(s,r[key]); if(ex&&(ex.alterado||"")>(r.alterado||"")){ mant++; continue; } await DB.put(s,r); n++; } }
      await recarregaCadastros(); toast(`Restaurado: ${n} registro(s)${mant?`; ${mant} mais recente(s) do aparelho mantido(s)`:""}`); render(); }
    catch(_){ toast("Arquivo de backup inválido"); } e.target.value=""; };
};

/* ---------- Off-line, instalação e início ---------- */
(function(){ const dl=document.createElement("datalist"); dl.id="listaOper"; dl.innerHTML=["Plantio","Cultivo","Adubação","Aplicação de herbicida","Aplicação de vinhaça","Torta de filtro","Colheita","Transporte","Preparo de solo","Irrigação"].map(o=>`<option value="${o}">`).join(""); document.body.appendChild(dl); })();
function updateOffline(){ $("#offlineBadge").classList.toggle("show",!navigator.onLine); }
addEventListener("online",updateOffline); addEventListener("offline",updateOffline); updateOffline();
if("serviceWorker" in navigator){ addEventListener("load",()=>navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).catch(()=>{})); }
if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(()=>{});
function setHeadH(){ document.documentElement.style.setProperty("--head-h",$("#appHead").offsetHeight+"px"); } addEventListener("resize",setHeadH);
let deferredInstall=null; const installBtn=$("#openInstall"), sheet=$("#installSheet");
const INST_KEY="instalado:calc"; let jaInst=false; try{ jaInst=localStorage.getItem(INST_KEY)==="1"; }catch(_){}
if((matchMedia("(display-mode: standalone)").matches||navigator.standalone===true)&&jaInst) installBtn.hidden=true;
addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredInstall=e; });
installBtn.addEventListener("click",async()=>{ if(deferredInstall){ deferredInstall.prompt(); const r=await deferredInstall.userChoice; deferredInstall=null; if(r&&r.outcome==="accepted") installBtn.hidden=true; return; }
  if(matchMedia("(display-mode: standalone)").matches) $("#instTxt").innerHTML=`Esta tela abriu <b>dentro de outro app</b>. Abra o <b>Chrome pelo ícone dele</b>, digite <b style="word-break:break-all">${esc(location.href.split("#")[0])}</b> e toque em Instalar app.`;
  sheet.hidden=false; });
$("#closeInstall").onclick=()=>sheet.hidden=true; sheet.onclick=e=>{ if(e.target===sheet) sheet.hidden=true; };
addEventListener("appinstalled",()=>{ installBtn.hidden=true; try{ localStorage.setItem(INST_KEY,"1"); }catch(_){} });
/* versão 1 guardava a aba aberta em calc:tab — abre o mesmo módulo */
(async()=>{ await recarregaCadastros(); mostraCtx(); setHeadH(); const tab=LS.get("tab",null); if(!location.hash && tab && MODULOS[tab]) { LS.set("tab",null); location.hash="#/m/"+tab; } else render(); })();
