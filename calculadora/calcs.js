/* =====================================================================
   Calculadora da Cana — fórmulas (versão 2)
   Cada cálculo declara as entradas (com unidade e limites) e uma função
   compute(v) que devolve resultados, etapas da memória e premissas.
   Precisão interna completa; arredondamento só na exibição.
   As 12 contas da versão 1 foram mantidas com as mesmas fórmulas.
   ===================================================================== */
"use strict";
const CALC_VERSAO = "2.0 (14/10/2026)";
const nfx = (x,d)=> (x===null||x===undefined||!isFinite(x)) ? "—" : new Intl.NumberFormat("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}).format(x);
const R = (label,val,unit,dec,main)=>({label,val,unit,dec,main:!!main});
const MODULOS = {
  campo:{nome:"Campo",ic:"🌱",desc:"Perfilhos, TCH estimado, falhas, capacidade operacional"},
  adubo:{nome:"Adubação",ic:"🧪",desc:"Fertilizante, nutrientes, vinhaça e torta"},
  colheita:{nome:"Colheita",ic:"🌾",desc:"Maturação, ATR, desempenho e metas"},
  diesel:{nome:"Diesel",ic:"⛽",desc:"Consumo, custo e previsto x real"},
  uteis:{nome:"Medidas úteis",ic:"📏",desc:"Área, sulco e conversor de unidades"}
};

/* Conversor de unidades: só dentro da mesma grandeza (fator para a unidade base) */
const UNIDADES = {
  comprimento:{nome:"Comprimento", u:{m:["metro (m)",1], km:["quilômetro (km)",1000]}},
  area:{nome:"Área", u:{m2:["metro² (m²)",1], ha:["hectare (ha)",10000], alq:["alqueire paulista (alq)",24200]}},
  volume:{nome:"Volume", u:{mL:["mililitro (mL)",0.001], L:["litro (L)",1], m3:["metro³ (m³)",1000]}},
  massa:{nome:"Massa", u:{g:["grama (g)",0.001], kg:["quilograma (kg)",1], t:["tonelada (t)",1000]}},
  tempo:{nome:"Tempo", u:{min:["minuto (min)",1/60], h:["hora (h)",1]}},
  velocidade:{nome:"Velocidade", u:{kmh:["km/h",1], ms:["m/s",3.6]}},
  produtividade:{nome:"Produtividade", u:{tha:["t/ha",1], kgha:["kg/ha",0.001], talq:["t/alq",1/2.42]}},
  consumoArea:{nome:"Consumo por área", u:{Lha:["L/ha",1], Lalq:["L/alq",1/2.42]}},
  consumoHora:{nome:"Consumo por tempo", u:{Lh:["L/h",1], Lmin:["L/min",60]}},
  doseLiq:{nome:"Dose líquida por área", u:{Lha:["L/ha",1], mLha:["mL/ha",0.001]}},
  doseSol:{nome:"Dose sólida por área", u:{kgha:["kg/ha",1], gha:["g/ha",0.001], tha:["t/ha",1000]}}
};

const CALCS = [
/* ---------------- CAMPO ---------------- */
{ mod:"campo", id:"perf", title:"População de perfilhos",
  desc:"Conte os perfilhos num trecho da linha. A conta leva para metro e para hectare.",
  inputs:[{id:"n",label:"Perfilhos contados",unit:"un",int:true},{id:"m",label:"Metros de linha contados",unit:"m",def:"10",min:0.1},
          {id:"esp",label:"Espaçamento entre linhas",unit:"m",def:"1,5",min:0.3,warn:[0.8,2.5],full:true}],
  compute:v=>{ const pm=v.n/v.m, ha=pm*10000/v.esp;
    return {rows:[R("Perfilhos por metro",pm,"perf/m",1),R("Perfilhos por hectare",ha,"perf/ha",0,1)],
      steps:[`Perfilhos/m = ${nfx(v.n,0)} ÷ ${nfx(v.m,2)} m = ${nfx(pm,3)}`,`Metros de linha/ha = 10.000 m² ÷ ${nfx(v.esp,2)} m = ${nfx(10000/v.esp,1)} m`,`Perfilhos/ha = ${nfx(pm,3)} × ${nfx(10000/v.esp,1)} = ${nfx(ha,0)}`],
      prem:["Espaçamento simples e uniforme na área."]}; } },
{ mod:"campo", id:"tch", title:"Estimativa de produtividade (TCH)",
  desc:"Conte os colmos num trecho, pese uma amostra e calcule o peso médio de um colmo. É estimativa, não pesagem.",
  inputs:[{id:"n",label:"Colmos contados",unit:"un",int:true},{id:"m",label:"Metros de linha contados",unit:"m",def:"10",min:0.1},
          {id:"peso",label:"Peso médio do colmo",unit:"kg",def:"1,2",warn:[0.3,3]},{id:"esp",label:"Espaçamento entre linhas",unit:"m",def:"1,5",min:0.3,warn:[0.8,2.5]},
          {id:"area",label:"Área do talhão",unit:"ha",opt:true,area:true,full:true}],
  compute:v=>{ const cm=v.n/v.m, mha=10000/v.esp, cha=cm*mha, tch=cha*v.peso/1000; const rows=[R("Colmos por metro",cm,"colmos/m",1),R("Colmos por hectare",cha,"colmos/ha",0),R("TCH estimado",tch,"t/ha",1,1)];
    const steps=[`Colmos/m = ${nfx(v.n,0)} ÷ ${nfx(v.m,2)} = ${nfx(cm,3)}`,`Colmos/ha = ${nfx(cm,3)} × (10.000 ÷ ${nfx(v.esp,2)}) = ${nfx(cha,0)}`,`TCH = ${nfx(cha,0)} × ${nfx(v.peso,3)} kg ÷ 1.000 = ${nfx(tch,2)} t/ha`];
    if(v.area>0){ rows.push(R("Produção estimada do talhão",tch*v.area,"t",0)); steps.push(`Produção = ${nfx(tch,2)} × ${nfx(v.area,2)} ha = ${nfx(tch*v.area,1)} t`); }
    return {rows,steps,prem:["Estimativa por amostragem: não substitui a pesagem.","Amostra representativa do talhão."], tag:["Estimativa","mid"]}; } },
{ mod:"campo", id:"falha", title:"Falhas de plantio",
  desc:"Some só as falhas maiores que 0,5 m ao longo da linha avaliada (método de Stolf).",
  inputs:[{id:"m",label:"Metros de linha avaliados",unit:"m",def:"100",min:1},{id:"f",label:"Soma das falhas acima de 0,5 m",unit:"m",zeroOk:true}],
  check:v=> v.f>v.m ? ["A soma das falhas não pode ser maior que os metros avaliados."] : [],
  compute:v=>{ const p=v.f/v.m*100;
    const c = p<=10?["Excelente","ok"]: p<=20?["Normal","ok"]: p<=35?["Subnormal","mid"]: p<=50?["Ruim","warn"]:["Péssimo","warn"];
    return {rows:[R("Falhas",p,"%",1,1)],tag:["Plantio "+c[0].toLowerCase(),c[1]],steps:[`Falhas = ${nfx(v.f,2)} ÷ ${nfx(v.m,2)} × 100 = ${nfx(p,2)}%`],
      prem:["Classes de Stolf (1986): até 10% excelente · 10–20% normal · 20–35% subnormal · 35–50% ruim · acima de 50% péssimo."]}; } },
{ mod:"campo", id:"capop", title:"Capacidade operacional",
  desc:"Para qualquer operação mecanizada (plantio, cultivo, pulverização, adubação). Separa capacidade teórica de efetiva.",
  inputs:[{id:"area",label:"Área a trabalhar",unit:"ha",area:true},{id:"feita",label:"Área já executada",unit:"ha",opt:true},
          {id:"larg",label:"Largura efetiva de trabalho",unit:"m",min:0.1,warn:[1,40]},{id:"vel",label:"Velocidade operacional",unit:"km/h",min:0.1,warn:[1,25]},
          {id:"ef",label:"Eficiência de campo",unit:"%",def:"70",min:1,max:100,warn:[40,95]},{id:"turno",label:"Tempo disponível por turno",unit:"h",def:"8",min:0.1,max:24},
          {id:"par",label:"Paradas por turno",unit:"h",opt:true,def:"0"},{id:"nq",label:"Quantidade de equipamentos",unit:"un",def:"1",min:1,int:true},
          {id:"prazo",label:"Prazo para terminar",unit:"turnos",opt:true}],
  check:v=>{ const e=[]; if(v.feita>v.area) e.push("A área executada é maior que a área a trabalhar."); if(v.par>=v.turno) e.push("As paradas ocupam o turno inteiro."); return e; },
  compute:v=>{ const cct=v.larg*v.vel/10, cce=cct*v.ef/100, par=isFinite(v.par)?v.par:0, hu=v.turno-par, feita=isFinite(v.feita)?v.feita:0;
    const turnoEq=cce*hu, turnoTot=turnoEq*v.nq, rest=v.area-feita, horas=rest/(cce*v.nq), turnos=rest/turnoTot;
    const rows=[R("Capacidade teórica",cct,"ha/h",2),R("Capacidade efetiva",cce,"ha/h",2,1),R("Área por turno (cada equipamento)",turnoEq,"ha",1),
      R("Área por turno (todos)",turnoTot,"ha",1),R("Área restante",rest,"ha",1),R("Horas efetivas para concluir",horas,"h",1),R("Turnos para concluir",turnos,"turnos",1)];
    const steps=[`Capacidade teórica = ${nfx(v.larg,2)} m × ${nfx(v.vel,2)} km/h ÷ 10 = ${nfx(cct,3)} ha/h`,`Capacidade efetiva = ${nfx(cct,3)} × ${nfx(v.ef,0)}% = ${nfx(cce,3)} ha/h`,
      `Horas úteis por turno = ${nfx(v.turno,1)} − ${nfx(par,1)} = ${nfx(hu,2)} h`,`Área por turno = ${nfx(cce,3)} × ${nfx(hu,2)} × ${nfx(v.nq,0)} equip. = ${nfx(turnoTot,2)} ha`,
      `Área restante = ${nfx(v.area,2)} − ${nfx(feita,2)} = ${nfx(rest,2)} ha`,`Turnos = ${nfx(rest,2)} ÷ ${nfx(turnoTot,2)} = ${nfx(turnos,2)}`];
    if(v.prazo>0){ const nec=Math.ceil(rest/(turnoEq*v.prazo)); rows.push(R("Equipamentos necessários no prazo",nec,"un",0)); steps.push(`Equipamentos = ${nfx(rest,2)} ÷ (${nfx(turnoEq,2)} ha × ${nfx(v.prazo,1)} turnos) = ${nfx(rest/(turnoEq*v.prazo),2)} → ${nec}`); }
    return {rows,steps,prem:["Capacidade teórica = largura × velocidade, sem perdas.","Efetiva = teórica × eficiência (manobras, abastecimento, regulagens).","Não considera deslocamento entre talhões nem chuva."]}; } },

/* ---------------- ADUBAÇÃO ---------------- */
{ mod:"adubo", id:"adubo", title:"Dose de fertilizante pela recomendação do nutriente",
  desc:"Converte a recomendação do nutriente (da análise e do agrônomo) em quantidade do produto comercial.",
  inputs:[{id:"rec",label:"Recomendação do nutriente",unit:"kg/ha"},{id:"teor",label:"Teor do nutriente no produto",unit:"%",min:0.1,max:100},
          {id:"area",label:"Área do talhão",unit:"ha",opt:true,area:true},{id:"saco",label:"Peso do saco / big bag",unit:"kg",def:"50",opt:true}],
  compute:v=>{ const kg=v.rec/(v.teor/100); const rows=[R("Produto por hectare",kg,"kg/ha",0,1)]; const steps=[`Produto = ${nfx(v.rec,1)} kg/ha ÷ (${nfx(v.teor,1)}% ÷ 100) = ${nfx(kg,2)} kg/ha`];
    if(v.area>0){ const tot=kg*v.area; rows.push(R("Total no talhão",tot,"kg",0),R("Em toneladas",tot/1000,"t",2)); steps.push(`Total = ${nfx(kg,2)} × ${nfx(v.area,2)} ha = ${nfx(tot,1)} kg`);
      if(v.saco>0){ rows.push(R("Sacos / big bags",Math.ceil(tot/v.saco),"un",0)); steps.push(`Sacos = ${nfx(tot,1)} ÷ ${nfx(v.saco,0)} kg (arredondado para cima)`); } }
    return {rows,steps,prem:["A recomendação do nutriente vem da análise de solo e do agrônomo; a conta não gera recomendação."]}; } },
{ mod:"adubo", id:"fert", title:"Fertilizante formulado: quantidade, nutrientes e cargas",
  desc:"Parte da dose do produto comercial já recomendada. Mostra quanto de N, P₂O₅ e K₂O essa dose fornece.",
  inputs:[{id:"prod",label:"Produto (nome / formulação)",kind:"txt",opt:true,full:true},
          {id:"N",label:"N no produto",unit:"%",opt:true,max:100},{id:"P",label:"P₂O₅ no produto",unit:"%",opt:true,max:100},{id:"K",label:"K₂O no produto",unit:"%",opt:true,max:100},
          {id:"dose",label:"Dose do produto (recomendada)",unit:"kg/ha",warn:[20,2000]},{id:"area",label:"Área",unit:"ha",area:true},
          {id:"areas",label:"Outras áreas (separe por ;)",kind:"txt",opt:true,unit:"ha",full:true},
          {id:"carga",label:"Capacidade por carga",unit:"kg",opt:true},{id:"disp",label:"Quantidade disponível",unit:"kg",opt:true},
          {id:"apl",label:"Quantidade efetivamente aplicada",unit:"kg",opt:true}],
  check:v=>{ const s=(v.N||0)+(v.P||0)+(v.K||0); return s>100 ? ["A soma dos teores passa de 100%."] : []; },
  compute:(v,raw)=>{ const extras=String(raw.areas||"").split(/[;\n]/).map(x=>Number(String(x).trim().replace(/\./g,"").replace(",","."))).filter(x=>isFinite(x)&&x>0);
    const areaTot=v.area+extras.reduce((a,b)=>a+b,0), tot=v.dose*areaTot;
    const rows=[R("Produto total",tot,"kg",0,1),R("Em toneladas",tot/1000,"t",3),R("Área total",areaTot,"ha",2)];
    const steps=[`Área total = ${[v.area,...extras].map(a=>nfx(a,2)).join(" + ")} = ${nfx(areaTot,2)} ha`,`Produto total = ${nfx(v.dose,1)} kg/ha × ${nfx(areaTot,2)} ha = ${nfx(tot,1)} kg`];
    [["N","N"],["P","P₂O₅"],["K","K₂O"]].forEach(([k,n])=>{ if(v[k]>0){ const kh=v.dose*v[k]/100; rows.push(R(n+" fornecido",kh,"kg/ha",1)); steps.push(`${n} = ${nfx(v.dose,1)} × ${nfx(v[k],1)}% = ${nfx(kh,2)} kg/ha (total ${nfx(kh*areaTot,1)} kg)`); } });
    if(v.carga>0){ const c=Math.ceil(tot/v.carga); rows.push(R("Cargas / abastecimentos",c,"un",0)); steps.push(`Cargas = ${nfx(tot,1)} ÷ ${nfx(v.carga,0)} kg → ${c}`); }
    const warn=[];
    if(v.disp>0){ const s=v.disp-tot; rows.push(R(s>=0?"Sobra do estoque":"Falta no estoque",Math.abs(s),"kg",0)); steps.push(`Saldo = ${nfx(v.disp,0)} − ${nfx(tot,0)} = ${nfx(s,0)} kg`); if(s<0) warn.push("Estoque disponível não cobre a operação."); }
    if(v.apl>0){ const dif=v.apl-tot, pct=dif/tot*100, real=v.apl/areaTot; rows.push(R("Dose real aplicada",real,"kg/ha",1),R("Aplicado − planejado",dif,"kg",0),R("Diferença",pct,"%",1));
      steps.push(`Dose real = ${nfx(v.apl,0)} kg ÷ ${nfx(areaTot,2)} ha = ${nfx(real,2)} kg/ha`,`Diferença = (${nfx(v.apl,0)} − ${nfx(tot,0)}) ÷ ${nfx(tot,0)} = ${nfx(pct,2)}%`);
      if(Math.abs(pct)>10) warn.push("Aplicado difere mais de 10% do planejado: confira a regulagem do equipamento."); }
    return {rows,steps,warn,prem:["Dose do produto comercial ≠ quantidade de nutriente: o nutriente é a dose × teor declarado.","Não gera recomendação: use a dose da recomendação técnica."]}; } },
{ mod:"adubo", id:"vinh", title:"Vinhaça pela dose de potássio",
  desc:"Use o teor de K₂O da análise da vinhaça. A dose não pode passar o limite da norma CETESB P4.231 para o talhão.",
  inputs:[{id:"k",label:"K₂O desejado",unit:"kg/ha"},{id:"kv",label:"K₂O na vinhaça (análise)",unit:"kg/m³",min:0.01,warn:[0.5,10]},
          {id:"area",label:"Área do talhão",unit:"ha",opt:true,area:true},{id:"cap",label:"Capacidade do caminhão",unit:"m³",def:"22,5",opt:true}],
  compute:v=>{ const dose=v.k/v.kv; const rows=[R("Dose de vinhaça",dose,"m³/ha",0,1)]; const steps=[`Dose = ${nfx(v.k,1)} kg/ha ÷ ${nfx(v.kv,2)} kg/m³ = ${nfx(dose,2)} m³/ha`];
    if(v.area>0){ const tot=dose*v.area; rows.push(R("Total no talhão",tot,"m³",0)); steps.push(`Total = ${nfx(dose,2)} × ${nfx(v.area,2)} = ${nfx(tot,1)} m³`);
      if(v.cap>0){ rows.push(R("Viagens do caminhão",Math.ceil(tot/v.cap),"un",0)); steps.push(`Viagens = ${nfx(tot,1)} ÷ ${nfx(v.cap,1)} m³ (para cima)`); } }
    return {rows,steps,prem:["Não confere o limite da CETESB P4.231 (depende da CTC e do K do solo)."]}; } },
{ mod:"adubo", id:"torta", title:"Torta de filtro pela dose do nutriente",
  desc:"Informe o nutriente que quer suprir (K₂O ou P₂O₅) e o teor da torta úmida pela análise.",
  inputs:[{id:"k",label:"Nutriente desejado",unit:"kg/ha"},{id:"kt",label:"Teor na torta (análise)",unit:"kg/t",min:0.01},
          {id:"area",label:"Área do talhão",unit:"ha",opt:true,area:true},{id:"cap",label:"Capacidade do caminhão",unit:"t",def:"15",opt:true}],
  compute:v=>{ const dose=v.k/v.kt; const rows=[R("Dose de torta",dose,"t/ha",1,1)]; const steps=[`Dose = ${nfx(v.k,1)} ÷ ${nfx(v.kt,2)} = ${nfx(dose,2)} t/ha`];
    if(v.area>0){ const tot=dose*v.area; rows.push(R("Total no talhão",tot,"t",0)); steps.push(`Total = ${nfx(dose,2)} × ${nfx(v.area,2)} = ${nfx(tot,1)} t`);
      if(v.cap>0){ rows.push(R("Viagens do caminhão",Math.ceil(tot/v.cap),"un",0)); } }
    return {rows,steps,prem:["Teor da torta úmida, conforme análise do lote."]}; } },

/* ---------------- COLHEITA ---------------- */
{ mod:"colheita", id:"im", title:"Brix e índice de maturação",
  desc:"Meça o Brix com o refratômetro no topo e na base do colmo.",
  inputs:[{id:"t",label:"Brix do topo",unit:"°Brix",warn:[5,30]},{id:"b",label:"Brix da base",unit:"°Brix",min:0.1,warn:[5,30]}],
  compute:v=>{ const im=v.t/v.b; const c = im<0.60?["Imatura","warn"]: im<0.85?["Em maturação","mid"]: im<=1.00?["Madura","ok"]:["Em declínio","warn"];
    return {rows:[R("Índice de maturação (topo ÷ base)",im,"",2,1),R("Brix médio",(v.t+v.b)/2,"°Brix",1)],tag:["Cana "+c[0].toLowerCase(),c[1]],
      steps:[`IM = ${nfx(v.t,1)} ÷ ${nfx(v.b,1)} = ${nfx(im,3)}`,`Brix médio = (${nfx(v.t,1)} + ${nfx(v.b,1)}) ÷ 2 = ${nfx((v.t+v.b)/2,2)}`],
      prem:["Referência: < 0,60 imatura · 0,60–0,85 em maturação · 0,85–1,00 madura · > 1,00 em declínio."]}; } },
{ mod:"colheita", id:"atr", title:"ATR e açúcar por hectare",
  desc:"Use o ATR do laboratório (kg por tonelada de cana) e o TCH do talhão.",
  inputs:[{id:"tch",label:"TCH",unit:"t/ha",warn:[30,200]},{id:"atr",label:"ATR",unit:"kg/t",warn:[90,180]},
          {id:"area",label:"Área do talhão",unit:"ha",opt:true,area:true},{id:"pc",label:"Pol da cana – PC",unit:"%",opt:true,max:30}],
  compute:v=>{ const a=v.tch*v.atr/1000; const rows=[R("ATR por hectare",a,"t/ha",2,1)]; const steps=[`ATR/ha = ${nfx(v.tch,1)} t/ha × ${nfx(v.atr,1)} kg/t ÷ 1.000 = ${nfx(a,3)} t/ha`];
    if(v.pc>0){ rows.push(R("Açúcar (pol) por hectare – TPH",v.tch*v.pc/100,"t/ha",2)); steps.push(`TPH = ${nfx(v.tch,1)} × ${nfx(v.pc,2)}% = ${nfx(v.tch*v.pc/100,3)} t/ha`); }
    if(v.area>0){ rows.push(R("ATR total do talhão",a*v.area,"t",1),R("Cana total do talhão",v.tch*v.area,"t",0)); steps.push(`ATR total = ${nfx(a,3)} × ${nfx(v.area,2)} ha`); }
    return {rows,steps,prem:["ATR informado pelo laboratório; a conta não aplica a fórmula do Consecana."]}; } },
{ mod:"colheita", id:"colh", title:"Desempenho da colheita e meta",
  desc:"Compara planejado e realizado. Indique se as toneladas vêm de pesagem ou de estimativa.",
  inputs:[{id:"ap",label:"Área planejada",unit:"ha",area:true},{id:"ac",label:"Área colhida",unit:"ha"},
          {id:"tp",label:"Toneladas previstas",unit:"t",opt:true},{id:"tr",label:"Toneladas colhidas",unit:"t",opt:true},
          {id:"orig",label:"Origem das toneladas",kind:"sel",opts:["Pesagem (balança)","Estimativa"],opt:true},
          {id:"hp",label:"Horas produtivas",unit:"h",opt:true},{id:"hpar",label:"Horas paradas",unit:"h",opt:true},{id:"turno",label:"Horas por turno",unit:"h",opt:true,def:"8"}],
  check:v=> v.ac>v.ap*1.5 ? [] : [],
  compute:(v,raw)=>{ const rows=[], steps=[], warn=[]; const pa=v.ac/v.ap*100;
    rows.push(R("Execução da meta de área",pa,"%",1,1),R("Área restante",Math.max(0,v.ap-v.ac),"ha",1)); steps.push(`Execução = ${nfx(v.ac,2)} ÷ ${nfx(v.ap,2)} × 100 = ${nfx(pa,2)}%`);
    if(v.tr>0){ const tch=v.tr/v.ac; rows.push(R("Produtividade realizada (TCH)",tch,"t/ha",1)); steps.push(`TCH = ${nfx(v.tr,1)} t ÷ ${nfx(v.ac,2)} ha = ${nfx(tch,2)} t/ha`);
      if(v.tp>0){ const pt=v.tr/v.tp*100; rows.push(R("Execução da meta de toneladas",pt,"%",1),R("Realizado − previsto",v.tr-v.tp,"t",0)); steps.push(`Meta t = ${nfx(v.tr,0)} ÷ ${nfx(v.tp,0)} × 100 = ${nfx(pt,2)}%`); } }
    if(v.hp>0){ const hah=v.ac/v.hp; rows.push(R("Área colhida por hora",hah,"ha/h",2)); steps.push(`ha/h = ${nfx(v.ac,2)} ÷ ${nfx(v.hp,1)} h = ${nfx(hah,3)}`);
      if(v.tr>0){ const th=v.tr/v.hp; rows.push(R("Produção por hora",th,"t/h",1)); if(v.turno>0){ rows.push(R("Produção por turno",th*v.turno,"t/turno",0)); steps.push(`t/turno = ${nfx(th,2)} × ${nfx(v.turno,1)} h`); } }
      const rest=Math.max(0,v.ap-v.ac); if(rest>0){ rows.push(R("Horas para concluir",rest/hah,"h",1)); steps.push(`Horas = ${nfx(rest,2)} ha ÷ ${nfx(hah,3)} ha/h`); }
      if(v.hpar>=0 && isFinite(v.hpar)){ const disp=v.hp/(v.hp+v.hpar)*100; rows.push(R("Tempo parado",v.hpar,"h",1),R("Aproveitamento do tempo",disp,"%",1)); steps.push(`Aproveitamento = ${nfx(v.hp,1)} ÷ (${nfx(v.hp,1)} + ${nfx(v.hpar,1)}) × 100 = ${nfx(disp,2)}%`); } }
    if(v.tr>0 && raw.orig!=="Pesagem (balança)") warn.push("Toneladas sem origem de pesagem: trate como estimativa.");
    if(pa>110) warn.push("Área colhida bem maior que a planejada: confira os dados.");
    return {rows,steps,warn,tag: v.tr>0 ? (raw.orig==="Pesagem (balança)"?["Toneladas de pesagem","ok"]:["Toneladas estimadas","mid"]) : null,
      prem:["Aproveitamento = horas produtivas ÷ (produtivas + paradas)."]}; } },

/* ---------------- DIESEL ---------------- */
{ mod:"diesel", id:"diesel", title:"Consumo de diesel",
  desc:"Use o horímetro e os litros abastecidos no período. Toneladas e área são opcionais.",
  inputs:[{id:"l",label:"Litros abastecidos",unit:"L"},{id:"h0",label:"Horímetro inicial",unit:"h",opt:true},{id:"h1",label:"Horímetro final",unit:"h",opt:true},
          {id:"t",label:"Toneladas no período",unit:"t",opt:true},{id:"area",label:"Área trabalhada",unit:"ha",opt:true,area:true,full:true}],
  check:v=>{ const e=[]; if(isFinite(v.h0)!==isFinite(v.h1)) e.push("Preencha os dois horímetros ou nenhum."); else if(isFinite(v.h1)&&v.h1<=v.h0) e.push("O horímetro final precisa ser maior que o inicial."); if(!isFinite(v.h0)&&!(v.t>0)&&!(v.area>0)) e.push("Informe horímetros, toneladas ou área para calcular o consumo."); return e; },
  compute:v=>{ const rows=[], steps=[]; let main=true;
    if(isFinite(v.h0)){ const hs=v.h1-v.h0; rows.push(R("Horas trabalhadas",hs,"h",1),R("Consumo por hora",v.l/hs,"L/h",1,main)); main=false; steps.push(`Horas = ${nfx(v.h1,1)} − ${nfx(v.h0,1)} = ${nfx(hs,2)} h`,`L/h = ${nfx(v.l,1)} ÷ ${nfx(hs,2)} = ${nfx(v.l/hs,3)}`); }
    if(v.t>0){ rows.push(R("Consumo por tonelada",v.l/v.t,"L/t",2,main)); main=false; steps.push(`L/t = ${nfx(v.l,1)} ÷ ${nfx(v.t,1)}`); }
    if(v.area>0){ rows.push(R("Consumo por hectare",v.l/v.area,"L/ha",1,main)); steps.push(`L/ha = ${nfx(v.l,1)} ÷ ${nfx(v.area,2)}`); }
    return {rows,steps,prem:["Considera que todo o diesel do período foi usado na operação informada."]}; } },
{ mod:"diesel", id:"dcusto", title:"Custo do diesel e previsto x real",
  desc:"Custo total, por hora e por hectare. Compare com o consumo padrão definido pelo gestor.",
  inputs:[{id:"l",label:"Litros consumidos",unit:"L"},{id:"preco",label:"Preço do diesel",unit:"R$/L",warn:[3,12]},
          {id:"h",label:"Horas trabalhadas",unit:"h",opt:true},{id:"area",label:"Área trabalhada",unit:"ha",opt:true,area:true},
          {id:"prev",label:"Consumo previsto (padrão)",unit:"L/h",opt:true},{id:"prevha",label:"Consumo previsto (padrão)",unit:"L/ha",opt:true}],
  compute:v=>{ const c=v.l*v.preco, rows=[R("Custo total",c,"R$",2,1)], steps=[`Custo = ${nfx(v.l,1)} L × R$ ${nfx(v.preco,2)} = R$ ${nfx(c,2)}`], warn=[];
    if(v.h>0){ rows.push(R("Consumo por hora",v.l/v.h,"L/h",1),R("Custo por hora",c/v.h,"R$/h",2)); steps.push(`L/h = ${nfx(v.l,1)} ÷ ${nfx(v.h,1)}`);
      if(v.prev>0){ const d=(v.l/v.h-v.prev)/v.prev*100; rows.push(R("Real x previsto (L/h)",d,"%",1)); steps.push(`Diferença = (${nfx(v.l/v.h,2)} − ${nfx(v.prev,2)}) ÷ ${nfx(v.prev,2)} × 100 = ${nfx(d,2)}%`); if(d>15) warn.push("Consumo por hora mais de 15% acima do padrão. Antes de concluir, confira operação, carga, terreno e os dados do horímetro."); } }
    if(v.area>0){ rows.push(R("Consumo por hectare",v.l/v.area,"L/ha",1),R("Custo por hectare",c/v.area,"R$/ha",2)); steps.push(`L/ha = ${nfx(v.l,1)} ÷ ${nfx(v.area,2)}`);
      if(v.prevha>0){ const d=(v.l/v.area-v.prevha)/v.prevha*100; rows.push(R("Real x previsto (L/ha)",d,"%",1)); if(d>15) warn.push("Consumo por hectare acima do padrão. Confira as condições da operação antes de concluir."); } }
    return {rows,steps,warn,prem:["Preço informado pelo usuário; o app não busca preços."]}; } },

/* ---------------- MEDIDAS ÚTEIS ---------------- */
{ mod:"uteis", id:"area", title:"Área do talhão",
  desc:"Para talhão retangular. Mostra em hectares e em alqueires paulistas.",
  inputs:[{id:"c",label:"Comprimento",unit:"m"},{id:"lg",label:"Largura",unit:"m"}],
  compute:v=>{ const m2=v.c*v.lg; return {rows:[R("Área",m2/10000,"ha",2,1),R("Área",m2,"m²",0),R("Alqueire paulista (2,42 ha)",m2/24200,"alq",2)],
    steps:[`m² = ${nfx(v.c,1)} × ${nfx(v.lg,1)} = ${nfx(m2,1)}`,`ha = ${nfx(m2,1)} ÷ 10.000`,`alq = ${nfx(m2,1)} ÷ 24.200`],prem:["Talhão retangular."]}; } },
{ mod:"uteis", id:"conv", title:"Hectare ⇄ alqueire",
  desc:"Preencha um dos dois campos.",
  inputs:[{id:"ha",label:"Hectares",unit:"ha",opt:true},{id:"alq",label:"Alqueires paulistas",unit:"alq",opt:true}],
  check:v=> (!(v.ha>0)&&!(v.alq>0)) ? ["Preencha um dos campos."] : [],
  compute:v=>{ const rows=[], steps=[];
    if(v.ha>0){ rows.push(R(nfx(v.ha,2)+" ha =",v.ha/2.42,"alq",2,1)); steps.push(`${nfx(v.ha,2)} ÷ 2,42`); }
    if(v.alq>0){ rows.push(R(nfx(v.alq,2)+" alq =",v.alq*2.42,"ha",2,!rows.length)); steps.push(`${nfx(v.alq,2)} × 2,42`); }
    return {rows,steps,prem:["Alqueire paulista = 2,42 ha (24.200 m²)."]}; } },
{ mod:"uteis", id:"sulco", title:"Espaçamento e metros de sulco",
  desc:"Para linha dupla (ex.: 1,50 × 0,90), preencha também o espaçamento menor.",
  inputs:[{id:"e1",label:"Espaçamento entre linhas",unit:"m",def:"1,5",min:0.3,warn:[0.8,2.5]},{id:"e2",label:"Espaçamento menor (linha dupla)",unit:"m",opt:true},
          {id:"area",label:"Área do talhão",unit:"ha",opt:true,area:true,full:true}],
  compute:v=>{ const med = v.e2>0 ? (v.e1+v.e2)/2 : v.e1, mha=10000/med; const rows=[R("Metros de sulco por hectare",mha,"m/ha",0,1)];
    const steps=[ v.e2>0 ? `Espaçamento médio = (${nfx(v.e1,2)} + ${nfx(v.e2,2)}) ÷ 2 = ${nfx(med,3)} m` : `Espaçamento = ${nfx(v.e1,2)} m`, `m/ha = 10.000 ÷ ${nfx(med,3)} = ${nfx(mha,1)}`];
    if(v.e2>0) rows.push(R("Espaçamento médio",med,"m",2));
    if(v.area>0){ rows.push(R("Metros de sulco no talhão",mha*v.area,"m",0),R("Em quilômetros",mha*v.area/1000,"km",2)); steps.push(`Total = ${nfx(mha,1)} × ${nfx(v.area,2)} ha`); }
    return {rows,steps,prem:[]}; } },
{ mod:"uteis", id:"unid", title:"Conversor de unidades",
  desc:"Converte só entre unidades da mesma grandeza.",
  inputs:[{id:"g",label:"Grandeza",kind:"sel",opts:Object.keys(UNIDADES),optLabels:Object.values(UNIDADES).map(x=>x.nome),def:"area",full:true},
          {id:"x",label:"Valor",unit:""},{id:"de",label:"De",kind:"sel",dyn:"de"},{id:"para",label:"Para",kind:"sel",dyn:"para"}],
  compute:(v,raw)=>{ const G=UNIDADES[raw.g]; if(!G) return {err:["Escolha a grandeza."]};
    const de=G.u[raw.de], pa=G.u[raw.para]; if(!de||!pa) return {err:["Escolha as unidades de origem e destino da mesma grandeza."]};
    const base=v.x*de[1], res=base/pa[1];
    let dd=0; while(dd<6 && Math.abs(Number(res.toFixed(dd))-res)>1e-9*Math.max(1,Math.abs(res))) dd++;
    return {rows:[R(`${nfx(v.x,4).replace(/,?0+$/,"")} ${de[0]} =`,res,pa[0].replace(/.*\((.*)\)/,"$1"),dd,1)],
      steps:[`${nfx(v.x,4)} × ${nfx(de[1],6)} = ${nfx(base,6)} (unidade base)`,`${nfx(base,6)} ÷ ${nfx(pa[1],6)} = ${nfx(res,6)}`],prem:[`Grandeza: ${G.nome}.`]}; } }
];

/* Validação genérica das entradas — devolve {v, raw, err[], warn[]} */
function parseNum(s){ if(s===undefined||s===null) return NaN; s=String(s).trim().replace(/\s/g,""); if(!s) return NaN; if(s.includes(",")) s=s.replace(/\./g,"").replace(",","."); return Number(s); }
function validar(c, raw){
  const v={}, err=[], warn=[];
  c.inputs.forEach(i=>{
    if(i.kind==="txt"||i.kind==="sel"){ v[i.id]=raw[i.id]; if(!i.opt && !raw[i.id]) err.push(`Escolha: ${i.label}.`); return; }
    const s=raw[i.id], x=parseNum(s); v[i.id]=x;
    if(s && String(s).trim() && !isFinite(x)){ err.push(`${i.label}: número inválido.`); return; }
    if(!isFinite(x)){ if(!i.opt) err.push(`Preencha: ${i.label}.`); return; }
    const min = i.min!==undefined ? i.min : 0;
    if(x<0 && min>=0) err.push(`${i.label} não pode ser negativo.`);
    else if(x<min || (min===0 && x===0 && !i.opt && !i.zeroOk)) err.push(`${i.label} precisa ser maior que ${String(min).replace(".",",")}${i.unit?" "+i.unit:""}.`);
    if(i.max!==undefined && x>i.max) err.push(`${i.label} não pode passar de ${String(i.max).replace(".",",")}${i.unit?" "+i.unit:""}.`);
    if(i.int && !Number.isInteger(x)) warn.push(`${i.label}: esperado número inteiro.`);
    if(i.warn && x>0 && (x<i.warn[0]||x>i.warn[1])) warn.push(`${i.label} (${String(x).replace(".",",")} ${i.unit||""}) está fora da faixa comum (${String(i.warn[0]).replace(".",",")} a ${String(i.warn[1]).replace(".",",")}). Confira.`);
  });
  if(!err.length && c.check) err.push(...c.check(v,raw));
  return {v,raw,err,warn};
}
function calcular(c, raw){
  const val=validar(c,raw); if(val.err.length) return {err:val.err, warn:val.warn};
  let out; try{ out=c.compute(val.v,raw); }catch(e){ return {err:["Não foi possível calcular com esses dados."]}; }
  if(out.err) return out;
  const ruins=out.rows.filter(r=>typeof r.val==="number" && !isFinite(r.val));
  if(ruins.length) return {err:["Resultado indisponível: confira se algum valor está zerado (divisão por zero)."]};
  return {...out, warn:[...val.warn, ...(out.warn||[])]};
}
if(typeof module!=="undefined") module.exports={CALCS,MODULOS,UNIDADES,calcular,validar,parseNum,CALC_VERSAO};
