# Guia da Cana — versão 4.1 (14/10/2026)

Ponto central dos apps de campo. Roda inteiro no celular, sem servidor.
Endereço: https://jleandro1214-creator.github.io/guia-da-cana/
Versão anterior guardada para consulta: `v1/`

## Arquivos
- `index.html` — estrutura e estilo; `app.js` — telas e registros.
- `base.js` — textos e fotos das fichas da versão 1 (mantidos).
- `fichas.js` — campos novos das fichas padronizadas, referências e chave de sinais.
- `sw.js` — funcionamento sem internet (cache `guia-cana-v5`). Não interfere nos apps das pastas `daninhas/` e `calculadora/`.

## Dados (só no aparelho)
| Banco local | Conteúdo |
|---|---|
| `guiaCanaDB` | Anotações (o mesmo da v1 — as anotações antigas continuam). |
| `guiaCana` | Fazendas e talhões (o mesmo cadastro da Calculadora). |
| `danCampo` | Vistorias e aplicações do app Daninhas (o Guia só lê). |

## Pronto e testado
Versão simplificada a pedido do usuário: 5 módulos — Pragas, Doenças, Plantas daninhas (abre o app Daninhas), Anotações de campo e Relatórios.
Fichas padronizadas de 5 pragas e 4 doenças, chave "não sei o que é" (só possibilidades), busca geral, anotações completas (fotos, vídeos, GPS opcional, rascunho, suspeita x confirmado, filtros, edição e exclusão com confirmação), relatórios com filtros, PDF, CSV e backup/restauração.
Saíram do Guia: Calculadora (continua em `calculadora/`), cadastro de fazendas e talhões e tela de monitoramento.

## Pendências
- Revisão das fichas por agrônomo (status mostrado em cada ficha).
- Sincronização entre celulares, login: exige servidor online.
- Identificação automática por foto e mapa de talhões: não existem.
