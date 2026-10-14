/* =====================================================================
   Daninhas da Cana — banco de dados técnico de referência
   Separado dos registros de campo (que ficam no aparelho do usuário).

   STATUS de cada informação:
     "bula"      = conferido na bula do produto citado (fonte + data)
     "referencia"= referência técnica geral, ainda sem conferência de fonte
     "pendente"  = dado não conferido; não usar sem validação
   ===================================================================== */
const DADOS_VERSAO = "2026.10.14-v3";
const DADOS_REVISAO = "14/10/2026";
const DADOS_RESPONSAVEL = "Montagem inicial por assistente (Claude) — revisão por agrônomo responsável pendente";

/* ---------- Mecanismos de ação (classificação HRAC/WSSA, numérica) ---------- */
const MECANISMOS = {
  "2":  {nome:"Inibidores da ALS",                         ex:"imazapique, halossulfurom, trifloxissulfurom"},
  "4":  {nome:"Mimetizadores de auxina",                   ex:"2,4-D"},
  "5":  {nome:"Inibidores do fotossistema II (sítio A)",   ex:"hexazinona, ametrina, amicarbazona"},
  "7":  {nome:"Inibidores do fotossistema II (ureias)",    ex:"diurom, tebutiurom"},
  "13": {nome:"Inibidores da síntese de carotenoides (DXP)", ex:"clomazona"},
  "14": {nome:"Inibidores da PPO (Protox)",                ex:"sulfentrazona"},
  "27": {nome:"Inibidores da HPPD",                        ex:"isoxaflutol"},
  "29": {nome:"Inibidores da síntese de celulose",         ex:"indaziflam"}
};

/* ---------- Herbicidas: cada entrada é UM produto comercial, com a bula lida ----------
   dose(daninha, solo, cana) -> {d, u, n} ou {na:"motivo"}
   Solo: "arenoso" | "medio" | "argiloso"; cana: "planta" | "soca"            */
const HERBICIDAS = {
  velpark:{ comercial:"Velpar K WG", titular:"Corteva Agriscience", ia:"Hexazinona + diurom", conc:"132 + 468 g/kg", form:"WG (granulado dispersível)",
    moa:["5","7"], registro:"não conferido", modalidade:"Pré e pós-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Revista Cultivar — ficha do produto (dados da bula)", link:"https://revistacultivar.com.br/pesticida/velpar-k-wg",
    alvos:["corda","caruru","picao","trapoeraba","coloniao","braquiaria","colchao"],
    restricoes:["Uma aplicação por ciclo.","Cana-planta em solo médio ou argiloso: dose máxima 2,0 kg/ha.","Não indicado em cana-planta em solo arenoso.","Pós: plantas daninhas com até 4 folhas (folha larga) ou até o 1º perfilho (gramíneas)."],
    dose:(w,s,c)=>{ if(s==="arenoso"&&c==="planta") return {na:"Não indicado em cana-planta em solo arenoso."};
      if(c==="planta") return {d:"até 2,0",u:"kg/ha",n:"Cana-planta: limite de 2,0 kg/ha. Pós-emergência: 2,5 kg/ha."};
      return {d:{arenoso:"1,8 a 2,0",medio:"2,0 a 2,5",argiloso:"2,5 a 3,0"}[s],u:"kg/ha (pré)",n:"Pós-emergência: 2,5 kg/ha."}; } },
  hexaron:{ comercial:"Hexaron WG", titular:"ADAMA", ia:"Hexazinona + diurom", conc:"132 + 468 g/kg", form:"WG",
    moa:["5","7"], registro:"não conferido", modalidade:"Pré e pós-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Hexaron WG — ADAMA", link:"https://www.adama.com/brasil/sites/adama_brazil/files/downloads/UTF-8%27%27Hexaron%25C2%25AE%2520WG%2520-%2520Bula.pdf",
    alvos:["corda","caruru","picao","trapoeraba","coloniao","braquiaria","colchao"],
    restricoes:["Doses de pré para matéria orgânica entre 1,3% e 3,0%.","Solo arenoso: pré-emergência só em cana-soca.","Não aplicar em plantas estressadas por seca ou acima de 30 °C."],
    dose:(w,s,c)=>{ if(s==="arenoso"&&c==="planta") return {na:"Pré em solo arenoso só em cana-soca. Pós: 2,5 kg/ha."};
      return {d:{arenoso:"1,8 a 2,0",medio:"2,0 a 2,5",argiloso:"2,5 a 3,0"}[s],u:"kg/ha (pré)",n:"Pós-emergência: 2,5 kg/ha em qualquer solo."}; } },
  tebunortox:{ comercial:"Tebutiuron Nortox", titular:"Nortox", ia:"Tebutiurom", conc:"500 g/L", form:"SC (suspensão concentrada)",
    moa:["7"], registro:"MAPA nº 14620", modalidade:"Pré-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Tebutiuron Nortox", link:"https://painel.farmby.com.br/storage/bulas/tebutiuron-nortox.pdf",
    alvos:["corda","caruru","picao","leiteiro","trapoeraba","coloniao","braquiaria","colchao"],
    restricoes:["Mesma faixa para cana-planta e soca.","Rotação: não cultivar outras culturas por 24 meses após a aplicação."],
    dose:(w,s)=>({d:{arenoso:"1,6 a 2,0",medio:"2,0 a 2,4",argiloso:"2,4"}[s],u:"L/ha"}) },
  sulfupl:{ comercial:"Sulfentrazone UPL BR 500 SC", titular:"UPL", ia:"Sulfentrazona", conc:"500 g/L", form:"SC",
    moa:["14"], registro:"não conferido", modalidade:"Pré-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Sulfentrazone UPL BR 500 SC (versão 30/08/2022)", link:"https://agribrasilis.com/wp-content/uploads/2021/03/F780898673_Sulfentrazone-UPL-BR-500-SC_Bula_V2022-08-30.pdf",
    alvos:["corda","caruru","leiteiro","trapoeraba","coloniao","braquiaria","colchao","tiririca"],
    restricoes:["A bula não varia a dose por textura de solo na cana.","Volume de calda terrestre: 100 a 300 L/ha."],
    dose:(w)=> w==="tiririca" ? {d:"1,6",u:"L/ha",n:"Mesma dose em qualquer solo."} : {d:"1,2",u:"L/ha",n:"Mesma dose em qualquer solo."} },
  provence:{ comercial:"Provence 750 WG", titular:"Bayer", ia:"Isoxaflutol", conc:"750 g/kg", form:"WG",
    moa:["27"], registro:"não conferido", modalidade:"Pré-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Provence 750 WG", link:"https://assets.revistacultivar.com.br/0c155355-4a10-4897-95ab-86e61490d82b_provence_750_wg_bula.pdf",
    alvos:["caruru","coloniao","braquiaria","colchao"],
    restricoes:["Solo arenoso: não aplicar de novembro a fevereiro (Centro-Sul).","A tabela da bula tem layout confuso: confira a dose por espécie na bula antes de aplicar."],
    dose:(w,s,c)=>{ if(c==="planta"){ if(s==="arenoso") return {na:"Bula sem dose para cana-planta em solo arenoso."};
        return {d:s==="medio"?"80 + 80":"90 + 90",u:"g/ha",n:"Duas aplicações: após o plantio e na entrelinha aos 60 dias."}; }
      return {d:{arenoso:"200 a 250",medio:"250 a 300",argiloso:"300 a 350"}[s],u:"g/ha (soca seca)",n:"Soca úmida: "+{arenoso:"100",medio:"125",argiloso:"150"}[s]+" g/ha."}; } },
  plateau:{ comercial:"Plateau", titular:"BASF", ia:"Imazapique", conc:"700 g/kg", form:"WG",
    moa:["2"], registro:"não conferido", modalidade:"Pré-emergência (cana-soca)", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Plateau", link:"https://assets.revistacultivar.com.br/a6c0eecb-4406-4bbe-bed5-9b8e81fd960e_plateau_bula.pdf",
    alvos:["tiririca"],
    restricoes:["Não aplicar em cana-planta.","Aplicar antes da brotação da soca.","Matéria orgânica alta pode reduzir o efeito sobre os tubérculos.","Intervalo de segurança na cana: 150 dias."],
    dose:(w,s,c)=>{ if(c==="planta") return {na:"Não aplicar em cana-planta."};
      if(s==="arenoso") return {na:"Bula sem dose de tiririca para solo leve."};
      return {d:s==="medio"?"190":"210",u:"g/ha"}; } },
  alion:{ comercial:"Alion", titular:"Bayer", ia:"Indaziflam", conc:"500 g/L", form:"SC",
    moa:["29"], registro:"não conferido", modalidade:"Pré e pós-emergência inicial", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Alion", link:"https://painel.farmby.com.br/storage/bulas/alion.pdf",
    alvos:["caruru","picao","coloniao","braquiaria","amargoso","colchao","gramaseda"],
    restricoes:["Uma aplicação por ano (intervalo mínimo de 12 meses).","Não usar em cana-planta com menos de 10% de argila nem com menos de 1% de matéria orgânica.","Não usar com mudas pré-brotadas (MPB).","Intervalo de segurança: 165 dias."],
    dose:(w,s)=>{ const baixa=["coloniao","caruru","colchao","amargoso"].includes(w)?"0,10":"0,15";
      return {d:s==="argiloso"?"0,20":baixa,u:"L/ha"}; } },
  amicnortox:{ comercial:"Amicarbazone Nortox", titular:"Nortox", ia:"Amicarbazona", conc:"700 g/kg", form:"WG",
    moa:["5"], registro:"não conferido", modalidade:"Pré e pós-emergência inicial", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Amicarbazone Nortox", link:"https://assets.revistacultivar.com.br/f722ffbe-4738-43d6-9306-6660600ef075_amicarbazone_nortox_bula.pdf",
    alvos:["corda","caruru","picao","trapoeraba","braquiaria","colchao"],
    restricoes:["Aplicação única.","Pré na cana-planta ou logo após o corte na soca."],
    dose:(w,s)=> s==="argiloso" ? {d:"2,0",u:"kg/ha"} : {d:["caruru","picao","corda"].includes(w)?"1,5":"1,0",u:"kg/ha"} },
  gamit:{ comercial:"Gamit 360 CS", titular:"FMC", ia:"Clomazona", conc:"360 g/L", form:"CS (suspensão de cápsulas)",
    moa:["13"], registro:"não conferido", modalidade:"Pré-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Revista Cultivar — ficha do produto (dados da bula)", link:"https://revistacultivar.com.br/pesticida/gamit-360-cs",
    alvos:["corda","caruru","trapoeraba","coloniao","braquiaria","colchao"],
    restricoes:["Uma aplicação por ciclo.","Intervalo de segurança na cana: 365 dias.","Solo médio: a bula não define dose própria; escolha conforme infestação."],
    dose:(w,s)=>({d:{arenoso:"3,0",medio:"3,0 a 3,5",argiloso:"3,5"}[s],u:"L/ha"}) },
  krismat:{ comercial:"Krismat WG", titular:"Syngenta", ia:"Ametrina + trifloxissulfurom-sódico", conc:"731,5 + 18,5 g/kg", form:"WG",
    moa:["5","2"], registro:"não conferido", modalidade:"Pós-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Revista Cultivar — ficha do produto (dados da bula)", link:"https://revistacultivar.com.br/pesticida/krismat-wg",
    alvos:["corda","caruru","picao","trapoeraba","braquiaria","colchao","tiririca"],
    restricoes:["Uma aplicação.","2 a 4 semanas após o plantio ou 3 a 4 semanas após o corte.","Espalhante adesivo não iônico a 0,2%.","Tiririca: só supressão, após 2,4-D."],
    dose:(w)=> w==="tiririca" ? {d:"2,0",u:"kg/ha",n:"Supressão, após aplicação de 2,4-D."} : {d:"1,75 a 2,0",u:"kg/ha",n:"1,75 kg/ha em baixa infestação."} },
  sempra:{ comercial:"Sempra", titular:"não conferido", ia:"Halossulfurom-metílico", conc:"750 g/kg", form:"WG",
    moa:["2"], registro:"não conferido", modalidade:"Pós-emergência", status:"bula", conferido:"14/10/2026",
    fonte:"Bula Sempra", link:"https://assets.revistacultivar.com.br/ef125e38-c7fd-45be-8e97-8030dfc4d8e2_sempra_bula.pdf",
    alvos:["tiririca"],
    restricoes:["Uma aplicação por ciclo.","30 a 40 dias após o plantio ou corte.","Surfactante (amina polioxietilenada) a 1,0 L/ha."],
    dose:()=>({d:"150",u:"g/ha"}) },
  dma806:{ comercial:"2,4-D DMA 806 SL CAC", titular:"não conferido", ia:"2,4-D (sal dimetilamina)", conc:"806 g/L (670 g/L e.a.)", form:"SL (concentrado solúvel)",
    moa:["4"], registro:"não conferido", modalidade:"Pós-emergência (área total ou jato dirigido)", status:"bula", conferido:"14/10/2026",
    fonte:"Bula 2,4-D DMA 806 SL CAC", link:"https://assets.revistacultivar.com.br/58e13de1-e1c1-4d1b-9563-fa50baa0256a_24d_dma_806_sl_cac_bula.pdf",
    alvos:["corda","caruru","picao","leiteiro","trapoeraba","tiririca"],
    restricoes:["Área total: cana até 30 cm, antes da formação dos colmos.","Jato dirigido: antes da floração da planta daninha.","Alto risco de deriva para culturas sensíveis vizinhas: siga as normas estaduais para 2,4-D."],
    dose:(w)=> ["picao","caruru"].includes(w) ? {d:"1,0 a 1,5",u:"L/ha",n:"Área total, daninhas com 3 a 5 folhas."} : {d:"1,5",u:"L/ha",n:"Jato dirigido."} }
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
