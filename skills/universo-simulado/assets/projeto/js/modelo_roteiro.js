'use strict';
// MODELO: copie para js/<slug>_roteiro.js. Aqui fica so o roteiro (tempos e textos): quem escreve o roteiro mexe so neste arquivo.
// world, main e audio leem daqui, entao trocar uma frase ou um tempo nao exige tocar no codigo das cenas.
const ROTEIRO = {
  slug: 'modelo',                              // nome dos arquivos e do MP4
  DUR: 12,                                     // duracao total em segundos (videos reais: 60 a 75)
  T: { walk: 3.0, event: 6.0, card: 8.5 },     // inicio de cada trecho; os mesmos nomes valem na camera, nas legendas e no audio
  titulo: 'E se isto fosse\num *modelo*?',      // aparece sobre a primeira imagem; \n quebra linha, *palavra* sai em vermelho
  tituloSai: 2.9,                              // instante em que o titulo termina de sumir
  // Legendas: [inicio, fim, texto]. Uma palavra entre *asteriscos* (vermelha) por legenda; 2,5 a 3,6 s cada, 0,3 a 0,5 s entre elas.
  legendas: [
    [3.3, 5.8, 'Tudo parece *normal*.'],
    [6.2, 8.3, 'Até que o céu muda de *cor*.'],
  ],
  // Cartao final (comeca em T.card, reserve ~4,5 s): fato real que poe a dramatizacao em contexto e pergunta para os comentarios.
  cartao: {
    title: 'TÍTULO DO VÍDEO',
    fact: 'Um fato real e curto que põe a dramatização em contexto.',
    question: 'Uma pergunta para os *comentários*?',
  },
  // Texto do post (vai para o card do Trello).
  post: 'E se isto fosse um modelo? 🌍 Uma frase que puxa a curiosidade, terminando em pergunta?\n\n#universosimulado #esevoce #tema1 #tema2 #tema3',
};
