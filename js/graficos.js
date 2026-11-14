// js/graficos.js — grafo em SVG e gráfico de evolução (Chart.js, carregado via CDN)
import { formatarDecimal, formatarDistancia, formatarRota } from './formato.js';
import { calcularViewBox, espessura, opacidade, iteracaoDaMelhor } from './escala.js';

// ---------- Grafo ----------

const NS = 'http://www.w3.org/2000/svg';
const AVISO_ITERACOES = 3; // por quantas iterações o aviso "Escala ajustada" fica na tela

// Memória do desenho. O SVG só é refeito quando a configuração muda;
// nas demais chamadas só os atributos das arestas são atualizados
// (assim a transição de espessura funciona e o mouse não perde a aresta).
const grafo = {
  parametros: null,   // configuração do último desenho completo
  app: null,          // app mais recente (usado pelos eventos do mouse)
  linhas: new Map(),  // 'i-j' -> linha do feromônio
  rota: null,         // grupo das linhas tracejadas da melhor rota
  realce: null,       // linha que marca a aresta consultada
  arestas: [],        // [{ i, j, chave }]
  largura: 1000,      // largura do viewBox (base de todos os tamanhos)
  fixada: null,       // aresta fixada pelo clique: { i, j } ou null
  passando: null,     // aresta sob o mouse: { i, j } ou null
  ligado: false       // o clique no fundo do SVG já foi ligado?
};

function criar(nome, atributos) {
  const el = document.createElementNS(NS, nome);
  for (const k in atributos) el.setAttribute(k, atributos[k]);
  return el;
}

function desenharGrafo(app) {
  if (app.parametros === null || app.estado === null) return;
  grafo.app = app;
  if (grafo.parametros !== app.parametros) montarGrafo(app);
  atualizarArestas(app);
  atualizarRota(app);
  atualizarConsulta();
  atualizarLegenda(app);
  atualizarMelhorRota(app);
}

// Refaz o SVG inteiro (vértices, arestas, camadas) para a configuração atual.
function montarGrafo(app) {
  const svg = document.getElementById('grafo');
  const vertices = app.parametros.vertices;
  const n = vertices.length;
  const vb = calcularViewBox(vertices);
  grafo.parametros = app.parametros;
  grafo.largura = vb.largura;
  grafo.linhas = new Map();
  grafo.arestas = [];
  grafo.fixada = null;
  grafo.passando = null;
  svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.largura + ' ' + vb.altura);
  svg.innerHTML = '';

  const camadaArestas = criar('g', {});
  const camadaRota = criar('g', {});
  const camadaRealce = criar('g', {});
  const camadaVertices = criar('g', {});
  const camadaToque = criar('g', {});
  svg.append(camadaArestas, camadaRota, camadaRealce, camadaVertices, camadaToque);
  grafo.rota = camadaRota;

  grafo.realce = criar('line', { visibility: 'hidden', 'stroke-linecap': 'round', 'stroke-width': vb.largura * 0.007, opacity: 0.85 });
  grafo.realce.style.stroke = 'var(--texto)';
  grafo.realce.style.pointerEvents = 'none';
  camadaRealce.appendChild(grafo.realce);

  // Arestas: uma por par (i < j), mais uma linha invisível e larga por cima para o mouse.
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const chave = i + '-' + j;
      const a = vertices[i], b = vertices[j];
      const dados = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
      const linha = criar('line', { ...dados, 'stroke-linecap': 'round' });
      linha.style.stroke = 'var(--feromonio)';
      linha.style.transition = 'stroke-width 250ms';
      camadaArestas.appendChild(linha);
      grafo.linhas.set(chave, linha);
      grafo.arestas.push({ i, j, chave });

      const toque = criar('line', { ...dados, stroke: 'transparent', 'stroke-width': vb.largura * 0.025 });
      toque.style.cursor = 'pointer';
      toque.style.pointerEvents = 'stroke';
      toque.addEventListener('mouseenter', () => { grafo.passando = { i, j }; atualizarConsulta(); });
      toque.addEventListener('mouseleave', () => { grafo.passando = null; atualizarConsulta(); });
      toque.addEventListener('click', (e) => {
        e.stopPropagation(); // senão o clique no fundo soltaria a aresta logo em seguida
        grafo.fixada = { i, j };
        atualizarConsulta();
      });
      camadaToque.appendChild(toque);
    }
  }

  // Vértices: o depósito é um quadrado escuro; os demais, círculos claros.
  const raio = vb.largura * 0.03;
  vertices.forEach((v, i) => {
    const ehDeposito = i === app.parametros.deposito;
    let forma;
    if (ehDeposito) {
      forma = criar('rect', { x: v.x - raio, y: v.y - raio, width: 2 * raio, height: 2 * raio, rx: raio * 0.3, fill: '#2a1d10' });
    } else {
      forma = criar('circle', { cx: v.x, cy: v.y, r: raio, fill: '#fff', stroke: '#2a1d10', 'stroke-width': raio * 0.18 });
    }
    const rotulo = criar('text', {
      x: v.x, y: v.y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': vb.largura * 0.03, 'font-weight': 700, fill: ehDeposito ? '#fff' : '#2a1d10'
    });
    rotulo.textContent = v.id;
    rotulo.style.pointerEvents = 'none';
    camadaVertices.append(forma, rotulo);
  });

  // Clicar no fundo solta a aresta fixada (ligado uma única vez).
  if (!grafo.ligado) {
    grafo.ligado = true;
    svg.addEventListener('click', () => {
      grafo.fixada = null;
      atualizarConsulta();
    });
  }
}

// Espessura e opacidade de cada aresta pela escala da execução.
function atualizarArestas(app) {
  const ref = app.escala.ref;
  const fator = grafo.largura / 1000;
  for (const { i, j, chave } of grafo.arestas) {
    const tau = app.estado.tau[i][j];
    const linha = grafo.linhas.get(chave);
    linha.setAttribute('stroke-width', espessura(tau, ref) * fator);
    linha.setAttribute('stroke-opacity', opacidade(tau, ref));
  }
}

// Melhor rota: linhas tracejadas em --destaque por cima das arestas.
function atualizarRota(app) {
  grafo.rota.innerHTML = '';
  const rota = app.estado.melhorRota;
  if (rota === null) return;
  const vertices = app.parametros.vertices;
  const fator = grafo.largura / 1000;
  for (let k = 0; k + 1 < rota.length; k++) {
    const a = vertices[rota[k]], b = vertices[rota[k + 1]];
    const linha = criar('line', {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      'stroke-width': 4 * fator, 'stroke-dasharray': (14 * fator) + ' ' + (9 * fator), 'stroke-linecap': 'round'
    });
    linha.style.stroke = 'var(--destaque)';
    linha.style.pointerEvents = 'none';
    grafo.rota.appendChild(linha);
  }
}

// Caixa de consulta: o mouse tem prioridade; sem mouse, mostra a aresta fixada.
// Sempre lê os valores atuais, então a aresta fixada acompanha as iterações.
function atualizarConsulta() {
  const app = grafo.app;
  const caixa = document.getElementById('consulta');
  const alvo = grafo.passando !== null ? grafo.passando : grafo.fixada;
  caixa.innerHTML = '';
  if (alvo === null) {
    grafo.realce.setAttribute('visibility', 'hidden');
    const vazio = document.createElement('span');
    vazio.className = 'vazio';
    vazio.textContent = 'Passe o mouse numa aresta para ver a distância e o feromônio. Clique para fixar.';
    caixa.appendChild(vazio);
    return;
  }
  const { i, j } = alvo;
  const v = app.parametros.vertices;
  const fixa = grafo.fixada !== null && grafo.fixada.i === i && grafo.fixada.j === j;
  const linhas = [
    ['Aresta ' + v[i].id + '–' + v[j].id + (fixa ? ' (fixada)' : ''), true],
    ['Distância: ' + formatarDecimal(app.estado.dist[i][j], 2), false],
    ['Feromônio: ' + formatarDecimal(app.estado.tau[i][j], 4), false]
  ];
  for (const [texto, negrito] of linhas) {
    const d = document.createElement('div');
    d.textContent = texto;
    if (negrito) d.style.fontWeight = '700'; else d.className = 'mono';
    caixa.appendChild(d);
  }
  grafo.realce.setAttribute('x1', v[i].x);
  grafo.realce.setAttribute('y1', v[i].y);
  grafo.realce.setAttribute('x2', v[j].x);
  grafo.realce.setAttribute('y2', v[j].y);
  grafo.realce.setAttribute('visibility', 'visible');
}

function atualizarLegenda(app) {
  let texto = 'Espessura proporcional ao maior feromônio da execução (máx.: ' + formatarDecimal(app.escala.ref, 4) + ')';
  const m = app.escala.mudouEm;
  if (m !== null && app.estado.iteracao - m < AVISO_ITERACOES) {
    texto += '. Escala ajustada na iteração ' + m;
  }
  document.getElementById('legenda-escala').textContent = texto;
}

function atualizarMelhorRota(app) {
  const e = app.estado;
  const rota = document.getElementById('melhor-rota');
  const dist = document.getElementById('melhor-dist');
  if (e.melhorRota === null) {
    rota.textContent = 'ainda não calculada';
    dist.textContent = '';
    return;
  }
  rota.textContent = formatarRota(e.melhorRota, app.parametros.vertices);
  dist.textContent = 'distância ' + formatarDistancia(e.melhorComprimento) +
    ', achada na iteração ' + iteracaoDaMelhor(e.historico);
}

// ---------- Gráfico do histórico (Chart.js, carregado como global) ----------

let grafico = null;

// Cria o gráfico uma vez; depois só troca os dados. Sem Chart (CDN fora do ar), não faz nada.
function desenharHistorico(historico) {
  if (typeof Chart === 'undefined') return;
  const rotulos = historico.map((h) => h.iteracao);
  const serie = (campo) => historico.map((h) => h[campo]); // null na iteração 0: Chart.js pula o ponto
  if (grafico === null) {
    const tela = document.getElementById('grafico-historico');
    if (!tela) return;
    const base = { pointRadius: 2, tension: 0, spanGaps: false };
    grafico = new Chart(tela, {
      type: 'line',
      data: {
        labels: rotulos,
        datasets: [
          { ...base, label: 'Melhor acumulada', data: serie('melhorAcumulado'), borderColor: '#d9480f', backgroundColor: '#d9480f', borderWidth: 3 },
          { ...base, label: 'Menor da iteração', data: serie('menorIteracao'), borderColor: '#6e5f4c', backgroundColor: '#6e5f4c', borderWidth: 2, borderDash: [6, 4] },
          { ...base, label: 'Média', data: serie('mediaIteracao'), borderColor: '#b07a2a', backgroundColor: '#b07a2a', borderWidth: 2 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: true } },
        scales: {
          x: { title: { display: true, text: 'iteração' } },
          y: { title: { display: true, text: 'distância' } }
        }
      }
    });
    return;
  }
  grafico.data.labels = rotulos;
  grafico.data.datasets[0].data = serie('melhorAcumulado');
  grafico.data.datasets[1].data = serie('menorIteracao');
  grafico.data.datasets[2].data = serie('mediaIteracao');
  grafico.update('none');
}

export { desenharGrafo, desenharHistorico };
