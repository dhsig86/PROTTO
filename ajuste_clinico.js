// ajuste_clinico.js

const impactoSintomas = {
  febre: { otite_media_aguda: 0.25, otite_media_cronica: -0.15, otite_externa_aguda: -0.10, obstrucao: -0.05, normal: -0.10 },
  otalgia: { otite_media_aguda: 0.20, otite_media_cronica: -0.20, otite_externa_aguda: 0.30, obstrucao: 0.10, normal: -0.20 },
  otalgia_tracao: { otite_media_aguda: -0.25, otite_media_cronica: -0.20, otite_externa_aguda: 0.30, obstrucao: -0.10, normal: -0.20 },
  exposicao_agua: { otite_media_aguda: -0.15, otite_media_cronica: -0.10, otite_externa_aguda: 0.25, obstrucao: -0.05, normal: -0.05 },
  otorreia: { otite_media_aguda: 0.10, otite_media_cronica: 0.30, otite_externa_aguda: 0.20, obstrucao: -0.20, normal: -0.30 },
  prurido: { otite_media_aguda: -0.10, otite_media_cronica: 0.10, otite_externa_aguda: 0.20, obstrucao: 0.10, normal: -0.10 },
  hipoacusia: { otite_media_aguda: 0.10, otite_media_cronica: 0.25, otite_externa_aguda: 0.10, obstrucao: 0.30, normal: -0.30 },
  plenitude: { otite_media_aguda: 0.15, otite_media_cronica: 0.15, otite_externa_aguda: 0.05, obstrucao: 0.25, normal: -0.20 },
  inicio_agudo: { otite_media_aguda: 0.20, otite_media_cronica: -0.25, otite_externa_aguda: 0.20, obstrucao: 0.10 },
  duracao_cronica: { otite_media_aguda: -0.25, otite_media_cronica: 0.30, otite_externa_aguda: -0.20 },
  tinnitus: { otite_media_cronica: 0.10, obstrucao: 0.10 },
  vertigem: { otite_media_aguda: 0.05, otite_media_cronica: 0.05 },
  tosse: { obstrucao: 0.05 }
};

window.ajustarComSintomas = function (predicoes, sintomasSelecionados) {
  const ajustes = {};
  const aliases = {
    "não é imagem otoscópica": "nao_otoscopica",
    "nao eh imagem otoscopica": "nao_otoscopica",
    "otite média aguda": "otite_media_aguda",
    "otite media aguda": "otite_media_aguda",
    "otite média crônica": "otite_media_cronica",
    "otite media cronica": "otite_media_cronica",
    "otite externa aguda": "otite_externa_aguda",
    "otite externa": "otite_externa_aguda",
    "obstrução": "obstrucao",
    "obstrucao": "obstrucao",
    "normal": "normal"
  };

  sintomasSelecionados.forEach(sintoma => {
    const impacto = impactoSintomas[sintoma.toLowerCase()];
    if (!impacto) return;
    for (const [classe, valor] of Object.entries(impacto)) {
      ajustes[classe] = (ajustes[classe] || 0) + valor;
    }
  });

  let ajustado = predicoes.map(p => {
    const classeBruta = (p.className || p.classe || "").toLowerCase().trim();
    const classe = aliases[classeBruta] || classeBruta;
    const original = p.probability || p.original || 0;
    const delta = ajustes[classe] || 0;
    const bruto = Math.max(0, original + delta);
    return { classe, original, bruto };
  });

  const somaBruto = ajustado.reduce((acc, curr) => acc + curr.bruto, 0) || 1;

  return ajustado.map(p => ({
    classe: p.classe,
    original: p.original,
    ajustado: +(p.bruto / somaBruto).toFixed(4)
  }));
};
