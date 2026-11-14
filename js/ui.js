// js/ui.js — formulário, estado da execução e laço de Executar.
// Único arquivo (junto com graficos.js) que mexe no DOM. Não faz cálculos do algoritmo.
import { criarRng } from './prng.js';
import * as nucleo from './nucleo.js';
import { CENARIO_INICIAL, INSTANCIA_TESTE, lerConfiguracao, proximoId, depositoValido } from './configuracao.js';
import { botoesPorEstado, textoStatus, modoAposEdicao } from './estados.js';

const MIN_VERTICES = 4;
const MAX_VERTICES = 12;
const CAMPOS = ['formigas', 'iteracoes', 'alfa', 'beta', 'rho', 'tau0', 'q', 'semente'];

// Tudo o que muda durante o uso fica neste objeto.
// modo: 'pronto' | 'executando' | 'pausado' | 'concluido' | 'desatualizado' | 'invalido'
const app = {
  modo: 'pronto',
  entrada: structuredClone(CENARIO_INICIAL), // textos do formulário
  parametros: null,                          // números da última configuração aplicada
  rng: null,
  estado: null,
  eventosPorIteracao: [],
  temporizador: null
};

// Ganchos das tarefas seguintes (grafo, métricas, histórico, logs). Por enquanto não fazem nada.
function desenharGrafo(app) {}
function atualizarMetricasEHistorico(app) {}
function registrarEventos(app, eventos) {}
function limparLogs() {}

const $ = (id) => document.getElementById(id);

// ---------- Tabela de vértices e depósito ----------

// Refaz a tabela inteira a partir de app.entrada (ao adicionar, remover ou carregar).
function montarTabela() {
  const corpo = $('tvert');
  corpo.innerHTML = '';
  app.entrada.vertices.forEach((v, i) => {
    const tr = document.createElement('tr');
    for (const coluna of ['id', 'x', 'y']) {
      const td = document.createElement('td');
      const inp = document.createElement('input');
      inp.type = 'text';
      if (coluna === 'id') inp.className = 'id';
      else inp.inputMode = 'decimal';
      inp.value = v[coluna];
      inp.setAttribute('aria-label', 'Vértice ' + (i + 1) + ': ' + (coluna === 'id' ? 'nome' : coluna));
      inp.addEventListener('input', () => aoEditarVertice(i, coluna, inp.value));
      td.appendChild(inp);
      tr.appendChild(td);
    }
    const tdx = document.createElement('td');
    const bx = document.createElement('button');
    bx.type = 'button';
    bx.className = 'x';
    bx.textContent = '×';
    bx.setAttribute('aria-label', 'Remover vértice ' + (i + 1));
    bx.disabled = app.entrada.vertices.length <= MIN_VERTICES;
    bx.addEventListener('click', () => removerVertice(i));
    tdx.appendChild(bx);
    tr.appendChild(tdx);
    corpo.appendChild(tr);
  });
  $('btn-add-vertice').disabled = app.entrada.vertices.length >= MAX_VERTICES;
  montarSelecaoDeposito();
}

// Ids sem espaços nas pontas (proximoId e depositoValido comparam sem aparar).
function idsAparados() {
  return app.entrada.vertices.map((v) => ({ id: v.id.trim() }));
}

// Refaz as opções do depósito. Se o escolhido sumiu, passa para o primeiro vértice.
function montarSelecaoDeposito() {
  const ids = idsAparados();
  app.entrada.deposito = depositoValido(ids, app.entrada.deposito);
  const sel = $('sel-deposito');
  sel.innerHTML = '';
  for (const { id } of ids) {
    if (id === '') continue;
    const op = document.createElement('option');
    op.value = id;
    op.textContent = id;
    sel.appendChild(op);
  }
  sel.value = app.entrada.deposito;
}

function aoEditarVertice(linha, coluna, valor) {
  const v = app.entrada.vertices[linha];
  // Se o usuário renomeia o depósito, o depósito acompanha o novo nome.
  const eraDeposito = coluna === 'id' && v.id.trim() === app.entrada.deposito;
  v[coluna] = valor;
  if (eraDeposito) app.entrada.deposito = valor.trim();
  if (coluna === 'id') montarSelecaoDeposito();
  aoEditar();
}

function removerVertice(linha) {
  if (app.entrada.vertices.length <= MIN_VERTICES) return;
  app.entrada.vertices.splice(linha, 1);
  montarTabela();
  aoEditar();
}

// Primeira posição livre numa grade de passo 50 (de 50 a 950).
function posicaoLivre() {
  const usadas = app.entrada.vertices.map((v) => Number(v.x.replace(',', '.')) + ',' + Number(v.y.replace(',', '.')));
  for (let y = 50; y <= 950; y += 50) {
    for (let x = 50; x <= 950; x += 50) {
      if (!usadas.includes(x + ',' + y)) return { x: String(x), y: String(y) };
    }
  }
  return { x: '0', y: '0' };
}

function adicionarVertice() {
  if (app.entrada.vertices.length >= MAX_VERTICES) return;
  const pos = posicaoLivre();
  app.entrada.vertices.push({ id: proximoId(idsAparados()), x: pos.x, y: pos.y });
  montarTabela();
  aoEditar();
}

// Copia os textos de app.entrada para os campos da tela.
function preencherTela() {
  for (const c of CAMPOS) $('c-' + c).value = app.entrada.campos[c];
  montarTabela();
}

function carregarInstanciaTeste() {
  app.entrada = structuredClone(INSTANCIA_TESTE);
  preencherTela();
  aoEditar();
}

// ---------- Erros na tela ----------

function pintarErros(r) {
  for (const c of CAMPOS) {
    const campo = $('c-' + c).closest('.campo');
    const msg = r.errosCampos[c] || '';
    campo.classList.toggle('invalido', msg !== '');
    campo.querySelector('.erro').textContent = msg;
    $('c-' + c).setAttribute('aria-invalid', msg !== '' ? 'true' : 'false');
  }
  // Células da tabela: borda vermelha e a mensagem como dica ao passar o mouse.
  const linhas = $('tvert').rows;
  for (const linha of linhas) {
    linha.querySelectorAll('input').forEach((inp) => {
      inp.classList.remove('invalido');
      inp.removeAttribute('title');
      inp.removeAttribute('aria-invalid');
    });
  }
  const indice = { id: 0, x: 1, y: 2 };
  for (const e of r.errosVertices) {
    const inp = linhas[e.linha].querySelectorAll('input')[indice[e.coluna]];
    inp.classList.add('invalido');
    inp.title = e.mensagem;
    inp.setAttribute('aria-invalid', 'true');
  }
  // Resumo no topo dos parâmetros: contagem + erros gerais.
  const total = Object.keys(r.errosCampos).length + r.errosVertices.length;
  const partes = [];
  if (total > 0) partes.push(total === 1 ? '1 campo inválido' : total + ' campos inválidos');
  for (const g of r.errosGerais) partes.push(g);
  const resumo = $('resumo-erros');
  resumo.textContent = partes.join(' · ');
  resumo.hidden = partes.length === 0;
}

// ---------- Execução ----------

// Lê o formulário, mostra os erros e decide o novo modo.
function aoEditar() {
  // Editar durante a execução pausa antes de qualquer coisa.
  if (app.modo === 'executando') {
    pararTemporizador();
    app.modo = 'pausado';
  }
  const r = lerConfiguracao(app.entrada);
  pintarErros(r);
  const novo = modoAposEdicao(app.modo, app.estado.iteracao, r.parametros !== null);
  if (novo === 'pronto') {
    reiniciar(); // iteração 0: a nova configuração já vale
  } else {
    app.modo = novo;
    renderizar();
  }
}

function pararTemporizador() {
  if (app.temporizador !== null) {
    clearTimeout(app.temporizador);
    app.temporizador = null;
  }
}

// Volta à iteração 0 com a configuração atual da tela.
function reiniciar() {
  pararTemporizador();
  const r = lerConfiguracao(app.entrada);
  pintarErros(r);
  if (r.parametros === null) {
    app.modo = 'invalido';
    renderizar();
    return;
  }
  app.parametros = r.parametros;
  app.estado = nucleo.inicializar(app.parametros);
  app.rng = criarRng(app.parametros.semente);
  app.eventosPorIteracao = [];
  limparLogs();
  app.modo = 'pronto';
  renderizar();
}

// Intervalo do laço: velocidade 1 -> 1.000 ms, 10 -> 30 ms.
function intervaloMs() {
  const v = Number($('velocidade').value);
  return Math.round(1000 * Math.pow(30 / 1000, (v - 1) / 9));
}

// Uma iteração do algoritmo; vai para 'concluido' ao chegar no total.
function avancarUma() {
  const r = nucleo.passo(app.estado, app.parametros, app.rng);
  app.eventosPorIteracao.push(r.eventos);
  registrarEventos(app, r.eventos);
  if (app.estado.iteracao >= app.parametros.iteracoes) {
    pararTemporizador();
    app.modo = 'concluido';
  }
  renderizar();
}

// Passo do laço: avança uma iteração e agenda a próxima com a velocidade atual.
function volta() {
  app.temporizador = null;
  avancarUma();
  if (app.modo === 'executando') app.temporizador = setTimeout(volta, intervaloMs());
}

function executar() {
  app.modo = 'executando';
  volta();
}

function pausar() {
  pararTemporizador();
  app.modo = 'pausado';
  renderizar();
}

function avancar() {
  app.modo = 'pausado';
  avancarUma(); // pode virar 'concluido'
}

// ---------- Tela ----------

function renderizar() {
  const b = botoesPorEstado(app.modo);
  $('btn-executar').disabled = !b.executar;
  $('btn-pausar').disabled = !b.pausar;
  $('btn-avancar').disabled = !b.avancar;
  $('btn-reiniciar').disabled = !b.reiniciar;
  const total = app.parametros ? app.parametros.iteracoes : 0;
  const status = $('status');
  status.textContent = textoStatus(app.modo, app.estado.iteracao, total);
  status.className = 'status ' + app.modo;
  desenharGrafo(app);
  atualizarMetricasEHistorico(app);
}

function atualizarTextoVelocidade() {
  $('vel-texto').textContent = intervaloMs() + ' ms por iteração';
}

// ---------- Início ----------

for (const c of CAMPOS) {
  $('c-' + c).addEventListener('input', (e) => {
    app.entrada.campos[c] = e.target.value;
    aoEditar();
  });
}
$('sel-deposito').addEventListener('change', (e) => {
  app.entrada.deposito = e.target.value;
  aoEditar();
});
$('btn-add-vertice').addEventListener('click', adicionarVertice);
$('btn-instancia-teste').addEventListener('click', carregarInstanciaTeste);
$('btn-executar').addEventListener('click', executar);
$('btn-pausar').addEventListener('click', pausar);
$('btn-avancar').addEventListener('click', avancar);
$('btn-reiniciar').addEventListener('click', reiniciar);
$('velocidade').addEventListener('input', atualizarTextoVelocidade);

atualizarTextoVelocidade();
preencherTela();
reiniciar();
