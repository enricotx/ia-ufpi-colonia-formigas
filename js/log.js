// js/log.js — textos do log da execução (funções puras, sem DOM).
import { formatarDecimal, formatarDistancia, formatarRota } from './formato.js';

// Acima disso (em caracteres) o "Copiar log" baixa um arquivo em vez de copiar.
export const LIMITE_COPIA = 1_000_000;

export function deveBaixar(texto) {
  return texto.length > LIMITE_COPIA;
}

// Procura o primeiro evento de um tipo na lista da iteração.
function acharEvento(eventos, tipo) {
  for (const ev of eventos) {
    if (ev.tipo === tipo) return ev;
  }
  return null;
}

// "Iteração 12 — menor 2.731,40 · média 2.958,12"
export function resumoIteracao(eventos) {
  const r = acharEvento(eventos, 'resumo').registro;
  return 'Iteração ' + r.iteracao + ' — menor ' + formatarDistancia(r.menorIteracao) +
    ' · média ' + formatarDistancia(r.mediaIteracao);
}

// Uma linha por passo de cada formiga, mais uma com a rota e o comprimento.
export function textoConstrucao(eventos, vertices) {
  const linhas = [];
  for (const ev of eventos) {
    if (ev.tipo !== 'formiga') continue;
    const prefixo = 'Formiga ' + ev.formiga + ' — ';
    const deposito = vertices[ev.rota[0]].id;
    for (const e of ev.escolhas) {
      if (e.retorno) {
        linhas.push(prefixo + 'volta ao depósito ' + deposito);
        continue;
      }
      const partes = [];
      for (const c of e.candidatos) {
        partes.push(vertices[c.vertice].id + ' ' + formatarDecimal(c.probabilidade, 3));
      }
      linhas.push(prefixo + 'em ' + vertices[e.atual].id + ': ' + partes.join(' · ') +
        ' → escolheu ' + vertices[e.escolhido].id);
    }
    linhas.push(prefixo + 'rota ' + formatarRota(ev.rota, vertices) +
      ', comprimento ' + formatarDistancia(ev.comprimento));
  }
  return linhas;
}

// Uma linha por aresta: "A–B: anterior ...; após evaporação ...; depósito ...; final ..."
export function textoFeromonio(eventos, vertices) {
  const linhas = [];
  for (const ev of eventos) {
    if (ev.tipo !== 'feromonio') continue;
    for (const d of ev.detalhes) {
      linhas.push(vertices[d.i].id + '–' + vertices[d.j].id +
        ': anterior ' + formatarDecimal(d.anterior, 4) +
        '; após evaporação ' + formatarDecimal(d.aposEvaporacao, 4) +
        '; depósito ' + formatarDecimal(d.deposito, 4) +
        '; final ' + formatarDecimal(d.final, 4));
    }
  }
  return linhas;
}

// Texto de todas as iterações: resumo, construção e feromônio.
export function textoExecucao(eventosPorIteracao, vertices) {
  const partes = [];
  for (const eventos of eventosPorIteracao) {
    partes.push(resumoIteracao(eventos));
    partes.push('Construção das rotas:');
    for (const l of textoConstrucao(eventos, vertices)) partes.push('  ' + l);
    partes.push('Feromônio por aresta:');
    for (const l of textoFeromonio(eventos, vertices)) partes.push('  ' + l);
    partes.push('');
  }
  return partes.join('\n');
}
