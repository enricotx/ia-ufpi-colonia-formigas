// js/validacao.js — padrão do grupo
// Lê o texto de um campo e devolve { valor } ou { erro }. Nunca corrige o valor em silêncio.
export function lerNumero(texto, { nome, min = -Infinity, max = Infinity,
                                   inteiro = false, casas = null, minExclusivo = false }) {
  const bruto = String(texto ?? '').trim().replace(',', '.');
  if (bruto === '') return { erro: `${nome}: preencha este campo.` };
  if (!/^[+-]?\d+(\.\d+)?$/.test(bruto)) return { erro: `${nome}: digite um número válido.` };
  const valor = Number(bruto);
  if (!Number.isFinite(valor)) return { erro: `${nome}: o valor precisa ser finito.` };
  if (inteiro && !Number.isInteger(valor)) return { erro: `${nome}: use um número inteiro.` };
  if (casas !== null && (bruto.split('.')[1] ?? '').length > casas)
    return { erro: `${nome}: use no máximo ${casas} casas decimais.` };
  if (minExclusivo ? valor <= min : valor < min)
    return { erro: `${nome}: o valor deve ser ${minExclusivo ? 'maior que' : 'no mínimo'} ${min}.` };
  if (valor > max) return { erro: `${nome}: o valor deve ser no máximo ${max}.` };
  return { valor };
}

/** Enunciado 1, 3 e 6.5: regras que dependem de todos os vértices juntos.
 *  vertices = [{ id, x, y }] já lidos. Devolve a lista de mensagens de erro (vazia = tudo certo). */
export function validarVertices(vertices) {
  const erros = [];
  if (vertices.length < 4) erros.push('Vértices: cadastre pelo menos 4 vértices.');
  if (vertices.length > 12) erros.push('Vértices: cadastre no máximo 12 vértices.');
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      if (vertices[i].id === vertices[j].id)
        erros.push(`Vértices: o identificador ${vertices[i].id} está repetido.`);
      if (vertices[i].x === vertices[j].x && vertices[i].y === vertices[j].y)
        erros.push(`Vértices: ${vertices[i].id} e ${vertices[j].id} têm as mesmas coordenadas.`);
    }
  }
  return erros;
}

export function lerTexto(texto, { nome }) {
  const valor = String(texto ?? '').trim();
  if (valor === '') return { erro: `${nome}: preencha este campo.` };
  return { valor };
}
