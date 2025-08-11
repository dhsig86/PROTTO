const { ajustarComSintomas } = require('../ajuste_clinico.js');

describe('ajustarComSintomas', () => {
  const basePredicoes = [
    { className: 'otite_media_aguda', probability: 0.5 },
    { className: 'normal', probability: 0.5 },
  ];

  test('mantém probabilidades originais sem sintomas', () => {
    const result = ajustarComSintomas(basePredicoes, []);
    expect(result).toEqual([
      { classe: 'otite_media_aguda', original: 0.5, ajustado: 0.5 },
      { classe: 'normal', original: 0.5, ajustado: 0.5 },
    ]);
  });

  test('ajusta probabilidades com sintoma "febre"', () => {
    const result = ajustarComSintomas(basePredicoes, ['febre']);
    const otite = result.find(r => r.classe === 'otite_media_aguda');
    const normal = result.find(r => r.classe === 'normal');
    expect(otite.ajustado).toBeCloseTo(0.6522, 4);
    expect(normal.ajustado).toBeCloseTo(0.3478, 4);
  });

  test('trata "sem sintomas" corretamente', () => {
    const result = ajustarComSintomas(basePredicoes, ['sem_sintomas']);
    expect(result).toEqual([
      { classe: 'otite_media_aguda', original: 0.5, ajustado: 0.3 },
      { classe: 'normal', original: 0.5, ajustado: 0.7 },
    ]);
  });
});
