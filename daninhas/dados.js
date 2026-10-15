/* =====================================================================
   Daninhas da Cana — banco de dados técnico de referência
   Separado dos registros de campo (que ficam no aparelho do usuário).

   STATUS de cada informação:
     "bula"      = conferido na bula do produto citado (fonte + data)
     "referencia"= referência técnica geral, ainda sem conferência de fonte
     "pendente"  = dado não conferido; não usar sem validação
   ===================================================================== */
const DADOS_VERSAO = "2026.10.15-v5";
const DADOS_REVISAO = "15/10/2026";
const DADOS_RESPONSAVEL = "Montagem inicial por assistente (Claude) — revisão por agrônomo responsável pendente";

/* ---------- Mecanismos de ação (classificação HRAC/WSSA, numérica) ---------- */
const MECANISMOS = {
  "0":  {nome:"Mecanismo desconhecido (organoarsenicais)", ex:"MSMA (antigo grupo 17 / Z)"},
  "2":  {nome:"Inibidores da ALS",                         ex:"imazapique, imazapir, halossulfurom, trifloxissulfurom, diclosulam, metsulfurom"},
  "3":  {nome:"Inibidores da formação de microtúbulos",    ex:"trifluralina"},
  "4":  {nome:"Mimetizadores de auxina",                   ex:"2,4-D, picloram, fluroxipir, triclopir, aminopiralide"},
  "5":  {nome:"Inibidores do fotossistema II (sítio A)",   ex:"hexazinona, ametrina, amicarbazona, metribuzim"},
  "7":  {nome:"Inibidores do fotossistema II (ureias)",    ex:"diurom, tebutiurom"},
  "9":  {nome:"Inibidores da EPSPS",                       ex:"glifosato (não seletivo para a cana)"},
  "13": {nome:"Inibidores da síntese de carotenoides (DXP)", ex:"clomazona"},
  "14": {nome:"Inibidores da PPO (Protox)",                ex:"sulfentrazona, flumioxazina, carfentrazona"},
  "15": {nome:"Inibidores de ácidos graxos de cadeia muito longa (VLCFA)", ex:"piroxasulfona"},
  "18": {nome:"Inibidores da DHP sintase",                 ex:"asulam"},
  "27": {nome:"Inibidores da HPPD",                        ex:"isoxaflutol, mesotriona"},
  "29": {nome:"Inibidores da síntese de celulose",         ex:"indaziflam"}
};

/* ---------- Tipos de solo (classes de textura usadas nas bulas) ----------
   Faixas usuais de argila; cada bula pode definir faixas próprias (confira).   */
const SOLOS = {
  arenoso: {nome:"Arenoso (leve)",   argila:"menos de 15% de argila", ic:"🟨",
            obs:"Pouca argila e matéria orgânica: o herbicida fica mais livre na água do solo. Bulas costumam usar doses menores ou proibir o uso em cana-planta."},
  medio:   {nome:"Textura média",    argila:"15% a 35% de argila", ic:"🟧",
            obs:"Faixa intermediária de dose na maioria das bulas."},
  argiloso:{nome:"Argiloso (pesado)",argila:"mais de 35% de argila", ic:"🟫",
            obs:"Mais argila e matéria orgânica retêm o herbicida: as bulas costumam indicar a maior dose."}
};
/* Nível da restrição por solo: "nao" = não indicado | "restr" = indicado com restrição | "ok" = sem restrição além da dose */
const NIVEL_SOLO = {nao:["pend","⛔ Não indicado"], restr:["ref","⚠ Com restrição"], ok:["ok","✓ Sem restrição de solo"]};

/* Atalhos para produtos de pós-emergência e não seletivos (a bula não muda nada por solo) */
const SOLO_POS = "Produto aplicado sobre as folhas das daninhas: a bula não restringe o uso por textura de solo.";
const SOLO_IGUAL = "A bula não muda a dose por textura de solo.";
const soloTodos = (t,n="ok")=>({arenoso:{n,t},medio:{n,t},argiloso:{n,t}});

/* ---------- Herbicidas: cada entrada é UM produto comercial, com a bula lida ----------
   cod    = código do produto na planilha de estoque (Acompanhamento Estoque — Herbicidas)
   outros = daninhas da bula que não têm ficha no guia
   dose(daninha, solo, cana) -> {d, u, n} ou {na:"motivo"}
   Solo: "arenoso" | "medio" | "argiloso"; cana: "planta" | "soca"            */
const HERBICIDAS = {
  velpark:{ cod:"11370", comercial:"Velpar K WG", titular:"Corteva Agriscience", ia:"Hexazinona + diurom", conc:"132 + 468 g/kg", form:"WG (granulado dispersível)",
    moa:["5","7"], registro:"não conferido", modalidade:"Pré e pós-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Revista Cultivar — ficha do produto (dados da bula)", link:"https://revistacultivar.com.br/pesticida/velpar-k-wg",
    alvos:["corda","caruru","picao","trapoeraba","coloniao","braquiaria","colchao"],
    porSolo:{arenoso:{n:"restr",t:"Cana-planta: não indicado. Cana-soca: pré-emergência 1,8 a 2,0 kg/ha."},
      medio:{n:"ok",t:"Cana-soca: 2,0 a 2,5 kg/ha (pré). Cana-planta: no máximo 2,0 kg/ha."},
      argiloso:{n:"ok",t:"Cana-soca: 2,5 a 3,0 kg/ha (pré). Cana-planta: no máximo 2,0 kg/ha."}},
    restricoes:["Uma aplicação por ciclo.","Cana-planta em solo médio ou argiloso: dose máxima 2,0 kg/ha.","Não indicado em cana-planta em solo arenoso.","Pós: plantas daninhas com até 4 folhas (folha larga) ou até o 1º perfilho (gramíneas)."],
    dose:(w,s,c)=>{ if(s==="arenoso"&&c==="planta") return {na:"Não indicado em cana-planta em solo arenoso."};
      if(c==="planta") return {d:"até 2,0",u:"kg/ha",n:"Cana-planta: limite de 2,0 kg/ha. Pós-emergência: 2,5 kg/ha."};
      return {d:{arenoso:"1,8 a 2,0",medio:"2,0 a 2,5",argiloso:"2,5 a 3,0"}[s],u:"kg/ha (pré)",n:"Pós-emergência: 2,5 kg/ha."}; } },
  hexaron:{ comercial:"Hexaron WG", titular:"ADAMA", ia:"Hexazinona + diurom", conc:"132 + 468 g/kg", form:"WG",
    moa:["5","7"], registro:"não conferido", modalidade:"Pré e pós-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Hexaron WG — ADAMA", link:"https://www.adama.com/brasil/sites/adama_brazil/files/downloads/UTF-8%27%27Hexaron%25C2%25AE%2520WG%2520-%2520Bula.pdf",
    alvos:["corda","caruru","picao","trapoeraba","coloniao","braquiaria","colchao"],
    porSolo:{arenoso:{n:"restr",t:"Pré-emergência só em cana-soca (1,8 a 2,0 kg/ha). Pós: 2,5 kg/ha."},
      medio:{n:"ok",t:"Pré 2,0 a 2,5 kg/ha. Doses válidas para matéria orgânica entre 1,3% e 3,0%."},
      argiloso:{n:"ok",t:"Pré 2,5 a 3,0 kg/ha. Doses válidas para matéria orgânica entre 1,3% e 3,0%."}},
    restricoes:["Doses de pré para matéria orgânica entre 1,3% e 3,0%.","Solo arenoso: pré-emergência só em cana-soca.","Não aplicar em plantas estressadas por seca ou acima de 30 °C."],
    dose:(w,s,c)=>{ if(s==="arenoso"&&c==="planta") return {na:"Pré em solo arenoso só em cana-soca. Pós: 2,5 kg/ha."};
      return {d:{arenoso:"1,8 a 2,0",medio:"2,0 a 2,5",argiloso:"2,5 a 3,0"}[s],u:"kg/ha (pré)",n:"Pós-emergência: 2,5 kg/ha em qualquer solo."}; } },
  tebunortox:{ comercial:"Tebutiuron Nortox", titular:"Nortox", ia:"Tebutiurom", conc:"500 g/L", form:"SC (suspensão concentrada)",
    moa:["7"], registro:"MAPA nº 14620", modalidade:"Pré-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Tebutiuron Nortox", link:"https://painel.farmby.com.br/storage/bulas/tebutiuron-nortox.pdf",
    alvos:["corda","caruru","picao","leiteiro","trapoeraba","coloniao","braquiaria","colchao"],
    porSolo:{arenoso:{n:"ok",t:"1,6 a 2,0 L/ha (menor faixa da bula)."},
      medio:{n:"ok",t:"2,0 a 2,4 L/ha."},
      argiloso:{n:"ok",t:"2,4 L/ha."}},
    restricoes:["Mesma faixa para cana-planta e soca.","Rotação: não cultivar outras culturas por 24 meses após a aplicação."],
    dose:(w,s)=>({d:{arenoso:"1,6 a 2,0",medio:"2,0 a 2,4",argiloso:"2,4"}[s],u:"L/ha"}) },
  sulfupl:{ comercial:"Sulfentrazone UPL BR 500 SC", titular:"UPL", ia:"Sulfentrazona", conc:"500 g/L", form:"SC",
    moa:["14"], registro:"não conferido", modalidade:"Pré-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Sulfentrazone UPL BR 500 SC (versão 30/08/2022)", link:"https://agribrasilis.com/wp-content/uploads/2021/03/F780898673_Sulfentrazone-UPL-BR-500-SC_Bula_V2022-08-30.pdf",
    alvos:["corda","caruru","leiteiro","trapoeraba","coloniao","braquiaria","colchao","tiririca"],
    porSolo:{arenoso:{n:"ok",t:"A bula não muda a dose por solo: 1,2 L/ha (tiririca 1,6 L/ha)."},
      medio:{n:"ok",t:"A bula não muda a dose por solo: 1,2 L/ha (tiririca 1,6 L/ha)."},
      argiloso:{n:"ok",t:"A bula não muda a dose por solo: 1,2 L/ha (tiririca 1,6 L/ha)."}},
    restricoes:["A bula não varia a dose por textura de solo na cana.","Volume de calda terrestre: 100 a 300 L/ha."],
    dose:(w)=> w==="tiririca" ? {d:"1,6",u:"L/ha",n:"Mesma dose em qualquer solo."} : {d:"1,2",u:"L/ha",n:"Mesma dose em qualquer solo."} },
  provence:{ cod:"120964", comercial:"Provence 750 WG", titular:"Bayer", ia:"Isoxaflutol", conc:"750 g/kg", form:"WG",
    moa:["27"], registro:"não conferido", modalidade:"Pré-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Provence 750 WG", link:"https://assets.revistacultivar.com.br/0c155355-4a10-4897-95ab-86e61490d82b_provence_750_wg_bula.pdf",
    alvos:["caruru","coloniao","braquiaria","colchao"],
    porSolo:{arenoso:{n:"restr",t:"Não aplicar de novembro a fevereiro (Centro-Sul). Cana-planta: bula sem dose. Soca: 200 a 250 g/ha (seca) ou 100 g/ha (úmida)."},
      medio:{n:"ok",t:"Cana-planta: 80 + 80 g/ha. Soca: 250 a 300 g/ha (seca) ou 125 g/ha (úmida)."},
      argiloso:{n:"ok",t:"Cana-planta: 90 + 90 g/ha. Soca: 300 a 350 g/ha (seca) ou 150 g/ha (úmida)."}},
    restricoes:["Solo arenoso: não aplicar de novembro a fevereiro (Centro-Sul).","A tabela da bula tem layout confuso: confira a dose por espécie na bula antes de aplicar."],
    dose:(w,s,c)=>{ if(c==="planta"){ if(s==="arenoso") return {na:"Bula sem dose para cana-planta em solo arenoso."};
        return {d:s==="medio"?"80 + 80":"90 + 90",u:"g/ha",n:"Duas aplicações: após o plantio e na entrelinha aos 60 dias."}; }
      return {d:{arenoso:"200 a 250",medio:"250 a 300",argiloso:"300 a 350"}[s],u:"g/ha (soca seca)",n:"Soca úmida: "+{arenoso:"100",medio:"125",argiloso:"150"}[s]+" g/ha."}; } },
  plateau:{ cod:"237572", comercial:"Plateau", titular:"BASF", ia:"Imazapique", conc:"700 g/kg", form:"WG",
    moa:["2"], registro:"não conferido", modalidade:"Pré-emergência (cana-soca)", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Plateau", link:"https://assets.revistacultivar.com.br/a6c0eecb-4406-4bbe-bed5-9b8e81fd960e_plateau_bula.pdf",
    alvos:["tiririca"],
    porSolo:{arenoso:{n:"nao",t:"Bula sem dose de tiririca para solo leve."},
      medio:{n:"ok",t:"190 g/ha, só em cana-soca, antes da brotação."},
      argiloso:{n:"ok",t:"210 g/ha, só em cana-soca. Matéria orgânica alta pode reduzir o efeito nos tubérculos."}},
    restricoes:["Não aplicar em cana-planta.","Aplicar antes da brotação da soca.","Matéria orgânica alta pode reduzir o efeito sobre os tubérculos.","Intervalo de segurança na cana: 150 dias."],
    dose:(w,s,c)=>{ if(c==="planta") return {na:"Não aplicar em cana-planta."};
      if(s==="arenoso") return {na:"Bula sem dose de tiririca para solo leve."};
      return {d:s==="medio"?"190":"210",u:"g/ha"}; } },
  alion:{ cod:"397511", comercial:"Alion", titular:"Bayer", ia:"Indaziflam", conc:"500 g/L", form:"SC",
    moa:["29"], registro:"não conferido", modalidade:"Pré e pós-emergência inicial", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Alion", link:"https://painel.farmby.com.br/storage/bulas/alion.pdf",
    alvos:["caruru","picao","coloniao","braquiaria","amargoso","colchao","gramaseda"],
    porSolo:{arenoso:{n:"restr",t:"Cana-planta: proibido em solo com menos de 10% de argila ou menos de 1% de matéria orgânica — confira a análise do talhão. Dose 0,10 a 0,15 L/ha conforme a daninha."},
      medio:{n:"ok",t:"0,10 a 0,15 L/ha conforme a daninha. Em cana-planta, confirme matéria orgânica de pelo menos 1%."},
      argiloso:{n:"ok",t:"0,20 L/ha."}},
    restricoes:["Uma aplicação por ano (intervalo mínimo de 12 meses).","Não usar em cana-planta com menos de 10% de argila nem com menos de 1% de matéria orgânica.","Não usar com mudas pré-brotadas (MPB).","Intervalo de segurança: 165 dias."],
    dose:(w,s)=>{ const baixa=["coloniao","caruru","colchao","amargoso"].includes(w)?"0,10":"0,15";
      return {d:s==="argiloso"?"0,20":baixa,u:"L/ha"}; } },
  amicnortox:{ comercial:"Amicarbazone Nortox", titular:"Nortox", ia:"Amicarbazona", conc:"700 g/kg", form:"WG",
    moa:["5"], registro:"não conferido", modalidade:"Pré e pós-emergência inicial", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Amicarbazone Nortox", link:"https://assets.revistacultivar.com.br/f722ffbe-4738-43d6-9306-6660600ef075_amicarbazone_nortox_bula.pdf",
    alvos:["corda","caruru","picao","trapoeraba","braquiaria","colchao"],
    porSolo:{arenoso:{n:"ok",t:"1,0 a 1,5 kg/ha conforme a daninha."},
      medio:{n:"ok",t:"1,0 a 1,5 kg/ha conforme a daninha."},
      argiloso:{n:"ok",t:"2,0 kg/ha."}},
    restricoes:["Aplicação única.","Pré na cana-planta ou logo após o corte na soca."],
    dose:(w,s)=> s==="argiloso" ? {d:"2,0",u:"kg/ha"} : {d:["caruru","picao","corda"].includes(w)?"1,5":"1,0",u:"kg/ha"} },
  gamit:{ cod:"372525", comercial:"Gamit 360 CS", titular:"FMC", ia:"Clomazona", conc:"360 g/L", form:"CS (suspensão de cápsulas)",
    moa:["13"], registro:"não conferido", modalidade:"Pré-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Revista Cultivar — ficha do produto (dados da bula)", link:"https://revistacultivar.com.br/pesticida/gamit-360-cs",
    alvos:["corda","caruru","trapoeraba","coloniao","braquiaria","colchao"],
    porSolo:{arenoso:{n:"ok",t:"3,0 L/ha."},
      medio:{n:"restr",t:"A bula não define dose própria para solo médio: 3,0 a 3,5 L/ha conforme a infestação, com o agrônomo."},
      argiloso:{n:"ok",t:"3,5 L/ha."}},
    restricoes:["Uma aplicação por ciclo.","Intervalo de segurança na cana: 365 dias.","Solo médio: a bula não define dose própria; escolha conforme infestação."],
    dose:(w,s)=>({d:{arenoso:"3,0",medio:"3,0 a 3,5",argiloso:"3,5"}[s],u:"L/ha"}) },
  krismat:{ comercial:"Krismat WG", titular:"Syngenta", ia:"Ametrina + trifloxissulfurom-sódico", conc:"731,5 + 18,5 g/kg", form:"WG",
    moa:["5","2"], registro:"não conferido", modalidade:"Pós-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Revista Cultivar — ficha do produto (dados da bula)", link:"https://revistacultivar.com.br/pesticida/krismat-wg",
    alvos:["corda","caruru","picao","trapoeraba","braquiaria","colchao","tiririca"],
    porSolo:{arenoso:{n:"ok",t:"Produto de pós-emergência: a bula não restringe o uso por textura de solo."},
      medio:{n:"ok",t:"Produto de pós-emergência: a bula não restringe o uso por textura de solo."},
      argiloso:{n:"ok",t:"Produto de pós-emergência: a bula não restringe o uso por textura de solo."}},
    restricoes:["Uma aplicação.","2 a 4 semanas após o plantio ou 3 a 4 semanas após o corte.","Espalhante adesivo não iônico a 0,2%.","Tiririca: só supressão, após 2,4-D."],
    dose:(w)=> w==="tiririca" ? {d:"2,0",u:"kg/ha",n:"Supressão, após aplicação de 2,4-D."} : {d:"1,75 a 2,0",u:"kg/ha",n:"1,75 kg/ha em baixa infestação."} },
  sempra:{ comercial:"Sempra", titular:"não conferido", ia:"Halossulfurom-metílico", conc:"750 g/kg", form:"WG",
    moa:["2"], registro:"não conferido", modalidade:"Pós-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Sempra", link:"https://assets.revistacultivar.com.br/ef125e38-c7fd-45be-8e97-8030dfc4d8e2_sempra_bula.pdf",
    alvos:["tiririca"],
    porSolo:{arenoso:{n:"ok",t:"Produto de pós-emergência: a bula não restringe o uso por textura de solo."},
      medio:{n:"ok",t:"Produto de pós-emergência: a bula não restringe o uso por textura de solo."},
      argiloso:{n:"ok",t:"Produto de pós-emergência: a bula não restringe o uso por textura de solo."}},
    restricoes:["Uma aplicação por ciclo.","30 a 40 dias após o plantio ou corte.","Surfactante (amina polioxietilenada) a 1,0 L/ha."],
    dose:()=>({d:"150",u:"g/ha"}) },
  dma806:{ cod:"69 (2,4-D — marca não informada na planilha)", comercial:"2,4-D DMA 806 SL CAC", titular:"não conferido", ia:"2,4-D (sal dimetilamina)", conc:"806 g/L (670 g/L e.a.)", form:"SL (concentrado solúvel)",
    moa:["4"], registro:"não conferido", modalidade:"Pós-emergência (área total ou jato dirigido)", status:"bula", conferido:"14/10/2026",
    fonte:"Bula 2,4-D DMA 806 SL CAC", link:"https://assets.revistacultivar.com.br/58e13de1-e1c1-4d1b-9563-fa50baa0256a_24d_dma_806_sl_cac_bula.pdf",
    alvos:["corda","caruru","picao","leiteiro","trapoeraba","tiririca"],
    porSolo:{arenoso:{n:"ok",t:"Produto de pós-emergência: a bula não restringe o uso por textura de solo."},
      medio:{n:"ok",t:"Produto de pós-emergência: a bula não restringe o uso por textura de solo."},
      argiloso:{n:"ok",t:"Produto de pós-emergência: a bula não restringe o uso por textura de solo."}},
    restricoes:["Área total: cana até 30 cm, antes da formação dos colmos.","Jato dirigido: antes da floração da planta daninha.","Alto risco de deriva para culturas sensíveis vizinhas: siga as normas estaduais para 2,4-D."],
    dose:(w)=> ["picao","caruru"].includes(w) ? {d:"1,0 a 1,5",u:"L/ha",n:"Área total, daninhas com 3 a 5 folhas."} : {d:"1,5",u:"L/ha",n:"Jato dirigido."} },

  /* ===== Acrescentados em 15/10/2026 a partir da planilha de estoque de 01/10/2026 ===== */
  combine:{ cod:"3001", comercial:"Combine 500 SC", titular:"Proventis Lifescience", ia:"Tebutiurom", conc:"500 g/L", form:"SC (suspensão concentrada)",
    moa:["7"], registro:"MAPA nº 718701", modalidade:"Pré-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Combine 500 SC / Spike 500 SC (dados da bula)", link:"https://revistacultivar.com.br/pesticida/combine-500-sc-spike-500-sc",
    alvos:["caruru","corda","picao","leiteiro","trapoeraba","coloniao","braquiaria","colchao"],
    outros:"carrapicho-rasteiro, capim-marmelada, capim-carrapicho, capim-pé-de-galinha, falsa-serralha, picão-branco, beldroega, poaia-branca, guanxumas",
    porSolo:{arenoso:{n:"ok",t:"1,6 a 2,0 L/ha."},medio:{n:"ok",t:"Areno-argiloso: 2,0 a 2,4 L/ha."},argiloso:{n:"ok",t:"2,4 L/ha."}},
    restricoes:["Uma aplicação por ciclo, após o plantio (cana-planta) ou após o corte (cana-soca), em qualquer época do ano.","Mesma dose para cana-planta e soca.","Rotação: não implantar outras culturas por 24 meses após a última aplicação.","Terrestre: não aplicar com vento acima de 8 km/h nem nas horas mais quentes.","Intervalo de segurança: não determinado (modalidade de emprego)."],
    dose:(w,s)=>({d:{arenoso:"1,6 a 2,0",medio:"2,0 a 2,4",argiloso:"2,4"}[s],u:"L/ha"}) },

  ametrina:{ cod:"5287", comercial:"Ametrina 500 g/L (referência: Metrimex 500 SC)", titular:"Oxon Brasil", ia:"Ametrina", conc:"500 g/L", form:"SC",
    moa:["5"], registro:"MAPA nº 1558106 (Metrimex 500 SC)", modalidade:"Pré e pós-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Metrimex 500 SC (dados da bula)", link:"https://revistacultivar.com.br/pesticida/metrimex-500-sc",
    alvos:["colchao","caruru","trapoeraba","picao","corda"],
    outros:"capim-carrapicho, capim-pé-de-galinha, capim-marmelada (pós), beldroega, guanxuma, falsa-serralha (pós)",
    porSolo:soloTodos("5,0 a 6,0 L/ha. A bula não fixa dose por solo: usar as maiores em solo com mais argila ou matéria orgânica."),
    restricoes:["A planilha não informa a marca: os dados são da bula do Metrimex 500 SC. Confira a bula da ametrina 500 g/L que está no estoque.","Uma aplicação por safra.","Picão-preto e corda-de-viola: só em pré-emergência.","Cana com mais de 40 cm: aplicação dirigida nas entrelinhas.","Exige 6 horas sem chuva; não aplicar em solo seco ou mal preparado.","Na pós, pode causar clorose passageira em algumas variedades (some em 3 a 4 semanas).","Restrição estadual no Paraná para caruru, trapoeraba, corda-de-viola e picão-preto em cana."],
    dose:(w,s)=>({d:"5,0 a 6,0",u:"L/ha",n:(["picao","corda"].includes(w)?"Só em pré-emergência para esta daninha. ":"")+(s==="argiloso"?"Solo argiloso: preferir a dose maior.":s==="arenoso"?"Solo arenoso: preferir a dose menor.":"")}) },

  sencor:{ cod:"5499", comercial:"Sencor 480", titular:"Bayer", ia:"Metribuzim", conc:"480 g/L", form:"SC",
    moa:["5"], registro:"MAPA nº 1288594", modalidade:"Pré-emergência e pós-emergência inicial", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Sencor 480 (dados da bula)", link:"https://revistacultivar.com.br/pesticida/sencor-480",
    alvos:["picao","caruru","corda","braquiaria","coloniao","colchao"],
    outros:"beldroega, serralha, guanxuma, picão-branco, apaga-fogo, erva-quente, falsa-serralha, poaia-branca, capim-carrapicho, capim-pé-de-galinha, capim-marmelada e outras",
    porSolo:{arenoso:{n:"ok",t:"3,0 L/ha (arenoso a médio: menor dose)."},medio:{n:"ok",t:"3,0 L/ha (arenoso a médio: menor dose)."},argiloso:{n:"ok",t:"4,0 L/ha."}},
    restricoes:["Uma aplicação por ciclo.","Pré-emergência, ou logo após a emergência (daninhas com no máximo 4 folhas).","Intervalo de segurança: 120 dias.","Altamente móvel e persistente no solo, com risco de atingir água subterrânea."],
    dose:(w,s)=>({d:s==="argiloso"?"4,0":"3,0",u:"L/ha"}) },

  jump:{ cod:"37225", comercial:"Jump", titular:"ADAMA", ia:"Diurom + hexazinona", conc:"533 + 67 g/kg", form:"WG",
    moa:["7","5"], registro:"MAPA nº 8808", modalidade:"Pré e pós-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Jump (dados da bula)", link:"https://revistacultivar.com.br/pesticida/jump",
    alvos:["caruru","picao","braquiaria","trapoeraba","colchao","corda","coloniao"],
    outros:"carrapicho-rasteiro, apaga-fogo, capim-marmelada, capim-carrapicho, capim-pé-de-galinha, falsa-serralha, beldroega, nabo-bravo, guanxuma",
    porSolo:{arenoso:{n:"ok",t:"Pré: perto de 2,0 kg/ha."},medio:{n:"ok",t:"Pré: 2,0 a 3,5 kg/ha conforme argila, matéria orgânica e infestação."},argiloso:{n:"ok",t:"Pré: perto de 3,5 kg/ha (solo pesado, matéria orgânica alta, infestação alta)."}},
    restricoes:["A planilha lista \"Jump / Advance\": os dados são da bula do Jump. Se vier outra marca, confira a bula dela.","Uma aplicação por ciclo (pré ou pós).","Pré: matéria orgânica de no mínimo 1,3%; solo úmido e sem torrões. Na soca, após enleirar a palha.","Pós: jato dirigido recomendado; 2,0 kg/ha (daninhas menores) ou 3,5 kg/ha (maiores).","Não aplicar em pós com umidade abaixo de 55% ou daninhas estressadas pela seca.","Intervalo de segurança: 150 dias. Uso exclusivo em cana."],
    dose:(w,s)=>({d:{arenoso:"2,0",medio:"2,0 a 3,5",argiloso:"3,5"}[s],u:"kg/ha (pré)",n:"Pós-emergência: 2,0 kg/ha (daninhas pequenas) ou 3,5 kg/ha (maiores)."}) },

  contain:{ cod:"51016", comercial:"Contain", titular:"BASF", ia:"Imazapir", conc:"250 g/L e.a. (266,3 g/L)", form:"SL (concentrado solúvel)",
    moa:["2"], registro:"MAPA nº 128895", modalidade:"Pré-emergência na soca · pré/pós da tiririca antes do plantio", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Contain (dados da bula)", link:"https://revistacultivar.com.br/pesticida/contain",
    alvos:["colchao","gramaseda","tiririca"], outros:"capim-marmelada",
    porSolo:{arenoso:{n:"ok",t:"Soca: 0,5 L/ha (menor dose)."},medio:{n:"ok",t:"Soca: 0,5 a 0,8 L/ha."},argiloso:{n:"ok",t:"Soca: 0,8 L/ha. Matéria orgânica alta pode reduzir o residual."}},
    restricoes:["Soca seca: logo após a colheita, em pré-emergência total da brotação, de abril a setembro.","Cana-planta: só para tiririca, no despraguejamento da área ANTES do plantio. Abrir o sulco no mínimo 60 dias depois (90 no plantio de inverno) e com 90 mm de chuva.","Causa fitotoxicidade se aplicado em pós-emergência da cana ou acima da dose.","Uma aplicação por ciclo. Adjuvante não iônico a 0,5%.","Não aplicar perto de árvores e plantas úteis; sem chuva nas 4 horas seguintes."],
    dose:(w,s,c)=>{ if(c==="planta") return w==="tiririca" ? {d:"1,5 a 2,0",u:"L/ha",n:"Antes do plantio. Sulco só 60 dias depois (90 no inverno), com 90 mm de chuva."} : {na:"Na cana-planta a bula só indica o Contain para tiririca, antes do plantio."};
      if(w==="tiririca") return {na:"Na soca a bula não indica o Contain para tiririca."};
      return {d:{arenoso:"0,5",medio:"0,5 a 0,8",argiloso:"0,8"}[s],u:"L/ha",n:"Soca seca, logo após a colheita (abril a setembro)."}; } },

  msma720:{ cod:"53394", comercial:"MSMA 720", titular:"UPL", ia:"MSMA", conc:"720 g/L", form:"SL (a planilha cita SC)",
    moa:["0"], registro:"MAPA nº 6108", modalidade:"Pós-emergência (jato dirigido)", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha MSMA 720 (dados da bula)", link:"https://revistacultivar.com.br/pesticida/msma-720",
    alvos:["caruru","picao","trapoeraba","tiririca","colchao","coloniao"],
    outros:"carrapicho-de-carneiro, capim-marmelada, capim-carrapicho, capim-pé-de-galinha, picão-branco, rubim, mastruz, beldroega, guanxuma",
    porSolo:soloTodos(SOLO_POS),
    restricoes:["A planilha diz \"MSMA 720 SC\": os dados são da bula do MSMA 720 (UPL). Confira a marca do estoque.","Jato dirigido, sem atingir a cana; daninhas com menos de 20 cm.","Uma única aplicação.","Não aplicar com temperatura média abaixo de 20 °C nem em dia nublado; 6 horas sem chuva.","Reentrada: 7 dias (sem EPI).","Não plantar outras culturas por 2 anos após a última aplicação.","Capim-colonião: aplicação em manchas, dose em % na calda."],
    dose:(w)=>({d:{caruru:"2,5 a 4,0",trapoeraba:"2,5 a 4,0",colchao:"2,5 a 4,0",picao:"2,5 a 3,5",tiririca:"2,5 a 3,5",coloniao:"2,5"}[w]||"2,5 a 4,0",u:"L/ha",n:"Jato dirigido, daninhas com menos de 20 cm."}) },

  volcane:{ cod:"153668", comercial:"Volcane", titular:"Luxembourg Brasil (distribuição Sipcam Nichino)", ia:"MSMA", conc:"790 g/L", form:"SL",
    moa:["0"], registro:"MAPA nº 4798", modalidade:"Pós-emergência (jato dirigido)", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Volcane (dados da bula)", link:"https://revistacultivar.com.br/pesticida/volcane",
    alvos:["colchao","caruru","picao","braquiaria","corda","coloniao"],
    outros:"carrapicho-de-carneiro, capim-marmelada, capim-carrapicho",
    porSolo:soloTodos(SOLO_POS),
    restricoes:["Jato dirigido, sem atingir a cana. Só equipamento terrestre.","Gramíneas e caruru até 12 cm; colonião, picão e corda-de-viola até 20 cm.","Uma aplicação por safra.","Não aplicar abaixo de 20 °C, em dia nublado ou com previsão de chuva.","Espalhante adesivo não iônico: 100 mL por 100 L de água.","Manter pessoas e animais fora da área por 7 dias."],
    dose:(w)=> w==="coloniao" ? {d:"3,0",u:"L/ha",n:"Colonião de semente, abaixo de 20 cm."} : {d:"1,8 a 3,0",u:"L/ha",n:"Dose menor para daninhas menores. Jato dirigido."} },

  boral:{ cod:"53554", comercial:"Boral 500 SC", titular:"FMC", ia:"Sulfentrazona", conc:"500 g/L", form:"SC",
    moa:["14"], registro:"MAPA nº 7495", modalidade:"Pré-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Boral 500 SC / Capaz (dados da bula)", link:"https://revistacultivar.com.br/pesticida/boral-500-sc-capaz",
    alvos:["caruru","corda","leiteiro","trapoeraba","coloniao","braquiaria","colchao"],
    outros:"beldroega, capim-carrapicho, capim-marmelada, erva-quente, guanxuma-branca, poaia-branca",
    porSolo:soloTodos("1,2 L/ha. "+SOLO_IGUAL),
    restricoes:["Uma aplicação por ciclo, após o plantio, em pré-emergência da cana e das daninhas.","Precisa de umidade no solo; se estiver seco, esperar chuva acima de 10 mm.","Soca recém-brotada pode ter queima localizada nas folhas, com recuperação rápida.","Rotação com algodão: mínimo 18 meses.","Intervalo de segurança: não determinado."],
    dose:()=>({d:"1,2",u:"L/ha",n:"Mesma dose em qualquer solo."}) },

  roundupwg:{ cod:"57228", comercial:"Roundup WG", titular:"Monsanto do Brasil (Bayer)", ia:"Glifosato (sal de amônio)", conc:"720 g/kg e.a. (792,5 g/kg)", form:"WG",
    moa:["9"], registro:"MAPA nº 2094", modalidade:"Pós-emergência das daninhas antes do plantio · erradicação de soqueira", status:"bula", conferido:"15/10/2026",
    fonte:"Bula Roundup WG", link:"https://painel.farmby.com.br/storage/bulas/roundup-wg.pdf",
    alvos:["coloniao","tiririca","gramaseda","amargoso","colchao","corda","picao","trapoeraba"],
    outros:"junquinho, braquiarão",
    porSolo:soloTodos("Aplicado sobre as folhas, antes do plantio: a bula não muda a dose por solo."),
    restricoes:["NÃO SELETIVO: mata a cana. Só em área total antes do plantio ou para erradicar a soqueira na reforma.","Erradicação de soqueira: 2,0 a 3,0 kg/ha, com a folha-bandeira entre 0,6 e 1,0 m e antes de formar colmos.","Capim-amargoso e caruru têm biótipos resistentes a glifosato no Brasil.","Trapoeraba: duas aplicações com 28 a 30 dias de intervalo.","Chuva nas 4 horas seguintes reduz o efeito. Não capinar nem roçar antes ou logo depois.","Calda só em plástico, fibra, alumínio ou inox (corrói ferro)."],
    dose:(w,s,c)=>{ if(c==="soca") return {na:"Não seletivo: na soca só serve para erradicar a soqueira na reforma (2,0 a 3,0 kg/ha)."};
      const d={coloniao:"2,25",tiririca:"2,0 a 2,5",gramaseda:"2,5 a 3,5",amargoso:"1,5",colchao:"0,75 a 1,0",corda:"1,5 a 2,0",picao:"0,75",trapoeraba:"2,0 + 1,0 a 2,0"}[w];
      return d ? {d,u:"kg/ha",n:"Antes do plantio, em área total. Nunca sobre a cana."+(w==="trapoeraba"?" Duas aplicações, 28 a 30 dias entre elas.":"")+(w==="amargoso"?" Há biótipos resistentes.":"")} : {na:"Bula sem dose para esta daninha."}; } },

  roundup:{ cod:"516068", comercial:"Roundup Original DI", titular:"Monsanto do Brasil (Bayer)", ia:"Glifosato (sal de di-amônio)", conc:"370 g/L e.a. (445 g/L)", form:"SL",
    moa:["9"], registro:"MAPA nº 513", modalidade:"Pós-emergência das daninhas antes do plantio · erradicação de soqueira", status:"bula", conferido:"15/10/2026",
    fonte:"Bula Roundup Original DI", link:"https://assets.revistacultivar.com.br/6e265a6c-9d36-43f2-9ec1-c757bba8540a_roundup_original_di_bula.pdf",
    alvos:["coloniao","braquiaria","amargoso","colchao","picao","caruru"], outros:"capim-marmelada",
    porSolo:soloTodos("Aplicado sobre as folhas, antes do plantio: a bula não muda a dose por solo."),
    restricoes:["A planilha diz \"Monsanto Roundup\": os dados são da bula do Roundup Original DI. Confira a versão do estoque (Original, Original DI, Original Mais têm doses diferentes).","NÃO SELETIVO: mata a cana. Só antes do plantio ou para erradicar a soqueira.","Erradicação de soqueira: 5,0 a 6,0 L/ha, com folhas de 0,6 a 1,0 m e antes de formar colmos.","Capim-amargoso e caruru têm biótipos resistentes a glifosato.","Chuva nas 4 horas seguintes reduz o efeito; não aplicar acima de 28 °C ou umidade abaixo de 55%."],
    dose:(w,s,c)=>{ if(c==="soca") return {na:"Não seletivo: na soca só serve para erradicar a soqueira (5,0 a 6,0 L/ha)."};
      const d={coloniao:"5 a 6",braquiaria:"3 a 5",amargoso:"3 a 5",colchao:"2 a 4",picao:"2 a 3",caruru:"1 a 2"}[w];
      return d ? {d,u:"L/ha",n:"Antes do plantio, em área total. Nunca sobre a cana."} : {na:"Bula sem dose para esta daninha."}; } },

  ally:{ cod:"209762", comercial:"Ally", titular:"FMC", ia:"Metsulfurom-metílico", conc:"600 g/kg", form:"WG (a planilha cita 60 DF)",
    moa:["2"], registro:"MAPA nº 2492", modalidade:"Pré-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Ally (dados da bula)", link:"https://revistacultivar.com.br/pesticida/ally",
    alvos:[], outros:"mussambê, beldroega, guanxumas (Sida cordifolia e S. rhombifolia) — nenhuma tem ficha no guia",
    porSolo:{arenoso:{n:"ok",t:"30 g/ha (mussambê, beldroega e guanxumas)."},medio:{n:"restr",t:"30 g/ha, só para beldroega."},argiloso:{n:"nao",t:"Bula sem dose para solo pesado."}},
    restricoes:["Uma aplicação por ciclo; máximo 30 g/ha por safra.","Pré-emergência, com solo úmido, bem preparado e sem torrões.","Aplicar com vento abaixo de 10 km/h, temperatura abaixo de 25 °C e umidade acima de 70%.","Intervalo de segurança: 90 dias.","Rotação: 60 dias para soja e feijão, 70 para milho, 90 para algodão e girassol."],
    dose:(w,s)=> s==="argiloso" ? {na:"Bula sem dose para solo pesado."} : {d:"30",u:"g/ha",n:s==="medio"?"Em solo médio, só para beldroega.":"Mussambê, beldroega e guanxumas."} },

  aurora:{ cod:"247872", comercial:"Aurora 400 EC", titular:"FMC", ia:"Carfentrazona-etílica", conc:"400 g/L", form:"EC (concentrado emulsionável)",
    moa:["14"], registro:"MAPA nº 4900", modalidade:"Pós-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Aurora 400 EC (dados da bula)", link:"https://revistacultivar.com.br/pesticida/aurora-400-ec-coverge-400-ec-platform-400-ec",
    alvos:["corda","caruru","trapoeraba"], outros:"beldroega",
    porSolo:soloTodos(SOLO_POS),
    restricoes:["Uma aplicação por ciclo. Óleo mineral a 0,5% na calda.","Ação de contato (não sistêmica).","Pré-colheita (corda-de-viola I. purpurea, I. hederifolia, I. quamoclit): 100 a 200 mL/ha.","Trapoeraba em jato dirigido nas entrelinhas: 75 a 125 mL/ha.","Também registrado como maturador (150 a 200 mL/ha, só aéreo, 30 a 40 dias antes da colheita).","Intervalo de segurança: 6 dias. Chuva até 2 horas depois reduz o efeito."],
    dose:(w)=>({d:"50 a 75",u:"mL/ha",n:w==="corda"?"Pós inicial. Pré-colheita (I. purpurea, I. hederifolia): 100 a 200 mL/ha.":w==="trapoeraba"?"Jato dirigido nas entrelinhas: 75 a 125 mL/ha.":"Pós-emergência inicial da cana."}) },

  dinamic:{ cod:"266514", comercial:"Dinamic", titular:"UPL", ia:"Amicarbazona", conc:"700 g/kg", form:"WG",
    moa:["5"], registro:"MAPA nº 10601", modalidade:"Pré-emergência e pós-emergência precoce", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Dinamic (dados da bula)", link:"https://revistacultivar.com.br/pesticida/dinamic-dinamic-70-wdg-xtron-700-wg-herbicide-amitron-700-wg-herbicide-dinamic-700-wg-orion",
    alvos:["caruru","picao","braquiaria","trapoeraba","colchao","corda","coloniao"],
    outros:"carrapichos, capim-marmelada, capim-carrapicho, capim-pé-de-galinha, falsa-serralha, beldroega, mamona, mucuna, guanxumas, poaia-branca, melão-de-são-caetano",
    porSolo:{arenoso:{n:"ok",t:"Menores doses da faixa (residual de 60 a 70 dias)."},medio:{n:"ok",t:"Dose dentro da faixa conforme infestação."},argiloso:{n:"ok",t:"Maiores doses da faixa."}},
    restricoes:["Cana-planta: a bula proíbe as doses de 1,5 e 2,0 kg/ha, e também em variedades tipo PO (ex.: PO8862).","Uma aplicação por ciclo. Na soca, preferir o período seco, logo após o corte.","Pós precoce: daninhas com até 4 folhas.","Intervalo de segurança: 180 dias. Rotação: 1 ano para outras culturas.","Restrição estadual no Paraná para trapoeraba e falsa-serralha em cana."],
    dose:(w,s,c)=>{ if(w==="corda") return {d:"0,6 a 1,2",u:"kg/ha",n:"Ipomoea nil e I. purpurea. I. grandifolia: 1,5 a 2,0 kg/ha, só na soca."};
      if(c==="planta") return {na:"Para esta daninha a bula indica 1,5 a 2,0 kg/ha, doses proibidas em cana-planta."};
      return {d:{arenoso:"1,5",medio:"1,5 a 2,0",argiloso:"2,0"}[s],u:"kg/ha"}; } },

  flumyzin:{ cod:"317051", comercial:"Flumyzin 500 SC", titular:"Sumitomo Chemical", ia:"Flumioxazina", conc:"500 g/L", form:"SC (a planilha cita \"líquido\")",
    moa:["14"], registro:"MAPA nº 22617", modalidade:"Pré-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Flumyzin 500 SC (dados da bula)", link:"https://revistacultivar.com.br/pesticida/flumyzin-500-sc",
    alvos:["colchao","braquiaria","corda","picao"], outros:"capim-branco, capim-camalote",
    porSolo:{arenoso:{n:"restr",t:"A bula só fala em solos médios e argilosos; não traz recomendação para solo arenoso."},medio:{n:"ok",t:"Menores doses da faixa."},argiloso:{n:"ok",t:"Maiores doses da faixa (residual mais longo)."}},
    restricoes:["Não aplicar depois que a cana emergiu.","Uma aplicação. Intervalo de segurança: 180 dias.","Picão-preto e corda-de-viola (I. grandifolia): só em baixa infestação.","Não aplicar com seca prolongada; não misturar com produtos alcalinos.","A tabela da bula tem layout confuso: confira a dose por espécie na bula antes de aplicar."],
    dose:(w,s)=>{ if(s==="arenoso") return {na:"Bula sem recomendação para solo arenoso."};
      const f={colchao:["250","400"],braquiaria:["400","400"],corda:["150","250"],picao:["150","250"]}[w]||["250","400"];
      return {d:s==="medio"?f[0]:f[1],u:"mL/ha",n:"Faixa da bula: "+(f[0]===f[1]?f[0]:f[0]+" a "+f[1])+" mL/ha."+(w==="corda"?" I. purpurea: 400 mL/ha.":"")}; } },

  hexanortox:{ cod:"341636", comercial:"Hexazinona Nortox", titular:"Nortox", ia:"Hexazinona", conc:"250 g/L", form:"SL (concentrado solúvel)",
    moa:["5"], registro:"MAPA nº 1509", modalidade:"Pré-emergência e pós-emergência inicial (jato dirigido)", status:"bula", conferido:"15/10/2026",
    fonte:"Bula Hexazinona Nortox", link:"https://painel.farmby.com.br/storage/bulas/hexazinona-nortox.pdf",
    alvos:["trapoeraba","picao","leiteiro","colchao","corda","coloniao"], outros:"capim-carrapicho, capim-marmelada",
    porSolo:{arenoso:{n:"restr",t:"0,75 L/ha. Não aplicar em solo arenoso com menos de 1% de matéria orgânica."},medio:{n:"ok",t:"1,0 a 1,5 L/ha."},argiloso:{n:"ok",t:"1,5 a 2,0 L/ha."}},
    restricoes:["Uma aplicação por ciclo. Mesma dose para cana-planta e soca.","Cana-planta: aplicar após as primeiras chuvas. Soca: após enleirar a palha.","Pós inicial em jato dirigido: folhas largas até 15 cm ou 2 a 4 folhas; gramíneas antes de perfilhar.","Não aplicar em cana fraca (pragas, doenças, geada, seca).","Intervalo de segurança: 150 dias. Rotação: 1 ano.","Restrição estadual no Paraná para picão-preto em cana."],
    dose:(w,s)=>({d:{arenoso:"0,75",medio:"1,0 a 1,5",argiloso:"1,5 a 2,0"}[s],u:"L/ha"}) },

  coact:{ cod:"357538", comercial:"Coact", titular:"Corteva (CTVA)", ia:"Diclosulam", conc:"840 g/kg", form:"WG",
    moa:["2"], registro:"MAPA nº 5199", modalidade:"Pré-emergência das daninhas (cana em pré ou pós)", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Coact (dados da bula)", link:"https://revistacultivar.com.br/pesticida/coact",
    alvos:["corda","colchao","tiririca"], outros:"capim-marmelada",
    porSolo:soloTodos(SOLO_IGUAL),
    restricoes:["Uma aplicação por ciclo.","Cana-planta: no plantio e/ou após o quebra-lombo. Soca: após o corte e/ou antes do fechamento.","Cana alta: equipamento tipo pingente para atingir o solo ou a palha.","Persistente e móvel no solo: risco para água subterrânea.","A tabela da bula não deixa claro qual dose vale para cada espécie: confira antes de aplicar."],
    dose:(w)=>({d:{corda:"63 a 126",colchao:"63 a 105",tiririca:"105 a 126"}[w],u:"g/ha"}) },

  diurom500:{ cod:"360795", comercial:"Diurom 500 g/L (referência: Diuron Nortox 500 SC)", titular:"Nortox", ia:"Diurom", conc:"500 g/L", form:"SC",
    moa:["7"], registro:"MAPA nº 8895 (Diuron Nortox 500 SC)", modalidade:"Pré-emergência e pós-emergência (jato dirigido)", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Diuron Nortox 500 SC (dados da bula)", link:"https://revistacultivar.com.br/pesticida/diuron-nortox-500-sc",
    alvos:["caruru","picao","colchao","amargoso"],
    outros:"mentrasto, apaga-fogo, capim-marmelada, capim-carrapicho, tiririca (Cyperus sesquiflorus), pega-pega, capim-pé-de-galinha, guanxumas, poaia-branca e outras",
    porSolo:{arenoso:{n:"ok",t:"Pré: 3,2 L/ha."},medio:{n:"ok",t:"Pré: 4,0 a 4,8 L/ha."},argiloso:{n:"ok",t:"Pré: 4,0 a 6,4 L/ha."}},
    restricoes:["A planilha não informa a marca: os dados são da bula do Diuron Nortox 500 SC. Confira a bula do diurom do estoque.","Pós-emergência: 3,2 a 6,4 L/ha em jato dirigido, na fase inicial das daninhas.","Solo bem preparado e úmido, nunca seco.","Intervalo de segurança: 150 dias.","Capim-amargoso: a bula só traz dose em solo leve."],
    dose:(w,s)=>{ if(w==="amargoso"&&s!=="arenoso") return {na:"Bula só traz dose de pré para capim-amargoso em solo leve. Pós: 3,2 a 6,4 L/ha."};
      return {d:{arenoso:"3,2",medio:"4,0 a 4,8",argiloso:"4,0 a 6,4"}[s],u:"L/ha (pré)",n:"Pós (jato dirigido): 3,2 a 6,4 L/ha."}; } },

  tractor:{ cod:"399426", comercial:"Tractor", titular:"Nufarm", ia:"2,4-D + picloram (sais de trietanolamina)", conc:"240 + 64 g/L e.a. (406 + 103 g/L)", form:"SL",
    moa:["4"], registro:"MAPA nº 2708", modalidade:"Pós-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Bula Tractor (Nufarm, rev. 04 de 28/05/2018)", link:"https://cdn.nufarm.com/wp-content/uploads/sites/23/2018/07/17205725/F1703183408_TRACTOR_BulaAgrofit_Rev04_2018_05_28.pdf",
    alvos:["corda"], outros:"mamona",
    porSolo:soloTodos(SOLO_POS),
    restricoes:["Há outro \"Tractor\" (Sumitomo, registro 18707) cuja bula não traz dose para cana: confira qual está no estoque.","O rótulo indica só cana-planta, com a cana em 6 folhas.","Corda-de-viola até 6 folhas; mamona até 4 folhas.","Uma aplicação. Não usar equipamento manual ou costal.","Vento até 6 km/h; aérea a no mínimo 2 km de culturas sensíveis.","Culturas sensíveis (algodão, tomate, soja, café, eucalipto, hortaliças) só 2 a 3 anos após aplicação em área total."],
    dose:(w,s,c)=> c==="soca" ? {na:"O rótulo do Tractor (Nufarm) só indica cana-planta."} : {d:"0,75 a 2,0",u:"L/ha",n:"Cana com 6 folhas; corda-de-viola até 6 folhas."} },

  provtotal:{ cod:"507400", comercial:"Provence Total", titular:"Bayer", ia:"Isoxaflutol + indaziflam", conc:"450 + 150 g/L", form:"SC",
    moa:["27","29"], registro:"MAPA nº 8317", modalidade:"Pré-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Provence Total (dados da bula)", link:"https://revistacultivar.com.br/pesticida/provence-total",
    alvos:["coloniao","braquiaria","colchao","amargoso","caruru","picao","leiteiro"], outros:"capim-marmelada, capim-carrapicho, capim-pé-de-galinha, capim-camalote",
    porSolo:{arenoso:{n:"restr",t:"Menor dose. Não aplicar de novembro a fevereiro (Centro-Sul) nem em solo leve com menos de 1% de matéria orgânica."},medio:{n:"ok",t:"Menor dose da faixa."},argiloso:{n:"ok",t:"Maior dose da faixa."}},
    restricoes:["Uma aplicação por ano.","Cana-planta: logo após o plantio. Soca: logo após a colheita; se já brotou, jato dirigido nas entrelinhas.","Solo arenoso: não aplicar nos meses mais chuvosos (nov. a fev. no Centro-Sul; maio a ago. no Nordeste).","Não aplicar em solo encharcado, em período muito seco, nem até 90 dias após calagem pesada.","Intervalo de segurança: 165 dias. Rotação: 24 meses (amendoim, soja e milho: 14 meses)."],
    dose:(w,s)=>({d:s==="argiloso"?"0,30":"0,20",u:"L/ha",n:"Faixa da bula: 0,20 a 0,30 L/ha — menores em solo leve a médio, maiores em argiloso."}) },

  arreio:{ cod:"529179", comercial:"Arreio Cana", titular:"ADAMA", ia:"Fluroxipir-meptílico + picloram", conc:"80 + 80 g/L e.a. (115 + 129,42 g/L)", form:"ME (microemulsão)",
    moa:["4"], registro:"MAPA nº 3815 (Arreio Cana) · nº 5515 (Arreio / Arreio Pasto, mesma fórmula)", modalidade:"Pós-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Arreio Cana / Tayta 160 ME (dados da bula)", link:"https://revistacultivar.com.br/pesticida/arreio-cana-tayta-160-me",
    alvos:["corda","caruru"], outros:"mamona, guanxuma, erva-quente",
    porSolo:soloTodos(SOLO_POS),
    restricoes:["Uma aplicação por ciclo. Óleo vegetal a 0,25% na calda.","Caruru: acima de 4 folhas e até 10 cm. Corda-de-viola e mamona: 4 a 6 folhas.","Chuva até 2 a 3 horas depois reduz o efeito.","Muito persistente: culturas sensíveis só 2 anos após aplicação em área total. Cuidado com deriva (algodão, tomate, uva e outras)."],
    dose:()=>({d:"1,5 a 2,0",u:"L/ha",n:"Dose maior para plantas adultas já roçadas."}) },

  yamato:{ cod:"541482", comercial:"Yamato SC", titular:"Iharabras", ia:"Piroxasulfona", conc:"500 g/L", form:"SC",
    moa:["15"], registro:"MAPA nº 15520", modalidade:"Pré-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Bula Yamato SC", link:"https://painel.farmby.com.br/storage/bulas/yamato-sc.pdf",
    alvos:["braquiaria","colchao","coloniao"],
    porSolo:{arenoso:{n:"ok",t:"Faixa da bula; doses menores em solo leve."},medio:{n:"ok",t:"Faixa da bula conforme infestação."},argiloso:{n:"ok",t:"Doses mais altas em solo pesado ou alta infestação."}},
    restricoes:["Uma aplicação, após o plantio ou após a colheita na soca, em pré-emergência total.","Preferir solo úmido; seca longa reduz o efeito.","Com fluxos de germinação ou alta infestação, complementar com pós-emergente.","A bula agrupa colchão e colonião numa mesma faixa sem separar claramente: confira na bula."],
    dose:(w)=>({d:w==="braquiaria"?"300 a 400":"200 a 400",u:"mL/ha",n:"Maiores doses em solo pesado ou alta infestação."}) },

  linear:{ cod:"546140", comercial:"Linear", titular:"Corteva (CTVA)", ia:"Aminopiralide + picloram + triclopir-butotílico", conc:"59,17 + 115,74 + 208,62 g/L", form:"EW (emulsão óleo em água)",
    moa:["4"], registro:"MAPA nº 11318", modalidade:"Pré e pós-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Agrolink e CultivaSmart — dados da bula Linear", link:"https://www.agrolink.com.br/agrolinkfito/produto/linear_10629.html",
    alvos:["corda"], outros:"mamona, mucuna-preta, bucha",
    porSolo:soloTodos(SOLO_IGUAL),
    restricoes:["Até 2 aplicações por ciclo: a 1ª em pré ou até 3 folhas da cana; a 2ª até 28 dias antes da colheita.","Corda-de-viola até 6 folhas: 0,5 a 1,5 L/ha. Pós tardia (mais de 12 folhas) ou pré-colheita: até 1,5 L/ha.","Intervalo de segurança: 28 dias.","Rotação: culturas intercalares só 24 meses após a última aplicação.","Drone: 50 m de faixa de segurança de culturas sensíveis."],
    dose:()=>({d:"0,5 a 1,5",u:"L/ha",n:"Pós até 6 folhas (Ipomoea purpurea). I. nil em pós tardia: 1,5 L/ha."}) },

  magneto:{ cod:"513421", comercial:"Amicarbazona 500 g/L (referência: Magneto SC)", titular:"Iharabras", ia:"Amicarbazona", conc:"500 g/L", form:"SC",
    moa:["5"], registro:"MAPA nº 21319 (Magneto SC)", modalidade:"Pré-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Magneto SC (dados da bula)", link:"https://revistacultivar.com.br/pesticida/magneto-sc",
    alvos:["corda"], outros:"melão-de-são-caetano, mamona, mucuna-preta (corda-de-viola da bula: Merremia aegyptia)",
    porSolo:{arenoso:{n:"ok",t:"Menores doses da faixa."},medio:{n:"ok",t:"Faixa da bula conforme infestação."},argiloso:{n:"ok",t:"Maiores doses em solo pesado ou alta infestação."}},
    restricoes:["A planilha não informa a marca: os dados são da bula do Magneto SC. Confira a bula da amicarbazona 500 g/L do estoque.","Uma aplicação, em pré-emergência total, após o plantio ou após o corte (soca na época seca).","Cana-planta: usar a menor dose (1,5 L/ha).","Chuva ou irrigação em excesso logo depois pode causar fitotoxicidade.","Intervalo de segurança: 180 dias."],
    dose:(w,s,c)=> c==="planta" ? {d:"1,5",u:"L/ha",n:"Cana-planta: menor dose."} : {d:"1,5 a 2,8",u:"L/ha",n:"Maiores doses em solo pesado ou alta infestação."} },

  eximia:{ cod:"563940", comercial:"Exímia", titular:"UPL", ia:"Asulam", conc:"400 g/L", form:"SL",
    moa:["18"], registro:"MAPA nº 178704", modalidade:"Pós-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Exímia / Asulox 400 / Thunder (dados da bula)", link:"https://revistacultivar.com.br/pesticida/eximia-asulox-400-thunder",
    alvos:["gramaseda","colchao","amargoso"], outros:"capim-pé-de-galinha, capim-marmelada, capim-favorito, capim-gengibre, capim-fino",
    porSolo:soloTodos(SOLO_POS),
    restricoes:["Uma aplicação, em pós-emergência da cana e das daninhas em pleno crescimento.","Não usar com temperatura média abaixo de 17 °C nem com seca; precisa de umidade no solo.","Chuva em menos de 8 horas compromete o controle.","Usar a calda logo depois de preparada (até 30 minutos)."],
    dose:()=>({d:"9,0",u:"L/ha"}) },

  trifluralina:{ cod:"303525", comercial:"Trifluralina (referência: Arrow)", titular:"Nortox", ia:"Trifluralina", conc:"450 g/L", form:"EC",
    moa:["3"], registro:"MAPA nº 11707 (Arrow)", modalidade:"Pré-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Arrow (dados da bula)", link:"https://revistacultivar.com.br/pesticida/arrow",
    alvos:["caruru","braquiaria","colchao","coloniao"], outros:"capim-marmelada, capim-carrapicho, capim-arroz, capim-pé-de-galinha, capim-favorito, capim-massambará, beldroega, poaia-branca",
    porSolo:{arenoso:{n:"ok",t:"3,0 L/ha."},medio:{n:"ok",t:"Areno-argiloso: 4,0 L/ha."},argiloso:{n:"ok",t:"5,0 L/ha."}},
    restricoes:["A planilha não informa a marca. Atenção: nem toda trifluralina tem registro para cana (a Trifluralina Nortox comum não tem). Os dados são do Arrow; confira a bula do produto do estoque.","Só plantio convencional; não recomendado em plantio direto.","Aplicar logo após o plantio, até 3 dias após o último preparo do solo. Não incorporar.","Não aplicar em solo seco."],
    dose:(w,s,c)=> c==="soca" ? {na:"A bula indica aplicação logo após o plantio (cana-planta, plantio convencional)."} : {d:{arenoso:"3,0",medio:"4,0",argiloso:"5,0"}[s],u:"L/ha"} },

  mesotriona:{ cod:"311757", comercial:"Mesotriona (referência: Callisto)", titular:"Syngenta", ia:"Mesotriona", conc:"480 g/L", form:"SC",
    moa:["27"], registro:"MAPA nº 1004 (Callisto)", modalidade:"Pós-emergência", status:"bula", conferido:"15/10/2026",
    fonte:"Revista Cultivar — ficha Callisto (dados da bula)", link:"https://revistacultivar.com.br/pesticida/callisto",
    alvos:["corda","caruru","colchao"],
    porSolo:soloTodos(SOLO_POS),
    restricoes:["A planilha não informa a marca: os dados são da bula do Callisto. Confira a bula da mesotriona do estoque.","Uma aplicação por ciclo, com a cana até 8 folhas (após a brotação na planta ou o rebrote na soca).","Corda-de-viola com 2 a 4 folhas; capim-colchão até 1 perfilho.","Óleo mineral a 0,5% na calda.","Inseticidas fosforados ou carbamatos: 7 dias de distância.","Intervalo de segurança: 30 dias. Não aplicar com solo seco."],
    dose:()=>({d:"0,25 a 0,30",u:"L/ha",n:"Com óleo mineral a 0,5%."}) }
};

/* ---------- Plantas daninhas ----------
   Campos agronômicos marcados como "referencia": conhecimento técnico geral,
   pendente de conferência com fonte (ex.: Lorenzi, Embrapa).                 */
const CATEGORIAS = {larga:"Folha larga", gram:"Gramínea", ciper:"Ciperácea", perene:"Perene", anual:"Anual", trep:"Trepadeira", dificil:"Difícil controle", resist:"Casos de resistência"};
const DANINHAS = [
  {id:"corda", nome:"Corda-de-viola", sci:"Ipomoea spp. (I. grandifolia, I. nil, I. purpurea)", fam:"Convolvulaceae", ic:"🌸",
   cat:["larga","anual","trep","dificil"], ciclo:"Anual", prop:"Sementes de casca dura, que ficam anos no solo", epoca:"Fluxos o ano todo com chuva; pico na primavera e verão",
   ident:["Trepadeira que se enrola nos colmos.","Folhas em forma de coração, inteiras ou com 3 lóbulos.","Flores em corneta: brancas, rosas, roxas ou vermelhas.","Plântula com as duas primeiras folhas em forma de \"borboleta\" (V)."],
   monitorar:"Plântulas até 4 folhas, antes de começar a enrolar", competicao:"Alta. Enrola a cana, causa acamamento e atrapalha muito a colheita mecanizada.",
   dificuldade:"Emergência em fluxos sucessivos; sementes duras germinam por vários anos; a palhada não impede totalmente.",
   resistencia:"Sem resistência confirmada comum na cana; algumas espécies têm tolerância natural a glifosato.",
   mip:["Pré-emergente residual logo após plantio ou corte.","Catação ou jato dirigido nos fluxos tardios.","Evitar que produza sementes nas bordas e carreadores."]},
  {id:"caruru", nome:"Caruru", sci:"Amaranthus spp. (A. viridis, A. hybridus, A. retroflexus)", fam:"Amaranthaceae", ic:"🌿",
   cat:["larga","anual","resist"], ciclo:"Anual", prop:"Sementes, em quantidade muito grande", epoca:"Primavera e verão",
   ident:["Planta ereta, caule às vezes avermelhado.","Folhas ovais, alternas, nervuras marcadas; o caruru-de-mancha tem mancha clara em V.","Inflorescência em espiga densa no topo.","Sementes pretas, pequenas e brilhantes."],
   monitorar:"Até 4 folhas", competicao:"Média a alta no início do ciclo da cana.",
   dificuldade:"Banco de sementes enorme; cresce rápido.",
   resistencia:"Há casos de caruru resistente a inibidores da ALS e a glifosato no Brasil. Amaranthus palmeri é praga de alerta: comunique a defesa agropecuária se suspeitar.",
   mip:["Pré-emergentes residuais.","Rotacionar mecanismos de ação.","Não deixar plantas sementearem."]},
  {id:"picao", nome:"Picão-preto", sci:"Bidens pilosa / B. subalternans", fam:"Asteraceae", ic:"🌼",
   cat:["larga","anual","resist"], ciclo:"Anual", prop:"Sementes com ganchos (grudam em roupa, animais e máquinas)", epoca:"Ano todo com umidade",
   ident:["Folhas opostas, divididas em 3 a 5 folíolos serrilhados.","Caule quadrado.","Flor com miolo amarelo e poucas pétalas brancas (às vezes sem pétalas).","Sementes pretas e compridas, com 2 a 4 ganchos na ponta."],
   monitorar:"2 a 6 folhas", competicao:"Média a alta.", dificuldade:"Ciclo curto, várias gerações por ano.",
   resistencia:"Resistência a inibidores da ALS documentada no Brasil. Varie o mecanismo.",
   mip:["Pré-emergentes com mecanismos diferentes da ALS.","Limpeza de máquinas entre áreas."]},
  {id:"leiteiro", nome:"Leiteiro (amendoim-bravo)", sci:"Euphorbia heterophylla", fam:"Euphorbiaceae", ic:"🥛",
   cat:["larga","anual","resist"], ciclo:"Anual", prop:"Sementes, lançadas a distância quando o fruto seca", epoca:"Fluxos após as chuvas",
   ident:["Solta látex branco ao quebrar folha ou caule.","Folhas de formato variado, de ovais a estreitas.","Folhas de cima, perto das flores, com mancha clara ou avermelhada na base.","Caule oco."],
   monitorar:"Até 4 folhas", competicao:"Média.", dificuldade:"Ciclo rápido e vários fluxos.",
   resistencia:"Casos de resistência a ALS, PPO e glifosato registrados no Brasil.",
   mip:["Pré-emergentes residuais.","Não depender de um só mecanismo."]},
  {id:"trapoeraba", nome:"Trapoeraba", sci:"Commelina benghalensis", fam:"Commelinaceae", ic:"💧",
   cat:["larga","perene","dificil"], ciclo:"Perene (comporta-se como anual em algumas áreas)", prop:"Sementes aéreas e subterrâneas e pedaços de caule que enraízam", epoca:"Período chuvoso; tolera sombra da palhada",
   ident:["Caule suculento e rasteiro, que enraíza nos nós.","Folhas ovais com bainha envolvendo o caule.","Flores azuis pequenas, com duas pétalas maiores."],
   monitorar:"2 a 6 folhas", competicao:"Média; forma tapete denso.", dificuldade:"Tolera glifosato; rebrota de fragmentos; sementes embaixo da terra.",
   resistencia:"Tolerância natural a glifosato (não é resistência adquirida).",
   mip:["Pré-emergentes residuais.","Evitar picar e espalhar fragmentos com grade."]},
  {id:"coloniao", nome:"Capim-colonião", sci:"Megathyrsus maximus (Panicum maximum)", fam:"Poaceae", ic:"🌾",
   cat:["gram","perene","dificil"], ciclo:"Perene", prop:"Sementes e touceiras", epoca:"Verão chuvoso",
   ident:["Touceira de 1 a 3 m; jovem, parece cana.","Folhas largas e compridas, nervura central clara.","Panícula grande e aberta."],
   monitorar:"Plântulas de semente antes do perfilhamento", competicao:"Muito alta: disputa luz, água e nutrientes.", dificuldade:"Touceiras adultas rebrotam e não são seletivamente controláveis na cana.",
   resistencia:"Sem resistência comum registrada na cana.",
   mip:["Pré-emergentes residuais para as plantas de semente.","Arranquio ou controle das touceiras na reforma."]},
  {id:"braquiaria", nome:"Capim-braquiária", sci:"Urochloa decumbens (Brachiaria decumbens)", fam:"Poaceae", ic:"🌾",
   cat:["gram","perene"], ciclo:"Perene", prop:"Sementes e estolões", epoca:"Verão chuvoso",
   ident:["Rasteiro, forma tapete denso.","Folhas verde-escuras, com pelos.","Inflorescência com 2 a 5 ramos, sementes de um lado só."],
   monitorar:"Até o 1º ou 2º perfilho", competicao:"Alta, principalmente em áreas que foram pasto.", dificuldade:"Banco de sementes grande vindo do pasto.",
   resistencia:"Sem resistência comum registrada na cana.",
   mip:["Pré-emergentes residuais nos primeiros anos após pasto.","Controle na reforma."]},
  {id:"amargoso", nome:"Capim-amargoso", sci:"Digitaria insularis", fam:"Poaceae", ic:"🌾",
   cat:["gram","perene","dificil","resist"], ciclo:"Perene", prop:"Sementes levadas pelo vento e rizomas curtos", epoca:"Ano todo",
   ident:["Touceira com rizomas curtos e grossos na base.","Inflorescência peluda, esbranquiçada, parecendo pluma.","Folhas ásperas; gosto amargo."],
   monitorar:"Antes de formar touceira (até 4 folhas)", competicao:"Alta.", dificuldade:"Touceiras adultas quase não são controladas na cana.",
   resistencia:"Resistência a glifosato confirmada no Brasil.",
   mip:["Agir cedo, nas plântulas.","Touceiras: arranquio ou controle na reforma com graminicida indicado pelo agrônomo (graminicida mata a cana)."]},
  {id:"colchao", nome:"Capim-colchão", sci:"Digitaria horizontalis / D. sanguinalis", fam:"Poaceae", ic:"🌾",
   cat:["gram","anual"], ciclo:"Anual", prop:"Sementes e enraizamento nos nós", epoca:"Primavera e verão",
   ident:["Rasteiro, enraíza nos nós.","Folhas macias com pelos.","Inflorescência em \"dedos\" (vários ramos finos do mesmo ponto)."],
   monitorar:"3 a 4 folhas", competicao:"Média.", dificuldade:"Baixa quando controlado cedo.",
   resistencia:"Sem resistência comum registrada na cana.",
   mip:["Pré-emergentes residuais."]},
  {id:"tiririca", nome:"Tiririca", sci:"Cyperus rotundus", fam:"Cyperaceae", ic:"🔺",
   cat:["ciper","perene","dificil"], ciclo:"Perene", prop:"Tubérculos (batatinhas) e rizomas em corrente", epoca:"Ano todo; mais forte no calor",
   ident:["Caule triangular, sem nós (\"tiririca tem quina\").","Folhas brilhantes em roseta.","Inflorescência marrom-avermelhada em guarda-chuva.","Tubérculos em corrente no solo."],
   monitorar:"10 a 15 cm, antes de florescer", competicao:"Muito alta no início do ciclo; reduz a brotação da soca.", dificuldade:"Os tubérculos sobrevivem anos; a parte aérea volta após o controle.",
   resistencia:"Sem resistência comum registrada; falhas costumam vir de tubérculos não atingidos.",
   mip:["Combinar pré-emergente de solo e pós.","Repetir o manejo por várias safras.","Evitar levar tubérculos com terra de uma área para outra."]},
  {id:"gramaseda", nome:"Grama-seda", sci:"Cynodon dactylon", fam:"Poaceae", ic:"🟩",
   cat:["gram","perene","dificil"], ciclo:"Perene", prop:"Estolões, rizomas e sementes", epoca:"Ano todo",
   ident:["Rasteira, com estolões e rizomas que formam tapete.","Folhas curtas, finas e acinzentadas.","Inflorescência com 3 a 7 ramos finos em dedos."],
   monitorar:"Reboleiras iniciais", competicao:"Alta em reboleiras.", dificuldade:"Rebrota de rizomas; poucas opções seletivas na cana.",
   resistencia:"Sem resistência comum registrada.",
   mip:["Controle principal na reforma, antes do plantio.","Evitar levar rizomas em máquinas."]}
];

/* ---------- Fotos de referência (Wikimedia Commons, licenças livres; crédito em cada página) ---------- */
const REF = {"corda": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Ipomoea_purpurea_2400px.jpg/960px-Ipomoea_purpurea_2400px.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Ipomoea_purpurea_2400px.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Ipomoea_purpurea_2400px.jpg", "c": "Flor da corda-de-viola (Ipomoea purpurea)"}, {"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Ipomoea_nil_leaf.JPG/960px-Ipomoea_nil_leaf.JPG", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Ipomoea_nil_leaf.JPG?width=960", "p": "https://commons.wikimedia.org/wiki/File:Ipomoea_nil_leaf.JPG", "c": "Folha em forma de coração (Ipomoea nil)"}], "caruru": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Amaranthus_viridis_25042014_1.jpg/960px-Amaranthus_viridis_25042014_1.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Amaranthus_viridis_25042014_1.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Amaranthus_viridis_25042014_1.jpg", "c": "Caruru-de-mancha (Amaranthus viridis)"}, {"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Amaranthus_viridis_W3_IMG_3850.jpg/960px-Amaranthus_viridis_W3_IMG_3850.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Amaranthus_viridis_W3_IMG_3850.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Amaranthus_viridis_W3_IMG_3850.jpg", "c": "Planta e inflorescência do caruru"}], "picao": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Bidens_pilosa_01.jpg/960px-Bidens_pilosa_01.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Bidens_pilosa_01.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Bidens_pilosa_01.jpg", "c": "Picão-preto (Bidens pilosa)"}, {"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Bidens_pilosa_-_Anamadinika_fleurs_et_graines.jpg/960px-Bidens_pilosa_-_Anamadinika_fleurs_et_graines.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Bidens_pilosa_-_Anamadinika_fleurs_et_graines.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Bidens_pilosa_-_Anamadinika_fleurs_et_graines.jpg", "c": "Flores e sementes com ganchos"}], "leiteiro": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Euphorbia_heterophylla_%28Painted_Euphorbia%29_in_Hyderabad%2C_AP_W_IMG_9720.jpg/960px-Euphorbia_heterophylla_%28Painted_Euphorbia%29_in_Hyderabad%2C_AP_W_IMG_9720.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Euphorbia_heterophylla_%28Painted_Euphorbia%29_in_Hyderabad%2C_AP_W_IMG_9720.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Euphorbia_heterophylla_%28Painted_Euphorbia%29_in_Hyderabad%2C_AP_W_IMG_9720.jpg", "c": "Leiteiro (Euphorbia heterophylla)"}], "trapoeraba": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/ARS_-_Commelina_benghalensis.jpg/960px-ARS_-_Commelina_benghalensis.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/ARS_-_Commelina_benghalensis.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:ARS_-_Commelina_benghalensis.jpg", "c": "Trapoeraba (Commelina benghalensis)"}, {"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Commelina_benghalensis_W_IMG_1549.jpg/960px-Commelina_benghalensis_W_IMG_1549.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Commelina_benghalensis_W_IMG_1549.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Commelina_benghalensis_W_IMG_1549.jpg", "c": "Flor azul da trapoeraba"}], "braquiaria": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Urochloa_decumbens_plant9_%287429385348%29.jpg/960px-Urochloa_decumbens_plant9_%287429385348%29.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Urochloa_decumbens_plant9_%287429385348%29.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Urochloa_decumbens_plant9_%287429385348%29.jpg", "c": "Capim-braquiária (Urochloa decumbens)"}], "amargoso": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Starr_050419-0386_Digitaria_insularis.jpg/960px-Starr_050419-0386_Digitaria_insularis.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Starr_050419-0386_Digitaria_insularis.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Starr_050419-0386_Digitaria_insularis.jpg", "c": "Capim-amargoso (Digitaria insularis)"}], "colchao": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Digitaria_sanguinalis.jpg/960px-Digitaria_sanguinalis.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Digitaria_sanguinalis.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Digitaria_sanguinalis.jpg", "c": "Capim-colchão (Digitaria sanguinalis)"}, {"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Harig_vingergras_plant_%28Digitaria_sanguinalis%29.jpg/960px-Harig_vingergras_plant_%28Digitaria_sanguinalis%29.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Harig_vingergras_plant_%28Digitaria_sanguinalis%29.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Harig_vingergras_plant_%28Digitaria_sanguinalis%29.jpg", "c": "Planta inteira do capim-colchão"}], "tiririca": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Cyperus_rotundus_by_kadavoor.JPG/960px-Cyperus_rotundus_by_kadavoor.JPG", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Cyperus_rotundus_by_kadavoor.JPG?width=960", "p": "https://commons.wikimedia.org/wiki/File:Cyperus_rotundus_by_kadavoor.JPG", "c": "Tiririca (Cyperus rotundus)"}, {"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Cyperus_rotundus_tuber01.jpg/960px-Cyperus_rotundus_tuber01.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Cyperus_rotundus_tuber01.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Cyperus_rotundus_tuber01.jpg", "c": "Tubérculos (batatinhas) da tiririca"}], "gramaseda": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Cynodon_dactylon_01.jpg/960px-Cynodon_dactylon_01.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Cynodon_dactylon_01.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Cynodon_dactylon_01.jpg", "c": "Grama-seda (Cynodon dactylon)"}, {"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Bermuda_grass%2C_Cynodon_dactylon_%2816434099448%29.jpg/960px-Bermuda_grass%2C_Cynodon_dactylon_%2816434099448%29.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Bermuda_grass%2C_Cynodon_dactylon_%2816434099448%29.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Bermuda_grass%2C_Cynodon_dactylon_%2816434099448%29.jpg", "c": "Grama-seda formando tapete"}], "coloniao": [{"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Starr-050525-1924-Megathyrsus_maximus-habit-Lua_Makika-Kahoolawe_%2824735828436%29.jpg/960px-Starr-050525-1924-Megathyrsus_maximus-habit-Lua_Makika-Kahoolawe_%2824735828436%29.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Starr-050525-1924-Megathyrsus_maximus-habit-Lua_Makika-Kahoolawe_%2824735828436%29.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Starr-050525-1924-Megathyrsus_maximus-habit-Lua_Makika-Kahoolawe_%2824735828436%29.jpg", "c": "Touceira de capim-colonião"}, {"t": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Starr-050414-6325-Megathyrsus_maximus-restoration_site-Kanaha_Beach-Maui_%2824449590060%29.jpg/960px-Starr-050414-6325-Megathyrsus_maximus-restoration_site-Kanaha_Beach-Maui_%2824449590060%29.jpg", "s": "https://commons.wikimedia.org/wiki/Special:FilePath/Starr-050414-6325-Megathyrsus_maximus-restoration_site-Kanaha_Beach-Maui_%2824449590060%29.jpg?width=960", "p": "https://commons.wikimedia.org/wiki/File:Starr-050414-6325-Megathyrsus_maximus-restoration_site-Kanaha_Beach-Maui_%2824449590060%29.jpg", "c": "Capim-colonião em área aberta"}]};
