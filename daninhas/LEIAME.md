# Daninhas da Cana — versão 3 (14/10/2026)

App instalável (PWA) que roda inteiro no celular, sem servidor.
Endereço: https://jleandro1214-creator.github.io/guia-da-cana/daninhas/

## Arquivos
- `index.html` — telas e estilo
- `app.js` — funcionamento (rotas, busca, filtros, calculadoras, caderno de campo, relatórios)
- `dados.js` — banco técnico de referência: daninhas, herbicidas, mecanismos de ação e fotos. Tem versão e data de revisão.
- `fazendas.js` — códigos e nomes das fazendas (planilha "Códigos e Seções")
- `sw.js` — funcionamento sem internet (cache `daninhas-v4`)

## O que está pronto (etapas 1 a 4 do projeto)
- Tela inicial com 6 módulos e busca geral (nome popular, científico, ingrediente ativo, nome comercial, mecanismo de ação, "grupo 2").
- 11 daninhas em 8 categorias, filtros por "o que você vê no campo", fichas com fotos ampliáveis e foto própria.
- 12 produtos comerciais, cada um com a dose da **própria bula**, fonte, link e data da conferência.
- Filtros de solo, fase do canavial e modalidade que começam como "Não informado" e não presumem nada.
- Consulta de manejo integrado com condições da área e avisos.
- Calculadoras de calda, quantidade de produto (L, mL, kg, g e % v/v) e capacidade operacional, com fórmula exibida e validações.
- Caderno de vistorias por fazenda e talhão, com fotos e GPS opcional, rascunho automático, histórico por talhão.
- Histórico de aplicações com alerta de repetição de mecanismo e de falhas de controle (indicador para investigação, não diagnóstico).
- Relatórios com indicadores, exportação CSV (abre no Excel), PDF pela impressão do celular, backup e restauração.

## Indicadores de confiabilidade
- **✓ Conferido na bula** — doses e restrições lidas na bula citada, com data.
- **ⓘ Referência técnica** — dados agronômicos gerais das daninhas, ainda sem fonte conferida. Precisam de revisão de agrônomo.
- **⚠ Não conferido** — campos como titular e número de registro que ainda não foram checados no AGROFIT.

## O que ainda NÃO está pronto e do que depende
| Recurso | Depende de |
|---|---|
| Identificação por foto com IA | Serviço externo de reconhecimento de imagem (API paga) e chave de acesso |
| Sincronização entre celulares e área administrativa com login | Servidor e banco de dados online (ex.: Firebase ou Supabase) |
| Mapa com contorno dos talhões | Arquivo de limites dos talhões (KML ou shapefile) da usina |
| Conferência automática de registro no AGROFIT | Acesso à base do MAPA |

Hoje, cada celular guarda os próprios registros. O backup em JSON é a forma de passar dados para outro aparelho.

## Responsabilidade técnica
O app é ferramenta de consulta. Não substitui a bula vigente, o receituário agronômico nem a avaliação do engenheiro agrônomo.
