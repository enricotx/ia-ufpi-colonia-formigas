# Colônia de Formigas (Ant System): rota de entregas

Atividade Prática de Inteligência Artificial — UFPI, período 2026.2

**Aplicação:** https://enricotx.github.io/ia-ufpi-colonia-formigas/
**Código-fonte:** https://github.com/enricotx/ia-ufpi-colonia-formigas
**Testes no navegador:** https://enricotx.github.io/ia-ufpi-colonia-formigas/testes.html

## Autores
- [Nome Completo] — [matrícula]
- [Nome Completo] — [matrícula]

## Problema
Planejar a rota de um veículo que sai do depósito, visita cada ponto de entrega exatamente uma vez
e volta ao depósito, minimizando a distância total. Os locais formam um grafo completo, não
direcionado, com distância euclidiana entre as coordenadas.

## Modelo e algoritmo
_TODO: representação da rota; peso w = τ^α · (1/d)^β; probabilidade entre não visitados; sorteio
por roleta; evaporação e depósito Q/L ao fim da iteração; simetria; piso de 1e-12; ordem dos
sorteios; registro da melhor rota._

## Como usar
_TODO: campos e botões (Executar, Pausar, Avançar uma iteração, Reiniciar)._

Para rodar localmente, abra a pasta no VS Code e use a extensão Live Server, ou rode
`python -m http.server` e acesse `http://localhost:8000`. Abrir o `index.html` direto pelo
explorador de arquivos não funciona, porque o código usa módulos ES.

## Parâmetros
| Campo | Intervalo | Valor inicial |
| --- | --- | --- |
| Vértices | 4 a 12; x e y de 0 a 1.000 com até 2 casas | _TODO_ |
| Número de formigas | inteiro de 1 a 100 | 10 |
| Número de iterações | inteiro de 1 a 200 | 30 |
| Influência do feromônio (α) | 0 a 5 | 1 |
| Influência da distância (β) | 0 a 5 | 2 |
| Taxa de evaporação (ρ) | 0% a 90% | 50% |
| Feromônio inicial (τ₀) | 0,01 a 100 | 1 |
| Constante de depósito (Q) | 0,01 a 10.000 | _TODO_ |
| Semente aleatória | inteiro | 42 |

## Estrutura do código
| Arquivo | Função |
| --- | --- |
| `index.html` | aplicação |
| `testes.html` | executa os testes da seção 6 do enunciado |
| `css/estilo.css` | estilos (padrão do grupo) |
| `js/nucleo.js` | Ant System: funções puras, sem DOM |
| `js/prng.js` | gerador pseudoaleatório com semente (Mulberry32) e roleta |
| `js/validacao.js` | leitura e validação dos campos |
| `js/formato.js` | formatação pt-BR |
| `js/graficos.js` | grafo em SVG e gráfico de evolução |
| `js/ui.js` | eventos, estado da execução e logs |
| `js/testes.js` | casos de teste |

## Bibliotecas auxiliares
| Biblioteca | Versão | Finalidade |
| --- | --- | --- |
| Chart.js | 4.4.1 | gráfico do histórico por iteração |

O gerador pseudoaleatório com semente (Mulberry32) é implementação própria, em `js/prng.js`.
Nenhuma biblioteca de IA ou otimização foi usada.

## Testes de validação
_TODO: para cada item da seção 6 do enunciado — Entradas e parâmetros · Esperado · Obtido · Conclusão._

### 6.1 — Instância de referência e cálculo das rotas
### 6.2 — Probabilidades de escolha
### 6.3 — Evaporação e depósito
### 6.4 — Execução completa e reprodutibilidade
### 6.5 — Efeito dos parâmetros e entradas inválidas

## Análise dos resultados
_TODO: comparação β = 0 × β = 2 (sementes 1 a 5): média da melhor distância final, quantas
execuções atingiram 14 e interpretação._

## Limitações
_TODO_
