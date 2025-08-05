// ajuste_clinico.js

// Tabela de impacto clínico baseado em guidelines
const impactoSintomas = {
  "exposicao_agua": {
    "otite_externa_aguda": 0.30,
    "otite_media_aguda": -0.15
  },
  "otalgia_tracao": {
    "otite_externa_aguda": 0.25
  },
  "febre": {
    "otite_media_aguda": 0.25,
    "obstrucao": -0.10
  },
  "plenitude": {
    "obstrucao": 0.20,
    "otite_media_aguda": 0.10
  },
  "hipoacusia": {
    "otite_media_cronica": 0.25,
    "obstrucao": 0.10
  }
};

// Função principal para ajustar predição com base nos sintomas
export function ajustarComSintomas(predicoes, sintomasSelecionados) {
  const ajustes = {};

  // Calcular impacto por classe
  sintomasSelecionados.forEach(sintoma => {
    const impacto = impactoSintomas[sintoma];
    if (!impacto) return;

    for (const [classe, valor] of Object.entries(impacto)) {
      ajustes[classe] = (ajustes[classe] || 0) + valor;
    }
  });

  // Aplicar os ajustes
  const ajustado = predicoes.map(p => ({
    classe: p.classe,
    original: p.probabilidade,
    ajustado: Math.min(1, Math.max(0, p.probabilidade + (ajustes[p.classe] || 0)))
  }));

  // Ordenar do mais provável
  ajustado.sort((a, b) => b.ajustado - a.ajustado);

  return ajustado;
}
