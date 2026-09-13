// known-chats.js
// Garde la trace de tous les chats (privés et groupes) où Naya a déjà été
// contactée, pour pouvoir faire une annonce générale à tout le monde.
// ⚠️ En mémoire — remis à zéro si le bot redémarre.

const knownChats = new Set();

export function registerChat(chatId) {
  knownChats.add(chatId);
}

export function getAllKnownChats() {
  return [...knownChats];
}
