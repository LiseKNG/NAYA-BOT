// known-chats.js
// Garde la trace de tous les chats (privés et groupes) où Naya a déjà été
// contactée, avec leur type — pour l'annonce générale et pour cibler
// les groupes lors des mini-jeux automatiques.
// ⚠️ En mémoire — remis à zéro si le bot redémarre.

const knownChats = new Map(); // chatId -> type ("private", "group", "supergroup", "channel")

export function registerChat(chatId, type) {
  knownChats.set(chatId, type);
}

export function getAllKnownChats() {
  return [...knownChats.entries()].map(([id, type]) => ({ id, type }));
}

/** Renvoie uniquement les IDs des groupes/supergroupes connus (pas les chats privés). */
export function getAllKnownGroupChats() {
  return [...knownChats.entries()]
    .filter(([, type]) => type === "group" || type === "supergroup")
    .map(([id]) => id);
}
