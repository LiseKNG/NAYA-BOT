// points-store.js
// Stocke les points d'activité des membres, par groupe.
// ⚠️ En mémoire — remis à zéro si le bot redémarre.

// chatId -> Map(userId -> { name, daily, total })
const store = new Map();

/** Ajoute des points à un membre dans un groupe donné. */
export function addPoints(chatId, userId, name, points) {
  if (!store.has(chatId)) store.set(chatId, new Map());
  const chatMap = store.get(chatId);
  const entry = chatMap.get(userId) || { name, daily: 0, total: 0 };
  entry.name = name; // garder le prénom à jour au cas où il change
  entry.daily += points;
  entry.total += points;
  chatMap.set(userId, entry);
}

/** Renvoie le classement trié, "daily" (aujourd'hui) ou "total" (depuis le début). */
export function getLeaderboard(chatId, type = "total") {
  const chatMap = store.get(chatId);
  if (!chatMap) return [];
  return [...chatMap.values()]
    .map((e) => ({ name: e.name, points: e[type] }))
    .filter((e) => e.points > 0)
    .sort((a, b) => b.points - a.points);
}

/** Remet à zéro les points du jour pour un groupe (après l'annonce quotidienne). */
export function resetDaily(chatId) {
  const chatMap = store.get(chatId);
  if (!chatMap) return;
  for (const entry of chatMap.values()) entry.daily = 0;
}

/** Liste tous les groupes ayant de l'activité enregistrée. */
export function getAllChatIds() {
  return [...store.keys()];
}
