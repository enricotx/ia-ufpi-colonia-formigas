// js/estados.js — estados da execução (módulo puro, sem DOM).
// Modos: 'pronto' | 'executando' | 'pausado' | 'concluido' | 'desatualizado' | 'invalido'

// Quais botões ficam habilitados em cada modo (tabela da seção 6.3 do design).
export function botoesPorEstado(modo) {
  const tabela = {
    pronto:        { executar: true,  pausar: false, avancar: true,  reiniciar: true },
    executando:    { executar: false, pausar: true,  avancar: false, reiniciar: true },
    pausado:       { executar: true,  pausar: false, avancar: true,  reiniciar: true },
    concluido:     { executar: false, pausar: false, avancar: false, reiniciar: true },
    desatualizado: { executar: false, pausar: false, avancar: false, reiniciar: true },
    invalido:      { executar: false, pausar: false, avancar: false, reiniciar: false }
  };
  return Object.assign({}, tabela[modo]);
}

// Texto mostrado na etiqueta de status.
export function textoStatus(modo, iteracao, total) {
  if (modo === 'executando') return 'Executando… iteração ' + iteracao + ' de ' + total;
  if (modo === 'pausado') return 'Pausado na iteração ' + iteracao;
  if (modo === 'concluido') return 'Concluído: ' + total + ' iterações';
  if (modo === 'desatualizado') return 'Configuração alterada — clique em Reiniciar';
  if (modo === 'invalido') return 'Corrija os campos destacados';
  return 'Pronto para executar';
}

// Novo modo depois de o usuário editar a configuração.
export function modoAposEdicao(modoAtual, iteracao, valida) {
  if (!valida) return 'invalido';
  if (iteracao === 0) return 'pronto';
  return 'desatualizado';
}
