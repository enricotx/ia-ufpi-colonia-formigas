# Colônia de Formigas (Ant System): rota de entregas

Atividade Prática de Inteligência Artificial — UFPI, período 2026.2

**Aplicação:** https://enricotx.github.io/ia-ufpi-colonia-formigas/
**Código-fonte:** https://github.com/enricotx/ia-ufpi-colonia-formigas
**Testes no navegador:** https://enricotx.github.io/ia-ufpi-colonia-formigas/testes.html

## Autores

- Enrico Teixeira — [matrícula]
- João Pedro Moura — [matrícula]

## Problema

Planejar a rota de um veículo que sai do depósito, visita cada ponto de entrega exatamente uma vez
e volta ao depósito, percorrendo a menor distância total. Os locais formam um grafo completo, não
direcionado, e a distância entre dois vértices é a euclidiana:
d(i, j) = √((x(i) − x(j))² + (y(i) − y(j))²).

Não há trânsito, obstáculos, vários veículos, capacidade de carga nem horários.

## Modelo e algoritmo

Implementamos a variante **Ant System**. O código do algoritmo fica todo em `js/nucleo.js`, sem
nenhum acesso à tela; a interface só lê o que o núcleo devolve.

**Representação.** Os vértices são guardados pelo índice (A = 0, B = 1, …). Uma rota é a lista de
índices que começa e termina no depósito, por exemplo `[0, 1, 2, 3, 0]` (A → B → C → D → A). O
comprimento L é a soma das distâncias de todas as arestas, inclusive a volta ao depósito.
`dist[i][j]` guarda as distâncias (fixas) e `tau[i][j]` o feromônio (muda a cada iteração). As duas
matrizes são simétricas e a diagonal é 0.

**Construção da rota.** Cada formiga parte do depósito. Em cada passo, os candidatos são os vértices
ainda não visitados, e para cada candidato j:

- peso: w(i, j) = τ(i, j)^α × (1 / d(i, j))^β
- probabilidade: p(i, j) = w(i, j) / Σ w(i, u), somando só os não visitados

O próximo vértice é **sorteado** proporcionalmente às probabilidades (roleta), e não escolhido pelo
maior peso. Depois de visitar todos, a formiga volta obrigatoriamente ao depósito.

**Atualização do feromônio.** Todas as formigas de uma iteração usam o mesmo τ. Só depois que todas
terminam é feita a atualização, aresta por aresta:

τ_novo(i, j) = (1 − ρ) × τ_antigo(i, j) + Σ Δτk(i, j), com Δτk = Q / Lk se a formiga k usou a
aresta (em qualquer sentido) e 0 caso contrário.

O depósito inclui a aresta de volta ao depósito. Como o grafo não é direcionado, o mesmo valor é
gravado em τ(i, j) e τ(j, i), sem contar duas vezes a mesma formiga. Depois da atualização, nenhuma
aresta fica abaixo de 10⁻¹² (proteção numérica); a diagonal não recebe feromônio.

**Melhor solução.** Em cada iteração registramos a menor distância (empate: formiga de menor
número), a média das formigas e a melhor rota acumulada. A melhor acumulada só é trocada quando
aparece uma distância **estritamente menor**, então ela nunca aumenta.

**Ordem dos sorteios.** Todos os sorteios usam o gerador com semente de `js/prng.js` (Mulberry32);
`Math.random` não é usado em nenhum lugar. A ordem é:

1. Iteração 1, formiga 1: um sorteio por passo da rota, do primeiro ao último vértice escolhido
   (inclusive quando sobra um único candidato). A volta ao depósito não sorteia.
2. Formiga 2, formiga 3… até a última, na mesma ordem.
3. A atualização do feromônio não sorteia nada. Em seguida começa a iteração 2.

Reiniciar recria o gerador com a semente. Pausar e retomar continua o mesmo gerador. A velocidade
da animação só muda o intervalo entre iterações e não consome sorteios. A animação da tela inicial
usa um gerador próprio, separado do da execução.

## Como usar

1. Abra a aplicação e clique em **Iniciar**.
2. Ajuste os **vértices** na tabela (nome, x e y). Use **+ Adicionar vértice** e **×** para manter
   de 4 a 12 vértices, e escolha o **depósito**. O botão **Carregar instância de teste (6.1)**
   coloca os vértices A, B, C e D da seção 6.1 e os parâmetros da seção 6.4.
3. Ajuste os **parâmetros**. Campos vazios ou fora do intervalo ficam em vermelho, com a mensagem
   do que corrigir, e bloqueiam a execução.
4. Use os botões:
   - **Executar:** roda as iterações em sequência, na velocidade escolhida. Depois de pausado,
     retoma de onde parou.
   - **Pausar:** para a execução, preservando o estado.
   - **Avançar uma iteração:** roda uma iteração e fica pausado.
   - **Reiniciar:** limpa o histórico, volta o feromônio a τ₀ e recria o gerador com a semente.
5. Acompanhe o resultado:
   - **Métricas:** iteração atual, menor distância da iteração, média das formigas e melhor
     distância acumulada (na iteração 0 aparece "ainda não calculada").
   - **Grafo:** a espessura e a cor das arestas mostram o feromônio. Passe o mouse ou clique numa
     aresta para ver a distância e o feromônio exatos. A melhor rota aparece tracejada em laranja,
     e a sequência e a distância ficam ao lado.
   - **Histórico:** gráfico e tabela por iteração, a partir da iteração 0.
   - **Construção das rotas:** para cada formiga, o vértice atual, os candidatos com as
     probabilidades, o vértice escolhido e a volta ao depósito.
   - **Feromônio por aresta:** valor anterior, após a evaporação, depósito total e valor final.
   - **Copiar log:** copia o log da execução. Se o log passar de ~1 MB, ele é baixado como
     arquivo `.txt`.

Se algum campo mudar depois de a execução começar, a aplicação pede para clicar em Reiniciar.
Antes da primeira iteração, as mudanças são aplicadas na hora.

**Escala do feromônio no grafo.** A espessura é proporcional ao maior feromônio já visto na
execução. Essa referência só cresce, então uma aresta cujo feromônio diminuiu sempre fica mais
fina, nunca mais grossa. Quando a referência aumenta, a legenda avisa "Escala ajustada na
iteração N".

Para rodar localmente, abra a pasta no VS Code e use a extensão Live Server, ou rode
`python -m http.server` e acesse `http://localhost:8000`. Abrir o `index.html` direto pelo
explorador de arquivos não funciona, porque o código usa módulos ES.

## Parâmetros

| Campo | Intervalo | Valor inicial |
| --- | --- | --- |
| Vértices | 4 a 12; nome único; x e y de 0 a 1.000 com até 2 casas; sem coordenadas repetidas | A(120, 520), B(300, 180), C(620, 120), D(880, 300), E(820, 700), F(520, 860), G(220, 820) |
| Depósito | um dos vértices | A |
| Número de formigas | inteiro de 1 a 100 | 10 |
| Número de iterações | inteiro de 1 a 200 | 30 |
| Influência do feromônio (α) | 0 a 5 | 1 |
| Influência da distância (β) | 0 a 5 | 2 |
| Taxa de evaporação (ρ) | 0% a 90% (usada como fração: 50% → 0,5) | 50% |
| Feromônio inicial (τ₀) | 0,01 a 100 | 1 |
| Constante de depósito (Q) | 0,01 a 10.000 | 1.000 |
| Semente aleatória | inteiro | 42 |

Os números aceitam vírgula decimal. Ponto de milhar ("10.000") é recusado com uma mensagem, para
não ser lido como 10.

O Q inicial é 1.000 porque, no cenário de 7 vértices, as rotas medem cerca de 2.700: assim o
depósito Q/L de cada formiga (~0,4) é visível perto de τ₀ = 1. Na instância de teste (rotas de 14 a
18), o botão da seção 6.1 usa Q = 14, como pede o enunciado.

## Estrutura do código

| Arquivo | Função |
| --- | --- |
| `index.html` | tela inicial e simulador |
| `testes.html` | executa os testes da seção 6 do enunciado |
| `css/estilo.css` | estilos |
| `js/nucleo.js` | Ant System: funções puras, sem DOM e sem `Math.random` |
| `js/prng.js` | gerador pseudoaleatório com semente (Mulberry32) e roleta |
| `js/validacao.js` | leitura e validação de números e do conjunto de vértices |
| `js/configuracao.js` | transforma o formulário nos parâmetros do núcleo, ou em mensagens de erro |
| `js/estados.js` | botões e texto de status de cada estado da execução |
| `js/escala.js` | escala de espessura do feromônio e enquadramento do grafo |
| `js/log.js` | textos do log (construção das rotas e feromônio) |
| `js/formato.js` | formatação pt-BR |
| `js/graficos.js` | grafo em SVG e gráfico do histórico |
| `js/abertura.js` | tela inicial com as formigas animadas |
| `js/ui.js` | eventos, estado da execução, métricas, histórico e logs |
| `js/testes.js` | casos de teste da seção 6 |

O núcleo tem uma função para cada etapa, e os testes controlados chamam essas funções direto, com
as rotas forçadas:

| Função | O que faz |
| --- | --- |
| `matrizDistancias(vertices)` | distâncias euclidianas |
| `comprimentoRota(rota, dist)` | comprimento L, com a volta |
| `rotaValida(rota, n, deposito)` | confere se a rota é completa e sem repetição |
| `probabilidades(atual, candidatos, tau, dist, alfa, beta)` | pesos e probabilidades |
| `atualizarFeromonio(tau, rotas, comprimentos, rho, Q)` | evaporação e depósito, com o detalhe de cada aresta |
| `construirRota(deposito, tau, dist, alfa, beta, rng)` | uma formiga monta a rota com a roleta |
| `inicializar(parametros)` / `passo(estado, parametros, rng)` | iteração 0 / uma iteração completa |

## Bibliotecas auxiliares

| Biblioteca | Versão | Finalidade |
| --- | --- | --- |
| Chart.js | 4.4.1 (CDN) | gráfico do histórico por iteração |

O gerador pseudoaleatório com semente (Mulberry32), o grafo em SVG e a animação da tela inicial são
implementação própria. Nenhuma biblioteca de IA, otimização ou colônia de formigas foi usada.

## Testes de validação

Todos os testes abaixo estão em `js/testes.js` e rodam em
[`testes.html`](https://enricotx.github.io/ia-ufpi-colonia-formigas/testes.html): **20 de 20
passaram**. Os decimais são comparados com tolerância de 0,000001.

Instância de referência (6.1): A = (0, 0), B = (3, 0), C = (3, 4), D = (0, 4), depósito A.

### 6.1 — Instância de referência e cálculo das rotas

| Entradas e parâmetros | Esperado | Obtido | Conclusão |
| --- | --- | --- | --- |
| Distâncias entre os 4 vértices | A-B 3, A-C 5, A-D 4, B-C 4, B-D 5, C-D 3; d(i, i) = 0 | iguais | correto |
| A → B → C → D → A e A → D → C → B → A | 14 | 14 | correto |
| A → B → D → C → A e A → C → D → B → A | 16 | 16 | correto |
| A → C → B → D → A e A → D → B → C → A | 18 | 18 | correto |
| A → B → C → A (incompleta), A → B → B → D → A (repetida), A → B → C → D (sem volta) | inválidas | inválidas | correto |

### 6.2 — Probabilidades de escolha

| Entradas e parâmetros | Esperado | Obtido | Conclusão |
| --- | --- | --- | --- |
| Em A, τ = 1, α = 1, β = 2 | w = 1/9, 1/25, 1/16; p(A,B) = 0,520156, p(A,C) = 0,187256, p(A,D) = 0,292588; soma 1 | 0,520156 · 0,187256 · 0,292588; soma 1 | correto |
| Em B, depois de A e B visitados | p(B,C) = 25/41 ≈ 0,609756; p(B,D) = 16/41 ≈ 0,390244; A e B fora | iguais; candidatos só C e D | correto |
| α = 0 e β = 0 (com τ(A,B) = 7 para provar que não influencia) | todos iguais | 1/3 para B, C e D | correto |
| Um único candidato | probabilidade 1 | 1 | correto |
| 10.000 sorteios do primeiro passo (semente 7) | frequências perto de 0,520 / 0,187 / 0,293; nenhum candidato excluído | dentro de ±0,02 | sorteio é proporcional, não pega sempre o maior |

### 6.3 — Evaporação e depósito

| Entradas e parâmetros | Esperado | Obtido | Conclusão |
| --- | --- | --- | --- |
| τ₀ = 1, ρ = 50%, Q = 14, 1 formiga, rota forçada A → B → C → D → A (L = 14) | após evaporação 0,5 em todas; AB = BC = CD = AD = 1,5; AC = BD = 0,5 | iguais | correto |
| Log de AB | anterior 1; após evaporação 0,5; depósito 1; final 1,5 | anterior 1; após evaporação 0,5; depósito 1; final 1,5 | correto (inclui a volta D → A) |
| Log de AC | anterior 1; após evaporação 0,5; depósito 0; final 0,5 | anterior 1; após evaporação 0,5; depósito 0; final 0,5 | correto |
| Segunda iteração com a mesma rota | perímetro 1,75; diagonais 0,25 | 1,75 e 0,25 | correto |
| 2 formigas na mesma rota, uma iteração | perímetro 2,5; diagonais 0,5 | 2,5 e 0,5 | soma dos depósitos correta |
| 5 formigas na primeira iteração | todas veem p(A,B) = 400/769 | todas 0,520156 | o feromônio não muda durante a construção |
| τ = 10⁻¹³, ρ = 90% | nenhuma aresta abaixo de 10⁻¹² | 10⁻¹² | piso aplicado |

### 6.4 — Execução completa e reprodutibilidade

Configuração: instância 6.1, depósito A, 10 formigas, 30 iterações, α = 1, β = 2, ρ = 50%, τ₀ = 1,
Q = 14, semente 42.

| Entradas e parâmetros | Esperado | Obtido | Conclusão |
| --- | --- | --- | --- |
| Iteração 0 | τ = 1 em todas as arestas; melhor distância "ainda não calculada" | τ = 1; melhor = null (tela: "ainda não calculada") | correto |
| Execução completa, semente 42 | 30 registros; melhor acumulada nunca aumenta; rota válida de comprimento 14, 16 ou 18 | 30 registros (mais a iteração 0); melhor rota **A → B → C → D → A, comprimento 14**, já na iteração 1 | encontrou o ótimo |
| Mesma configuração duas vezes | mesmo histórico | históricos idênticos | reprodutível |
| 12 iterações, pausa, mais 18 com o mesmo gerador | igual à execução seguida | idêntico | pausar e retomar não altera o resultado |

Na execução com semente 42, a média das formigas caiu de 15,00 na iteração 1 para 14,00 na
iteração 30: no fim, todas as formigas seguiam a rota ótima, e o feromônio das diagonais AC e BD
tinha praticamente evaporado.

### 6.5 — Efeito dos parâmetros e entradas inválidas

**β = 0 × β = 2**, demais parâmetros da seção 6.4, sementes 1 a 5:

| Semente | β = 0: melhor final | β = 0: média das formigas nas 10 últimas iterações | β = 2: melhor final | β = 2: média nas 10 últimas |
| --- | --- | --- | --- | --- |
| 1 | 14 | 16,36 | 14 | 14,00 |
| 2 | 14 | 15,08 | 14 | 14,00 |
| 3 | 14 | 15,58 | 14 | 14,00 |
| 4 | 14 | 16,28 | 14 | 14,00 |
| 5 | 14 | 15,58 | 14 | 14,00 |
| **Média** | **14,00** (5 de 5 chegaram a 14) | **15,78** | **14,00** (5 de 5 chegaram a 14) | **14,00** |

**Entradas inválidas e ρ = 0%:**

| Entradas e parâmetros | Esperado | Obtido | Conclusão |
| --- | --- | --- | --- |
| Vértice E com as mesmas coordenadas de C | bloqueia com mensagem | "Vértices: C e E têm as mesmas coordenadas." e células em vermelho | correto |
| Dois vértices com nome A | bloqueia com mensagem | "Vértices: o identificador A está repetido." e células em vermelho | correto |
| Só 3 vértices | bloqueia | "Vértices: cadastre pelo menos 4 vértices."; na tela o × fica desabilitado em 4 | correto |
| Formigas vazio, "abc" ou 0; iterações 201; α 5,5; ρ 91%; τ₀ 0; x 1000,5; x com 3 casas | bloqueia com mensagem | uma mensagem para cada caso, no formato "Campo: o que fazer." | correto |
| ρ = 0%, rota forçada | a evaporação não reduz o feromônio | após evaporação = anterior; perímetro 2, diagonais 1 | correto |

**Testes manuais da interface** (feitos no navegador):

- [x] Mesma semente, Reiniciar e rodar de novo: histórico e logs idênticos.
- [x] Pausar na iteração 12 e continuar: mesmo resultado da execução seguida.
- [x] Mudar a velocidade no meio da execução: mesmo resultado.
- [x] Campo inválido: mensagem abaixo do campo, botões Executar e Avançar bloqueados.
- [x] Limites de 4 e 12 vértices desabilitam × e + Adicionar vértice, com explicação.
- [x] Consulta de distância e feromônio por mouse e por clique numa aresta.
- [x] Em 30 iterações, nenhuma aresta cujo feromônio caiu ficou mais grossa.
- [x] Execução de 200 iterações × 100 formigas sem travar a página; Copiar log baixa o `.txt`.
- [x] Sem rolagem horizontal em 1440 px e em 375 px; console sem erros.

## Análise dos resultados

**β = 0 × β = 2.** Nas duas configurações, as 5 execuções chegaram a 14, e já na iteração 1. Isso
é esperado nessa instância: ela tem só 3 rotas diferentes (14, 16 e 18), e 10 formigas por
iteração quase sempre sorteiam a rota ótima logo no começo. Por isso a melhor distância final não
diferencia os dois valores de β.

A diferença aparece no comportamento da colônia. Com **β = 2**, a distância influencia a escolha
(a aresta A-B, de comprimento 3, tem probabilidade 0,52 contra 0,19 da diagonal A-C), as formigas
convergem para a rota ótima e a média das formigas nas últimas 10 iterações é **14,00** em todas as
sementes: a colônia inteira passou a seguir o mesmo caminho. Com **β = 0**, a escolha depende só do
feromônio; as diagonais continuam sendo sorteadas e a média fica em **15,78**, com formigas ainda
fazendo rotas de 16 e 18. Ou seja, a informação da distância acelera a convergência da colônia,
mesmo que, numa instância tão pequena, as duas encontrem o ótimo.

**Feromônio.** Na execução com semente 42, as arestas da rota ótima acumularam feromônio
(A-B chegou a 20) e as diagonais evaporaram até perto de zero. Isso mostra o reforço positivo:
quanto mais formigas usam uma aresta curta, mais feromônio ela recebe e mais provável fica ser
escolhida de novo.

## Limitações

- O Ant System não garante o ótimo. Em instâncias maiores, uma execução pode terminar numa rota
  subótima válida.
- Não há busca local nem variantes (Elitist, Max-Min, ACS); o enunciado não pede.
- O resultado depende da semente e da ordem dos sorteios: outra implementação com a mesma semente
  pode dar um histórico diferente.
- O problema é o do enunciado: um veículo, sem capacidade, horários, trânsito ou mapa real.
- No grafo, nomes de vértice com mais de 2 caracteres podem ultrapassar o círculo.
