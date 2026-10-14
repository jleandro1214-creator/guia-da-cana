/* Guia da Cana — ponto central (versão 4). Roda 100% no aparelho, sem servidor. */
"use strict";
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>[...el.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const nf=d=>new Intl.NumberFormat("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}); const fmt=(x,d=1)=>(x==null||!isFinite(x))?"—":nf(d).format(x);
const parseNum=s=>{ s=String(s??"").trim().replace(/\s/g,""); if(!s) return NaN; if(s.includes(",")) s=s.replace(/\./g,"").replace(",","."); return Number(s); };
const hojeISO=()=>{ const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
const agoraHora=()=>new Date().toTimeString().slice(0,5);
const dataBR=iso=>iso?String(iso).slice(0,10).split("-").reverse().join("/"):"—";
const uid=()=>Date.now()*1000+Math.floor(Math.random()*1000);
function toast(t,erro){ const el=$("#toast"); el.textContent=t; el.className=erro?"erro":""; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>el.hidden=true,2800); }
const LS={ get(k,d){ try{ const v=localStorage.getItem("guia:"+k); return v===null?d:JSON.parse(v); }catch(_){ return d; } }, set(k,v){ try{ localStorage.setItem("guia:"+k,JSON.stringify(v)); }catch(_){} } };

/* ---------- Bancos locais (todos no mesmo endereço, compartilhados entre os apps do Guia neste aparelho) ----------
   guiaCanaDB  → anotações (mesmo banco da versão 1: nada se perde)
   guiaCana    → cadastro de fazendas e talhões (mesmo banco da Calculadora)
   danCampo    → vistorias e aplicações do app Daninhas (só leitura aqui)            */
function abre(nome, versao, criar){ return new Promise((ok,err)=>{ const r=indexedDB.open(nome,versao); r.onupgradeneeded=()=>criar(r.result); r.onsuccess=()=>ok(r.result); r.onerror=()=>err(r.error); }); }
const BANCOS={
  notas:()=>abre("guiaCanaDB",1,d=>{ if(!d.objectStoreNames.contains("notas")) d.createObjectStore("notas",{keyPath:"id"}); }),
  guia:()=>abre("guiaCana",1,d=>{ Object.entries({fazendas:"cod",talhoes:"id",equipamentos:"cod",calculos:"id",abastecimentos:"id",colheitas:"id",planos:"id"}).forEach(([s,k])=>{ if(!d.objectStoreNames.contains(s)) d.createObjectStore(s,{keyPath:k}); }); }),
  dan:()=>abre("danCampo",1,d=>{ ["vistorias","aplicacoes"].forEach(s=>{ if(!d.objectStoreNames.contains(s)) d.createObjectStore(s,{keyPath:"id"}); }); if(!d.objectStoreNames.contains("fotos")) d.createObjectStore("fotos"); })
};
const conex={};
async function db(b){ return conex[b] ||= await BANCOS[b](); }
async function todos(b,s){ try{ const d=await db(b); return await new Promise(ok=>{ const q=d.transaction(s).objectStore(s).getAll(); q.onsuccess=()=>ok(q.result||[]); q.onerror=()=>ok([]); }); }catch(_){ return []; } }
async function pega(b,s,k){ const d=await db(b); return new Promise(ok=>{ const q=d.transaction(s).objectStore(s).get(k); q.onsuccess=()=>ok(q.result??null); q.onerror=()=>ok(null); }); }
async function grava(b,s,v,k){ const d=await db(b); return new Promise((ok,err)=>{ const t=d.transaction(s,"readwrite"); k===undefined?t.objectStore(s).put(v):t.objectStore(s).put(v,k); t.oncomplete=()=>ok(); t.onerror=()=>err(t.error); t.onabort=()=>err(t.error||new Error("gravação cancelada")); }); }
async function apaga(b,s,k){ const d=await db(b); return new Promise(ok=>{ const t=d.transaction(s,"readwrite"); t.objectStore(s).delete(k); t.oncomplete=()=>ok(); t.onerror=()=>ok(); }); }
const carimbo=r=>{ const a=new Date().toISOString(); if(!r.criado) r.criado=a; r.alterado=a; return r; };

/* Anotação: lê registros antigos (v1) e novos no mesmo formato */
function normNota(n){ return {...n, cod:n.cod??n.codigo??"", faz:n.faz??n.fazenda??"", talhao:n.talhao??"", desc:n.desc??n.texto??"", midias:n.midias??(n.media?[n.media]:[]), cat:n.cat??"", situacao:n.situacao??""}; }
const notasTodas=async()=>(await todos("notas","notas")).map(normNota).sort((a,b)=>(b.data+(b.hora||"")).localeCompare(a.data+(a.hora||""))||b.id-a.id);
const talId=(cod,tal)=>`${cod||"?"}|${String(tal||"").trim().toUpperCase()}`;
const fazNome=c=>(typeof FAZENDAS!=="undefined"&&FAZENDAS[c])||"";

/* ---------- Catálogo técnico ---------- */
const ITENS=[...PRAGAS.map(p=>({...p,...EXTRA[p.id],tipo:"praga"})),...DOENCAS.map(d=>({...d,...EXTRA[d.id],tipo:"doenca"}))];
const item=id=>ITENS.find(x=>x.id===id);
const CATS=["Praga","Doença","Planta daninha","Falha de plantio / brotação","Vinhaça / irrigação","Máquina / operação","Segurança","Outros"];
const SITUACOES=["Pendente","Em andamento","Concluída"];
const PRIOR=["Baixa","Média","Alta"];

/* ---------- Roteador e menu ---------- */
const ROTAS={}; const rota={nome:""};
const go=h=>{ location.hash=h; };
const MODULOS=[
  {r:"#/pragas",e:"🐛",n:"Pragas",d:"Identificação, danos, monitoramento e manejo"},
  {r:"#/doencas",e:"🍂",n:"Doenças",d:"Sintomas, condições, prevenção e controle"},
  {r:"daninhas/",e:"🌿",n:"Plantas daninhas",d:"Identificação, infestação e herbicidas por bula",ext:1},
  {r:"calculadora/",e:"🧮",n:"Calculadora agrícola",d:"Campo, adubação, colheita, diesel e conversões",ext:1},
  {r:"#/notas",e:"📝",n:"Anotações de campo",d:"Ocorrências, fotos, vídeos e providências"},
  {r:"#/cad",e:"🗺️",n:"Fazendas e talhões",d:"Cadastro usado por todos os módulos"},
  {r:"#/monit",e:"📍",n:"Monitoramento",d:"Evolução das ocorrências por talhão"},
  {r:"#/rel",e:"📊",n:"Relatórios",d:"Filtros, PDF, planilha e backup"}
];
async function render(){
  $("#menu").hidden=true;
  const h=location.hash.replace(/^#/,"")||"/"; const [_,r,...a]=h.split("/"); rota.nome=r||"home"; if(rota.nome!=="busca") $("#q").value="";
  const grupo={praga:"pragas",doenca:"pragas",doencas:"pragas",sinais:"pragas",notas:"nota",nota:"nota",talhao:"monit"}[rota.nome]||rota.nome;
  $$("nav.bottom a").forEach(x=>x.classList.toggle("on",x.dataset.r===grupo));
  const fn=ROTAS[rota.nome]||ROTAS.home;
  try{ $("#main").innerHTML=await fn(...a.map(decodeURIComponent)); if(fn.after) await fn.after(...a.map(decodeURIComponent)); }
  catch(e){ $("#main").innerHTML=`<div class="aviso"><b>Erro ao abrir esta tela.</b> ${esc(e.message||e)}</div>`; }
  if(!render.keep) scrollTo({top:0,behavior:"instant"}); render.keep=false;
}
addEventListener("hashchange",render);
$("#menuItens").innerHTML=`<h2 class="tit" style="margin-top:0">Módulos</h2>`+[{r:"#/",e:"🏠",n:"Início",d:"Painel do Guia da Cana"},...MODULOS].map(m=>`<a class="item" href="${m.r}"><div class="thumb" style="width:48px;height:48px;font-size:24px">${m.e}</div><div class="t"><h4>${m.n}</h4><p>${m.d}${m.ext?" · abre o app":""}</p></div><div class="chev">›</div></a>`).join("");
$("#menuBtn").onclick=()=>{ $("#menu").hidden=false; }; $("#menuFechar").onclick=()=>{ $("#menu").hidden=true; }; $("#menu").onclick=e=>{ if(e.target.id==="menu") $("#menu").hidden=true; };

/* ---------- Início ---------- */
ROTAS.home=async()=>{
  const ns=await notasTodas(); const pend=ns.filter(n=>n.situacao==="Pendente"||n.situacao==="Em andamento").length;
  const tals=(await todos("guia","talhoes")).length;
  return `<div class="grid">${MODULOS.map(m=>`<a class="mod" href="${m.r}"><span class="e">${m.e}</span><b>${m.n}</b><small>${m.d}</small>
      ${m.ext?`<span class="ext">abre o app ↗</span>`:""}${m.r==="#/notas"&&pend?`<span class="cnt">${pend}</span>`:""}</a>`).join("")}</div>
    <div class="sec-t">Resumo neste aparelho</div>
    <div class="stat"><div><b>${ns.length}</b><span>anotações</span></div><div><b style="color:${pend?"var(--warn)":"inherit"}">${pend}</b><span>pendentes ou em andamento</span></div>
      <div><b>${tals}</b><span>talhões cadastrados</span></div><div><b>${PRAGAS.length+DOENCAS.length}</b><span>fichas de pragas e doenças</span></div></div>
    <div class="info" style="margin-top:14px">Os registros ficam <b>só neste celular</b>, no navegador. Não existe servidor de sincronização. Faça backup em <a href="#/rel">Relatórios</a>.</div>`;
};

/* ---------- Busca geral ---------- */
$("#q").addEventListener("input",()=>{ if(rota.nome!=="busca") go("#/busca"); else { render.keep=true; render(); } });
ROTAS.busca=async()=>{
  const q=norm($("#q").value.trim()); if(!q) return `<div class="vazio">Digite o nome de uma praga, doença, planta daninha, fazenda ou talhão.</div>`;
  const it=ITENS.filter(x=>norm(`${x.nome} ${x.cientifico} ${x.agente||""} ${x.desc}`).includes(q));
  const dn=(typeof DANINHAS!=="undefined"?DANINHAS:[]).filter(w=>norm(`${w.nome} ${w.sci} ${w.fam}`).includes(q));
  const fz=Object.entries(FAZENDAS).filter(([c,n])=>c.startsWith(q)||norm(n).includes(q)).slice(0,15);
  const tl=(await todos("guia","talhoes")).filter(t=>norm(`${t.talhao} ${t.cod} ${fazNome(t.cod)} ${t.variedade||""}`).includes(q));
  const ns=(await notasTodas()).filter(n=>norm(`${n.desc} ${n.faz} ${n.talhao} ${n.cat} ${n.alvoNome||""} ${n.prov||""}`).includes(q)).slice(0,20);
  if(!it.length&&!dn.length&&!fz.length&&!tl.length&&!ns.length) return `<div class="vazio">Nada encontrado para "<b>${esc($("#q").value)}</b>".</div>`;
  return `${it.length?`<h2 class="tit">Pragas e doenças</h2>`+it.map(itemCard).join(""):""}
    ${dn.length?`<h2 class="tit">Plantas daninhas</h2>`+dn.map(w=>`<a class="item" href="daninhas/#/daninha/${w.id}"><div class="thumb">${w.ic}</div><div class="t"><h4>${esc(w.nome)}</h4><p class="sci">${esc(w.sci)}</p><p>abre no app Daninhas ↗</p></div></a>`).join(""):""}
    ${tl.length?`<h2 class="tit">Talhões cadastrados</h2>`+tl.map(talCard).join(""):""}
    ${fz.length?`<h2 class="tit">Fazendas</h2>`+fz.map(([c,n])=>`<a class="item" href="#/cad/${c}"><div class="thumb">🏡</div><div class="t"><h4>${esc(n)}</h4><p>Código ${c}</p></div><div class="chev">›</div></a>`).join(""):""}
    ${ns.length?`<h2 class="tit">Anotações</h2>`+ns.map(notaCard).join(""):""}`;
};

/* ---------- Pragas e doenças ---------- */
const itemCard=x=>`<a class="item" href="#/${x.tipo==="praga"?"praga":"doenca"}/${x.id}"><div class="thumb"><img src="${x.imagens[0].src}" alt=""></div><div class="t"><h4>${esc(x.nome)}</h4><p class="sci">${esc(x.agente||x.cientifico)}</p></div><div class="chev">›</div></a>`;
function lista(tipo){
  const xs=ITENS.filter(x=>x.tipo===tipo);
  return `<div class="chips"><a class="chip${tipo==="praga"?" on":""}" href="#/pragas">🐛 Pragas</a><a class="chip${tipo==="doenca"?" on":""}" href="#/doencas">🍂 Doenças</a><a class="chip" href="#/sinais">❓ Não sei o que é</a></div>
    ${xs.map(itemCard).join("")}`;
}
ROTAS.pragas=()=>lista("praga"); ROTAS.doencas=()=>lista("doenca");
let sinaisSel=[];
ROTAS.sinais=()=>{
  const cont={}; sinaisSel.forEach(k=>SINAIS.find(s=>s.k===k).ids.forEach(id=>cont[id]=(cont[id]||0)+1));
  const cand=Object.entries(cont).sort((a,b)=>b[1]-a[1]);
  return `<h2 class="tit">O que você está vendo?</h2><p class="sub">Marque um ou mais sinais. O app mostra <b>possibilidades</b>, não um diagnóstico.</p>
    <div class="chips" style="flex-wrap:wrap">${SINAIS.map(s=>`<button class="chip${sinaisSel.includes(s.k)?" on":""}" data-s="${s.k}">${s.t}</button>`).join("")}</div>
    ${cand.length?`<h3 style="margin:10px 0">Possíveis causas</h3>${cand.map(([id,n])=>{ const x=item(id); return `<a class="item" href="#/${x.tipo==="praga"?"praga":"doenca"}/${id}"><div class="thumb"><img src="${x.imagens[0].src}" alt=""></div><div class="t"><h4>${esc(x.nome)}</h4><p>${n} de ${sinaisSel.length} sinal(is) combinam</p></div><div class="chev">›</div></a>`; }).join("")}
      <div class="aviso">Para confirmar: compare com as fotos e características da ficha, tire fotos de perto (folha, colmo, raiz) e peça avaliação técnica. <a href="#/nota/nova">Registrar como suspeita</a>.</div>`
    :`<div class="vazio">Escolha os sinais acima.</div>`}`;
};
ROTAS.sinais.after=()=>$$("[data-s]").forEach(b=>b.onclick=()=>{ const k=b.dataset.s; sinaisSel=sinaisSel.includes(k)?sinaisSel.filter(x=>x!==k):[...sinaisSel,k]; render.keep=true; render(); });
function ficha(id){
  const x=item(id); if(!x) return `<div class="vazio">Ficha não encontrada.</div>`;
  const li=a=>a&&a.length?`<ul>${a.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`:"<p>—</p>";
  const fotos=[...x.imagens,...(x.monitor?[x.monitor.img]:[])];
  return `<a class="btn sec peq noprint" href="#/${x.tipo==="praga"?"pragas":"doencas"}">‹ Voltar</a>
  <div class="card ficha" style="margin-top:10px"><h2 class="tit" style="margin:0">${esc(x.nome)}</h2><p class="sub" style="margin:2px 0 10px"><i>${esc(x.cientifico)}</i>${x.agente?` · Agente: <i>${esc(x.agente)}</i>`:""}</p>
    <div class="galeria">${fotos.map(f=>`<figure><img src="${f.src}" alt="${esc(f.alt)}" data-zoom="1"><figcaption>${esc(f.alt)}</figcaption></figure>`).join("")}</div>
    <p class="sub" style="margin:0 0 6px">Arraste para ver mais fotos. Toque para ampliar.</p>
    <p><span class="badge b-ref">ⓘ ${esc(FICHAS_STATUS)}</span></p>
    <p>${esc(x.desc)}</p>
    ${x.tipo==="praga"?`<h4>Como identificar</h4>${li(x.ident)}<dl><dt>Fase</dt><dd>${esc(x.fase)}</dd></dl>
      <h4>Sintomas e danos</h4>${li(x.sintomas)}<h4>Condições favoráveis</h4>${li(x.favor)}<h4>Monitoramento</h4>${li(x.monit)}${x.monitor?`<p>${esc(x.monitor.texto)}</p>`:""}
      <h4>Tomada de decisão</h4><p>${esc(x.decisao)}</p>`
    :`<h4>Sintomas</h4><dl>${Object.entries(x.partes||{}).map(([p,t])=>`<dt>${esc(p)}</dt><dd>${esc(t)}</dd>`).join("")}</dl>${li(x.sintomas)}
      <h4>Fatores favoráveis</h4>${li(x.favor)}<h4>Disseminação</h4><p>${esc(x.dissem)}</p><h4>Inspeção</h4><p>${esc(x.inspecao)}</p>
      <h4>Pode ser confundida com</h4>${li(x.confunde)}<h4>Prevenção</h4>${li(x.prev)}`}
    <h4>Manejo integrado</h4>${li(x.mip)}<p><b>Manejo (versão anterior da ficha):</b> ${x.manejo}</p>
    <h4>Controle</h4><p>${esc(x.controle)}</p>
    ${x.linkExtra?`<p><a href="${x.linkExtra.href}" target="_blank" rel="noopener">📷 ${esc(x.linkExtra.texto)}</a></p>`:""}
    <h4>Referências</h4><ul>${REFERENCIAS_GERAIS.map(r=>`<li>${r.u?`<a href="${r.u}" target="_blank" rel="noopener">${esc(r.t)}</a>`:esc(r.t)}</li>`).join("")}</ul>
    <p class="sub">Última revisão: ${FICHAS_REVISAO}. As referências indicam onde conferir; o texto ainda não foi checado frase a frase.</p></div>
  <div class="btns noprint"><a class="btn" href="#/nota/nova/${encodeURIComponent(x.tipo==="praga"?"Praga":"Doença")}/${x.id}">📝 Registrar ${x.tipo==="praga"?"ocorrência":"suspeita"}</a></div>`;
}
ROTAS.praga=ficha; ROTAS.doenca=ficha;

/* ---------- Fazendas e talhões (cadastro compartilhado) ---------- */
async function listasLocal(cod){
  $("#listaFazendas").innerHTML=Object.entries(FAZENDAS).map(([c,n])=>`<option value="${esc(n)}">${c}</option>`).join("");
  $("#listaTalhoes").innerHTML=(await todos("guia","talhoes")).filter(t=>!cod||t.cod===cod).map(t=>`<option value="${esc(t.talhao)}">${t.area?fmt(t.area,2)+" ha":""}</option>`).join("");
}
const talCard=t=>`<a class="item" href="#/talhao/${encodeURIComponent(t.id)}"><div class="thumb">🗺️</div><div class="t"><h4>${esc(fazNome(t.cod)||t.cod)} · Talhão ${esc(t.talhao)}</h4><p>${[t.area?fmt(t.area,2)+" ha":"",t.variedade,t.estagio,t.solo].filter(Boolean).map(esc).join(" · ")||"sem detalhes"}</p></div><div class="chev">›</div></a>`;
ROTAS.cad=async(cod,talEd)=>{
  const ts=(await todos("guia","talhoes")).sort((a,b)=>a.id.localeCompare(b.id));
  if(!cod) return `<h2 class="tit">Fazendas e talhões</h2><p class="sub">Cadastro usado pelas anotações, pelo monitoramento e pela Calculadora. Os nomes das ${Object.keys(FAZENDAS).length} fazendas já vêm da planilha.</p>
    <div class="card"><label class="lb" for="cadCod">Código ou nome da fazenda</label><input class="f" id="cadCod" list="listaFazendas" placeholder="ex.: 10003 ou PEDRA">
      <div class="btns"><button class="btn" id="cadAbrir" type="button">Abrir fazenda</button></div></div>
    <input class="f" id="busTal" type="search" placeholder="Buscar talhão cadastrado" style="margin-bottom:10px">
    <div id="lsTal">${ts.map(talCard).join("")||`<div class="vazio">Nenhum talhão cadastrado ainda.</div>`}</div>`;
  const fz=await pega("guia","fazendas",cod)||{cod,nome:fazNome(cod)};
  const tf=ts.filter(t=>t.cod===cod); const ed=talEd?tf.find(t=>t.id===talEd):null; const r=ed||{};
  return `<a class="btn sec peq" href="#/cad">‹ Fazendas</a>
    <form class="card" id="fzF" style="margin-top:10px"><h3>${esc(fz.nome||"Fazenda")} <small style="color:var(--soft)">· código ${esc(cod)}</small></h3>
      ${!fazNome(cod)?`<div class="aviso">Código não encontrado na planilha de fazendas. Confira o número.</div>`:""}
      <div class="fields"><div class="full"><label class="lb" for="fz-nome">Nome</label><input class="f" id="fz-nome" value="${esc(fz.nome||"")}"></div>
        <div><label class="lb" for="fz-mun">Município</label><input class="f" id="fz-mun" value="${esc(fz.municipio||"")}"></div>
        <div><label class="lb" for="fz-area">Área total (ha)</label><input class="f" id="fz-area" inputmode="decimal" value="${fz.areaTotal!=null?String(fz.areaTotal).replace(".",","):""}"></div>
        <div><label class="lb" for="fz-resp">Responsável</label><input class="f" id="fz-resp" value="${esc(fz.resp||"")}"></div>
        <div><label class="lb" for="fz-reg">Unidade / região</label><input class="f" id="fz-reg" value="${esc(fz.regiao||"")}"></div>
        <div class="full"><label class="lb" for="fz-obs">Observações</label><textarea class="f" id="fz-obs">${esc(fz.obs||"")}</textarea></div></div>
      <div class="btns"><button class="btn" type="submit">💾 Salvar fazenda</button></div></form>
    <form class="card" id="tlF"><h3>${ed?"Editar talhão "+esc(ed.talhao):"Cadastrar talhão"}</h3><div class="fields">
      <div><label class="lb" for="tl-tal">Talhão *</label><input class="f" id="tl-tal" value="${esc(r.talhao||"")}" ${ed?"readonly":""}></div>
      <div><label class="lb" for="tl-area">Área (ha)</label><input class="f" id="tl-area" inputmode="decimal" value="${r.area!=null?String(r.area).replace(".",","):""}"></div>
      <div><label class="lb" for="tl-var">Variedade</label><input class="f" id="tl-var" value="${esc(r.variedade||"")}"></div>
      <div><label class="lb" for="tl-tipo">Tipo de canavial</label><select class="f" id="tl-tipo"><option value="">Não informado</option>${["Cana-planta","Cana-soca"].map(o=>`<option${o===r.tipo?" selected":""}>${o}</option>`).join("")}</select></div>
      <div><label class="lb" for="tl-est">Estágio / ciclo</label><input class="f" id="tl-est" value="${esc(r.estagio||"")}" placeholder="ex.: 3º corte"></div>
      <div><label class="lb" for="tl-data">Plantio / último corte</label><input class="f" type="date" id="tl-data" value="${esc(r.dataRef||"")}"></div>
      <div class="full"><label class="lb" for="tl-solo">Tipo de solo</label><select class="f" id="tl-solo"><option value="">Não informado</option>${["Arenoso","Textura média","Argiloso"].map(o=>`<option${o===r.solo?" selected":""}>${o}</option>`).join("")}</select></div>
      <div class="full"><label class="lb" for="tl-obs">Observações</label><textarea class="f" id="tl-obs">${esc(r.obs||"")}</textarea></div></div>
      <div class="btns"><button class="btn" type="submit">💾 ${ed?"Salvar alteração":"Cadastrar"}</button>${ed?`<a class="btn sec" href="#/cad/${cod}">Novo talhão</a><button class="btn sec" type="button" id="tlDel">🗑️ Excluir</button>`:""}</div></form>
    <h3>Talhões desta fazenda (${tf.length})</h3>${tf.map(t=>talCard(t).replace(`href="#/talhao/`,`data-ed="${esc(t.id)}" href="#/talhao/`)).join("")||`<div class="vazio">Nenhum talhão.</div>`}
    ${tf.length?`<p class="sub">Para editar, abra o talhão e toque em "Editar cadastro".</p>`:""}`;
};
ROTAS.cad.after=async(cod,talEd)=>{
  await listasLocal(cod);
  if(!cod){ $("#cadAbrir").onclick=()=>{ const v=$("#cadCod").value.trim(); const c=/^\d+$/.test(v)?v:(Object.entries(FAZENDAS).find(([k,n])=>n.toUpperCase()===v.toUpperCase())||[])[0]; if(!c){ toast("Fazenda não encontrada",1); return; } go("#/cad/"+c); };
    $("#busTal").oninput=e=>{ const q=norm(e.target.value); $$("#lsTal .item").forEach(a=>a.hidden=q&&!norm(a.textContent).includes(q)); }; return; }
  $("#fzF").onsubmit=async e=>{ e.preventDefault(); const ant=await pega("guia","fazendas",cod); const a=parseNum($("#fz-area").value);
    if($("#fz-area").value.trim()&&!(a>0)){ toast("Área total inválida",1); return; }
    try{ await grava("guia","fazendas",carimbo({...(ant||{}),cod,nome:$("#fz-nome").value.trim()||fazNome(cod),municipio:$("#fz-mun").value.trim(),areaTotal:a>0?a:null,resp:$("#fz-resp").value.trim(),regiao:$("#fz-reg").value.trim(),obs:$("#fz-obs").value.trim()})); toast("Fazenda salva neste aparelho"); }catch(err){ toast("Não foi possível salvar: "+err.message,1); } };
  $("#tlF").onsubmit=async e=>{ e.preventDefault(); const tal=$("#tl-tal").value.trim(); if(!tal){ toast("Informe o talhão",1); return; }
    const id=talId(cod,tal), ant=await pega("guia","talhoes",id); if(ant&&!talEd){ toast("Esse talhão já existe — abri para editar"); go(`#/cad/${cod}/${encodeURIComponent(id)}`); return; }
    const a=parseNum($("#tl-area").value); if($("#tl-area").value.trim()&&!(a>0)){ toast("Área inválida",1); return; }
    try{ await grava("guia","talhoes",carimbo({...(ant||{}),id,cod,talhao:tal.toUpperCase(),area:a>0?a:null,variedade:$("#tl-var").value.trim(),tipo:$("#tl-tipo").value,estagio:$("#tl-est").value.trim(),dataRef:$("#tl-data").value,solo:$("#tl-solo").value,obs:$("#tl-obs").value.trim()}));
      toast(ant?"Talhão atualizado":"Talhão cadastrado"); go(`#/cad/${cod}`); render(); }catch(err){ toast("Não foi possível salvar: "+err.message,1); } };
  const d=$("#tlDel"); if(d) d.onclick=async()=>{ if(d.dataset.ok!=="1"){ d.dataset.ok="1"; d.textContent="Toque de novo para excluir"; return; } await apaga("guia","talhoes",talEd); toast("Talhão excluído"); go(`#/cad/${cod}`); };
};

/* ---------- Anotações de campo ---------- */
const filN=Object.assign({q:"",de:"",ate:"",cod:"",tal:"",cat:"",sit:""},LS.get("filN",{}));
const passaN=n=>(!filN.de||n.data>=filN.de)&&(!filN.ate||n.data<=filN.ate)&&(!filN.cod||n.cod===filN.cod)&&(!filN.tal||norm(n.talhao)===norm(filN.tal))&&(!filN.cat||n.cat===filN.cat)&&(!filN.sit||(n.situacao||"Sem situação")===filN.sit)
  &&(!filN.q||norm(`${n.desc} ${n.prov||""} ${n.alvoNome||""} ${n.resp||""} ${n.faz} ${n.talhao}`).includes(norm(filN.q)));
const urls=new Map(); const urlDe=b=>{ if(!b) return ""; if(!urls.has(b)) urls.set(b,URL.createObjectURL(b)); return urls.get(b); };
const sitBadge=s=>s==="Concluída"?`<span class="badge b-ok">✓ Concluída</span>`:s==="Em andamento"?`<span class="badge b-mid">↻ Em andamento</span>`:s==="Pendente"?`<span class="badge b-warn">● Pendente</span>`:`<span class="badge b-ref">Sem situação</span>`;
function notaCard(n){ const m=n.midias[0];
  return `<a class="item" href="#/nota/${n.id}"><div class="thumb">${m?(m.type==="video"?`<video src="${urlDe(m.blob)}" muted></video>`:`<img src="${urlDe(m.blob)}" alt="">`):"📝"}</div>
    <div class="t"><h4>${esc(n.cat||"Anotação")}${n.alvoNome?": "+esc(n.alvoNome):""}</h4><p>${dataBR(n.data)}${n.hora?" "+n.hora:""} · ${esc(n.faz||n.cod||"—")}${n.talhao?" / "+esc(n.talhao):""}</p>
    <p>${sitBadge(n.situacao)} ${n.prioridade==="Alta"?`<span class="badge b-warn">Alta</span>`:""} ${n.diag==="Suspeita visual"?`<span class="badge b-ref">Suspeita</span>`:n.diag==="Diagnóstico confirmado"?`<span class="badge b-ok">Confirmado</span>`:""}</p></div><div class="chev">›</div></a>`; }
ROTAS.notas=async()=>{
  const ns=await notasTodas(), fs=ns.filter(passaN); const ativos=Object.entries(filN).filter(([k,v])=>v&&k!=="q").length;
  return `<h2 class="tit">Anotações de campo</h2><div class="btns" style="margin-top:0"><a class="btn" href="#/nota/nova">➕ Nova anotação</a></div>
    <input class="f" id="nq" type="search" placeholder="Palavra-chave" value="${esc(filN.q)}" style="margin:12px 0 8px">
    <details class="card"${ativos?" open":""}><summary style="font-weight:700;color:var(--accent-strong)">Filtros${ativos?` (${ativos} ativo${ativos>1?"s":""})`:""}</summary><div class="fields" style="margin-top:10px">
      <div><label class="lb" for="nde">De</label><input class="f" type="date" id="nde" value="${filN.de}"></div><div><label class="lb" for="nate">Até</label><input class="f" type="date" id="nate" value="${filN.ate}"></div>
      <div><label class="lb" for="ncod">Código fazenda</label><input class="f" id="ncod" inputmode="numeric" value="${esc(filN.cod)}"></div><div><label class="lb" for="ntal">Talhão</label><input class="f" id="ntal" value="${esc(filN.tal)}"></div>
      <div><label class="lb" for="ncat">Categoria</label><select class="f" id="ncat"><option value="">Todas</option>${CATS.map(c=>`<option${c===filN.cat?" selected":""}>${c}</option>`).join("")}</select></div>
      <div><label class="lb" for="nsit">Situação</label><select class="f" id="nsit"><option value="">Todas</option>${[...SITUACOES,"Sem situação"].map(c=>`<option${c===filN.sit?" selected":""}>${c}</option>`).join("")}</select></div></div>
      <div class="btns"><button class="btn sec" id="nlimpa" type="button">Limpar filtros</button></div></details>
    <p class="sub">${fs.length} de ${ns.length} anotação(ões)</p>
    ${fs.map(notaCard).join("")||`<div class="vazio">${ns.length?"Nenhuma anotação com esses filtros.":"Nenhuma anotação ainda. Toque em <b>Nova anotação</b>."}</div>`}`;
};
ROTAS.notas.after=()=>{
  $("#nq").oninput=e=>{ filN.q=e.target.value; LS.set("filN",filN); clearTimeout(ROTAS.notas.t); ROTAS.notas.t=setTimeout(async()=>{ render.keep=true; await render(); const q=$("#nq"); q.focus(); q.setSelectionRange(q.value.length,q.value.length); },350); };
  [["nde","de"],["nate","ate"],["ncod","cod"],["ntal","tal"],["ncat","cat"],["nsit","sit"]].forEach(([id,k])=>$("#"+id).onchange=e=>{ filN[k]=e.target.value.trim(); LS.set("filN",filN); render.keep=true; render(); });
  $("#nlimpa").onclick=()=>{ Object.keys(filN).forEach(k=>filN[k]=""); LS.set("filN",filN); render(); };
};
let midiasEdit=[];
ROTAS.nota=async(id,catPre,alvoPre)=>{
  const novo=!id||id==="nova"; const ant=novo?null:await pega("notas","notas",Number(id));
  if(!novo&&!ant) return `<div class="vazio">Anotação não encontrada.</div>`;
  const ult=LS.get("ultLocal",{}); const rasc=novo?LS.get("rascNota",null):null;
  const n=ant?normNota(ant):{data:hojeISO(),hora:agoraHora(),cod:ult.cod||"",faz:ult.faz||"",talhao:ult.talhao||"",resp:ult.resp||"",cat:catPre||"",alvo:alvoPre||"",situacao:"Pendente",...(rasc&&!catPre?rasc:{})};
  midiasEdit=[...(n.midias||[])];
  const sel=(id,ops,v,vazio="Não informado")=>`<select class="f" id="${id}"><option value="">${vazio}</option>${ops.map(o=>`<option${o===v?" selected":""}>${esc(o)}</option>`).join("")}</select>`;
  return `<h2 class="tit">${novo?"Nova anotação":"Anotação"}</h2>${!novo?`<p class="sub">Criada em ${n.criado?new Date(n.criado).toLocaleString("pt-BR"):dataBR(n.data)}${n.alterado&&n.alterado!==n.criado?" · alterada em "+new Date(n.alterado).toLocaleString("pt-BR"):""}</p>`:""}
  ${rasc&&novo?`<div class="info">Recuperei o que você estava digitando antes. <button class="btn sec peq" type="button" id="descarta">Descartar rascunho</button></div>`:""}
  <form class="card" id="fn" autocomplete="off"><div class="fields">
    <div><label class="lb" for="n-data">Data *</label><input class="f" type="date" id="n-data" value="${esc(n.data)}"></div>
    <div><label class="lb" for="n-hora">Hora</label><input class="f" type="time" id="n-hora" value="${esc(n.hora||"")}"></div>
    <div><label class="lb" for="n-cod">Código fazenda</label><input class="f" id="n-cod" inputmode="numeric" value="${esc(n.cod)}"></div>
    <div><label class="lb" for="n-faz">Fazenda</label><input class="f" id="n-faz" list="listaFazendas" value="${esc(n.faz)}"></div>
    <div><label class="lb" for="n-tal">Talhão</label><input class="f" id="n-tal" list="listaTalhoes" value="${esc(n.talhao)}"></div>
    <div><label class="lb" for="n-resp">Responsável</label><input class="f" id="n-resp" value="${esc(n.resp||"")}"></div>
    <div class="full"><span class="sub" id="n-talInfo"></span></div>
    <div class="full"><label class="lb" for="n-cat">Categoria</label>${sel("n-cat",CATS,n.cat,"Escolha…")}</div>
    <div class="full" id="n-alvoBox"></div>
    <div class="full"><label class="lb" for="n-desc">Descrição *</label><textarea class="f" id="n-desc" placeholder="O que foi observado no campo…">${esc(n.desc)}</textarea></div>
    <div><label class="lb" for="n-int">Intensidade</label>${sel("n-int",["Baixa","Média","Alta","Muito alta"],n.intens)}</div>
    <div><label class="lb" for="n-pri">Prioridade</label>${sel("n-pri",PRIOR,n.prioridade)}</div>
    <div class="full"><label class="lb" for="n-prov">Providência recomendada ou tomada</label><textarea class="f" id="n-prov" style="min-height:70px">${esc(n.prov||"")}</textarea></div>
    <div class="full"><label class="lb" for="n-sit">Situação</label>${sel("n-sit",SITUACOES,n.situacao,"Sem situação")}</div>
  </div>
  <span class="lb" style="margin-top:14px">Fotos e vídeos</span><div class="midias" id="n-mid"></div>
  <div class="btns"><label class="btn sec" for="n-foto">📷 Foto</label><label class="btn sec" for="n-video">🎥 Vídeo</label><label class="btn sec" for="n-gal">🖼️ Galeria</label><button class="btn sec" type="button" id="n-gps">📍 ${n.lat?"Local marcado ✓":"Marcar local"}</button></div>
  <input type="file" accept="image/*" capture="environment" id="n-foto" class="vh"><input type="file" accept="video/*" capture="environment" id="n-video" class="vh"><input type="file" accept="image/*,video/*" id="n-gal" class="vh" multiple>
  <p class="sub" id="n-gpsTxt">${n.lat?`Local: ${fmt(n.lat,6)}, ${fmt(n.lon,6)} (±${fmt(n.prec,0)} m) · <a href="https://www.google.com/maps?q=${n.lat},${n.lon}" target="_blank" rel="noopener">ver no mapa</a>`:"Local é opcional e só é marcado se você tocar no botão."}</p>
  <div class="btns"><button class="btn" type="submit">💾 Salvar</button>${!novo?`<a class="btn wa" id="n-wa" href="#" target="_blank" rel="noopener">📤 WhatsApp</a><button class="btn sec" type="button" id="n-del">🗑️ Excluir</button>`:""}<a class="btn sec" href="#/notas">Voltar</a></div></form>`;
};
ROTAS.nota.after=async(id,catPre,alvoPre)=>{
  const novo=!id||id==="nova"; const ant=novo?null:await pega("notas","notas",Number(id)); if(!novo&&!ant) return;
  const rec=ant?normNota(ant):{id:uid()};
  const cod=$("#n-cod"), faz=$("#n-faz"), tal=$("#n-tal");
  await listasLocal(cod.value);
  const talInfo=async()=>{ const t=await pega("guia","talhoes",talId(cod.value,tal.value)); $("#n-talInfo").innerHTML = !tal.value?"": t?`✓ Talhão cadastrado: ${[t.area?fmt(t.area,2)+" ha":"",t.variedade,t.estagio,t.solo].filter(Boolean).map(esc).join(" · ")}`:`Talhão não cadastrado. <a href="#/cad/${esc(cod.value)}">Cadastrar</a>`; };
  cod.addEventListener("input",()=>{ cod.value=cod.value.replace(/\D/g,""); if(FAZENDAS[cod.value]) faz.value=FAZENDAS[cod.value]; listasLocal(cod.value); talInfo(); });
  faz.addEventListener("input",()=>{ const c=Object.entries(FAZENDAS).filter(([k,v])=>v.toUpperCase()===faz.value.trim().toUpperCase()); if(c.length===1){ cod.value=c[0][0]; listasLocal(cod.value); } talInfo(); });
  tal.addEventListener("input",talInfo); talInfo();
  const alvoBox=()=>{ const c=$("#n-cat").value, v=rec.alvo||alvoPre||""; let h="";
    if(c==="Praga"||c==="Doença"){ const xs=ITENS.filter(x=>x.tipo===(c==="Praga"?"praga":"doenca"));
      h=`<div class="fields"><div class="full"><label class="lb" for="n-alvo">${c==="Praga"?"Praga":"Doença"}</label><select class="f" id="n-alvo"><option value="">Não identificada</option>${xs.map(x=>`<option value="${x.id}"${x.id===v?" selected":""}>${esc(x.nome)}</option>`).join("")}</select></div>
        <div class="full"><label class="lb" for="n-diag">Identificação</label><select class="f" id="n-diag">${["Suspeita visual","Identificação confirmada no campo","Diagnóstico confirmado"].map(o=>`<option${o===(rec.diag||"Suspeita visual")?" selected":""}>${o}</option>`).join("")}</select><span class="sub">"Diagnóstico confirmado" só com laudo ou avaliação técnica.</span></div></div>`; }
    else if(c==="Planta daninha"){ h=`<div class="fields"><div class="full"><label class="lb" for="n-alvo">Espécie</label><select class="f" id="n-alvo"><option value="">Não identificada / suspeita</option>${(typeof DANINHAS!=="undefined"?DANINHAS:[]).map(w=>`<option value="${w.id}"${w.id===v?" selected":""}>${esc(w.nome)}</option>`).join("")}</select></div>
        <div><label class="lb" for="n-estd">Estágio da daninha</label><select class="f" id="n-estd"><option value="">Não informado</option>${["Plântula","Até 4 folhas","Perfilhando","Florescendo","Com sementes"].map(o=>`<option${o===rec.estd?" selected":""}>${o}</option>`).join("")}</select></div>
        <div><label class="lb" for="n-estc">Estágio da cana</label><input class="f" id="n-estc" value="${esc(rec.estc||"")}"></div>
        <div class="full"><label class="lb" for="n-res">Resultado após o manejo</label><input class="f" id="n-res" value="${esc(rec.resultado||"")}"></div></div>
        <div class="info" style="margin-top:10px">Para herbicida e dose, use o app <a href="daninhas/">Daninhas da Cana</a> (doses de bula). Varie o mecanismo de ação: repetir o mesmo grupo favorece a resistência.</div>`; }
    $("#n-alvoBox").innerHTML=h; };
  $("#n-cat").addEventListener("change",()=>{ rec.alvo=""; alvoBox(); }); alvoBox();
  const mostraMid=()=>{ $("#n-mid").innerHTML=midiasEdit.map((m,i)=>`<div class="m">${m.type==="video"?`<video src="${urlDe(m.blob)}" data-zoom="1" muted></video><span class="v">▶ vídeo</span>`:`<img src="${urlDe(m.blob)}" data-zoom="1" alt="">`}<button type="button" data-rm="${i}" aria-label="Remover">✕</button></div>`).join("")||`<span class="sub">Nenhuma foto ou vídeo.</span>`;
    $$("[data-rm]").forEach(b=>b.onclick=()=>{ midiasEdit.splice(Number(b.dataset.rm),1); mostraMid(); }); };
  mostraMid();
  const add=async e=>{ for(const f of e.target.files){ const v=(f.type||"").startsWith("video");
      if(v&&f.size>80*1048576) toast("Vídeo grande ("+fmt(f.size/1048576,0)+" MB): pode ocupar muito espaço no aparelho",1);
      midiasEdit.push({type:v?"video":"image",blob:v?f:await reduz(f),nome:f.name}); } e.target.value=""; mostraMid(); };
  ["n-foto","n-video","n-gal"].forEach(i=>$("#"+i).onchange=add);
  $("#n-gps").onclick=()=>{ if(!navigator.geolocation){ $("#n-gpsTxt").textContent="Este aparelho não oferece localização ao app."; return; } $("#n-gpsTxt").textContent="Buscando sinal de GPS…";
    navigator.geolocation.getCurrentPosition(p=>{ rec.lat=p.coords.latitude; rec.lon=p.coords.longitude; rec.prec=p.coords.accuracy; $("#n-gpsTxt").textContent=`Local: ${fmt(rec.lat,6)}, ${fmt(rec.lon,6)} (±${fmt(rec.prec,0)} m)`; $("#n-gps").textContent="📍 Local marcado ✓"; },
      e=>{ $("#n-gpsTxt").textContent=e.code===1?"Permissão de localização negada. A anotação pode ser salva sem local.":"Sem sinal de GPS agora. Tente em área aberta."; },{enableHighAccuracy:true,timeout:20000}); };
  const form=$("#fn"); const ids=["data","hora","cod","faz","tal","resp","cat","desc","int","pri","prov","sit"];
  const ler=()=>{ const o={}; ids.forEach(k=>o[k]=$("#n-"+k).value.trim()); return o; };
  if(novo) form.addEventListener("input",()=>{ const o=ler(); LS.set("rascNota",{data:o.data,hora:o.hora,cod:o.cod,faz:o.faz,talhao:o.tal,resp:o.resp,cat:o.cat,desc:o.desc,intens:o.int,prioridade:o.pri,prov:o.prov,situacao:o.sit}); });
  const desc=$("#descarta"); if(desc) desc.onclick=()=>{ LS.set("rascNota",null); render(); };
  form.onsubmit=async e=>{ e.preventDefault(); const o=ler();
    if(!o.data){ toast("Informe a data",1); return; } if(!o.desc && !midiasEdit.length){ toast("Escreva a descrição ou anexe uma foto",1); $("#n-desc").focus(); return; }
    const alvoEl=$("#n-alvo"), alvo=alvoEl?alvoEl.value:""; const alvoNome= alvo ? (item(alvo)?.nome || (typeof DANINHAS!=="undefined"&&DANINHAS.find(w=>w.id===alvo)?.nome) || "") : "";
    const r=carimbo({...rec,data:o.data,hora:o.hora,cod:o.cod,faz:o.faz||fazNome(o.cod),talhao:o.tal.toUpperCase(),resp:o.resp,cat:o.cat,alvo,alvoNome,diag:$("#n-diag")?.value||"",estd:$("#n-estd")?.value||"",estc:$("#n-estc")?.value.trim()||"",resultado:$("#n-res")?.value.trim()||"",
      desc:o.desc,intens:o.int,prioridade:o.pri,prov:o.prov,situacao:o.sit,midias:midiasEdit});
    Object.assign(r,{codigo:r.cod,fazenda:r.faz,texto:r.desc,media:r.midias[0]||null}); /* compatível com a versão 1 */
    try{ await grava("notas","notas",r); }catch(err){ toast("NÃO foi salvo: "+(err.message||"erro de armazenamento")+". Tente remover vídeos grandes.",1); return; }
    const conf=await pega("notas","notas",r.id); if(!conf){ toast("NÃO foi possível confirmar a gravação. Tente de novo.",1); return; }
    if(novo) LS.set("rascNota",null); LS.set("ultLocal",{cod:r.cod,faz:r.faz,talhao:r.talhao,resp:r.resp});
    toast("Anotação salva neste aparelho ✓"); go("#/nota/"+r.id); };
  if(!novo){ const r=normNota(ant); const txt=[`*Guia da Cana — anotação de campo*`,`${dataBR(r.data)} ${r.hora||""}`,`Fazenda: ${r.cod?r.cod+" - ":""}${r.faz||"—"} · Talhão: ${r.talhao||"—"}`,`Categoria: ${r.cat||"—"}${r.alvoNome?" — "+r.alvoNome:""}${r.diag?" ("+r.diag+")":""}`,
      r.intens?`Intensidade: ${r.intens}`:"",r.prioridade?`Prioridade: ${r.prioridade}`:"",`Situação: ${r.situacao||"—"}`,"",r.desc,r.prov?`\nProvidência: ${r.prov}`:"",r.lat?`\nLocal: https://www.google.com/maps?q=${r.lat},${r.lon}`:""].filter(Boolean).join("\n");
    const wa=$("#n-wa"); wa.href="https://wa.me/?text="+encodeURIComponent(txt);
    wa.onclick=async ev=>{ try{ const m=r.midias.find(x=>x.type==="image")||r.midias[0]; if(m&&navigator.canShare){ const f=new File([m.blob],m.type==="video"?"video.mp4":"foto.jpg",{type:m.blob.type||(m.type==="video"?"video/mp4":"image/jpeg")}); if(navigator.canShare({files:[f]})){ ev.preventDefault(); await navigator.share({text:txt,files:[f]}); return; } } if(navigator.share){ ev.preventDefault(); await navigator.share({text:txt}); } }catch(_){} };
    const del=$("#n-del"); del.onclick=async()=>{ if(del.dataset.ok!=="1"){ del.dataset.ok="1"; del.textContent="Toque de novo para excluir"; return; } await apaga("notas","notas",rec.id); toast("Anotação excluída"); go("#/notas"); }; }
};
async function reduz(file,max=1600){ try{ const bmp=await createImageBitmap(file); const k=Math.min(1,max/Math.max(bmp.width,bmp.height)); const c=document.createElement("canvas"); c.width=Math.round(bmp.width*k); c.height=Math.round(bmp.height*k); c.getContext("2d").drawImage(bmp,0,0,c.width,c.height); return await new Promise(ok=>c.toBlob(b=>ok(b||file),"image/jpeg",.85)); }catch(_){ return file; } }

/* ---------- Monitoramento ---------- */
async function eventosTalhao(){
  const ev=[];
  (await notasTodas()).forEach(n=>ev.push({k:talId(n.cod,n.talhao),data:n.data,tipo:"nota",cat:n.cat||"Outros",sit:n.situacao,n}));
  const dnV=await todos("dan","vistorias"); dnV.forEach(v=>ev.push({k:talId(v.cod,v.talhao),data:v.data,tipo:"daninha",cat:"Planta daninha",sit:v.acomp==="Sim"?"Em andamento":"",v}));
  const dnA=await todos("dan","aplicacoes"); dnA.forEach(a=>ev.push({k:talId(a.cod,a.talhao),data:a.data,tipo:"aplic",cat:"Aplicação de herbicida",a}));
  const cs=await todos("guia","calculos"); cs.forEach(c=>ev.push({k:talId(c.cod,c.talhao),data:(c.quando||"").slice(0,10),tipo:"calc",cat:"Cálculo",c}));
  return ev;
}
const barras=obj=>{ const e=Object.entries(obj).sort((a,b)=>b[1]-a[1]); const mx=Math.max(1,...e.map(x=>x[1])); return `<div class="bars">${e.map(([k,v])=>`<div class="bar"><span>${esc(k)}</span><i style="width:${v/mx*100}%"></i><b>${v}</b></div>`).join("")}</div>`; };
ROTAS.monit=async()=>{
  const ev=await eventosTalhao(); const ocorr=ev.filter(e=>e.tipo==="nota"||e.tipo==="daninha");
  if(!ocorr.length) return `<h2 class="tit">Monitoramento</h2><div class="vazio">Ainda não há ocorrências registradas.<br><a class="btn" href="#/nota/nova" style="margin-top:12px">📝 Registrar a primeira</a></div>`;
  const porCat={}, porMes={}, porSit={"Pendente":0,"Em andamento":0,"Concluída":0}; const porTal={};
  ocorr.forEach(e=>{ porCat[e.cat]=(porCat[e.cat]||0)+1; const m=(e.data||"").slice(0,7); if(m) porMes[m.split("-").reverse().join("/")]=(porMes[m.split("-").reverse().join("/")]||0)+1; if(e.sit in porSit) porSit[e.sit]++; (porTal[e.k] ||= []).push(e); });
  const tals=await todos("guia","talhoes");
  return `<h2 class="tit">Monitoramento</h2><div class="btns" style="margin-top:0"><a class="btn" href="#/nota/nova">📝 Nova ocorrência</a><a class="btn sec" href="daninhas/#/vistoria/nova">🌿 Vistoria de daninhas ↗</a></div>
    <div class="stat" style="margin-top:14px"><div><b style="color:var(--warn)">${porSit["Pendente"]}</b><span>novas / pendentes</span></div><div><b style="color:var(--mid)">${porSit["Em andamento"]}</b><span>em acompanhamento</span></div>
      <div><b style="color:var(--ok)">${porSit["Concluída"]}</b><span>resolvidas</span></div><div><b>${Object.keys(porTal).length}</b><span>talhões com ocorrência</span></div></div>
    <div class="card" style="margin-top:14px"><h3>Por categoria</h3>${barras(porCat)}</div>
    <div class="card"><h3>Por mês</h3>${barras(porMes)}</div>
    <h3>Talhões</h3>${Object.entries(porTal).sort((a,b)=>b[1].length-a[1].length).map(([k,l])=>{ const [cod,t]=k.split("|"); const tc=tals.find(x=>x.id===k); const pend=l.filter(e=>e.sit==="Pendente"||e.sit==="Em andamento").length;
      return `<a class="item" href="#/talhao/${encodeURIComponent(k)}"><div class="thumb">🗺️</div><div class="t"><h4>${esc(fazNome(cod)||cod)} · Talhão ${esc(t)}</h4><p>${l.length} ocorrência(s)${pend?` · <b style="color:var(--warn)">${pend} em aberto</b>`:""}${tc&&tc.area?" · "+fmt(tc.area,2)+" ha":""}</p></div><div class="chev">›</div></a>`; }).join("")}
    <p class="sub">Inclui as anotações deste app e as vistorias do app Daninhas feitas neste celular. Mapa de infestação não aparece porque o app ainda não tem os contornos dos talhões.</p>`;
};
ROTAS.talhao=async(k)=>{
  const [cod,t]=k.split("|"); const tc=await pega("guia","talhoes",k); const ev=(await eventosTalhao()).filter(e=>e.k===k).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  const nomeDan=id=>(typeof DANINHAS!=="undefined"&&DANINHAS.find(w=>w.id===id)?.nome)||id||"—";
  return `<a class="btn sec peq" href="#/monit">‹ Monitoramento</a>
    <div class="card" style="margin-top:10px"><h2 class="tit" style="margin:0">${esc(fazNome(cod)||cod)} · Talhão ${esc(t)}</h2>
      ${tc?`<p class="sub" style="margin:6px 0 0">${[tc.area?fmt(tc.area,2)+" ha":"",tc.tipo,tc.variedade,tc.estagio,tc.solo?"Solo "+tc.solo.toLowerCase():""].filter(Boolean).map(esc).join(" · ")}</p><div class="btns"><a class="btn sec peq" href="#/cad/${esc(cod)}/${encodeURIComponent(k)}">✏️ Editar cadastro</a></div>`
          :`<p class="sub" style="margin:6px 0 0">Talhão não cadastrado. <a href="#/cad/${esc(cod)}">Cadastrar</a></p>`}
      <div class="btns"><a class="btn" href="#/nota/nova">📝 Nova ocorrência</a></div></div>
    <h3>Histórico (${ev.length})</h3>
    ${ev.length?`<div class="hist">${ev.map(e=>`<div class="ev"><small>${dataBR(e.data)}</small><br>${
      e.tipo==="nota"?`<a href="#/nota/${e.n.id}"><b>${esc(e.n.cat||"Anotação")}${e.n.alvoNome?": "+esc(e.n.alvoNome):""}</b></a> ${sitBadge(e.n.situacao)}<br><span>${esc((e.n.desc||"").slice(0,140))}</span>`
      :e.tipo==="daninha"?`<a href="daninhas/#/vistoria/${e.v.id}"><b>Planta daninha: ${esc(e.v.esp==="outra"?(e.v.outra||"outra"):nomeDan(e.v.esp))}</b></a> <span class="badge b-ref">app Daninhas</span><br><span>${esc([e.v.nivel&&"Infestação "+e.v.nivel.toLowerCase(),e.v.estd,e.v.dist].filter(Boolean).join(" · "))}</span>`
      :e.tipo==="aplic"?`<a href="daninhas/#/aplicacao/${e.a.id}"><b>Aplicação: ${esc(e.a.produto)}</b></a> <span class="badge b-ref">app Daninhas</span><br><span>${esc(e.a.resultado||"resultado não avaliado")}</span>`
      :`<a href="calculadora/#/h/${e.c.id}"><b>Cálculo: ${esc(e.c.titulo)}</b></a> <span class="badge b-ref">Calculadora</span><br><span>${esc((e.c.rows.find(r=>r.main)||e.c.rows[0]||{}).label||"")}: ${(()=>{ const r=e.c.rows.find(r=>r.main)||e.c.rows[0]; return r?esc(fmt(r.val,r.dec)+" "+r.unit):""; })()}</span>`}</div>`).join("")}</div>`
    :`<div class="vazio">Nenhum registro neste talhão.</div>`}`;
};

/* ---------- Relatórios e backup ---------- */
const filR=Object.assign({de:"",ate:"",cod:"",tal:"",cat:"",alvo:"",resp:"",sit:""},LS.get("filR",{}));
const passaR=n=>(!filR.de||n.data>=filR.de)&&(!filR.ate||n.data<=filR.ate)&&(!filR.cod||n.cod===filR.cod)&&(!filR.tal||norm(n.talhao)===norm(filR.tal))&&(!filR.cat||n.cat===filR.cat)
  &&(!filR.alvo||norm(n.alvoNome||"").includes(norm(filR.alvo)))&&(!filR.resp||norm(n.resp||"").includes(norm(filR.resp)))&&(!filR.sit||(n.situacao||"Sem situação")===filR.sit);
function baixa(nome,conteudo,tipo){ const b=conteudo instanceof Blob?conteudo:new Blob([conteudo],{type:tipo}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=nome; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },2000); }
const csv=l=>"﻿"+l.map(r=>r.map(c=>{ const s=String(c??""); return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(";")).join("\n");
const b64=b=>new Promise(ok=>{ const r=new FileReader(); r.onload=()=>ok(r.result); r.readAsDataURL(b); });
ROTAS.rel=async()=>{
  const ns=(await notasTodas()).filter(passaR);
  let est=""; try{ const e=await navigator.storage.estimate(); est=`O app usa ${fmt(e.usage/1048576,1)} MB de ${fmt(e.quota/1048576,0)} MB disponíveis no navegador.`; }catch(_){}
  let pers=null; try{ pers=await navigator.storage.persisted(); }catch(_){}
  const ativos=Object.values(filR).filter(Boolean).length;
  return `<div class="printonly"><h2>Guia da Cana — relatório de ocorrências</h2><p>Gerado em ${new Date().toLocaleString("pt-BR")}${ativos?" · filtros: "+Object.entries(filR).filter(([,v])=>v).map(([k,v])=>k+"="+v).join(", "):""}</p></div>
  <h2 class="tit">Relatórios</h2>
  <details class="card noprint" open><summary style="font-weight:700;color:var(--accent-strong)">Filtros${ativos?` (${ativos})`:""}</summary><div class="fields" style="margin-top:10px">
    <div><label class="lb" for="rde">De</label><input class="f" type="date" id="rde" value="${filR.de}"></div><div><label class="lb" for="rate">Até</label><input class="f" type="date" id="rate" value="${filR.ate}"></div>
    <div><label class="lb" for="rcod">Código fazenda</label><input class="f" id="rcod" inputmode="numeric" value="${esc(filR.cod)}"></div><div><label class="lb" for="rtal">Talhão</label><input class="f" id="rtal" value="${esc(filR.tal)}"></div>
    <div><label class="lb" for="rcat">Categoria</label><select class="f" id="rcat"><option value="">Todas</option>${CATS.map(c=>`<option${c===filR.cat?" selected":""}>${c}</option>`).join("")}</select></div>
    <div><label class="lb" for="ralvo">Tipo de ocorrência</label><input class="f" id="ralvo" value="${esc(filR.alvo)}" placeholder="ex.: broca"></div>
    <div><label class="lb" for="rresp">Responsável</label><input class="f" id="rresp" value="${esc(filR.resp)}"></div>
    <div><label class="lb" for="rsit">Situação</label><select class="f" id="rsit"><option value="">Todas</option>${[...SITUACOES,"Sem situação"].map(c=>`<option${c===filR.sit?" selected":""}>${c}</option>`).join("")}</select></div></div>
    <div class="btns"><button class="btn sec" id="rlimpa" type="button">Limpar filtros</button></div></details>
  <div class="btns noprint"><button class="btn" id="rpdf">🖨️ PDF (A4)</button><button class="btn sec" id="rcsv">📄 Planilha (CSV)</button></div>
  <p class="sub" style="margin-top:12px">${ns.length} ocorrência(s) no relatório</p>
  ${ns.map(n=>`<div class="card"><h3>${esc(n.cat||"Anotação")}${n.alvoNome?": "+esc(n.alvoNome):""} ${sitBadge(n.situacao)}</h3>
    <p class="sub" style="margin:0 0 6px">${dataBR(n.data)} ${n.hora||""} · ${esc(n.cod?n.cod+" — ":"")}${esc(n.faz||"—")} · Talhão ${esc(n.talhao||"—")}${n.resp?" · "+esc(n.resp):""}${n.diag?" · "+esc(n.diag):""}</p>
    <p style="white-space:pre-wrap;margin:6px 0">${esc(n.desc)}</p>${n.prov?`<p><b>Providência:</b> ${esc(n.prov)}</p>`:""}${n.intens||n.prioridade?`<p class="sub">${n.intens?"Intensidade "+esc(n.intens):""}${n.prioridade?" · Prioridade "+esc(n.prioridade):""}</p>`:""}
    ${n.midias.length?`<div class="midias">${n.midias.map(m=>m.type==="video"?`<div class="m"><video src="${urlDe(m.blob)}" data-zoom="1" muted></video><span class="v">▶ vídeo</span></div>`:`<div class="m"><img src="${urlDe(m.blob)}" data-zoom="1" alt=""></div>`).join("")}</div>`:""}</div>`).join("")||`<div class="vazio">Nenhuma ocorrência com esses filtros.</div>`}
  <div class="card noprint"><h3>Cópia de segurança</h3><p class="sub">Leva as anotações (com fotos e vídeos) e o cadastro de fazendas e talhões. Use para trocar de celular ou não perder nada.</p>
    <label style="display:flex;gap:8px;align-items:center;font-size:15.5px;margin-bottom:8px"><input type="checkbox" id="bkVid"> Incluir vídeos (arquivo fica bem maior)</label>
    <div class="btns"><button class="btn" id="bk">💾 Gerar backup</button><label class="btn sec" for="rs">♻️ Restaurar backup</label></div><input type="file" id="rs" accept=".json,application/json" class="vh"></div>
  <div class="info noprint"><b>Onde ficam os dados:</b> só neste celular, dentro do navegador. Nada é enviado a servidor. ${est} ${pers===true?"O armazenamento está protegido contra limpeza automática.":pers===false?"O navegador pode apagar os dados se faltar espaço: faça backup com frequência.":""}<br><br>
    <b>Ainda não existe:</b> sincronização entre celulares, login e permissões. Isso exige um servidor online (ex.: Firebase ou Supabase), que precisa ser contratado e configurado.</div>`;
};
ROTAS.rel.after=()=>{
  [["rde","de"],["rate","ate"],["rcod","cod"],["rtal","tal"],["rcat","cat"],["ralvo","alvo"],["rresp","resp"],["rsit","sit"]].forEach(([id,k])=>$("#"+id).onchange=e=>{ filR[k]=e.target.value.trim(); LS.set("filR",filR); render.keep=true; render(); });
  $("#rlimpa").onclick=()=>{ Object.keys(filR).forEach(k=>filR[k]=""); LS.set("filR",filR); render(); };
  $("#rpdf").onclick=()=>print();
  $("#rcsv").onclick=async()=>{ const ns=(await notasTodas()).filter(passaR); if(!ns.length){ toast("Nada para exportar",1); return; }
    baixa(`ocorrencias_guia_da_cana_${hojeISO()}.csv`,csv([["Data","Hora","Código","Fazenda","Talhão","Responsável","Categoria","Ocorrência","Identificação","Intensidade","Prioridade","Situação","Descrição","Providência","Fotos/vídeos","Latitude","Longitude"],
      ...ns.map(n=>[n.data,n.hora,n.cod,n.faz,n.talhao,n.resp,n.cat,n.alvoNome,n.diag,n.intens,n.prioridade,n.situacao,n.desc,n.prov,n.midias.length,n.lat??"",n.lon??""])]),"text/csv"); };
  $("#bk").onclick=async()=>{ const comVid=$("#bkVid").checked; toast("Gerando backup…");
    const ns=await todos("notas","notas"); const out=[];
    for(const n of ns){ const nn=normNota(n); const mids=[]; for(const m of nn.midias){ if(m.type==="video"&&!comVid) continue; mids.push({type:m.type,nome:m.nome||"",data:await b64(m.blob)}); }
      const {media,midias,...resto}=n; out.push({...resto,midias:mids}); }
    const j={app:"guia-da-cana",versao:4,gerado:new Date().toISOString(),notas:out,fazendas:await todos("guia","fazendas"),talhoes:await todos("guia","talhoes")};
    baixa(`backup_guia_da_cana_${hojeISO()}.json`,JSON.stringify(j),"application/json"); toast("Backup gerado ✓"); };
  $("#rs").onchange=async e=>{ const f=e.target.files[0]; if(!f) return;
    try{ const j=JSON.parse(await f.text()); if(j.app!=="guia-da-cana") throw 0; let n=0,mant=0;
      for(const r of j.notas||[]){ const ex=await pega("notas","notas",r.id); if(ex&&(ex.alterado||"")>(r.alterado||"")){ mant++; continue; }
        const mids=[]; for(const m of r.midias||[]) mids.push({type:m.type,nome:m.nome,blob:await (await fetch(m.data)).blob()});
        const rec={...r,midias:mids,media:mids[0]||null}; await grava("notas","notas",rec); n++; }
      for(const s of ["fazendas","talhoes"]) for(const r of j[s]||[]){ const ex=await pega("guia",s,r.cod&&s==="fazendas"?r.cod:r.id); if(ex&&(ex.alterado||"")>(r.alterado||"")){ mant++; continue; } await grava("guia",s,r); n++; }
      toast(`Restaurado: ${n} registro(s)${mant?`; ${mant} mais recente(s) mantido(s)`:""}`); render(); }
    catch(_){ toast("Arquivo de backup inválido",1); } e.target.value=""; };
};

/* ---------- Ampliar foto ou vídeo ---------- */
document.addEventListener("click",e=>{ const el=e.target.closest("[data-zoom]"); if(!el) return; e.preventDefault();
  $("#zoomIn").innerHTML= el.tagName==="VIDEO" ? `<video src="${el.src}" controls autoplay playsinline style="max-width:100vw;max-height:100vh"></video>` : `<img src="${el.currentSrc||el.src}" alt="">`; $("#zoom").hidden=false; });
$("#zoom button").onclick=()=>{ $("#zoom").hidden=true; $("#zoomIn").innerHTML=""; };

/* ---------- Off-line e instalação ---------- */
function updateOffline(){ $("#offlineBadge").classList.toggle("show",!navigator.onLine); }
addEventListener("online",updateOffline); addEventListener("offline",updateOffline); updateOffline();
if("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).catch(()=>{}));
if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(()=>{});
let deferredInstall=null; const installBtn=$("#openInstall"), sheet=$("#installSheet");
const INST_KEY="instalado:guia"; let jaInst=false; try{ jaInst=localStorage.getItem(INST_KEY)==="1"; }catch(_){}
if((matchMedia("(display-mode: standalone)").matches||navigator.standalone===true)) installBtn.hidden=true;
addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredInstall=e; installBtn.hidden=false; });
installBtn.onclick=async()=>{ if(deferredInstall){ deferredInstall.prompt(); const r=await deferredInstall.userChoice; deferredInstall=null; if(r&&r.outcome==="accepted") installBtn.hidden=true; return; } sheet.hidden=false; };
$("#closeInstall").onclick=()=>sheet.hidden=true; sheet.onclick=e=>{ if(e.target===sheet) sheet.hidden=true; };
addEventListener("appinstalled",()=>{ installBtn.hidden=true; try{ localStorage.setItem(INST_KEY,"1"); }catch(_){} });
listasLocal(""); render();
