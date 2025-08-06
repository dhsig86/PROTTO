// ajuste_clinico.js — compatível com navegador puro

/**
 * Impactos sintomáticos sobre probabilidades das classes.
 * Os valores seguem critérios clínicos observacionais e podem ser ajustados com base em evidência futura.
 * As chaves são sintomas clínicos (em camelCase).
 * Os valores são objetos com impacto positivo (aumentam probabilidade) ou negativo (reduzem).
 */

const impactoSintomas = {
  exposicao_agua: {
    // História de contato com água: sugere mais otite externa aguda
    otite_externa_aguda: 0.30,
    otite_media_aguda: -0.15
  },
  otalgia_tracao: {
    // Dor à tração do pavilhão: típico de otite externa
    otite_externa_aguda: 0.25
  },
  febre: {
    // Febre: mais comum em otite média aguda
    otite_media_aguda: 0.25,
    obstrucao: -0.10
  },
  plenitude: {
    // Sensação de ouvido tampado: comum em obstrução e otite média
    obstrucao: 0.20,
    otite_media_aguda: 0.10
  },
  hipoacusia: {
    // Perda auditiva: pode ocorrer em casos crônicos e obstrutivos
    otite_media_cronica: 0.25,
    obstrucao: 0.10
  }
};

/**
 * Ajusta a probabilidade das predições fornecidas por um modelo de CNN, com base nos sintomas clínicos.
 * @param {Array} predicoes - Array de objetos [{ className: 'classe', probability: 0.7 }]
 * @param {Array} sintomasSelecionados - Lista de sintomas selecionados ['febre', 'otalgia_tracao']
 * @returns {Array} Lista ordenada das classes com os ajustes clínicos aplicados
 */

window.ajustarComSintomas = function (predicoes, sintomasSelecionados) {
  const ajustes = {};

  // Acumula o impacto sintomático por classe
  sintomasSelecionados.forEach(sintoma => {
    const impacto = impactoSintomas[sintoma];
    if (!impacto) return;

    for (const [classe, valor] of Object.entries(impacto)) {
      ajustes[classe] = (ajustes[classe] || 0) + valor;
    }
  });

  // Aplica os ajustes às probabilidades originais (respeitando limite entre 0 e 1)
  const ajustado = predicoes.map(p => {
    const classe = p.className || p.classe;
    const original = p.probability || p.original;
    const delta = ajustes[classe] || 0;

    return {
      classe,
      original,
      ajustado: Math.max(0, Math.min(1, original + delta))
    };
  });

  // Ordena do maior para o menor valor ajustado
  ajustado.sort((a, b) => b.ajustado - a.ajustado);

  return ajustado;
};
