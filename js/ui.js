// js/ui.js — eventos, estado da execução, logs e laço de Executar
// Único arquivo que acessa o DOM junto com graficos.js. Não faz cálculos do algoritmo.
import { criarRng } from './prng.js';
import * as nucleo from './nucleo.js';
import { lerNumero, lerTexto } from './validacao.js';
import { formatarDecimal } from './formato.js';

// Estados: 'pronto' | 'executando' | 'pausado' | 'concluido' | 'desatualizado' | 'invalido'
const app = {
  modo: 'pronto',
  parametros: null,
  rng: null,
  estado: null,
  temporizador: null,
};

// TODO: cenário inicial com 5 a 12 vértices + botão "Carregar instância de teste (6.1)"
// TODO: tabela de vértices editável (id, x, y; 4 a 12; sem duplicatas), seleção do depósito, parâmetros
// TODO: Executar / Pausar / Avançar uma iteração / Reiniciar conforme a tabela de estados do padrão
// TODO: métricas, melhor rota, histórico por iteração, log de construção de rota e de feromônio
