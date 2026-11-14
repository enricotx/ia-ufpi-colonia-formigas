// js/escala.js — contas da escala do grafo (funções puras, sem DOM).

// Caixa quadrada que cobre todos os vértices, com margem de 12% do maior lado (mínimo 1).
export function calcularViewBox(vertices) {
  let minX = vertices[0].x, maxX = vertices[0].x;
  let minY = vertices[0].y, maxY = vertices[0].y;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  const maiorLado = Math.max(maxX - minX, maxY - minY);
  let margem = 0.12 * maiorLado;
  if (margem < 1) margem = 1;
  const larguraCaixa = maxX - minX + 2 * margem;
  const alturaCaixa = maxY - minY + 2 * margem;
  // Quadrada: o menor lado cresce, centralizado.
  const lado = Math.max(larguraCaixa, alturaCaixa);
  const centroX = (minX + maxX) / 2;
  const centroY = (minY + maxY) / 2;
  return { x: centroX - lado / 2, y: centroY - lado / 2, largura: lado, altura: lado };
}

// Referência da escala: o maior feromônio já visto na execução (fora da diagonal).
// Só cresce, para que uma redução nunca pareça um aumento.
export function atualizarReferencia(refAtual, tau) {
  let ref = refAtual === null ? 0 : refAtual;
  for (let i = 0; i < tau.length; i++) {
    for (let j = 0; j < tau.length; j++) {
      if (i !== j && tau[i][j] > ref) ref = tau[i][j];
    }
  }
  const mudou = refAtual !== null && ref > refAtual;
  return { ref, mudou };
}

// Espessura relativa (de 1 a 14) e opacidade (de 0,25 a 0,95) pelo feromônio.
export function espessura(tau, ref) {
  return 1 + 13 * tau / ref;
}

export function opacidade(tau, ref) {
  return 0.25 + 0.7 * tau / ref;
}

// Menor iteração cujo melhor acumulado já é igual ao último; null se ainda não há melhor.
export function iteracaoDaMelhor(historico) {
  const ultimo = historico[historico.length - 1].melhorAcumulado;
  if (ultimo === null) return null;
  for (const h of historico) {
    if (h.melhorAcumulado === ultimo) return h.iteracao;
  }
  return null;
}
