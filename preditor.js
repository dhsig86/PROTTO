import { ajustarComSintomas } from './ajuste_clinico.js';

const sintomasSelecionados = ["exposicao_agua", "otalgia_tracao"];
const predicoesModelo = [
  { classe: "otite_media_aguda", probabilidade: 0.56 },
  { classe: "otite_externa_aguda", probabilidade: 0.44 }
];

const predicoesAjustadas = ajustarComSintomas(predicoesModelo, sintomasSelecionados);

console.log(predicoesAjustadas);
/* [
  { classe: 'otite_externa_aguda', original: 0.44, ajustado: 0.99 },
  { classe: 'otite_media_aguda', original: 0.56, ajustado: 0.41 }
] */
