// js/nucleo.js — Ant System para rota de entregas (funções puras, sem DOM, sem Math.random)
// Grafo completo, não direcionado; distância euclidiana; matrizes simétricas tau[i][j] = tau[j][i].
import { roleta } from './prng.js';

export const FEROMONIO_MINIMO = 1e-12;

// ---------- Funções determinísticas (usadas direto pelos testes controlados) ----------

/** Matriz de distâncias euclidianas; d(i, i) = 0. */
export function matrizDistancias(vertices) {
  // TODO
}

/** Comprimento da rota fechada (inclui o retorno ao depósito). rota = [0, 2, 1, 3, 0] */
export function comprimentoRota(rota, dist) {
  // TODO
}

/** Enunciado 2: w(i,j) = tau^alfa * (1/d)^beta e p = w / soma, só entre os não visitados.
 *  → [{ vertice, peso, probabilidade }] */
export function probabilidades(atual, naoVisitados, tau, dist, alfa, beta) {
  // TODO
}

/** Enunciado 2: evaporação (1 − rho)·tau + soma de Q/Lk de TODAS as formigas, só ao fim da iteração.
 *  Piso de 1e-12, sem diagonal. → { tau, detalhes por aresta: anterior, aposEvaporacao, deposito, final } */
export function atualizarFeromonio(tau, rotas, comprimentos, rho, Q) {
  // TODO
}

// ---------- Funções sorteadoras (recebem o rng) ----------

/** Uma formiga constrói uma rota completa a partir do depósito usando roleta(rng, pesos).
 *  → { rota, comprimento, escolhas (para o log) } */
export function construirRota(deposito, tau, dist, alfa, beta, rng) {
  // TODO
}

/** Estado inicial: tau = tau0 em todas as arestas, iteração 0, melhor ainda não calculado. */
export function inicializar(parametros) {
  // TODO
}

/** Uma iteração completa: todas as formigas com o mesmo tau, depois a atualização. → { estado, eventos } */
export function passo(estado, parametros, rng) {
  // TODO
}
