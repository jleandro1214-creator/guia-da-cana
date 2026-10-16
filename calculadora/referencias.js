/* =====================================================================
   Calculadora da Cana — referências e passo a passo de cada cálculo
   ref:  faixas Bom / Regular / Ruim (ou tabela de equivalências)
   como: como fazer a análise no campo ou no laboratório
   Valores de referência gerais para cana no Centro-Sul. Ajuste às metas
   e aos padrões da sua usina quando forem diferentes.
   ===================================================================== */
"use strict";
const REF_AVISO = "Referência geral para cana no Centro-Sul. Se a usina tiver meta própria, vale a da usina.";
const REFS = {
/* ---------------- CAMPO ---------------- */
perf:{
  ref:{rows:[
    ["Perfilhos por metro (90 a 120 dias)","acima de 18","12 a 18","abaixo de 12"],
    ["Perfilhos por hectare (linha de 1,50 m)","acima de 120 mil","80 a 120 mil","abaixo de 80 mil"]],
    nota:"O pico de perfilhamento é entre 3 e 4 meses. Depois parte dos perfilhos morre, e é normal sobrar 10 a 14 colmos por metro na colheita."},
  como:["Escolha pelo menos 5 pontos espalhados no talhão, longe da bordadura (entre 20 e 30 m da carreadora).",
    "Em cada ponto, meça 10 m de linha com a trena.",
    "Conte todos os perfilhos vivos nesse trecho, inclusive os pequenos que já têm folha aberta.",
    "Some os pontos e os metros, ou faça a conta ponto a ponto e tire a média.",
    "Anote a idade da cana e a variedade: a comparação só vale para a mesma fase."]},
tch:{
  ref:{rows:[
    ["TCH estimado","acima de 90 t/ha","70 a 90 t/ha","abaixo de 70 t/ha"],
    ["Colmos por metro","acima de 12","9 a 12","abaixo de 9"],
    ["Peso médio do colmo","acima de 1,2 kg","0,9 a 1,2 kg","abaixo de 0,9 kg"]],
    nota:"Cana-planta e primeiros cortes tendem a ficar acima; cortes mais velhos, abaixo. Compare com o mesmo estágio de corte."},
  como:["Faça a estimativa de 30 a 60 dias antes da colheita.",
    "Em pelo menos 5 pontos do talhão, meça 10 m de linha e conte os colmos industrializáveis (sem contar brotos e colmos secos).",
    "Em cada ponto, corte 10 colmos seguidos rente ao chão e tire o ponteiro no ponto de quebra natural.",
    "Pese o feixe e divida por 10 para ter o peso médio do colmo.",
    "Lance a soma dos colmos, os metros e o peso médio. Use o espaçamento real do talhão."]},
falha:{
  ref:{rows:[
    ["Falhas na linha (Stolf)","até 20%","20 a 35%","acima de 35%"]],
    nota:"Até 10% é excelente e de 10 a 20% é normal. Acima de 35% é ruim e acima de 50% é péssimo: avalie replantio ou reforma."},
  como:["Avalie entre 30 e 60 dias após o plantio ou o corte, quando a brotação já está visível.",
    "Escolha linhas representativas e estique uma trena de 100 m (ou marque o trecho).",
    "Caminhe pela linha e meça cada espaço sem touceira entre duas touceiras.",
    "Anote só os espaços maiores que 0,5 m. Espaço menor não é falha.",
    "Some as falhas anotadas e lance com os metros avaliados. Repita em pelo menos 3 linhas por talhão."]},
capop:{
  ref:{rows:[
    ["Eficiência de campo","acima de 75%","60 a 75%","abaixo de 60%"],
    ["Paradas por turno de 8 h","até 1 h","1 a 2 h","acima de 2 h"],
    ["Área feita x planejada no turno","acima de 95%","85 a 95%","abaixo de 85%"]],
    nota:"Pulverização e adubação costumam ter eficiência maior que plantio. Talhão curto e muita manobra derrubam a eficiência."},
  como:["Meça a largura útil que a máquina realmente cobre (sem sobreposição), em metros.",
    "Marque 50 m no talhão e cronometre a passada: velocidade (km/h) = 180 ÷ segundos.",
    "Peça ao operador o tempo de turno e anote as paradas (abastecimento, manutenção, refeição, espera).",
    "Para a eficiência real, divida a área feita no turno pela capacidade teórica × horas trabalhadas.",
    "Lance os dados e compare a área por turno com a meta do dia."]},
/* ---------------- ADUBAÇÃO ---------------- */
adubo:{
  ref:{rows:[
    ["Aplicado x recomendado","diferença até 5%","5 a 10%","acima de 10%"]],
    nota:"A dose do nutriente vem da análise de solo e da recomendação do agrônomo. A referência aqui é o quanto a aplicação ficou perto do recomendado."},
  como:["Tire amostras de solo nas camadas 0 a 20 cm e 20 a 40 cm (e 40 a 60 cm na reforma).",
    "Em cada área homogênea de até 10 ha, junte de 15 a 20 subamostras em zigue-zague e misture num balde limpo.",
    "Mande cerca de 300 g por camada ao laboratório, identificadas com fazenda e talhão.",
    "Com o laudo, o agrônomo define a recomendação do nutriente em kg/ha.",
    "Lance a recomendação e o teor do nutriente que está no saco do produto (garantia do rótulo)."]},
fert:{
  ref:{rows:[
    ["Aplicado x planejado","diferença até 5%","5 a 10%","acima de 10%"],
    ["Uniformidade de distribuição (CV)","até 10%","10 a 15%","acima de 15%"]],
    nota:"Diferença acima de 10% pede regulagem da adubadora. O CV vem do teste de bandejas ou de coleta por linha."},
  como:["Confira a formulação no rótulo (por exemplo 20-05-20 é 20% de N, 5% de P₂O₅ e 20% de K₂O).",
    "Regule a adubadora antes: rode 50 m, colete o adubo de cada linha num saco e pese.",
    "Dose em kg/ha = peso coletado (kg) × 10.000 ÷ (50 m × espaçamento). Ajuste até bater com a recomendada.",
    "Para o CV, colete pelo menos 5 linhas, tire a média e o desvio padrão: CV = desvio ÷ média × 100.",
    "No fim da operação, lance o que foi realmente aplicado para comparar com o planejado."]},
vinh:{
  ref:{rows:[
    ["K₂O na vinhaça","acima de 3 kg/m³","1,5 a 3 kg/m³","abaixo de 1,5 kg/m³"],
    ["K no solo em relação à CTC (CETESB)","abaixo de 5%","—","5% ou mais: não aplicar"],
    ["Aplicado x planejado","diferença até 5%","5 a 10%","acima de 10%"]],
    nota:"Pela norma CETESB P4.231, a dose máxima é m³/ha = [(0,05 × CTC − K do solo) × 3.744 + 185] ÷ K₂O da vinhaça, com CTC e K em cmolc/dm³ na camada de 0 a 80 cm. Vinhaça diluída rende menos K por viagem."},
  como:["Colete a vinhaça na saída do tanque ou do canal, em frasco limpo de 1 L, no mesmo dia da aplicação.",
    "Mande ao laboratório pedindo K₂O em kg/m³ (se vier em mg/L, divida por 1.000).",
    "Confira na análise de solo a CTC e o K do talhão (0 a 80 cm) e calcule o limite da CETESB.",
    "Defina o K₂O desejado com o agrônomo e lance os dados aqui.",
    "Se a dose calculada passar do limite da norma, use o limite."]},
torta:{
  ref:{rows:[
    ["Umidade da torta","65 a 75%","75 a 80%","acima de 80%"],
    ["Dose no sulco de plantio","15 a 30 t/ha","30 a 40 t/ha","acima de 40 t/ha"]],
    nota:"Quanto mais úmida, menos nutriente por tonelada e mais frete por kg de nutriente. Em área total, as doses são maiores (80 a 100 t/ha)."},
  como:["Tire 10 a 15 porções de pontos e profundidades diferentes da pilha e misture.",
    "Mande cerca de 1 kg em saco plástico fechado, para não perder umidade.",
    "Peça teor de P₂O₅, K₂O e umidade. Use o resultado na base úmida (como a torta sai para o campo), em kg/t.",
    "Se o laudo vier em % na matéria seca: kg/t úmida = % × 10 × (100 − umidade) ÷ 100.",
    "Lance o nutriente desejado e o teor da torta."]},
/* ---------------- COLHEITA ---------------- */
im:{
  ref:{rows:[
    ["Índice de maturação (topo ÷ base)","0,85 a 1,00 (madura)","0,60 a 0,85 (em maturação)","abaixo de 0,60 ou acima de 1,00"],
    ["Brix médio do caldo (campo)","acima de 18 °Brix","16 a 18 °Brix","abaixo de 16 °Brix"]],
    nota:"IM abaixo de 0,60 é cana imatura. Acima de 1,00 a cana já passou do ponto e começa a perder açúcar."},
  como:["Faça a leitura com o refratômetro de campo limpo e zerado com água.",
    "Escolha 10 colmos ao acaso em pontos diferentes do talhão.",
    "Fure com o furador o terço superior (topo, abaixo do ponteiro) e o terço inferior (base, perto do chão) de cada colmo.",
    "Pingue 2 a 3 gotas do caldo no prisma e leia o °Brix. Limpe entre leituras.",
    "Tire a média do topo e a média da base dos 10 colmos e lance aqui."]},
atr:{
  ref:{rows:[
    ["ATR","acima de 140 kg/t","125 a 140 kg/t","abaixo de 125 kg/t"],
    ["ATR por hectare","acima de 12 t/ha","9,5 a 12 t/ha","abaixo de 9,5 t/ha"],
    ["Pol da cana (PC)","acima de 14%","12 a 14%","abaixo de 12%"]],
    nota:"O ATR sobe ao longo da safra e cai com chuva e com cana em declínio. Compare com a mesma época."},
  como:["Para análise prévia, corte de 10 a 15 colmos seguidos em pontos do talhão, sem ponteiro e sem palha.",
    "Mande ao laboratório da usina, que faz a análise pelo sistema Consecana.",
    "Na entrega à usina, o ATR vem da amostra colhida com sonda na carga.",
    "Pegue o ATR (kg/t) e a PC (%) do laudo e o TCH do talhão.",
    "Lance os dados para ter o ATR e o açúcar por hectare."]},
colh:{
  ref:{rows:[
    ["Execução da meta de área ou toneladas","acima de 95%","85 a 95%","abaixo de 85%"],
    ["Aproveitamento do tempo","acima de 65%","50 a 65%","abaixo de 50%"],
    ["TCH realizado","acima de 90 t/ha","70 a 90 t/ha","abaixo de 70 t/ha"]],
    nota:"Paradas por chuva, espera de transbordo e manutenção são as que mais derrubam o aproveitamento. Anote o motivo de cada parada."},
  como:["Pegue no início do dia a área e as toneladas planejadas na programação.",
    "Durante o turno, anote as horas produtivas e as paradas (com o motivo).",
    "No fim do turno, meça a área colhida (mapa, GPS ou contagem de linhas × comprimento × espaçamento).",
    "Pegue as toneladas do boletim da balança. Se ainda não houver pesagem, marque como estimativa.",
    "Lance os dados e confira se o realizado bate com a meta."]},
/* ---------------- DIESEL ---------------- */
diesel:{
  ref:{rows:[
    ["Consumo real x padrão do equipamento","até 5% acima","5 a 15% acima","mais de 15% acima"],
    ["Colhedora (litros por tonelada)","até 1,0 L/t","1,0 a 1,3 L/t","acima de 1,3 L/t"]],
    nota:"Cada equipamento tem o seu padrão, definido pelo gestor. Terreno, carga e cana deitada aumentam o consumo."},
  como:["Abasteça o tanque até completar e anote o horímetro (horímetro inicial).",
    "Trabalhe normalmente o período (turno, dia ou semana).",
    "Complete o tanque de novo e anote os litros que entraram e o horímetro final.",
    "Pegue as toneladas ou a área trabalhada no mesmo período.",
    "Lance os dados e compare com o padrão do equipamento."]},
dcusto:{
  ref:{rows:[
    ["Real x previsto (L/h ou L/ha)","até 5% acima","5 a 15% acima","mais de 15% acima"]],
    nota:"Antes de concluir que há desperdício, confira o horímetro, a operação feita e o terreno."},
  como:["Pegue os litros do período (pelo método do tanque cheio ou do controle de abastecimento).",
    "Use o preço pago por litro na nota do último abastecimento.",
    "Anote as horas trabalhadas pelo horímetro e a área feita.",
    "Peça ao gestor o consumo padrão do equipamento (L/h ou L/ha).",
    "Lance os dados para ver o custo e o desvio do padrão."]},
/* ---------------- MEDIDAS ÚTEIS ---------------- */
area:{
  ref:{rows:[
    ["Comprimento da linha (colheita mecanizada)","acima de 500 m","300 a 500 m","abaixo de 300 m"]],
    nota:"Linha longa diminui manobras de colhedora e transbordo. Para talhão irregular, use o mapa ou o GPS."},
  como:["Meça o comprimento com trena, roda de medição ou GPS, seguindo a direção das linhas.",
    "Meça a largura no sentido perpendicular às linhas.",
    "Se o talhão não for retangular, meça a largura em 3 pontos e use a média.",
    "Para formato muito irregular, divida em retângulos, calcule cada um e some.",
    "Lance comprimento e largura em metros."]},
conv:{
  ref:{cols:["Alqueire","Equivale a"],rows:[
    ["Paulista","2,42 ha (24.200 m²)"],["Mineiro e goiano","4,84 ha (48.400 m²)"],["Baiano","9,68 ha (96.800 m²)"]],
    nota:"Não há bom, regular e ruim: é só conversão. A conta usa o alqueire paulista. Confirme qual alqueire a pessoa está usando."},
  como:["Pergunte de qual alqueire se trata (paulista, mineiro ou outro).",
    "Para alqueire paulista, digite o valor em um dos dois campos.",
    "Para alqueire mineiro, multiplique o resultado em hectares por 2.",
    "Confira no mapa ou na escritura da área quando o valor for para contrato."]},
sulco:{
  ref:{rows:[
    ["Espaçamento simples","1,40 a 1,50 m","1,20 a 1,40 m","abaixo de 1,20 m ou diferente da bitola da máquina"],
    ["Linha dupla (combinado)","1,50 × 0,90 m","outro combinado na bitola","combinado que faz a roda pisar a linha"]],
    nota:"O bom espaçamento é o que casa com a bitola da colhedora e do transbordo, para a roda não pisar a soqueira."},
  como:["Meça de centro a centro de duas linhas vizinhas com a trena, em 5 pontos do talhão.",
    "Em linha dupla, meça também o espaçamento menor, dentro do par de linhas.",
    "Tire a média de cada medida.",
    "Lance os espaçamentos e, se quiser, a área do talhão para ter o total de sulco."]},
unid:{
  ref:{cols:["Unidade","Equivale a"],rows:[
    ["1 t/alq (paulista)","0,413 t/ha"],["1 L/alq (paulista)","0,413 L/ha"],["1 m/s","3,6 km/h"],["1 m³","1.000 L"]],
    nota:"Não há bom, regular e ruim: é só conversão entre unidades da mesma grandeza."},
  como:["Escolha a grandeza (área, massa, volume, produtividade etc.).",
    "Digite o valor e escolha a unidade de origem.",
    "Escolha a unidade de destino e leia o resultado.",
    "Para alqueire, confirme se é o paulista (2,42 ha)."]}
};
if(typeof module!=="undefined") module.exports={REFS,REF_AVISO};
