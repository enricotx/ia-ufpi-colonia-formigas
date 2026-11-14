// js/formato.js — padrão do grupo: formatação pt-BR só na exibição
export function formatarDecimal(x, casas = 2) {
  return x.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

// Distância na tela: 2 casas; null (ainda não calculada) vira traço.
export function formatarDistancia(x) {
  return x === null ? '—' : formatarDecimal(x, 2);
}

// Rota como texto: [0, 1, 2, 0] com vértices A, B, C vira "A → B → C → A".
export function formatarRota(rota, vertices) {
  return rota.map(i => vertices[i].id).join(' → ');
}
