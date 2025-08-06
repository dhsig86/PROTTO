// ajuste_clinico.js — compatível com navegador puro

/**
 * Impactos sintomáticos sobre probabilidades das classes.
 * Os valores seguem critérios clínicos observacionais e podem ser ajustados com base em evidência futura.
 */

const impactoSintomas = {
  // febre: temperatura elevada (≥38 °C) ou relato de febre recente
  febre: {
    otite_media_aguda: 0.25,
    otite_media_cronica: -0.15,
    otite_externa_aguda: -0.10,
    obstrucao: -0.05,
    normal: -0.10
  },
  // otalgia espontânea (dor de ouvido sem manipulação)
  otalgia: {
    otite_media_aguda: 0.20,
    otite_media_cronica: -0.20,
    otite_externa_aguda: 0.30,
    obstrucao: 0.10,
    normal: -0.20
  },
  // otalgia ao tracionar o pavilhão auricular ou pressionar o tragus
  otalgia_tracao: {
    otite_media_aguda: -0.25,
    otite_media_cronica: -0.20,
    otite_externa_aguda: 0.30,
    obstrucao: -0.10,
    normal: -0.20
  },
  // exposição recente à água ou permanência prolongada em ambiente úmido
  exposicao_agua: {
    otite_media_aguda: -0.15,
    otite_media_cronica: -0.10,
    otite_externa_aguda: 0.25,
    obstrucao: -0.05,
    normal: -0.05
  },
  // presença de secreção (otorréia) no conduto auditivo
  otorreia: {
    otite_media_aguda: 0.10,
    otite_media_cronica: 0.30,
    otite_externa_aguda: 0.20,
    obstrucao: -0.20,
    normal: -0.30
  },
  // prurido ou sensação de coceira no canal auditivo
  prurido: {
    otite_media_aguda: -0.10,
    otite_media_cronica: 0.10,
    otite_externa_aguda: 0.20,
    obstrucao: 0.10,
    normal: -0.10
  },
  // perda auditiva percebida (hipoacusia)
  hipoacusia: {
    otite_media_aguda: 0.10,
    otite_media_cronica: 0.25,
    otite_externa_aguda: 0.10,
    obstrucao: 0.30,
    normal: -0.30
  },
  // sensação de pressão ou plenitude aural
  plenitude: {
    otite_media_aguda: 0.15,
    otite_media_cronica: 0.15,
    otite_externa_aguda: 0.05,
    obstrucao: 0.25,
    normal: -0.20
  },
  // início súbito (evolução aguda) dos sintomas
  inicio_agudo: {
    otite_media_aguda: 0.20,
    otite_media_cronica: -0.25,
    otite_externa_aguda: 0.20,
    obstrucao: 0.10
  },
  // duração prolongada (> 6 semanas) dos sintomas
  duracao_cronica: {
    otite_media_aguda: -0.25,
    otite_media_cronica: 0.30,
    otite_externa_aguda: -0.20
  },
  // percepção de zumbido (tinnitus)
  tinnitus: {
    otite_media_cronica: 0.10,
    obstrucao: 0.10
  },
  // vertigem ou tontura associada
  vertigem: {
    otite_media_aguda: 0.05,
    otite_media_cronica: 0.05
  },
  // tosse reflexa associada à impactação de cerume
  tosse: {
    obstrucao: 0.05
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
    // equivalências para normalizar os rótulos recebidos do modelo
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

  // Acumular ajustes com base nos sintomas
  sintomasSelecionados.forEach(sintoma => {
    const impacto = impactoSintomas[sintoma.toLowerCase()];
    if (!impacto) return;

    for (const [classe, valor] of Object.entries(impacto)) {
      ajustes[classe] = (ajustes[classe] || 0) + valor;
    }
  });

  // Aplicar ajustes e calcular soma antes da normalização
let ajustado = predicoes.map(p => {
  const classeBruta = (p.className || p.classe || "").toLowerCase().trim();
  const classe = aliases[classeBruta] || classeBruta;

  const original = p.probability || p.original || 0;
  const delta = ajustes[classe] || 0;
  const bruto = Math.max(0, original + delta);

  return { classe, original, bruto };
});

// Normalizar os valores brutos
const somaBruto = ajustado.reduce((acc, curr) => acc + curr.bruto, 0) || 1;

ajustado = ajustado.map(p => ({
  classe: p.classe,
  original: p.original,
  ajustado: +(p.bruto / somaBruto).toFixed(4) // normalizado e arredondado
}));
  // DEBUG opcional
  console.log("🔧 Sintomas selecionados:", sintomasSelecionados);
  console.log("📊 Predições originais:", predicoes);
  console.log("🔧 Ajustes aplicados:", ajustes);
  console.log("📈 Resultado ajustado:", ajustado);

  return ajustado;
}

/**
 * Referências bibliográficas por sintoma.
 *
 * Cada chave corresponde a um sintoma e contém um array de identificadores
 * de citações (no formato ID†Lx-Ly) que documentam as evidências usadas para
 * atribuir os pesos. Consulte o relatório científico para detalhes.
 */
const referenciasSintomas = {
  febre: [
    "389071347389728†L360-L379",
    "931942536393632†L284-L289",
    "714915922470337†L371-L377",
    "87225251876959†L101-L110",
    "712966022426662†L137-L140"
  ],
  otalgia: [
    "389071347389728†L360-L379",
    "931942536393632†L284-L289",
    "714915922470337†L346-L373",
    "87225251876959†L103-L107",
    "395440648886554†L188-L209"
  ],
  otalgia_tracao: [
    "714915922470337†L346-L373",
    "87225251876959†L103-L107",
    "395440648886554†L223-L226"
  ],
  exposicao_agua: [
    "918166407141939†L114-L146",
    "87225251876959†L114-L118"
  ],
  otorreia: [
    "513747255469342†L130-L144",
    "714915922470337†L346-L373",
    "87225251876959†L103-L107",
    "712966022426662†L122-L124",
    "435775635786458†L53-L57"
  ],
  prurido: [
    "714915922470337†L346-L373",
    "87225251876959†L107-L110",
    "146266313050777†L69-L71"
  ],
  hipoacusia: [
    "513747255469342†L130-L144",
    "513747255469342†L203-L206",
    "714915922470337†L346-L373",
    "146266313050777†L69-L71",
    "169232636225916†L82-L115"
  ],
  plenitude: [
    "146266313050777†L69-L71",
    "87225251876959†L103-L104",
    "513747255469342†L203-L206"
  ],
  inicio_agudo: [
    "435775635786458†L53-L57",
    "714915922470337†L346-L373",
    "513747255469342†L130-L144"
  ],
  duracao_cronica: [
    "513747255469342†L130-L144"
  ],
  tinnitus: [
    "513747255469342†L203-L206",
    "146266313050777†L69-L71"
  ],
  vertigem: [
    "654366694287266†L251-L253"
  ],
  tosse: [
    "146266313050777†L69-L71"
  ]
};

