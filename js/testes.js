// js/testes.js — testes da seção 6 do enunciado (um caso por item).
// Abra testes.html no navegador para ver a tabela PASSOU/FALHOU.
// Também roda no terminal com: node js/testes.js
import * as nucleo from './nucleo.js';
import { criarRng } from './prng.js';
import { lerNumero, validarVertices } from './validacao.js';

// ---------- Funções de apoio dos testes (padrão do grupo) ----------

const resultados = [];

// Roda um teste: se a função lançar erro, o teste falhou.
export function caso(nome, fn) {
  try {
    fn();
    resultados.push({ nome: nome, ok: true, msg: '' });
  } catch (e) {
    resultados.push({ nome: nome, ok: false, msg: e.message });
  }
}

// Confere valores exatos (números inteiros, listas, null...).
export function igual(obtido, esperado, rotulo = '') {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a !== b) throw new Error(`${rotulo} esperado ${b}, obtido ${a}`);
}

// Confere números decimais com tolerância (o enunciado pede 0,000001).
export function perto(obtido, esperado, tol = 1e-6, rotulo = '') {
  if (!(Math.abs(obtido - esperado) <= tol)) throw new Error(`${rotulo} esperado ${esperado} ± ${tol}, obtido ${obtido}`);
}

// Confere uma condição verdadeira/falsa.
function verdadeiro(condicao, rotulo) {
  if (!condicao) throw new Error(rotulo);
}

// O comprimento é um dos três possíveis na instância 6.1 (14, 16 ou 18)?
function comprimentoPossivel(L) {
  return Math.abs(L - 14) <= 1e-6 || Math.abs(L - 16) <= 1e-6 || Math.abs(L - 18) <= 1e-6;
}

// ---------- Dados da seção 6.1 ----------

const VERTICES = [
  { id: 'A', x: 0, y: 0 },
  { id: 'B', x: 3, y: 0 },
  { id: 'C', x: 3, y: 4 },
  { id: 'D', x: 0, y: 4 },
];
const A = 0, B = 1, C = 2, D = 3;
const dist = nucleo.matrizDistancias(VERTICES);
const tau1 = nucleo.feromonioInicial(4, 1);
const PERIMETRO = [[A, B], [B, C], [C, D], [A, D]];
const DIAGONAIS = [[A, C], [B, D]];

// Configuração da seção 6.4 (dá para trocar beta e o número de formigas).
function configuracao(beta, formigas) {
  return { vertices: VERTICES, deposito: A, formigas: formigas, iteracoes: 30, alfa: 1, beta: beta, rho: 0.5, tau0: 1, Q: 14 };
}

// Procura nos detalhes da atualização a linha da aresta i-j.
function detalheDaAresta(detalhes, i, j) {
  for (let k = 0; k < detalhes.length; k++) {
    if (detalhes[k].i === i && detalhes[k].j === j) return detalhes[k];
  }
  return null;
}

// ---------- 6.1 Instância de referência e cálculo das rotas ----------

caso('6.1 — Distâncias A-B = 3, A-C = 5, A-D = 4, B-C = 4, B-D = 5, C-D = 3 e d(i,i) = 0', () => {
  perto(dist[A][B], 3, 1e-6, 'A-B');
  perto(dist[A][C], 5, 1e-6, 'A-C');
  perto(dist[A][D], 4, 1e-6, 'A-D');
  perto(dist[B][C], 4, 1e-6, 'B-C');
  perto(dist[B][D], 5, 1e-6, 'B-D');
  perto(dist[C][D], 3, 1e-6, 'C-D');
  for (let i = 0; i < 4; i++) igual(dist[i][i], 0, 'diagonal');
});

caso('6.1 — Comprimento das seis rotas a partir de A', () => {
  perto(nucleo.comprimentoRota([A, B, C, D, A], dist), 14, 1e-6, 'A→B→C→D→A');
  perto(nucleo.comprimentoRota([A, B, D, C, A], dist), 16, 1e-6, 'A→B→D→C→A');
  perto(nucleo.comprimentoRota([A, C, B, D, A], dist), 18, 1e-6, 'A→C→B→D→A');
  perto(nucleo.comprimentoRota([A, C, D, B, A], dist), 16, 1e-6, 'A→C→D→B→A');
  perto(nucleo.comprimentoRota([A, D, B, C, A], dist), 18, 1e-6, 'A→D→B→C→A');
  perto(nucleo.comprimentoRota([A, D, C, B, A], dist), 14, 1e-6, 'A→D→C→B→A');
});

caso('6.1 — Rota incompleta ou com vértice repetido é inválida', () => {
  verdadeiro(nucleo.rotaValida([A, B, C, D, A], 4, A), 'A→B→C→D→A deveria ser válida');
  verdadeiro(!nucleo.rotaValida([A, B, C, A], 4, A), 'rota incompleta foi aceita');
  verdadeiro(!nucleo.rotaValida([A, B, B, D, A], 4, A), 'vértice repetido foi aceito');
  verdadeiro(!nucleo.rotaValida([A, B, C, D], 4, A), 'rota sem retorno foi aceita');
});

// ---------- 6.2 Probabilidades de escolha ----------

caso('6.2 — Em A com τ = 1, α = 1, β = 2: pesos 1/9, 1/25, 1/16 e p = 400/769, 144/769, 225/769', () => {
  const p = nucleo.probabilidades(A, [B, C, D], tau1, dist, 1, 2);
  perto(p[0].peso, 1 / 9, 1e-6, 'w(A,B)');
  perto(p[1].peso, 1 / 25, 1e-6, 'w(A,C)');
  perto(p[2].peso, 1 / 16, 1e-6, 'w(A,D)');
  perto(p[0].probabilidade, 400 / 769, 1e-6, 'p(A,B)');
  perto(p[1].probabilidade, 144 / 769, 1e-6, 'p(A,C)');
  perto(p[2].probabilidade, 225 / 769, 1e-6, 'p(A,D)');
  perto(p[0].probabilidade + p[1].probabilidade + p[2].probabilidade, 1, 1e-6, 'soma');
});

caso('6.2 — Após visitar B: p(B,C) = 25/41 e p(B,D) = 16/41; A e B fora do sorteio', () => {
  const p = nucleo.probabilidades(B, [C, D], tau1, dist, 1, 2);
  igual(p.length, 2, 'quantidade de candidatos');
  perto(p[0].probabilidade, 25 / 41, 1e-6, 'p(B,C)');
  perto(p[1].probabilidade, 16 / 41, 1e-6, 'p(B,D)');
});

caso('6.2 — α = 0 e β = 0: probabilidades iguais entre os candidatos', () => {
  const tau = nucleo.feromonioInicial(4, 1);
  tau[A][B] = 7; // feromônio diferente não pode influenciar
  tau[B][A] = 7;
  const p = nucleo.probabilidades(A, [B, C, D], tau, dist, 0, 0);
  for (let k = 0; k < p.length; k++) perto(p[k].probabilidade, 1 / 3, 1e-6, 'candidato ' + k);
});

caso('6.2 — Um único candidato tem probabilidade 1', () => {
  const p = nucleo.probabilidades(C, [D], tau1, dist, 1, 2);
  perto(p[0].probabilidade, 1, 1e-6, 'p(C,D)');
});

caso('6.2 — Sorteio proporcional: não escolhe sempre o maior peso', () => {
  // Constrói 10.000 rotas e conta quantas vezes cada vértice foi o primeiro escolhido.
  // As frequências devem ficar perto das probabilidades (tolerância de 2%).
  const rng = criarRng(7);
  const contagem = [0, 0, 0, 0];
  for (let t = 0; t < 10000; t++) {
    const primeiro = nucleo.construirRota(A, tau1, dist, 1, 2, rng).rota[1];
    contagem[primeiro] = contagem[primeiro] + 1;
  }
  perto(contagem[B] / 10000, 400 / 769, 0.02, 'frequência de B');
  perto(contagem[C] / 10000, 144 / 769, 0.02, 'frequência de C');
  perto(contagem[D] / 10000, 225 / 769, 0.02, 'frequência de D');
});

// ---------- 6.3 Evaporação e depósito ----------

caso('6.3 — Uma formiga, rota forçada A→B→C→D→A: perímetro 1,5 e diagonais 0,5', () => {
  const r = nucleo.atualizarFeromonio(tau1, [[A, B, C, D, A]], [14], 0.5, 14);
  for (const [i, j] of PERIMETRO) perto(r.tau[i][j], 1.5, 1e-6, 'perímetro');
  for (const [i, j] of DIAGONAIS) perto(r.tau[i][j], 0.5, 1e-6, 'diagonal');

  // Log esperado de AB: anterior 1; após evaporação 0,5; depósito 1; final 1,5
  const ab = detalheDaAresta(r.detalhes, A, B);
  igual([ab.anterior, ab.aposEvaporacao, ab.deposito, ab.final], [1, 0.5, 1, 1.5], 'log AB');
  // Log esperado de AC: anterior 1; após evaporação 0,5; depósito 0; final 0,5
  const ac = detalheDaAresta(r.detalhes, A, C);
  igual([ac.anterior, ac.aposEvaporacao, ac.deposito, ac.final], [1, 0.5, 0, 0.5], 'log AC');
});

caso('6.3 — Segunda iteração com a mesma rota: perímetro 1,75 e diagonais 0,25', () => {
  const depoisDa1 = nucleo.atualizarFeromonio(tau1, [[A, B, C, D, A]], [14], 0.5, 14).tau;
  const depoisDa2 = nucleo.atualizarFeromonio(depoisDa1, [[A, B, C, D, A]], [14], 0.5, 14).tau;
  for (const [i, j] of PERIMETRO) perto(depoisDa2[i][j], 1.75, 1e-6, 'perímetro');
  for (const [i, j] of DIAGONAIS) perto(depoisDa2[i][j], 0.25, 1e-6, 'diagonal');
});

caso('6.3 — Duas formigas na mesma rota: perímetro 2,5 e diagonais 0,5', () => {
  const rota = [A, B, C, D, A];
  const r = nucleo.atualizarFeromonio(tau1, [rota, rota], [14, 14], 0.5, 14);
  for (const [i, j] of PERIMETRO) perto(r.tau[i][j], 2.5, 1e-6, 'perímetro');
  for (const [i, j] of DIAGONAIS) perto(r.tau[i][j], 0.5, 1e-6, 'diagonal');
});

caso('6.3 — Todas as formigas da iteração usam o mesmo τ', () => {
  // Se o feromônio mudasse no meio da iteração, a 2ª formiga em diante veria outra probabilidade.
  const config = configuracao(2, 5);
  const estado = nucleo.inicializar(config);
  const eventos = nucleo.passo(estado, config, criarRng(3)).eventos;
  for (let k = 0; k < eventos.length; k++) {
    if (eventos[k].tipo === 'formiga') {
      perto(eventos[k].escolhas[0].candidatos[0].probabilidade, 400 / 769, 1e-6, 'formiga ' + eventos[k].formiga);
    }
  }
});

caso('Piso de feromônio: nenhuma aresta fica abaixo de 1e-12', () => {
  const tau = nucleo.feromonioInicial(4, 1e-13);
  const r = nucleo.atualizarFeromonio(tau, [[A, B, C, D, A]], [14], 0.9, 14);
  igual(r.tau[A][C], nucleo.FEROMONIO_MINIMO, 'A-C');
});

// ---------- 6.4 Execução completa e reprodutibilidade ----------

caso('6.4 — Iteração 0: τ = 1 e melhor distância ainda não calculada', () => {
  const estado = nucleo.inicializar(configuracao(2, 10));
  igual(estado.iteracao, 0, 'iteração');
  igual(estado.melhorComprimento, null, 'melhor');
  igual(estado.historico.length, 1, 'registros no histórico');
  for (const [i, j] of PERIMETRO) igual(estado.tau[i][j], 1, 'τ perímetro');
  for (const [i, j] of DIAGONAIS) igual(estado.tau[i][j], 1, 'τ diagonal');
});

caso('6.4 — Semente 42: 30 registros, melhor acumulado nunca aumenta, rota válida', () => {
  const estado = nucleo.executar(configuracao(2, 10), criarRng(42));
  igual(estado.historico.length, 31, 'registros (iteração 0 + 30)');
  for (let k = 2; k < estado.historico.length; k++) {
    verdadeiro(estado.historico[k].melhorAcumulado <= estado.historico[k - 1].melhorAcumulado,
      'melhor acumulado aumentou na iteração ' + k);
  }
  verdadeiro(nucleo.rotaValida(estado.melhorRota, 4, A), 'melhor rota inválida');
  verdadeiro(comprimentoPossivel(estado.melhorComprimento), 'comprimento ' + estado.melhorComprimento);
});

caso('6.4 — Mesma semente reproduz o histórico; pausar e retomar dá o mesmo resultado', () => {
  const config = configuracao(2, 10);
  const primeira = nucleo.executar(config, criarRng(42));
  const segunda = nucleo.executar(config, criarRng(42));
  igual(JSON.stringify(primeira.historico) === JSON.stringify(segunda.historico), true, 'reprodução');

  // Pausar = parar de chamar passo. Aqui: 12 iterações, "pausa", mais 18 com o mesmo rng.
  const rng = criarRng(42);
  const estado = nucleo.inicializar(config);
  for (let k = 0; k < 12; k++) nucleo.passo(estado, config, rng);
  for (let k = 0; k < 18; k++) nucleo.passo(estado, config, rng);
  igual(JSON.stringify(estado.historico) === JSON.stringify(primeira.historico), true, 'pausar e retomar');
});

// ---------- 6.5 Efeito dos parâmetros e entradas inválidas ----------

// Roda as sementes 1 a 5 com um valor de beta e resume o resultado.
function compararBeta(beta) {
  const finais = [];
  let soma = 0;
  let chegaram14 = 0;
  for (let semente = 1; semente <= 5; semente++) {
    const L = nucleo.executar(configuracao(beta, 10), criarRng(semente)).melhorComprimento;
    finais.push(L);
    soma = soma + L;
    if (Math.abs(L - 14) <= 1e-6) chegaram14 = chegaram14 + 1;
  }
  return { finais: finais, media: soma / 5, chegaram14: chegaram14 };
}
const beta0 = compararBeta(0);
const beta2 = compararBeta(2);

caso(`6.5 — β = 0: média ${beta0.media}, chegaram a 14: ${beta0.chegaram14} de 5 · ` +
     `β = 2: média ${beta2.media}, chegaram a 14: ${beta2.chegaram14} de 5`, () => {
  for (let k = 0; k < 5; k++) {
    verdadeiro(comprimentoPossivel(beta0.finais[k]), 'β = 0, comprimento ' + beta0.finais[k]);
    verdadeiro(comprimentoPossivel(beta2.finais[k]), 'β = 2, comprimento ' + beta2.finais[k]);
  }
});

caso('6.5 — ρ = 0%: a evaporação não reduz o feromônio', () => {
  const r = nucleo.atualizarFeromonio(tau1, [[A, B, C, D, A]], [14], 0, 14);
  for (let k = 0; k < r.detalhes.length; k++) igual(r.detalhes[k].aposEvaporacao, r.detalhes[k].anterior, 'após evaporação');
  for (const [i, j] of PERIMETRO) perto(r.tau[i][j], 2, 1e-6, 'perímetro');
  for (const [i, j] of DIAGONAIS) perto(r.tau[i][j], 1, 1e-6, 'diagonal');
});

caso('6.5 — Coordenadas duplicadas, identificador repetido e menos de 4 vértices geram erro', () => {
  igual(validarVertices(VERTICES).length, 0, 'instância válida rejeitada');

  const duplicada = [VERTICES[0], VERTICES[1], VERTICES[2], VERTICES[3], { id: 'E', x: 3, y: 4 }];
  verdadeiro(validarVertices(duplicada).length > 0, 'coordenada duplicada aceita');

  const idRepetido = [VERTICES[0], VERTICES[1], VERTICES[2], VERTICES[3], { id: 'A', x: 9, y: 9 }];
  verdadeiro(validarVertices(idRepetido).length > 0, 'identificador repetido aceito');

  const tres = [VERTICES[0], VERTICES[1], VERTICES[2]];
  verdadeiro(validarVertices(tres).length > 0, 'menos de 4 vértices aceito');
});

caso('6.5 — Campo vazio e valores fora do intervalo geram erro', () => {
  verdadeiro(lerNumero('', { nome: 'Formigas', min: 1, max: 100, inteiro: true }).erro, 'vazio');
  verdadeiro(lerNumero('abc', { nome: 'Formigas', min: 1, max: 100, inteiro: true }).erro, 'texto');
  verdadeiro(lerNumero('0', { nome: 'Formigas', min: 1, max: 100, inteiro: true }).erro, 'formigas 0');
  verdadeiro(lerNumero('201', { nome: 'Iterações', min: 1, max: 200, inteiro: true }).erro, 'iterações 201');
  verdadeiro(lerNumero('5,5', { nome: 'α', min: 0, max: 5 }).erro, 'α 5,5');
  verdadeiro(lerNumero('91', { nome: 'ρ', min: 0, max: 90 }).erro, 'ρ 91%');
  verdadeiro(lerNumero('0', { nome: 'τ₀', min: 0.01, max: 100 }).erro, 'τ₀ 0');
  verdadeiro(lerNumero('1000,5', { nome: 'x', min: 0, max: 1000, casas: 2 }).erro, 'x 1000,5');
  verdadeiro(lerNumero('1,234', { nome: 'x', min: 0, max: 1000, casas: 2 }).erro, 'x com 3 casas');
  igual(lerNumero('2,5', { nome: 'β', min: 0, max: 5 }).valor, 2.5, 'β 2,5 válido');
});

// ---------- Mostrar os resultados ----------

let quantosPassaram = 0;
for (let k = 0; k < resultados.length; k++) {
  if (resultados[k].ok) quantosPassaram = quantosPassaram + 1;
}
const resumo = `${quantosPassaram} de ${resultados.length} testes passaram.`;

if (typeof document !== 'undefined') {
  // No navegador: monta a tabela da testes.html.
  let linhas = '';
  for (let k = 0; k < resultados.length; k++) {
    const r = resultados[k];
    const classe = r.ok ? 'ok' : 'falha';
    const texto = r.ok ? 'PASSOU' : 'FALHOU';
    linhas = linhas + `<tr class="${classe}"><td>${r.nome}</td><td>${texto}</td><td>${r.msg}</td></tr>`;
  }
  document.getElementById('resultados').innerHTML = linhas;
  document.getElementById('resumo').textContent = resumo;
} else {
  // No terminal (node js/testes.js).
  for (let k = 0; k < resultados.length; k++) {
    const r = resultados[k];
    console.log((r.ok ? 'PASSOU  ' : 'FALHOU  ') + r.nome + (r.msg ? '  → ' + r.msg : ''));
  }
  console.log(resumo);
}
