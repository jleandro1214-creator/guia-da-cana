/* =====================================================================
   Guia da Cana — complemento das fichas técnicas de pragas e doenças.
   O texto e as fotos da versão 1 (base.js) foram mantidos; aqui entram os
   campos novos da ficha padronizada.

   STATUS: conteúdo técnico geral, montado a partir de conhecimento
   agronômico consolidado sobre cana no Brasil. AINDA NÃO conferido frase a
   frase com fonte — revisão por agrônomo pendente. Não há doses de produtos
   aqui: consulte AGROFIT e a bula vigente.
   ===================================================================== */
const FICHAS_REVISAO = "14/10/2026";
const FICHAS_STATUS = "Referência técnica geral — revisão por agrônomo pendente";
const REFERENCIAS_GERAIS = [
  {t:"AGROFIT — Sistema de Agrotóxicos Fitossanitários (MAPA): consulta de produtos registrados para a cultura e o alvo", u:"https://agrofit.agricultura.gov.br/agrofit_cons/principal_agrofit_cons"},
  {t:"Embrapa — conteúdos técnicos sobre cana-de-açúcar", u:"https://www.embrapa.br/"},
  {t:"Dinardo-Miranda, L.L.; Vasconcelos, A.C.M.; Landell, M.G.A. (ed.). Cana-de-açúcar. Campinas: Instituto Agronômico (IAC), 2008", u:""}
];

const EXTRA = {
  broca:{ tipo:"praga", fase:"Todo o ciclo; danos maiores em cana com colmos formados",
    ident:["Adulto: mariposa amarelo-palha, asas com linhas finas escuras.","Lagarta branco-amarelada com pintas escuras e cabeça marrom, dentro do colmo.","Ovos em placas, como escamas sobrepostas, nas folhas.","Orifícios de entrada no colmo, com serragem."],
    favor:["Temperatura alta e umidade.","Variedades mais suscetíveis.","Ausência de inimigos naturais."],
    monit:["Amostragem de lagartas em gabarito no campo (veja o esquema na foto).","Na colheita: Índice de Intensidade de Infestação (I.I.%) = entrenós broqueados ÷ entrenós avaliados × 100."],
    decisao:"O momento de liberar parasitoides ou intervir segue o programa de manejo da usina. O app não define nível de controle.",
    mip:["Controle biológico com Cotesia flavipes (prática mais usada).","Uso de variedades menos suscetíveis.","Monitorar e manter registro por talhão."],
    controle:"Biológico como base. Qualquer produto químico só com registro no AGROFIT para cana e para Diatraea saccharalis, conforme a bula." },
  cigarrinha:{ tipo:"praga", fase:"Período chuvoso; cana-soca colhida sem queima (com palhada) é mais afetada",
    ident:["Ninfas dentro de espuma branca na base da touceira e nas raízes.","Adulto: inseto pequeno, preto-avermelhado, que salta."],
    favor:["Chuva e calor (início da estação chuvosa).","Palhada que mantém umidade na base da touceira."],
    monit:["Contar espumas/ninfas por metro de sulco em pontos fixos do talhão.","Começar o levantamento com o início das chuvas."],
    decisao:"Nível de controle definido pelo programa de MIP da usina; registre ninfas por metro para acompanhar a evolução.",
    mip:["Controle biológico com o fungo Metarhizium anisopliae.","Variedades mais tolerantes.","Monitoramento frequente no período chuvoso."],
    controle:"Biológico como base. Químicos só com registro no AGROFIT para o alvo e a cultura." },
  bicudo:{ tipo:"praga", fase:"Cana-soca, ataca o rizoma; maior problema na reforma",
    ident:["Besouro marrom-escuro com focinho (rostro) alongado.","Larva branca, sem pernas, dentro do rizoma e da base do colmo."],
    favor:["Áreas com histórico da praga.","Soqueiras velhas mantidas na reforma."],
    monit:["Iscas com toletes de cana para capturar adultos.","Abrir touceiras e trincheiras para ver larvas no rizoma."],
    decisao:"Decisão pelo programa da usina, a partir do levantamento de touceiras atacadas.",
    mip:["Destruição mecânica das soqueiras na reforma.","Controle biológico com fungos entomopatogênicos (ex.: Beauveria bassiana).","Evitar levar mudas de áreas infestadas."],
    controle:"Manejo cultural e biológico. Químicos só com registro no AGROFIT." },
  cupim:{ tipo:"praga", fase:"Plantio e brotação",
    ident:["Insetos claros, de corpo mole, em galerias de terra.","Toletes e mudas ocos, com terra por dentro."],
    favor:["Solo arenoso.","Restos de matéria orgânica em decomposição."],
    monit:["Iscas (papelão ou toletes) enterradas antes do plantio.","Avaliação de falhas de brotação."],
    decisao:"Na reforma, conforme levantamento com iscas e histórico da área.",
    mip:["Eliminar restos culturais que atraem a praga.","Tratamento de sulco no plantio quando indicado."],
    controle:"Somente produtos registrados no AGROFIT para cana e para cupins, conforme a bula." },
  sauva:{ tipo:"praga", fase:"Todo o ciclo; cana nova é mais sensível",
    ident:["Formigas grandes, avermelhadas, cortando e carregando folhas.","Olheiros e montes de terra solta no formigueiro."],
    favor:["Bordas com mata ou pasto.","Áreas sem controle sistemático."],
    monit:["Ronda nas bordas e carreadores procurando carreiros e olheiros.","Registrar formigueiros ativos por talhão."],
    decisao:"Controle quando há formigueiro ativo, conforme o programa da usina.",
    mip:["Controle sistemático dos formigueiros.","Atenção às bordas vizinhas a mata e pasto."],
    controle:"Iscas formicidas registradas no AGROFIT, aplicadas conforme a bula." },
  "ferrugem-alaranjada":{ tipo:"doenca", agente:"Puccinia kuehnii (fungo)",
    partes:{Folhas:"Pústulas pequenas, laranja vivo, mais na face de baixo; podem secar a folha."},
    favor:["Temperatura amena e muitas horas de folha molhada.","Variedades suscetíveis."],
    dissem:"Esporos levados pelo vento.",
    inspecao:"Olhar a face inferior das folhas mais novas em vários pontos do talhão; registrar a porcentagem de folhas com pústulas.",
    confunde:["Ferrugem marrom (pústulas mais escuras).","Mancha parda (não solta pó ao passar o dedo)."],
    prev:["Variedades resistentes.","Plantio em época que fuja das condições mais favoráveis."],
    mip:["Monitorar nas épocas favoráveis.","Decidir fungicida com o agrônomo, considerando a variedade."],
    controle:"Fungicidas apenas com registro no AGROFIT para cana e para Puccinia kuehnii." },
  "ferrugem-marrom":{ tipo:"doenca", agente:"Puccinia melanocephala (fungo)",
    partes:{Folhas:"Pústulas alongadas, marrom-escuras; folhas mais velhas secam antes."},
    favor:["Temperatura amena e umidade alta.","Variedades suscetíveis."],
    dissem:"Esporos levados pelo vento.",
    inspecao:"Avaliar folhas em vários pontos; passar o dedo: solta pó marrom.",
    confunde:["Ferrugem alaranjada (cor laranja viva).","Mancha parda.","Senescência natural das folhas velhas."],
    prev:["Variedades resistentes (principal medida)."],
    mip:["Monitorar a evolução nas variedades sensíveis."],
    controle:"Fungicidas apenas com registro no AGROFIT para o alvo." },
  carvao:{ tipo:"doenca", agente:"Sporisorium scitamineum (fungo)",
    partes:{Ponteiro:"\"Chicote\" preto saindo do topo, coberto de pó preto (esporos).",Colmos:"Finos e curtos.",Touceira:"Muitos perfilhos finos, aspecto de capim."},
    favor:["Calor e seca.","Variedades suscetíveis.","Mudas contaminadas."],
    dissem:"Esporos pelo vento e mudas infectadas.",
    inspecao:"Percorrer o talhão contando touceiras com chicote.",
    confunde:["O chicote é bem característico; plantas finas sem chicote podem ser outros problemas (seca, raquitismo)."],
    prev:["Mudas sadias de viveiro certificado.","Variedades resistentes.","Rouguing: arrancar e destruir touceiras doentes em viveiros."],
    mip:["Reformar áreas muito afetadas.","Não tirar mudas de talhões com carvão."],
    controle:"Medidas preventivas e varietais. Tratamento de mudas só com produtos registrados no AGROFIT." },
  raquitismo:{ tipo:"doenca", agente:"Leifsonia xyli subsp. xyli (bactéria)",
    partes:{Touceira:"Menor porte e colmos mais finos, sem sintoma externo claro.",Colmos:"Pontuações avermelhadas nos feixes dos nós, vistas com corte longitudinal."},
    favor:["Estresse hídrico (perdas maiores na seca).","Mudas contaminadas."],
    dissem:"Facões, colhedoras e plantadoras contaminados, e mudas infectadas.",
    inspecao:"Diagnóstico seguro só em laboratório; no campo, cortar colmos maduros no sentido do comprimento.",
    confunde:["Seca, deficiência nutricional, compactação e nematoides também deixam a cana fina.","Por isso a confirmação é laboratorial."],
    prev:["Mudas sadias (viveiro certificado).","Tratamento térmico de toletes (hidrotermoterapia) em viveiros.","Desinfecção de facões e lâminas entre talhões."],
    mip:["Começar a reforma com mudas sadias.","Diagnóstico em laboratório antes de grandes decisões."],
    controle:"Não há controle químico curativo; o manejo é preventivo." }
};

/* Chave de "o que você vê" — devolve POSSÍVEIS causas, nunca diagnóstico */
const SINAIS = [
  {k:"galeria",t:"Furo ou galeria no colmo",ids:["broca","bicudo"]},
  {k:"espuma",t:"Espuma branca na base",ids:["cigarrinha"]},
  {k:"amarela",t:"Folhas novas amarelas e secando",ids:["cigarrinha","bicudo","raquitismo"]},
  {k:"pustula",t:"Pústulas ou pó nas folhas",ids:["ferrugem-alaranjada","ferrugem-marrom"]},
  {k:"chicote",t:"Chicote preto no topo",ids:["carvao"]},
  {k:"oca",t:"Muda oca / falha na brotação",ids:["cupim","bicudo"]},
  {k:"cortada",t:"Folhas cortadas",ids:["sauva"]},
  {k:"fina",t:"Touceira fina e baixa",ids:["raquitismo","carvao","bicudo"]}
];
