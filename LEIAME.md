# Guia da Cana — versão 4 (14/10/2026)

Ponto central dos apps de campo. Roda inteiro no celular, sem servidor.
Endereço: https://jleandro1214-creator.github.io/guia-da-cana/
Versão anterior guardada para consulta: `v1/`

## Arquivos
- `index.html` — estrutura e estilo; `app.js` — telas e registros.
- `base.js` — textos e fotos das fichas da versão 1 (mantidos).
- `fichas.js` — campos novos das fichas padronizadas, referências e chave de sinais.
- `sw.js` — funcionamento sem internet (cache `guia-cana-v4`). Não interfere nos apps das pastas `daninhas/` e `calculadora/`.

## Dados (só no aparelho)
| Banco local | Conteúdo |
|---|---|
| `guiaCanaDB` | Anotações (o mesmo da v1 — as anotações antigas continuam). |
| `guiaCana` | Fazendas e talhões (o mesmo cadastro da Calculadora). |
| `danCampo` | Vistorias e aplicações do app Daninhas (o Guia só lê). |

## Pronto e testado
Painel com 8 módulos, busca geral, menu em todas as telas, fichas padronizadas de 5 pragas e 4 doenças, chave "não sei o que é" (só possibilidades), cadastro de fazendas e talhões, anotações completas (fotos, vídeos, GPS opcional, rascunho, suspeita x confirmado, edição e exclusão com confirmação), monitoramento com indicadores e histórico por talhão (inclui Daninhas e Calculadora), relatórios com filtros, PDF, CSV e backup/restauração.

## Pendências
- Revisão das fichas por agrônomo (status mostrado em cada ficha).
- Sincronização entre celulares, login: exige servidor online.
- Identificação automática por foto e mapa de talhões: não existem.
