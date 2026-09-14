// game-questions.js
// Banque de questions pour le mini-jeu quiz que Naya lance automatiquement.
// Ajoute autant de questions que tu veux, sur le même modèle.

export const quizQuestions = [
  {
    question: "Combien font 7 x 8 ?",
    options: ["54", "56", "58", "64"],
    correctIndex: 1,
  },
  {
    question: "Quelle est la capitale du Japon ?",
    options: ["Séoul", "Pékin", "Tokyo", "Bangkok"],
    correctIndex: 2,
  },
  {
    question: "Combien de continents y a-t-il sur Terre ?",
    options: ["5", "6", "7", "8"],
    correctIndex: 2,
  },
  {
    question: "Quel est le plus grand océan du monde ?",
    options: ["Atlantique", "Indien", "Arctique", "Pacifique"],
    correctIndex: 3,
  },
  {
    question: "En quelle année a eu lieu la première Coupe du Monde de football ?",
    options: ["1930", "1950", "1920", "1945"],
    correctIndex: 0,
  },
];

export function getRandomQuestion() {
  return quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
}
