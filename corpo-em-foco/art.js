/* Ilustrações esquemáticas do Corpo em Foco (todos os nomes em português) */
var ART = (function(){
  var ST = 'stroke="#6b4423" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';
  var FONT = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="11.5" font-weight="700"';
  function t(x,y,s,a,cor){return '<text x="'+x+'" y="'+y+'" text-anchor="'+(a||'start')+'" '+FONT+' fill="'+(cor||'#2b2418')+'">'+s+'</text>'}
  function L(x1,y1,x2,y2){return '<line class="ld" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#6b4423" stroke-width="1.2"/>'}
  function svg(w,h,body){return '<svg viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid meet">'+body+'</svg>'}
  function p(d,fill,extra){return '<path d="'+d+'" fill="'+fill+'" '+ST+' '+(extra||'')+'/>'}
  function line(d,cor,w,extra){return '<path d="'+d+'" fill="none" stroke="'+cor+'" stroke-width="'+w+'" stroke-linecap="round" '+(extra||'')+'/>'}

  var O = {};

  O.cerebro = svg(260,200,
    p('M35 100 C25 60 65 32 105 36 C145 30 175 62 165 100 C165 122 148 132 132 130 L62 130 C46 128 36 116 35 100Z','#eaa7a0')+
    line('M60 66 C75 52 90 70 105 58 M98 88 C112 74 126 92 142 78 M52 98 C66 88 80 104 94 96','#a65a52',2)+
    '<ellipse cx="135" cy="144" rx="28" ry="13" fill="#d98f86" '+ST+'/>'+
    p('M92 130 L92 176 Q92 183 100 183 Q108 183 108 176 L108 130Z','#c97d74')+
    t(100,122,'Cérebro','middle')+
    L(160,144,176,144)+t(178,148,'Cerebelo')+
    L(110,168,124,172)+t(126,176,'Tronco cerebral'));

  O.coracao = svg(280,200,
    '<g transform="translate(36,0)">'+
    line('M108 82 C112 40 150 30 162 58','#c0392b',10)+
    line('M96 82 C90 50 72 40 58 52','#4a6fa5',8)+
    p('M110 180 C58 140 46 94 72 76 C94 62 110 80 110 90 C110 80 132 60 154 76 C180 96 162 142 110 180Z','#d6564a')+
    line('M110 94 C108 120 110 150 110 174','#ffffff',2,'stroke-dasharray="5 4"')+
    line('M76 114 C100 120 120 120 148 114','#ffffff',2,'stroke-dasharray="5 4"')+
    '</g>'+
    t(4,22,'Artéria')+t(4,35,'pulmonar')+L(50,32,96,50)+
    t(206,50,'Aorta')+
    t(4,98,'Átrio')+t(4,111,'direito')+L(46,104,112,104)+
    t(206,98,'Átrio')+t(206,111,'esquerdo')+L(176,104,202,104)+
    t(4,152,'Ventrículo')+t(4,165,'direito')+L(70,154,124,150)+
    t(206,152,'Ventrículo')+t(206,165,'esquerdo')+L(172,152,202,152));

  O.pulmoes = svg(260,200,
    p('M122 20 L138 20 L138 76 L122 76Z','#e7d3b8')+
    line('M130 76 L98 104','#b8891a',6)+line('M130 76 L162 104','#b8891a',6)+
    p('M118 70 C90 62 55 92 52 142 C52 172 80 176 105 168 C118 160 118 120 118 70Z','#f0a8a8')+
    p('M142 70 C170 62 205 92 208 138 C208 164 188 172 168 160 C158 152 142 140 142 70Z','#f0a8a8')+
    t(146,38,'Traqueia')+
    L(156,98,170,60)+t(150,54,'Brônquios')+
    t(54,194,'Pulmão direito')+t(150,194,'Pulmão esquerdo'));

  O.figado = svg(260,200,
    p('M25 100 C40 55 120 48 195 85 C205 100 180 142 130 145 C80 148 40 140 25 100Z','#9a4b32')+
    line('M122 58 C116 90 112 120 112 143','#e8c9b8',2,'stroke-dasharray="4 3"')+
    '<ellipse cx="150" cy="150" rx="16" ry="9" fill="#6a9a3a" '+ST+'/>'+
    t(70,106,'Lobo direito','middle','#ffffff')+
    t(158,92,'Lobo','middle','#ffffff')+t(158,105,'esquerdo','middle','#ffffff')+
    L(150,159,150,170)+t(150,184,'Vesícula biliar','middle'));

  O.estomago = svg(260,200,
    line('M90 14 L90 54','#e6a39a',12)+
    p('M82 48 C55 55 38 95 52 130 C68 168 130 180 160 150 C178 125 150 112 128 100 C108 90 108 60 100 48Z','#e9a99b')+
    line('M160 150 C185 160 205 150 205 130 C205 114 192 110 184 122','#d98f86',12)+
    L(100,24,112,24)+t(114,28,'Esôfago')+
    t(64,128,'Estômago')+
    L(166,154,176,172)+t(166,186,'Piloro')+
    t(196,100,'Duodeno','middle'));

  O.intestinos = svg(260,200,
    line('M50 160 L50 52 Q50 40 62 40 L168 40 Q180 40 180 52 L180 160','#b8891a',14)+
    line('M78 62 H152 Q164 62 164 74 Q164 86 152 86 H78 Q66 86 66 98 Q66 110 78 110 H152 Q164 110 164 122 Q164 134 152 134 H78 Q66 134 66 146 Q66 156 78 156 H120','#e6a39a',10)+
    '<rect x="24" y="178" width="11" height="11" fill="#b8891a"/>'+t(40,188,'Intestino grosso')+
    '<rect x="136" y="178" width="11" height="11" fill="#e6a39a"/>'+t(152,188,'Intestino delgado'));

  var rim = 'M85 30 C55 25 38 60 44 92 C48 112 66 114 70 100 C72 90 62 84 68 70 C74 56 108 38 85 30Z';
  O.rins = svg(260,200,
    line('M130 14 L130 112','#c0392b',6)+
    p(rim,'#b5503f')+
    '<g transform="translate(260,0) scale(-1,1)">'+p(rim,'#b5503f')+'</g>'+
    line('M68 100 C70 130 100 140 120 152','#d9a441',4)+
    line('M192 100 C190 130 160 140 140 152','#d9a441',4)+
    '<ellipse cx="130" cy="166" rx="24" ry="17" fill="#e8c04a" '+ST+'/>'+
    t(6,20,'Rim direito')+t(176,20,'Rim esquerdo')+
    t(34,140,'Ureter')+
    t(130,198,'Bexiga','middle'));

  O.pancreas = svg(260,200,
    line('M42 76 C14 100 14 134 52 150','#e6a39a',12)+
    p('M40 108 C60 80 100 84 130 90 C165 94 205 96 200 112 C196 126 160 122 130 119 C100 116 70 132 40 108Z','#e8b878')+
    line('M58 112 C100 106 160 108 194 106','#8a5a1e',1.5,'stroke-dasharray="4 3"')+
    L(72,124,94,144)+t(98,156,'Cabeça','middle')+
    L(128,89,128,72)+t(128,64,'Corpo','middle')+
    L(194,118,194,138)+t(194,152,'Cauda','middle')+
    t(4,52,'Duodeno'));

  O.baco = svg(260,200,
    p('M95 46 C135 30 175 66 165 112 C160 144 125 158 110 138 C95 118 80 80 95 46Z','#7b4a74')+
    line('M96 98 L56 98','#c0392b',3)+line('M96 108 L56 112','#4a6fa5',3)+
    t(132,100,'Baço','middle','#ffffff')+
    t(4,92,'Vasos')+t(4,105,'do baço')+
    t(130,186,'Fica no alto da barriga, do lado esquerdo','middle'));

  O.bexiga = svg(260,200,
    line('M70 16 C70 50 82 64 92 72','#b8891a',5)+line('M150 16 C150 50 138 64 128 72','#b8891a',5)+
    p('M75 85 C75 62 145 62 145 85 C150 125 132 155 110 155 C88 155 70 125 75 85Z','#e8c04a')+
    '<rect x="104" y="155" width="12" height="30" rx="3" fill="#b8891a" '+ST+'/>'+
    t(110,118,'Bexiga','middle')+
    t(160,34,'Ureteres')+
    L(146,106,164,106)+t(168,104,'Parede')+t(168,117,'muscular')+
    t(124,178,'Uretra'));

  O.pele = svg(260,200,
    '<rect x="20" y="50" width="170" height="14" fill="#e7c9a0" stroke="#6b4423" stroke-width="1.5"/>'+
    '<rect x="20" y="64" width="170" height="64" fill="#f3d7c6" stroke="#6b4423" stroke-width="1.5"/>'+
    '<rect x="20" y="128" width="170" height="50" fill="#f6e6a8" stroke="#6b4423" stroke-width="1.5"/>'+
    line('M60 22 L62 50 L62 92','#6b4423',3)+'<circle cx="62" cy="96" r="6" fill="#6b4423"/>'+
    line('M105 128 C85 120 125 112 105 104 C85 96 125 88 105 80 L105 50','#4a6fa5',2)+
    t(70,18,'Pelo')+
    t(196,61,'Epiderme')+t(196,100,'Derme')+t(196,156,'Hipoderme')+
    t(128,100,'Glândula')+t(128,113,'de suor'));

  /* Close-ups de músculos e ossos (só o grupo, com partes nomeadas) */
  function B(d,f){return '<path d="'+d+'" fill="'+(f||'#f3ead6')+'" stroke="#8a6a3e" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'}
  function Mu(d,f){return '<path d="'+d+'" fill="'+(f||'#b85a48')+'" stroke="#7a2e22" stroke-width="2" stroke-linejoin="round"/>'}
  function Tn(d){return '<path d="'+d+'" fill="#efe3c8" stroke="#a08a5a" stroke-width="1.5" stroke-linejoin="round"/>'}
  function Fb(d){return '<path d="'+d+'" fill="none" stroke="#5a1f16" stroke-width="1" opacity=".4"/>'}
  function mir(g){return '<g transform="translate(260,0) scale(-1,1)">'+g+'</g>'}
  var W='#ffffff';
  var M = {};

  /* ---- MÚSCULOS ---- */
  var pm = Mu('M138 38 C170 32 205 50 226 70 C210 100 170 135 138 156Z')+Fb('M138 58 L224 70 M138 80 L222 72 M138 104 L216 78 M138 130 L204 92')+Tn('M222 62 C232 64 234 78 224 80Z');
  M.peitoral = svg(260,200,
    B('M20 34 C60 24 104 30 124 36 L124 46 C100 42 60 40 20 48Z')+B('M240 34 C200 24 156 30 136 36 L136 46 C160 42 200 40 240 48Z')+
    B('M124 30 h12 v130 h-12Z')+pm+mir(pm)+
    t(130,14,'Esterno','middle')+t(4,16,'Clavícula')+
    t(130,184,'Peitoral maior (um de cada lado)','middle')+
    t(256,150,'Liga ao','end')+t(256,163,'braço','end')+L(240,146,230,84));

  M.deltoide = svg(260,200,
    B('M40 20 C100 8 170 10 224 26 L226 38 C170 24 100 24 40 34Z')+
    B('M140 170 h20 v30 h-20Z')+
    Mu('M60 40 C90 24 180 24 210 42 C216 90 196 140 160 170 L140 170 C104 140 70 90 60 40Z','#c7695a')+
    Mu('M105 30 C115 90 135 135 150 170 L140 170 C104 140 80 90 70 44Z','#b85a48')+
    Mu('M165 28 C172 90 160 135 150 170 L160 170 C196 140 214 90 208 46Z','#a64d3d')+
    Fb('M90 50 L130 150 M120 40 L146 150 M180 40 L156 150 M200 52 L168 150')+
    t(4,106,'Parte')+t(4,119,'da frente')+L(52,112,96,110)+
    t(133,86,'Parte do','middle',W)+t(133,99,'meio','middle',W)+
    t(212,106,'Parte')+t(212,119,'de trás')+L(196,112,210,112)+
    t(170,190,'Úmero'));

  M.biceps = svg(260,200,
    B('M92 4 h86 v14 h-86Z')+B('M150 18 h22 v126 h-22Z')+
    '<path d="M158 148 L132 190" stroke="#8a6a3e" stroke-width="17" stroke-linecap="round"/><path d="M158 148 L132 190" stroke="#f3ead6" stroke-width="13" stroke-linecap="round"/>'+
    line('M104 18 C108 38 114 52 120 62','#b85a48',9)+line('M142 18 C138 38 130 52 124 62','#a64d3d',9)+
    Mu('M106 62 C86 92 90 130 116 150 C140 134 146 92 134 62 C128 54 112 54 106 62Z')+Fb('M118 60 C112 90 112 120 116 146 M126 60 C128 90 128 118 122 146')+
    Tn('M112 148 L122 148 L130 176 L122 180Z')+
    t(4,26,'Cabeça')+t(4,39,'longa')+L(44,30,100,26)+
    t(190,30,'Cabeça')+t(190,43,'curta')+L(188,34,146,28)+
    t(4,100,'Ventre do')+t(4,113,'músculo')+L(60,106,90,106)+
    t(4,170,'Tendão')+L(46,166,116,164)+
    t(190,90,'Úmero')+L(188,86,172,86)+
    t(190,180,'Rádio')+L(188,176,144,184));

  M.triceps = svg(260,200,
    B('M76 4 h108 v12 h-108Z')+
    Mu('M92 14 C84 60 92 120 120 152 L130 152 C126 120 118 70 112 14Z','#c7695a')+
    Mu('M112 14 C118 70 126 120 130 152 C134 120 142 70 148 14Z','#a64d3d')+
    Mu('M148 14 C142 70 134 120 130 152 L140 152 C168 120 176 60 168 14Z','#b85a48')+
    Fb('M100 30 L124 140 M156 30 L136 140')+
    Tn('M122 150 L138 150 L134 174 L126 174Z')+
    B('M120 172 C120 166 140 166 140 172 L143 198 L117 198Z')+
    t(4,70,'Cabeça')+t(4,83,'lateral')+L(46,76,96,76)+
    t(190,40,'Cabeça')+t(190,53,'medial')+L(188,44,162,44)+
    t(190,118,'Cabeça')+t(190,131,'longa')+L(188,122,136,112)+
    t(4,160,'Tendão')+L(46,156,124,160)+
    t(150,192,'Olécrano')+t(4,12,'Ombro'));

  var rb = function(x,y,w,h,r){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="#b85a48" stroke="#7a2e22" stroke-width="2"/>'};
  var ab=''; [24,62,100,138].forEach(function(y){ab+=rb(98,y,30,34,9)+rb(132,y,30,34,9)});
  var ob = Mu('M58 30 C80 40 92 80 92 176 L58 158 C52 110 52 70 58 30Z','#a64d3d')+Fb('M62 50 L90 100 M60 80 L90 130 M60 110 L90 160');
  M.abdominais = svg(260,200,
    '<rect x="128" y="18" width="4" height="166" fill="#efe3c8" stroke="#a08a5a"/>'+
    ab+ob+mir(ob)+
    t(4,100,'Oblíquos')+L(54,100,66,100)+
    t(130,12,'Linha alba','middle')+L(130,15,130,22)+
    t(130,198,'Reto abdominal','middle'));

  M.costas = svg(260,200,
    Mu('M130 124 L202 68 C216 120 196 160 130 186 C64 160 44 120 58 68Z','#a64d3d')+
    Mu('M130 10 L208 44 L130 124 L52 44Z','#c7695a')+
    Fb('M130 16 L180 56 M130 30 L170 72 M130 16 L80 56 M130 30 L90 72 M130 140 L190 100 M130 160 L180 120 M130 140 L70 100 M130 160 L80 120')+
    '<rect x="128" y="12" width="4" height="174" fill="#f3ead6" stroke="#8a6a3e" stroke-width="1"/>'+
    t(100,66,'Trapézio','middle',W)+t(204,150,'Latíssimo')+t(204,163,'do dorso')+L(202,152,176,142)+
    t(236,70,'Coluna','middle')+L(222,74,134,84));

  var gm = Mu('M66 24 C96 12 126 24 128 62 C104 60 80 52 66 24Z','#c7695a')+
           Mu('M128 62 C112 58 84 66 66 92 C58 130 84 168 128 172Z','#b85a48')+
           Fb('M126 70 L74 110 M126 96 L70 126 M126 124 L76 148 M110 30 L90 52');
  M.gluteos = svg(260,200,
    B('M118 14 L142 14 L134 60 L126 60Z')+gm+mir(gm)+
    t(130,10,'Sacro','middle')+
    t(4,36,'Glúteo')+t(4,49,'médio')+L(44,42,74,40)+
    t(4,120,'Glúteo')+t(4,133,'máximo')+L(48,126,70,126)+
    t(130,196,'O glúteo máximo é o maior músculo do corpo','middle'));

  M.quadriceps = svg(260,200,
    Mu('M92 30 C84 80 96 130 124 152 L128 150 C114 120 114 70 118 18Z','#c7695a')+
    Mu('M118 14 C112 70 114 120 128 150 L146 150 C150 120 150 70 144 14Z','#b85a48')+
    Mu('M170 40 C178 90 166 130 146 152 L144 150 C150 120 150 70 144 18Z','#a64d3d')+
    Fb('M110 20 L124 140 M134 20 L136 140 M156 24 L148 140')+
    Tn('M124 148 L148 148 L144 158 L128 158Z')+
    B('M122 160 C122 152 150 152 150 160 C150 174 122 174 122 160Z')+
    Tn('M128 172 L144 172 L140 196 L132 196Z')+
    t(130,10,'Reto femoral','middle')+
    t(4,80,'Vasto')+t(4,93,'lateral')+L(44,86,98,86)+
    t(196,80,'Vasto')+t(196,93,'medial')+L(194,86,172,86)+
    t(166,168,'Patela')+L(164,164,152,164)+
    t(166,190,'Tendão')+L(164,186,144,184));

  M.posteriores = svg(260,200,
    B('M84 4 h96 v14 h-96Z')+
    Mu('M92 20 C86 80 100 130 126 160 L140 160 C128 120 122 70 124 20Z','#c7695a')+
    Mu('M124 20 C122 70 128 120 140 160 L148 160 C150 120 148 70 150 20Z','#b85a48')+
    Mu('M150 20 C150 70 150 120 148 160 L162 160 C176 110 178 60 170 20Z','#a64d3d')+
    Tn('M124 158 L150 158 L146 188 L128 188Z')+
    t(4,80,'Bíceps')+t(4,93,'femoral')+L(50,86,96,86)+
    t(178,48,'Semitendíneo')+L(176,44,150,44)+
    t(184,120,'Semimem-')+t(184,133,'branoso')+L(182,126,166,126)+
    t(196,14,'Ísquio')+t(4,184,'Atrás do joelho'));

  M.panturrilha = svg(260,200,
    Mu('M104 70 C96 110 108 140 126 148 L134 148 C152 140 164 110 156 70Z','#a64d3d')+
    Mu('M94 14 C80 50 90 100 126 112 C128 80 128 40 118 14Z','#c7695a')+
    Mu('M142 14 C132 40 132 80 134 112 C170 100 180 50 166 14Z','#b85a48')+
    Fb('M100 24 L122 100 M110 20 L126 96 M158 24 L138 100 M150 20 L136 96')+
    Tn('M122 110 L138 110 L134 176 L126 176Z')+
    B('M112 176 C112 170 148 170 148 176 C154 194 106 194 112 176Z')+
    t(4,36,'Gastrocnêmio')+L(84,32,100,32)+
    t(192,100,'Sóleo')+L(190,96,158,96)+
    t(180,148,'Tendão de')+t(180,161,'Aquiles')+L(178,154,136,150)+
    t(166,196,'Calcanhar')+L(164,192,150,188));

  /* ---- OSSOS ---- */
  var DK='#4a3320';
  M.cranio = svg(260,200,
    B('M70 100 C58 40 90 12 130 12 C170 12 202 40 190 100 C190 118 182 128 176 138 L176 150 C176 168 160 186 130 190 C100 186 84 168 84 150 L84 138 C78 128 70 118 70 100Z')+
    '<ellipse cx="104" cy="94" rx="17" ry="13" fill="'+DK+'"/><ellipse cx="156" cy="94" rx="17" ry="13" fill="'+DK+'"/>'+
    '<path d="M130 106 C122 120 120 128 126 132 L134 132 C140 128 138 120 130 106Z" fill="'+DK+'"/>'+
    Tn('M104 156 h52 v12 h-52Z')+'<path d="M117 156 v12 M130 156 v12 M143 156 v12" stroke="#a08a5a"/>'+
    B('M88 168 C94 196 166 196 172 168 C176 184 154 198 130 198 C106 198 84 184 88 168Z')+
    t(4,40,'Osso')+t(4,53,'frontal')+L(40,46,84,46)+
    t(4,98,'Órbita')+t(4,111,'(do olho)')+L(48,94,86,94)+
    t(4,146,'Cavidade')+t(4,159,'nasal')+L(58,152,122,126)+
    t(204,124,'Maçã do')+t(204,137,'rosto')+L(202,128,182,120)+
    t(204,160,'Maxila')+L(202,156,172,160)+
    t(4,190,'Mandíbula')+L(66,188,100,186));

  function pilha(n,y0,st,xs,xe,w,h,f){var s='';for(var i=0;i<n;i++){var y=y0+i*st,x=xs+(xe-xs)*(i/(n-1||1));s+='<rect x="'+(x-w/2)+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="2.5" fill="'+f+'" stroke="#8a6a3e" stroke-width="1.5"/>'}return s}
  M.coluna = svg(260,200,
    pilha(7,6,6.5,108,100,20,5,'#f3ead6')+
    pilha(12,52,6.8,100,118,26,5.3,'#ecdcb4')+
    pilha(5,134,8.4,118,108,34,6.6,'#e3cc95')+
    '<path d="M98 176 L120 176 L114 194 L104 194Z" fill="#d6b97a" stroke="#8a6a3e" stroke-width="1.5"/>'+
    '<rect x="105" y="195" width="8" height="5" rx="2" fill="#c9a766" stroke="#8a6a3e"/>'+
    t(146,30,'Cervicais (7)')+L(144,26,122,26)+
    t(150,100,'Torácicas (12)')+L(148,96,136,96)+
    t(150,150,'Lombares (5)')+L(148,146,138,146)+
    t(150,186,'Sacro')+L(148,182,124,184)+
    t(4,100,'Entre elas há')+t(4,113,'discos que')+t(4,126,'amortecem'));

  var ribs='';
  for(var i=0;i<10;i++){
    var y=28+i*11, sx=i<7?122:112, ex=44-14*Math.sin(Math.PI*i/9), ey=y+30+i*2, cx=ex+16, cy=y-10;
    var dL='M'+sx+' '+y+' Q'+cx+' '+cy+' '+ex+' '+ey;
    var dR='M'+(260-sx)+' '+y+' Q'+(260-cx)+' '+cy+' '+(260-ex)+' '+ey;
    ribs+='<path d="'+dL+'" fill="none" stroke="#8a6a3e" stroke-width="7" stroke-linecap="round"/><path d="'+dL+'" fill="none" stroke="#f3ead6" stroke-width="4.5" stroke-linecap="round"/>';
    ribs+='<path d="'+dR+'" fill="none" stroke="#8a6a3e" stroke-width="7" stroke-linecap="round"/><path d="'+dR+'" fill="none" stroke="#f3ead6" stroke-width="4.5" stroke-linecap="round"/>';
  }
  M.costelas = svg(260,200,
    '<g transform="translate(26,4) scale(0.8,0.8)">'+ribs+B('M124 20 L136 20 L138 60 L134 120 L126 120 L122 60Z')+B('M126 120 L134 120 L130 138Z')+'</g>'+
    t(130,12,'Esterno','middle')+
    t(4,168,'Costelas')+t(4,181,'verdadeiras')+t(4,194,'(1ª a 7ª)')+
    t(256,168,'Costelas','end')+t(256,181,'falsas e','end')+t(256,194,'flutuantes','end'));

  M.clavicula = svg(260,200,
    B('M2 70 h14 v80 h-14Z')+B('M238 86 C250 86 258 92 258 102 L258 122 L238 122Z')+
    B('M16 112 C40 92 80 90 112 98 C150 106 180 126 236 100 C248 96 250 112 238 116 C190 136 150 116 112 112 C80 108 54 122 20 128Z')+
    t(130,70,'Clavícula','middle')+t(130,84,'(osso em forma de S)','middle')+
    t(4,176,'Liga ao esterno')+L(40,168,28,136)+
    t(246,70,'Ombro','end')+t(246,176,'Liga ao ombro','end')+L(214,168,230,118)+
    t(9,64,'Esterno','start'));

  M.umero = svg(260,200,
    B('M112 38 C112 14 148 14 148 38 C148 48 142 54 138 60 L140 140 C140 150 156 156 164 168 C168 182 156 192 142 190 L118 190 C104 192 92 182 96 168 C104 156 120 150 120 140 L122 60 C118 54 112 48 112 38Z')+
    '<circle cx="130" cy="174" r="9" fill="#e3d4ae" stroke="#8a6a3e" stroke-width="1.5"/>'+
    t(166,30,'Cabeça')+t(166,43,'(encaixa')+t(166,56,'no ombro)')+L(164,32,148,32)+
    t(4,100,'Corpo')+t(4,113,'do osso')+L(50,106,122,106)+
    t(176,172,'Forma o')+t(176,185,'cotovelo')+L(174,176,164,176));

  M.antebraco = svg(260,200,
    B('M96 22 C96 12 116 12 116 22 L118 56 C124 100 122 140 130 176 C134 186 110 192 98 188 C94 160 98 100 96 56Z')+
    B('M142 6 C154 6 160 16 156 30 C152 40 150 50 148 60 C146 110 150 150 152 178 C154 188 140 190 138 180 C136 150 136 110 136 60 C128 52 130 44 130 30 C128 16 134 6 142 6Z')+
    t(4,90,'Rádio')+t(4,103,'(lado do')+t(4,116,'polegar)')+L(50,92,98,92)+
    t(176,70,'Ulna')+t(176,83,'(lado do')+t(176,96,'dedo mínimo)')+L(174,74,152,74)+
    t(176,18,'Ponta do')+t(176,31,'cotovelo')+L(174,22,160,20));

  M.pelve = svg(260,200,
    B('M30 30 C20 70 44 110 80 120 L96 96 C84 72 74 46 70 24 C54 22 40 24 30 30Z')+
    B('M230 30 C240 70 216 110 180 120 L164 96 C176 72 186 46 190 24 C206 22 220 24 230 30Z')+
    B('M112 40 L148 40 L138 120 L122 120Z')+
    B('M94 128 C100 150 118 156 130 156 C142 156 160 150 166 128 L150 124 C146 136 138 138 130 138 C122 138 114 136 110 124Z')+
    '<circle cx="74" cy="132" r="14" fill="#e3d4ae" stroke="#8a6a3e" stroke-width="1.5"/><circle cx="186" cy="132" r="14" fill="#e3d4ae" stroke="#8a6a3e" stroke-width="1.5"/>'+
    t(4,12,'Osso ilíaco')+L(40,16,46,34)+
    t(130,34,'Sacro','middle')+
    t(256,172,'Encaixe da','end')+t(256,185,'coxa','end')+L(236,166,194,144)+
    t(130,184,'Púbis','middle')+L(130,170,130,158)+
    t(4,172,'Encaixe da')+t(4,185,'coxa')+L(52,164,66,146));

  M.femur = svg(260,200,
    B('M92 32 C92 14 124 12 128 30 C132 22 150 22 156 36 C158 48 146 54 138 56 C138 64 140 70 140 80 L142 150 C146 168 160 178 164 190 L110 190 C112 178 126 168 128 150 L126 80 C126 70 118 62 110 56 C98 52 92 44 92 32Z')+
    t(4,28,'Cabeça')+t(4,41,'(encaixa na')+t(4,54,'bacia)')+L(50,22,94,28)+
    t(4,80,'Colo')+L(30,76,108,56)+
    t(172,28,'Trocânter')+t(172,41,'maior')+L(170,32,154,32)+
    t(172,110,'Corpo')+t(172,123,'do osso')+L(170,114,142,114)+
    t(4,172,'Côndilos')+t(4,185,'(joelho)')+L(58,176,112,182));

  M.tibia = svg(260,200,
    B('M70 40 C78 34 90 40 90 48 L88 168 C90 180 84 190 76 190 C68 188 68 176 68 168 L66 50Z')+
    B('M98 10 C98 4 150 4 150 10 C156 24 150 34 142 38 L140 160 C142 172 150 180 150 192 L104 192 C106 180 112 172 112 160 L108 38 C98 34 94 22 98 10Z')+
    t(4,100,'Fíbula')+L(46,96,68,96)+
    t(166,80,'Tíbia')+t(166,93,'(canela)')+L(164,84,148,84)+
    t(166,24,'Joelho')+L(164,20,152,20)+
    t(166,184,'Tornozelo')+L(164,180,152,182));

  var mc='#f6e6a8', ms='#e3cc95', mt='#c9a766';
  function rod(x,y,w,h,f){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="3" fill="'+f+'" stroke="#8a6a3e" stroke-width="1.3"/>'}
  var hand='', fx=[26,44,62,80], fo=[6,0,4,14];
  fx.forEach(function(x,i){var d=fo[i]; hand+=rod(x-4,60,8,26,ms)+rod(x-3.5,40+d,7,18,mc)+rod(x-3,26+d,6,12,mc)+rod(x-2.5,14+d,5,10,mc)});
  hand+=rod(2,66,7,20,ms)+rod(0,50,6,14,mc)+rod(-1,38,6,10,mc);
  [[34,92],[48,94],[62,92],[76,92],[40,104],[54,106],[68,104],[82,104]].forEach(function(c){hand+='<ellipse cx="'+c[0]+'" cy="'+c[1]+'" rx="7" ry="6" fill="'+mt+'" stroke="#8a6a3e" stroke-width="1.3"/>'});
  var foot='';
  [[168,100],[184,96],[200,98],[214,102],[228,106]].forEach(function(c,i){foot+=rod(c[0]-4,c[1],8,34,ms)});
  foot+=rod(164,70,8,22,mc)+rod(164,56,8,13,mc)+rod(180,76,7,14,mc)+rod(180,64,7,11,mc)+rod(196,78,7,14,mc)+rod(196,66,7,11,mc)+rod(210,82,6,13,mc)+rod(210,72,6,9,mc)+rod(224,86,6,12,mc)+rod(224,77,6,8,mc);
  [[176,146],[194,146],[212,148]].forEach(function(c){foot+='<ellipse cx="'+c[0]+'" cy="'+c[1]+'" rx="9" ry="8" fill="'+mt+'" stroke="#8a6a3e" stroke-width="1.3"/>'});
  foot+='<ellipse cx="196" cy="168" rx="20" ry="14" fill="'+mt+'" stroke="#8a6a3e" stroke-width="1.5"/>';
  function key(x,y,f,s){return '<rect x="'+x+'" y="'+y+'" width="10" height="10" rx="2" fill="'+f+'" stroke="#8a6a3e"/>'+t(x+14,y+9,s)}
  M.maospes = svg(260,200,
    '<g transform="translate(8,0)">'+hand+'</g>'+foot+
    key(4,122,mc,'Dedos (falanges)')+key(4,138,ms,'Palma / peito do pé')+key(4,154,mt,'Punho / calcanhar')+
    t(10,196,'Mão: 27 ossos cada', 'start')+
    t(130,196,'Pé: 26 ossos cada','start'));

  var T = {};
  for(var k in O) T[k]=O[k];
  for(var m in M) T[m]=M[m];

  return {
    full: function(id){ return T[id] || ''; },
    thumb: function(id){
      return (T[id]||'').replace(/<text[^>]*>[^<]*<\/text>/g,'').replace(/<line class="ld"[^>]*\/>/g,'');
    }
  };
})();
