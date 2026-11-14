// js/configuracao.js — leitura e validação da configuração (módulo puro, sem DOM).
// Transforma os textos do formulário no objeto `parametros` que o núcleo usa.
import { lerNumero, lerTexto, validarVertices } from './validacao.js';

// Cenário que aparece ao abrir a tela (tudo em texto, como nos inputs).
export const CENARIO_INICIAL = {
  vertices: [
    { id: 'A', x: '120', y: '520' },
    { id: 'B', x: '300', y: '180' },
    { id: 'C', x: '620', y: '120' },
    { id: 'D', x: '880', y: '300' },
    { id: 'E', x: '820', y: '700' },
    { id: 'F', x: '520', y: '860' },
    { id: 'G', x: '220', y: '820' }
  ],
  deposito: 'A',
  campos: { formigas: '10', iteracoes: '30', alfa: '1', beta: '2', rho: '50', tau0: '1', q: '1000', semente: '42' }
};

// Instância pequena (retângulo 3 x 4) usada para conferir o cálculo à mão.
export const INSTANCIA_TESTE = {
  vertices: [
    { id: 'A', x: '0', y: '0' },
    { id: 'B', x: '3', y: '0' },
    { id: 'C', x: '3', y: '4' },
    { id: 'D', x: '0', y: '4' }
  ],
  deposito: 'A',
  campos: { formigas: '10', iteracoes: '30', alfa: '1', beta: '2', rho: '50', tau0: '1', q: '14', semente: '42' }
};

// Lê um campo numérico. Se der certo devolve o valor; se não, guarda a mensagem em errosCampos[chave].
function lerCampo(entrada, chave, regras, errosCampos) {
  const r = lerNumero(entrada.campos[chave], regras);
  if (r.erro) {
    errosCampos[chave] = r.erro;
    return null;
  }
  return r.valor;
}

// Lê um vértice (nome, x e y). Cada falha vira um item em errosVertices.
// Devolve o vértice com números, ou null se alguma célula estiver errada.
function lerVertice(bruto, linha, errosVertices) {
  const rotulo = 'Vértice ' + (linha + 1);
  let ok = true;

  const nome = lerTexto(bruto.id, { nome: rotulo + ': nome' });
  if (nome.erro) {
    errosVertices.push({ linha: linha, coluna: 'id', mensagem: nome.erro });
    ok = false;
  }
  const x = lerNumero(bruto.x, { nome: rotulo + ': x', min: 0, max: 1000, casas: 2 });
  if (x.erro) {
    errosVertices.push({ linha: linha, coluna: 'x', mensagem: x.erro });
    ok = false;
  }
  const y = lerNumero(bruto.y, { nome: rotulo + ': y', min: 0, max: 1000, casas: 2 });
  if (y.erro) {
    errosVertices.push({ linha: linha, coluna: 'y', mensagem: y.erro });
    ok = false;
  }
  if (!ok) return null;
  return { id: nome.valor, x: x.valor, y: y.valor };
}

// Lê o formulário inteiro. `parametros` só vem preenchido quando não há nenhum erro.
export function lerConfiguracao(entrada) {
  const errosCampos = {};
  const errosVertices = [];
  const errosGerais = [];

  // Parâmetros numéricos.
  const formigas = lerCampo(entrada, 'formigas', { nome: 'Formigas', min: 1, max: 100, inteiro: true }, errosCampos);
  const iteracoes = lerCampo(entrada, 'iteracoes', { nome: 'Iterações', min: 1, max: 200, inteiro: true }, errosCampos);
  const alfa = lerCampo(entrada, 'alfa', { nome: 'α', min: 0, max: 5 }, errosCampos);
  const beta = lerCampo(entrada, 'beta', { nome: 'β', min: 0, max: 5 }, errosCampos);
  const rhoPercentual = lerCampo(entrada, 'rho', { nome: 'ρ', min: 0, max: 90 }, errosCampos);
  const tau0 = lerCampo(entrada, 'tau0', { nome: 'τ₀', min: 0.01, max: 100 }, errosCampos);
  const q = lerCampo(entrada, 'q', { nome: 'Q', min: 0.01, max: 10000 }, errosCampos);
  const semente = lerCampo(entrada, 'semente', { nome: 'Semente', inteiro: true }, errosCampos);

  // Vértices: lê cada linha; só confere o conjunto se todas as células foram lidas.
  const vertices = [];
  let todosLidos = true;
  for (let i = 0; i < entrada.vertices.length; i++) {
    const v = lerVertice(entrada.vertices[i], i, errosVertices);
    if (v === null) {
      todosLidos = false;
    } else {
      vertices.push(v);
    }
  }
  if (todosLidos) {
    const mensagens = validarVertices(vertices);
    for (let i = 0; i < mensagens.length; i++) errosGerais.push(mensagens[i]);
  }

  // Depósito: precisa ser um dos vértices cadastrados.
  let deposito = -1;
  if (todosLidos) {
    const idDeposito = String(entrada.deposito).trim();
    for (let i = 0; i < vertices.length; i++) {
      if (vertices[i].id === idDeposito) {
        deposito = i;
        break;
      }
    }
    if (deposito === -1) errosGerais.push('Depósito: escolha um dos vértices cadastrados.');
  }

  const temErro = Object.keys(errosCampos).length > 0 || errosVertices.length > 0 || errosGerais.length > 0;
  if (temErro) {
    return { parametros: null, errosCampos: errosCampos, errosVertices: errosVertices, errosGerais: errosGerais };
  }

  const parametros = {
    vertices: vertices,
    deposito: deposito,
    formigas: formigas,
    iteracoes: iteracoes,
    alfa: alfa,
    beta: beta,
    rho: rhoPercentual / 100,
    tau0: tau0,
    Q: q,
    semente: semente
  };
  return { parametros: parametros, errosCampos: errosCampos, errosVertices: errosVertices, errosGerais: errosGerais };
}

// Devolve a primeira letra livre de A a L (ou '' se todas estiverem em uso).
export function proximoId(vertices) {
  const letras = 'ABCDEFGHIJKL';
  for (let i = 0; i < letras.length; i++) {
    let usada = false;
    for (let j = 0; j < vertices.length; j++) {
      if (vertices[j].id === letras[i]) usada = true;
    }
    if (!usada) return letras[i];
  }
  return '';
}

// Devolve o depósito se ele ainda existir entre os vértices; senão, o id do primeiro vértice.
export function depositoValido(vertices, deposito) {
  for (let i = 0; i < vertices.length; i++) {
    if (vertices[i].id === deposito) return deposito;
  }
  if (vertices.length > 0) return vertices[0].id;
  return '';
}
