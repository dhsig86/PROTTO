const { saveFeedback, modoRevisaoErros } = require('../quiz/quiz.js');

describe('fluxo de feedback', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test('saveFeedback registra dados no localStorage', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem');
    saveFeedback('img.png', 'pred', 'resp', 'real');
    expect(spy).toHaveBeenCalled();
    const historico = JSON.parse(localStorage.getItem('feedbacks'));
    expect(historico).toHaveLength(1);
    expect(historico[0]).toMatchObject({
      filename: 'img.png',
      predicted: 'pred',
      user_answer: 'resp',
      real_label: 'real'
    });
  });

  test('modoRevisaoErros avisa quando não há erros', () => {
    const registro = {
      filename: 'img.png',
      predicted: 'a',
      user_answer: 'a',
      real_label: 'a',
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('feedbacks', JSON.stringify([registro]));
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    modoRevisaoErros();
    expect(alertSpy).toHaveBeenCalledWith('Todos os casos anteriores estavam corretos! Parabéns!');
  });
});
