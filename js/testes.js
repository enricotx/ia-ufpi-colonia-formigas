// js/testes.js — padrão do grupo: um caso por item da seção 6 do enunciado
import * as nucleo from './nucleo.js';

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
function mostrar(corpo) {
  corpo.innerHTML = resultados.map(r =>
    `<tr class="${r.ok ? 'ok' : 'falha'}"><td>${r.nome}</td><td>${r.ok ? 'PASSOU' : 'FALHOU'}</td><td>${r.msg ?? ''}</td></tr>`).join('');
  const ok = resultados.filter(r => r.ok).length;
  document.getElementById('resumo').textContent = `${ok} de ${resultados.length} testes passaram.`;
}

// Instância de referência da seção 6.1 (depósito A = índice 0)
const VERTICES = [
  { id: 'A', x: 0, y: 0 },
  { id: 'B', x: 3, y: 0 },
  { id: 'C', x: 3, y: 4 },
  { id: 'D', x: 0, y: 4 },
];

caso('6.1 — Comprimento de A → B → C → D → A', () => {
  const dist = nucleo.matrizDistancias(VERTICES);
  perto(nucleo.comprimentoRota([0, 1, 2, 3, 0], dist), 14);
});

// TODO: demais casos da seção 6 (as seis rotas, probabilidades com α = 1 e β = 2, α = β = 0,
// candidato único, evaporação e depósito com rota forçada, duas formigas, execução com semente 42,
// β = 0 × β = 2 com sementes 1 a 5, entradas inválidas, ρ = 0%)

mostrar(document.getElementById('resultados'));
