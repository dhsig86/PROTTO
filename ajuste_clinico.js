// ajuste_clinico.js — compatível com navegador puro

/**
 * Impactos sintomáticos sobre probabilidades das classes.
 * Os valores seguem critérios clínicos observacionais e podem ser ajustados com base em evidência futura.
 */

const impactoSintomas = {
  exposicao_agua: {
    otite_externa_aguda: 0.30,
    otite_media_aguda: -0.15
  },
  otalgia_tracao: {
    otite_externa_aguda: 0.25
  },
  febre: {
    otite_media_aguda: 0.25,
    obstrucao: -0.10
  },
  plenitude: {
    obstrucao: 0.20,
    otite_media_aguda: 0.10
  },
  hipoacusia: {
    otite_media_cronica: 0.25,
    obstrucao: 0.10
  }
};

/**
 * Ajusta as probabilidades fornecidas por um modelo CNN com base nos sintomas clínicos do paciente.
 * @param {Array} predicoes - Lista de objetos com className e probability
 * @param {Array} sintomasSelecionados - Lista de sintomas ['febre', 'otalgia_tracao', ...]
 * @returns {Array} Lista de objetos com probabilidade original e ajustada
 */
window.ajustarComSintomas = function (predicoes, sintomasSelecionados) {
  const ajustes = {};

  // Equivalência entre nomes das classes (modelo vs. dicionário clínico)
  const aliases = {
    "não é imagem otoscópica": "nao_otoscopica",
    "otite média aguda": "otite_media_aguda",
    "otite média crônica": "otite_media_cronica",
    "otite externa aguda": "otite_externa_aguda",
    "obstrução": "obstrucao",
    "normal": "normal"
  };

  // Acumular ajustes com base nos sintomas
  sintomasSelecionados.forEach(sintoma => {
    const impacto = impactoSintomas[sintoma.toLowerCase()];
    if (!impacto) return;

    for (const [classe, valor] of Object.entries(impacto)) {
      ajustes[classe] = (ajustes[classe] || 0) + valor;
    }
  });

  // Aplicar ajustes nas predições
  const ajustado = predicoes.map(p => {
    const classeBruta = (p.className || p.classe || "").toLowerCase().trim();
    const classe = aliases[classeBruta] || classeBruta;

    const original = p.probability || p.original || 0;
    const delta = ajustes[classe] || 0;

    return {
      classe,
      original,
      ajustado: Math.max(0, Math.min(1, original + delta))
    };
  });

  // Ordenar por probabilidade ajustada decrescente
  ajustado.sort((a, b) => b.ajustado - a.ajustado);

  // DEBUG opcional
  console.log("📋 Sintomas selecionados:", sintomasSelecionados);
  console.log("📊 Predições originais:", predicoes);
  console.log("🔧 Ajustes aplicados:", ajustes);
  console.log("📈 Resultado ajustado:", ajustado);

  return ajustado;
};
