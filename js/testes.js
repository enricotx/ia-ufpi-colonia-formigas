// js/testes.js — padrão do grupo: um caso por item da seção 6 do enunciado
import * as nucleo from './nucleo.js';
import { criarRng } from './prng.js';
import { lerNumero, validarVertices } from './validacao.js';

const resultados = [];

export function caso(nome, fn) {
  try { fn(); resultados.push({ nome, ok: true }); }
  catch (e) { resultados.push({ nome, ok: false, msg: e.message }); }
}
export function igual(obtido, esperado, rotulo = '') {
  const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
  if (a !== b) throw new Error(`${rotulo} esperado ${b}, obtido ${a}`);
}
export function perto(obtido, esperado, tol = 1e-6, rotulo = '') {
  if (!(Math.abs(obtido - esperado) <= tol)) throw new Error(`${rotulo} esperado ${esperado} ± ${tol}, obtido ${obtido}`);
}
function verdadeiro(condicao, rotulo) {
  if (!condicao) throw new Error(rotulo);
}

// Instância de referência da seção 6.1 (depósito A = índice 0)
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

// Configuração da seção 6.4
const CONFIG = { vertices: VERTICES, deposito: A, formigas: 10, iteracoes: 30, alfa: 1, beta: 2, rho: 0.5, tau0: 1, Q: 14 };

// ---------- 6.1 ----------

caso('6.1 — Distâncias A-B = 3, A-C = 5, A-D = 4, B-C = 4, B-D = 5, C-D = 3 e d(i,i) = 0', () => {
  perto(dist[A][B], 3, 1e-6, 'A-B'); perto(dist[A][C], 5, 1e-6, 'A-C'); perto(dist[A][D], 4, 1e-6, 'A-D');
  perto(dist[B][C], 4, 1e-6, 'B-C'); perto(dist[B][D], 5, 1e-6, 'B-D'); perto(dist[C][D], 3, 1e-6, 'C-D');
  for (let i = 0; i < 4; i++) igual(dist[i][i], 0, `d(${i},${i})`);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) igual(dist[i][j], dist[j][i], 'simetria');
});

caso('6.1 — Comprimento das seis rotas a partir de A', () => {
  const rotas = [
    [[A, B, C, D, A], 14], [[A, B, D, C, A], 16], [[A, C, B, D, A], 18],
    [[A, C, D, B, A], 16], [[A, D, B, C, A], 18], [[A, D, C, B, A], 14],
  ];
  for (const [rota, esperado] of rotas) perto(nucleo.comprimentoRota(rota, dist), esperado, 1e-6, rota.join('→'));
});

caso('6.1 — Rota incompleta ou com vértice repetido é inválida', () => {
  verdadeiro(nucleo.rotaValida([A, B, C, D, A], 4, A), 'A→B→C→D→A deveria ser válida');
  verdadeiro(!nucleo.rotaValida([A, B, C, A], 4, A), 'rota incompleta aceita');
  verdadeiro(!nucleo.rotaValida([A, B, B, D, A], 4, A), 'vértice repetido aceito');
  verdadeiro(!nucleo.rotaValida([A, B, C, D], 4, A), 'rota sem retorno aceita');
});

// ---------- 6.2 ----------

caso('6.2 — Em A com τ = 1, α = 1, β = 2: pesos 1/9, 1/25, 1/16 e p = 400/769, 144/769, 225/769', () => {
  const p = nucleo.probabilidades(A, [B, C, D], tau1, dist, 1, 2);
  perto(p[0].peso, 1 / 9, 1e-6, 'w(A,B)'); perto(p[1].peso, 1 / 25, 1e-6, 'w(A,C)'); perto(p[2].peso, 1 / 16, 1e-6, 'w(A,D)');
  perto(p[0].probabilidade, 400 / 769, 1e-6, 'p(A,B)');
  perto(p[1].probabilidade, 144 / 769, 1e-6, 'p(A,C)');
  perto(p[2].probabilidade, 225 / 769, 1e-6, 'p(A,D)');
  perto(p[0].probabilidade + p[1].probabilidade + p[2].probabilidade, 1, 1e-6, 'soma');
});

caso('6.2 — Após visitar B: p(B,C) = 25/41 e p(B,D) = 16/41; A e B fora do sorteio', () => {
  const p = nucleo.probabilidades(B, [C, D], tau1, dist, 1, 2);
  igual(p.map(c => c.vertice), [C, D], 'candidatos');
  perto(p[0].probabilidade, 25 / 41, 1e-6, 'p(B,C)');
  perto(p[1].probabilidade, 16 / 41, 1e-6, 'p(B,D)');
});

caso('6.2 — α = 0 e β = 0: probabilidades iguais entre os candidatos', () => {
  const tau = nucleo.feromonioInicial(4, 1);
  tau[A][B] = tau[B][A] = 7; // feromônio diferente não deve influenciar
  const p = nucleo.probabilidades(A, [B, C, D], tau, dist, 0, 0);
  for (const c of p) perto(c.probabilidade, 1 / 3, 1e-6, `p(A,${c.vertice})`);
});

caso('6.2 — Um único candidato tem probabilidade 1', () => {
  const p = nucleo.probabilidades(C, [D], tau1, dist, 1, 2);
  perto(p[0].probabilidade, 1, 1e-6, 'p(C,D)');
});

caso('6.2 — Sorteio proporcional: não escolhe sempre o maior peso', () => {
  // 10.000 sorteios do primeiro passo; a frequência de cada candidato deve ficar perto da probabilidade.
  const rng = criarRng(7);
  const contagem = [0, 0, 0, 0];
  for (let t = 0; t < 10000; t++) contagem[nucleo.construirRota(A, tau1, dist, 1, 2, rng).rota[1]]++;
  perto(contagem[B] / 10000, 400 / 769, 0.02, 'freq. B');
  perto(contagem[C] / 10000, 144 / 769, 0.02, 'freq. C');
  perto(contagem[D] / 10000, 225 / 769, 0.02, 'freq. D');
});

// ---------- 6.3 ----------

caso('6.3 — Uma formiga, rota forçada A→B→C→D→A: perímetro 1,5 e diagonais 0,5', () => {
  const { tau, detalhes } = nucleo.atualizarFeromonio(tau1, [[A, B, C, D, A]], [14], 0.5, 14);
  for (const [i, j] of PERIMETRO) perto(tau[i][j], 1.5, 1e-6, `${i}-${j}`);
  for (const [i, j] of DIAGONAIS) perto(tau[i][j], 0.5, 1e-6, `${i}-${j}`);
  for (const d of detalhes) perto(d.aposEvaporacao, 0.5, 1e-6, 'após evaporação');
  const ab = detalhes.find(d => d.i === A && d.j === B);
  const ac = detalhes.find(d => d.i === A && d.j === C);
  igual([ab.anterior, ab.aposEvaporacao, ab.deposito, ab.final], [1, 0.5, 1, 1.5], 'log AB');
  igual([ac.anterior, ac.aposEvaporacao, ac.deposito, ac.final], [1, 0.5, 0, 0.5], 'log AC');
  for (let i = 0; i < 4; i++) igual(tau[i][i], 0, 'diagonal');
});

caso('6.3 — Segunda iteração com a mesma rota: perímetro 1,75 e diagonais 0,25', () => {
  const t1 = nucleo.atualizarFeromonio(tau1, [[A, B, C, D, A]], [14], 0.5, 14).tau;
  const t2 = nucleo.atualizarFeromonio(t1, [[A, B, C, D, A]], [14], 0.5, 14).tau;
  for (const [i, j] of PERIMETRO) perto(t2[i][j], 1.75, 1e-6, `${i}-${j}`);
  for (const [i, j] of DIAGONAIS) perto(t2[i][j], 0.25, 1e-6, `${i}-${j}`);
});

caso('6.3 — Duas formigas na mesma rota: perímetro 2,5 e diagonais 0,5', () => {
  const rota = [A, B, C, D, A];
  const { tau } = nucleo.atualizarFeromonio(tau1, [rota, rota], [14, 14], 0.5, 14);
  for (const [i, j] of PERIMETRO) perto(tau[i][j], 2.5, 1e-6, `${i}-${j}`);
  for (const [i, j] of DIAGONAIS) perto(tau[i][j], 0.5, 1e-6, `${i}-${j}`);
});

caso('6.3 — Todas as formigas usam o mesmo τ (atualização só no fim da iteração)', () => {
  const estado = nucleo.inicializar({ ...CONFIG, formigas: 5 });
  const { eventos } = nucleo.passo(estado, { ...CONFIG, formigas: 5 }, criarRng(3));
  const formigas = eventos.filter(e => e.tipo === 'formiga');
  // No primeiro passo de toda formiga, com τ = 1, as probabilidades devem ser as de 6.2.
  for (const f of formigas) perto(f.escolhas[0].candidatos[0].probabilidade, 400 / 769, 1e-6, `formiga ${f.formiga}`);
});

caso('6.5 — ρ = 0%: a evaporação não reduz o feromônio', () => {
  const { tau, detalhes } = nucleo.atualizarFeromonio(tau1, [[A, B, C, D, A]], [14], 0, 14);
  for (const d of detalhes) igual(d.aposEvaporacao, d.anterior, 'após evaporação');
  for (const [i, j] of PERIMETRO) perto(tau[i][j], 2, 1e-6, `${i}-${j}`);
  for (const [i, j] of DIAGONAIS) perto(tau[i][j], 1, 1e-6, `${i}-${j}`);
});

caso('Piso de feromônio: nenhuma aresta fica abaixo de 1e-12', () => {
  const tau = nucleo.feromonioInicial(4, 1e-13);
  const r = nucleo.atualizarFeromonio(tau, [[A, B, C, D, A]], [14], 0.9, 14).tau;
  igual(r[A][C], nucleo.FEROMONIO_MINIMO, 'A-C');
});

// ---------- 6.4 ----------

caso('6.4 — Iteração 0: τ = 1 e melhor distância ainda não calculada', () => {
  const e = nucleo.inicializar(CONFIG);
  igual(e.iteracao, 0, 'iteração');
  igual(e.melhorComprimento, null, 'melhor');
  igual(e.historico.length, 1, 'histórico');
  for (const [i, j] of [...PERIMETRO, ...DIAGONAIS]) igual(e.tau[i][j], 1, 'τ');
});

caso('6.4 — Semente 42: 30 registros, melhor acumulado nunca aumenta, rota válida', () => {
  const e = nucleo.executar(CONFIG, criarRng(42));
  const registros = e.historico.filter(r => r.iteracao > 0);
  igual(registros.length, 30, 'registros');
  for (let k = 1; k < registros.length; k++)
    verdadeiro(registros[k].melhorAcumulado <= registros[k - 1].melhorAcumulado, `melhor aumentou na iteração ${k + 1}`);
  verdadeiro(nucleo.rotaValida(e.melhorRota, 4, A), 'melhor rota inválida');
  verdadeiro([14, 16, 18].some(L => Math.abs(e.melhorComprimento - L) <= 1e-6), `comprimento ${e.melhorComprimento}`);
  perto(nucleo.comprimentoRota(e.melhorRota, dist), e.melhorComprimento, 1e-6, 'comprimento confere');
});

caso('6.4 — Mesma semente reproduz o histórico; passo a passo (pausar/retomar) dá o mesmo', () => {
  const a = nucleo.executar(CONFIG, criarRng(42));
  const b = nucleo.executar(CONFIG, criarRng(42));
  igual(JSON.stringify(a.historico) === JSON.stringify(b.historico), true, 'reprodução');
  // Simula pausar no meio: 12 passos, pausa, mais 18 com o mesmo rng.
  const rng = criarRng(42);
  let e = nucleo.inicializar(CONFIG);
  for (let k = 0; k < 12; k++) e = nucleo.passo(e, CONFIG, rng).estado;
  for (let k = 0; k < 18; k++) e = nucleo.passo(e, CONFIG, rng).estado;
  igual(JSON.stringify(e.historico) === JSON.stringify(a.historico), true, 'pausar e retomar');
});

// ---------- 6.5 ----------

function comparar(beta) {
  const finais = [1, 2, 3, 4, 5].map(s => nucleo.executar({ ...CONFIG, beta }, criarRng(s)).melhorComprimento);
  return { finais, media: finais.reduce((a, b) => a + b, 0) / 5, chegaram14: finais.filter(L => Math.abs(L - 14) <= 1e-6).length };
}
export const comparacaoBeta = { beta0: comparar(0), beta2: comparar(2) };

caso(`6.5 — β = 0 × β = 2 (sementes 1 a 5): médias ${comparacaoBeta.beta0.media} e ${comparacaoBeta.beta2.media}; ` +
     `chegaram a 14: ${comparacaoBeta.beta0.chegaram14} e ${comparacaoBeta.beta2.chegaram14}`, () => {
  for (const L of [...comparacaoBeta.beta0.finais, ...comparacaoBeta.beta2.finais])
    verdadeiro([14, 16, 18].some(v => Math.abs(L - v) <= 1e-6), `comprimento ${L}`);
});

caso('6.5 — Coordenadas duplicadas, identificador repetido e menos de 4 vértices geram erro', () => {
  verdadeiro(validarVertices(VERTICES).length === 0, 'instância válida rejeitada');
  verdadeiro(validarVertices([...VERTICES, { id: 'E', x: 3, y: 4 }]).some(m => m.includes('mesmas coordenadas')), 'coordenada duplicada');
  verdadeiro(validarVertices([...VERTICES, { id: 'A', x: 9, y: 9 }]).some(m => m.includes('repetido')), 'id repetido');
  verdadeiro(validarVertices(VERTICES.slice(0, 3)).some(m => m.includes('pelo menos 4')), 'menos de 4');
});

caso('6.5 — Campo vazio e valores fora do intervalo geram erro', () => {
  verdadeiro('erro' in lerNumero('', { nome: 'Formigas', min: 1, max: 100, inteiro: true }), 'vazio');
  verdadeiro('erro' in lerNumero('abc', { nome: 'Formigas', min: 1, max: 100, inteiro: true }), 'texto');
  verdadeiro('erro' in lerNumero('0', { nome: 'Formigas', min: 1, max: 100, inteiro: true }), 'formigas 0');
  verdadeiro('erro' in lerNumero('201', { nome: 'Iterações', min: 1, max: 200, inteiro: true }), 'iterações 201');
  verdadeiro('erro' in lerNumero('5,5', { nome: 'α', min: 0, max: 5 }), 'α 5,5');
  verdadeiro('erro' in lerNumero('91', { nome: 'ρ', min: 0, max: 90 }), 'ρ 91%');
  verdadeiro('erro' in lerNumero('0', { nome: 'τ₀', min: 0.01, max: 100 }), 'τ₀ 0');
  verdadeiro('erro' in lerNumero('1000,5', { nome: 'x', min: 0, max: 1000, casas: 2 }), 'x 1000,5');
  verdadeiro('erro' in lerNumero('1,234', { nome: 'x', min: 0, max: 1000, casas: 2 }), 'x com 3 casas');
  igual(lerNumero('2,5', { nome: 'β', min: 0, max: 5 }).valor, 2.5, 'β 2,5');
});

// ---------- Exibição ----------

if (typeof document !== 'undefined') {
  const corpo = document.getElementById('resultados');
  corpo.innerHTML = resultados.map(r =>
    `<tr class="${r.ok ? 'ok' : 'falha'}"><td>${r.nome}</td><td>${r.ok ? 'PASSOU' : 'FALHOU'}</td><td>${r.msg ?? ''}</td></tr>`).join('');
  const ok = resultados.filter(r => r.ok).length;
  document.getElementById('resumo').textContent = `${ok} de ${resultados.length} testes passaram.`;
} else {
  // Rodando no Node (conferência rápida): imprime no terminal.
  for (const r of resultados) console.log(`${r.ok ? 'PASSOU' : 'FALHOU'}  ${r.nome}${r.msg ? '  → ' + r.msg : ''}`);
  console.log(`${resultados.filter(r => r.ok).length} de ${resultados.length} testes passaram.`);
}
