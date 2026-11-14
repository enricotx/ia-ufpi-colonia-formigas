// js/nucleo.js — Ant System para rota de entregas (funções puras, sem DOM, sem Math.random)
// Grafo completo, não direcionado; distância euclidiana; matrizes simétricas tau[i][j] = tau[j][i].
// Os vértices são tratados pelo índice (0..n−1); o identificador ('A', 'B'...) só aparece na tela.
import { roleta } from './prng.js';

/** Enunciado 2: piso de feromônio por aresta, só contra valores numericamente nulos. */
export const FEROMONIO_MINIMO = 1e-12;

// ---------- Funções determinísticas (usadas direto pelos testes controlados) ----------

/** Enunciado 1: d(i,j) = √((xi − xj)² + (yi − yj)²); d(i,i) = 0. */
export function matrizDistancias(vertices) {
  const n = vertices.length;
  const dist = [];
  for (let i = 0; i < n; i++) {
    dist.push([]);
    for (let j = 0; j < n; j++) {
      const dx = vertices[i].x - vertices[j].x;
      const dy = vertices[i].y - vertices[j].y;
      dist[i].push(Math.sqrt(dx * dx + dy * dy));
    }
  }
  return dist;
}

/** Enunciado 2: τ₀ em todas as arestas; a diagonal (i = j) fica 0, pois não é aresta. */
export function feromonioInicial(n, tau0) {
  const tau = [];
  for (let i = 0; i < n; i++) {
    tau.push([]);
    for (let j = 0; j < n; j++) tau[i].push(i === j ? 0 : tau0);
  }
  return tau;
}

/** Enunciado 2: comprimento L = soma das arestas da rota, inclusive o retorno ao depósito.
 *  Exemplo de rota: [0, 1, 2, 3, 0] (A → B → C → D → A). */
export function comprimentoRota(rota, dist) {
  let total = 0;
  for (let k = 0; k < rota.length - 1; k++) total += dist[rota[k]][rota[k + 1]];
  return total;
}

/** Enunciado 6.1: válida = começa e termina no depósito e visita cada vértice uma única vez. */
export function rotaValida(rota, n, deposito) {
  if (rota.length !== n + 1 || rota[0] !== deposito || rota[n] !== deposito) return false;
  const visitado = new Array(n).fill(false);
  for (let k = 0; k < n; k++) {
    const v = rota[k];
    if (visitado[v] !== false) return false; // repetido ou fora de 0..n−1
    visitado[v] = true;
  }
  return true;
}

/** Enunciado 2: w(i,j) = τ(i,j)^α × (1/d(i,j))^β e p(i,j) = w(i,j) / Σ w(i,u),
 *  somando só os vértices ainda não visitados. → [{ vertice, peso, probabilidade }] */
export function probabilidades(atual, naoVisitados, tau, dist, alfa, beta) {
  const pesos = naoVisitados.map(j => Math.pow(tau[atual][j], alfa) * Math.pow(1 / dist[atual][j], beta));
  const soma = pesos.reduce((a, b) => a + b, 0);
  return naoVisitados.map((j, k) => ({ vertice: j, peso: pesos[k], probabilidade: pesos[k] / soma }));
}

/** Enunciado 2: τ_novo = (1 − ρ)·τ_antigo + Σ Q/Lk, com o depósito de TODAS as formigas,
 *  aplicado só no fim da iteração. Piso de 1e-12. Diagonal continua 0.
 *  → { tau, detalhes: [{ i, j, anterior, aposEvaporacao, deposito, final }] }, uma linha por aresta i < j. */
export function atualizarFeromonio(tau, rotas, comprimentos, rho, Q) {
  const n = tau.length;

  // 1) Soma dos depósitos. Numa rota válida cada aresta aparece uma vez só,
  //    então cada formiga deposita Q/L uma vez em cada aresta que percorreu.
  const deposito = feromonioInicial(n, 0);
  for (let k = 0; k < rotas.length; k++) {
    const rota = rotas[k];
    for (let p = 0; p < rota.length - 1; p++) {
      const i = rota[p], j = rota[p + 1];
      deposito[i][j] += Q / comprimentos[k];
      deposito[j][i] = deposito[i][j]; // grafo não direcionado: mesma aresta nos dois sentidos
    }
  }

  // 2) Evaporação + depósito, aresta por aresta.
  const novo = feromonioInicial(n, 0);
  const detalhes = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const anterior = tau[i][j];
      const aposEvaporacao = (1 - rho) * anterior;
      const final = Math.max(aposEvaporacao + deposito[i][j], FEROMONIO_MINIMO);
      novo[i][j] = final;
      novo[j][i] = final;
      detalhes.push({ i, j, anterior, aposEvaporacao, deposito: deposito[i][j], final });
    }
  }
  return { tau: novo, detalhes };
}

// ---------- Funções sorteadoras (recebem o rng) ----------

/** Enunciado 2: uma formiga constrói a rota a partir do depósito.
 *  A cada passo: candidatos = não visitados (em ordem de índice), calcula as probabilidades
 *  e sorteia o próximo com roleta(rng, ...) — um rng() por escolha. No fim, volta ao depósito.
 *  → { rota, comprimento, escolhas } (escolhas = dados para o log) */
export function construirRota(deposito, tau, dist, alfa, beta, rng) {
  const n = dist.length;
  const rota = [deposito];
  const escolhas = [];
  let atual = deposito;

  while (rota.length < n) {
    const naoVisitados = [];
    for (let j = 0; j < n; j++) if (!rota.includes(j)) naoVisitados.push(j);

    const candidatos = probabilidades(atual, naoVisitados, tau, dist, alfa, beta);
    const escolhido = candidatos[roleta(rng, candidatos.map(c => c.probabilidade))].vertice;

    escolhas.push({ atual, candidatos, escolhido });
    rota.push(escolhido);
    atual = escolhido;
  }

  rota.push(deposito); // retorno obrigatório
  escolhas.push({ atual, candidatos: [], escolhido: deposito, retorno: true });
  return { rota, comprimento: comprimentoRota(rota, dist), escolhas };
}

/** Iteração 0: τ = τ₀ em todas as arestas e melhor rota ainda não calculada (null, nunca 0).
 *  parametros = { vertices, deposito, formigas, iteracoes, alfa, beta, rho (fração), tau0, Q } */
export function inicializar(parametros) {
  return {
    iteracao: 0,
    dist: matrizDistancias(parametros.vertices),
    tau: feromonioInicial(parametros.vertices.length, parametros.tau0),
    melhorRota: null,
    melhorComprimento: null,
    historico: [{ iteracao: 0, menorIteracao: null, mediaIteracao: null, melhorAcumulado: null, rotaMelhorAcumulado: null }],
  };
}

/** Enunciado 2: uma iteração. Todas as formigas usam o MESMO τ; só depois de todas terminarem
 *  é que o feromônio é atualizado. Ordem dos sorteios: formiga 1 inteira, depois a 2, etc.
 *  Melhor acumulado só troca com distância estritamente menor (empate mantém a anterior).
 *  → { estado, eventos } (não altera o estado recebido) */
export function passo(estado, parametros, rng) {
  const eventos = [];
  const rotas = [];
  const comprimentos = [];

  for (let k = 0; k < parametros.formigas; k++) {
    const r = construirRota(parametros.deposito, estado.tau, estado.dist, parametros.alfa, parametros.beta, rng);
    rotas.push(r.rota);
    comprimentos.push(r.comprimento);
    eventos.push({ tipo: 'formiga', formiga: k + 1, rota: r.rota, comprimento: r.comprimento, escolhas: r.escolhas });
  }

  const atualizacao = atualizarFeromonio(estado.tau, rotas, comprimentos, parametros.rho, parametros.Q);
  eventos.push({ tipo: 'feromonio', detalhes: atualizacao.detalhes });

  // Melhor formiga da iteração (empate: a de menor número)
  let melhor = 0;
  for (let k = 1; k < comprimentos.length; k++) if (comprimentos[k] < comprimentos[melhor]) melhor = k;
  const media = comprimentos.reduce((a, b) => a + b, 0) / comprimentos.length;

  let melhorRota = estado.melhorRota;
  let melhorComprimento = estado.melhorComprimento;
  if (melhorComprimento === null || comprimentos[melhor] < melhorComprimento) {
    melhorRota = rotas[melhor];
    melhorComprimento = comprimentos[melhor];
  }

  const registro = {
    iteracao: estado.iteracao + 1,
    menorIteracao: comprimentos[melhor],
    mediaIteracao: media,
    melhorAcumulado: melhorComprimento,
    rotaMelhorAcumulado: melhorRota,
  };
  eventos.push({ tipo: 'resumo', ...registro, formigaMelhor: melhor + 1 });

  const novoEstado = {
    iteracao: registro.iteracao,
    dist: estado.dist,
    tau: atualizacao.tau,
    melhorRota,
    melhorComprimento,
    historico: [...estado.historico, registro],
  };
  return { estado: novoEstado, eventos };
}

/** Execução completa sem interface (usada nos testes 6.4 e 6.5). */
export function executar(parametros, rng) {
  let estado = inicializar(parametros);
  while (estado.iteracao < parametros.iteracoes) estado = passo(estado, parametros, rng).estado;
  return estado;
}
