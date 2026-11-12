'use strict';
// Roteiro de "E se o Sol explodisse?": tempos e textos. As cenas (sol_world/main/audio) leem daqui.
const ROTEIRO = {
  slug: 'sol',
  DUR: 70,
  T: { boom: 2.0, beach: 4.6, flash: 17.0, run: 24.2, shelter: 31.0, space2: 36.6, moon: 38.0, shock: 41.0, hit: 43.6, drift: 47.4, back: 53.6, after: 56.2, card: 65.2 },
  titulo: 'E se o Sol\n*explodisse*?',
  tituloSai: 4.5,
  legendas: [
    [5.0, 8.2, 'A luz do Sol leva *8 minutos* para chegar aqui.'],
    [8.6, 11.8, 'Por 8 minutos e 20 segundos, nada *muda*.'],
    [12.2, 15.8, 'Você olha para um Sol que não *existe* mais.'],
    [17.6, 20.4, 'Então o céu fica *branco*.'],
    [20.8, 24.0, 'O calor chega junto. Tudo começa a *queimar*.'],
    [24.4, 27.4, 'Corra para baixo da *terra*.'],
    [27.8, 30.8, 'Metros de solo e concreto são o único *escudo*.'],
    [31.6, 34.6, 'Lá fora, o mar começa a *ferver*.'],
    [36.9, 40.4, 'No lado da noite, a Lua vira um *farol*.'],
    [41.2, 44.2, 'Horas depois, chega a onda de *plasma*.'],
    [44.6, 47.2, 'Ela arranca a *atmosfera*.'],
    [47.8, 50.6, 'Sem o Sol, a Terra segue em linha *reta*.'],
    [51.0, 53.6, 'A 107 mil km/h, rumo ao *escuro*.'],
    [56.8, 59.8, 'Em uma semana, a superfície *congela*.'],
    [60.2, 63.0, 'Em um ano: 73 graus *negativos*.'],
    [63.3, 65.1, 'Não há mais *amanhecer*.'],
  ],
  cartao: {
    title: 'SE O SOL EXPLODISSE',
    fact: 'Calma: o Sol não tem massa para explodir. Daqui a uns 5 bilhões de anos, ele vira uma gigante vermelha.',
    question: 'Onde você passaria os últimos *8 minutos*?',
  },
  post: 'E se o Sol explodisse? ☀️ Você teria 8 minutos antes de perceber… onde você passaria esses últimos minutos?\n\n#universosimulado #esevoce #sol #espaco #curiosidades',
};
