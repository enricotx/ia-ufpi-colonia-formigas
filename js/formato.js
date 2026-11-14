// js/formato.js — padrão do grupo: formatação pt-BR só na exibição
// Um formatador por número de casas, criado uma vez só (criar um a cada número é lento).
const formatadores = {};
export function formatarDecimal(x, casas = 2) {
  if (!formatadores[casas]) {
    formatadores[casas] = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  return formatadores[casas].format(x);
}

// Distância na tela: 2 casas; null (ainda não calculada) vira traço.
export function formatarDistancia(x) {
  return x === null ? '—' : formatarDecimal(x, 2);
}

// Rota como texto: [0, 1, 2, 0] com vértices A, B, C vira "A → B → C → A".
export function formatarRota(rota, vertices) {
  return rota.map(i => vertices[i].id).join(' → ');
}
