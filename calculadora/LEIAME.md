# Calculadora da Cana — versão 2 (14/10/2026)

App instalável (PWA) que roda inteiro no celular, sem servidor.
Endereço: https://jleandro1214-creator.github.io/guia-da-cana/calculadora/
Versão anterior guardada para consulta: `calculadora/v1/`

## Arquivos
- `calcs.js` — todas as fórmulas, entradas com unidades e limites, validação e memória de cálculo. Pode ser testado fora do app (Node).
- `app.js` — telas, cadastros, histórico, registros, painel, relatórios e backup.
- `index.html` — estrutura e estilo (mesma identidade visual da v1).
- `fazendas.js` — códigos e nomes das fazendas (planilha "Códigos e Seções").
- `sw.js` — funcionamento sem internet (cache `calculadora-v3`).

## Fórmulas
As 12 contas da v1 foram mantidas com as mesmas fórmulas. Entraram 5 novas: capacidade operacional, fertilizante formulado, desempenho da colheita, custo do diesel e conversor de unidades.
Todas foram conferidas com 61 casos de teste contra resultados calculados à parte (perfilhos, TCH, falhas, capacidade teórica e efetiva, fertilizante e nutrientes, vinhaça, torta, maturação, ATR, colheita, diesel, área, sulco e 13 conversões).

## O que está pronto
- Fazenda e talhão ativos no topo (os mesmos campos da v1), com cadastro de fazendas, talhões (com área) e equipamentos. Também existe o botão "Usar área do talhão".
- Em todos os cálculos: unidades explícitas, validação (campos obrigatórios, negativos, divisão por zero, valores fora da faixa) e memória de cálculo com etapas, premissas, data e hora.
- Histórico de cálculos com filtros, edição que guarda a versão anterior, duplicação, exclusão com confirmação, PDF e WhatsApp.
- Planejamento diário (planejado x executado), abastecimentos de diesel (por equipamento, com padrão do gestor) e registros de colheita (pesagem separada de estimativa).
- Painel gerencial com filtros de período, fazenda, talhão, operação, equipamento e responsável.
- Exportação CSV (Excel), PDF A4 pela impressão do celular, backup e restauração com tratamento de conflito pelo registro mais recente.

## Limitações e dependências
| Recurso | Situação |
|---|---|
| Sincronização entre celulares, login e permissões | Não existe. Exige servidor e banco online (ex.: Firebase ou Supabase). O GitHub Pages só hospeda arquivos. |
| Dados | Ficam só no aparelho, no navegador. Faça backup regularmente. |
| Integração com o Daninhas da Cana | O cadastro fica no banco local `guiaCana`, que fica no mesmo endereço dos outros apps. A ligação do Daninhas com esse cadastro é a próxima etapa. |
| Preço do diesel | Informado pelo usuário. O app não busca preços. |
