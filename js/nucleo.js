// js/nucleo.js — Colônia de Formigas (Ant System) para a rota de entregas.
// Aqui fica só o algoritmo: nada de tela (document) e nada de Math.random.
// Os sorteios usam o rng que vem de prng.js, para a semente reproduzir a execução.
//
// Os vértices são guardados pelo número (índice): A = 0, B = 1, C = 2, D = 3...
// Uma rota é uma lista de índices que começa e termina no depósito, ex.: [0, 1, 2, 3, 0].
// dist[i][j] é a distância entre i e j; tau[i][j] é o feromônio da aresta i-j.
import { roleta } from './prng.js';

// Menor feromônio permitido numa aresta (o enunciado pede no mínimo 10^-12).
export const FEROMONIO_MINIMO = 1e-12;

// ======================================================================
// Funções sem sorteio (os testes chamam direto, com as escolhas forçadas)
// ======================================================================

// Enunciado 1: distância euclidiana entre todos os pares de vértices.
export function matrizDistancias(vertices) {
  const n = vertices.length;
  const dist = [];
  for (let i = 0; i < n; i++) {
    dist[i] = [];
    for (let j = 0; j < n; j++) {
      const dx = vertices[i].x - vertices[j].x;
      const dy = vertices[i].y - vertices[j].y;
      dist[i][j] = Math.sqrt(dx * dx + dy * dy);
    }
  }
  return dist;
}

// Enunciado 2: todas as arestas começam com o mesmo feromônio tau0.
// A diagonal (i igual a j) não é aresta, então fica 0.
export function feromonioInicial(n, tau0) {
  const tau = [];
  for (let i = 0; i < n; i++) {
    tau[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        tau[i][j] = 0;
      } else {
        tau[i][j] = tau0;
      }
    }
  }
  return tau;
}

// Enunciado 2: comprimento L da rota = soma das distâncias de cada trecho,
// incluindo o último trecho, que volta ao depósito.
export function comprimentoRota(rota, dist) {
  let total = 0;
  for (let k = 0; k < rota.length - 1; k++) {
    total = total + dist[rota[k]][rota[k + 1]];
  }
  return total;
}

// Enunciado 6.1: a rota é válida se começa e termina no depósito
// e passa por todos os vértices exatamente uma vez.
export function rotaValida(rota, n, deposito) {
  if (rota.length !== n + 1) return false;
  if (rota[0] !== deposito) return false;
  if (rota[n] !== deposito) return false;

  const visitado = [];
  for (let v = 0; v < n; v++) visitado[v] = false;

  for (let k = 0; k < n; k++) {
    const v = rota[k];
    if (v < 0 || v >= n) return false; // vértice que não existe
    if (visitado[v]) return false;     // vértice repetido
    visitado[v] = true;
  }
  return true;
}

// Enunciado 2: probabilidade de a formiga ir do vértice "atual" para cada candidato.
//   peso w(i,j) = tau(i,j)^alfa * (1 / d(i,j))^beta
//   p(i,j) = w(i,j) / (soma dos pesos dos candidatos)
// "candidatos" são só os vértices ainda não visitados.
// Devolve uma lista com { vertice, peso, probabilidade } para cada candidato.
export function probabilidades(atual, candidatos, tau, dist, alfa, beta) {
  const lista = [];
  let soma = 0;

  for (let k = 0; k < candidatos.length; k++) {
    const j = candidatos[k];
    const peso = Math.pow(tau[atual][j], alfa) * Math.pow(1 / dist[atual][j], beta);
    lista.push({ vertice: j, peso: peso, probabilidade: 0 });
    soma = soma + peso;
  }

  for (let k = 0; k < lista.length; k++) {
    lista[k].probabilidade = lista[k].peso / soma;
  }
  return lista;
}

// Enunciado 2: atualização do feromônio, feita só depois que TODAS as formigas
// terminaram suas rotas:
//   tau_novo(i,j) = (1 - rho) * tau_antigo(i,j) + soma dos depósitos Q / Lk
// Cada formiga k deposita Q / Lk em cada aresta que percorreu (inclusive a volta ao depósito).
// Devolve o novo tau e, para o log, os detalhes de cada aresta.
export function atualizarFeromonio(tau, rotas, comprimentos, rho, Q) {
  const n = tau.length;

  // Passo 1: somar o que cada formiga deposita em cada aresta.
  const deposito = feromonioInicial(n, 0); // matriz n x n cheia de zeros
  for (let k = 0; k < rotas.length; k++) {
    const rota = rotas[k];
    const quantidade = Q / comprimentos[k];
    for (let p = 0; p < rota.length - 1; p++) {
      const i = rota[p];
      const j = rota[p + 1];
      // O grafo não é direcionado: i-j e j-i são a mesma aresta.
      deposito[i][j] = deposito[i][j] + quantidade;
      deposito[j][i] = deposito[i][j];
    }
  }

  // Passo 2: evaporar e somar o depósito, aresta por aresta.
  const novoTau = feromonioInicial(n, 0);
  const detalhes = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) { // j começa em i + 1: cada aresta uma vez, sem a diagonal
      const anterior = tau[i][j];
      const aposEvaporacao = (1 - rho) * anterior;
      let final = aposEvaporacao + deposito[i][j];
      if (final < FEROMONIO_MINIMO) final = FEROMONIO_MINIMO;

      novoTau[i][j] = final;
      novoTau[j][i] = final;
      detalhes.push({ i: i, j: j, anterior: anterior, aposEvaporacao: aposEvaporacao, deposito: deposito[i][j], final: final });
    }
  }

  return { tau: novoTau, detalhes: detalhes };
}

// ======================================================================
// Funções com sorteio (recebem o rng)
// ======================================================================

// Enunciado 2: uma formiga monta uma rota completa saindo do depósito.
// Em cada passo ela olha os vértices não visitados, calcula as probabilidades
// e sorteia o próximo com a roleta (sorteio proporcional, não pega sempre o maior).
// No final, volta obrigatoriamente ao depósito.
// "escolhas" guarda cada passo para mostrar no log.
export function construirRota(deposito, tau, dist, alfa, beta, rng) {
  const n = dist.length;
  const rota = [deposito];
  const escolhas = [];

  const visitado = [];
  for (let v = 0; v < n; v++) visitado[v] = false;
  visitado[deposito] = true;

  let atual = deposito;
  for (let passoDaRota = 1; passoDaRota < n; passoDaRota++) {
    // Candidatos: quem ainda não foi visitado.
    const candidatos = [];
    for (let j = 0; j < n; j++) {
      if (!visitado[j]) candidatos.push(j);
    }

    const lista = probabilidades(atual, candidatos, tau, dist, alfa, beta);

    // A roleta recebe só os números das probabilidades e devolve a posição sorteada.
    const chances = [];
    for (let k = 0; k < lista.length; k++) chances.push(lista[k].probabilidade);
    const posicao = roleta(rng, chances);
    const escolhido = lista[posicao].vertice;

    escolhas.push({ atual: atual, candidatos: lista, escolhido: escolhido });
    rota.push(escolhido);
    visitado[escolhido] = true;
    atual = escolhido;
  }

  // Volta ao depósito.
  rota.push(deposito);
  escolhas.push({ atual: atual, candidatos: [], escolhido: deposito, retorno: true });

  return { rota: rota, comprimento: comprimentoRota(rota, dist), escolhas: escolhas };
}

// Estado inicial (iteração 0): feromônio tau0 em todas as arestas
// e nenhuma rota calculada ainda (null, e não 0).
// parametros = { vertices, deposito, formigas, iteracoes, alfa, beta, rho, tau0, Q }
// rho já chega como fração (50% vira 0.5).
export function inicializar(parametros) {
  return {
    iteracao: 0,
    dist: matrizDistancias(parametros.vertices),
    tau: feromonioInicial(parametros.vertices.length, parametros.tau0),
    melhorRota: null,
    melhorComprimento: null,
    historico: [
      { iteracao: 0, menorIteracao: null, mediaIteracao: null, melhorAcumulado: null, rotaMelhorAcumulado: null },
    ],
  };
}

// Enunciado 2: uma iteração completa.
// 1) Cada formiga monta sua rota, todas usando o MESMO feromônio.
// 2) Só depois de todas terminarem, o feromônio é atualizado.
// 3) Guarda a melhor rota da iteração e atualiza a melhor de toda a execução.
// Ordem dos sorteios: a formiga 1 monta a rota inteira, depois a formiga 2, e assim por diante.
// Devolve o estado atualizado e a lista de eventos (o que aconteceu, para o log).
export function passo(estado, parametros, rng) {
  const eventos = [];
  const rotas = [];
  const comprimentos = [];

  // 1) Todas as formigas constroem suas rotas com o mesmo estado.tau.
  for (let k = 0; k < parametros.formigas; k++) {
    const r = construirRota(parametros.deposito, estado.tau, estado.dist, parametros.alfa, parametros.beta, rng);
    rotas.push(r.rota);
    comprimentos.push(r.comprimento);
    eventos.push({ tipo: 'formiga', formiga: k + 1, rota: r.rota, comprimento: r.comprimento, escolhas: r.escolhas });
  }

  // 2) Evaporação e depósito.
  const atualizacao = atualizarFeromonio(estado.tau, rotas, comprimentos, parametros.rho, parametros.Q);
  eventos.push({ tipo: 'feromonio', detalhes: atualizacao.detalhes });

  // 3) Melhor formiga desta iteração (em caso de empate, fica a de menor número) e média.
  let melhor = 0;
  let soma = 0;
  for (let k = 0; k < comprimentos.length; k++) {
    if (comprimentos[k] < comprimentos[melhor]) melhor = k;
    soma = soma + comprimentos[k];
  }
  const media = soma / comprimentos.length;

  // Melhor de toda a execução: só troca se a nova for estritamente menor.
  if (estado.melhorComprimento === null || comprimentos[melhor] < estado.melhorComprimento) {
    estado.melhorRota = rotas[melhor];
    estado.melhorComprimento = comprimentos[melhor];
  }

  estado.tau = atualizacao.tau;
  estado.iteracao = estado.iteracao + 1;

  const registro = {
    iteracao: estado.iteracao,
    menorIteracao: comprimentos[melhor],
    mediaIteracao: media,
    melhorAcumulado: estado.melhorComprimento,
    rotaMelhorAcumulado: estado.melhorRota,
  };
  estado.historico.push(registro);
  eventos.push({ tipo: 'resumo', registro: registro, formigaMelhor: melhor + 1 });

  return { estado: estado, eventos: eventos };
}

// Roda todas as iterações de uma vez, sem tela (usada nos testes 6.4 e 6.5).
export function executar(parametros, rng) {
  const estado = inicializar(parametros);
  while (estado.iteracao < parametros.iteracoes) {
    passo(estado, parametros, rng);
  }
  return estado;
}
