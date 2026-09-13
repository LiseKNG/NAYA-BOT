// welcome-config.js
// Configuration des messages de bienvenue par groupe.
// Ajoute une entrée par groupe où tu veux un message personnalisé.
//
// - match : le username du groupe (@monGroupe) OU son ID numérique (-100...)
// - welcomeText : le message envoyé au nouveau membre. Tu peux utiliser :
//     {name}      -> prénom du nouveau membre
//     {chatTitle} -> nom du groupe
// - buttons (optionnel) : boutons cliquables sous le message
//
// Si aucune config ne correspond au groupe, un message générique par défaut est utilisé.

export const welcomeConfigs = [
  {
    match: "@remplace_par_le_username_du_groupe",
    welcomeText: "Bienvenue {name} dans {chatTitle} ! 🌙 Je suis Naya, contente de t'avoir parmi nous 💕",
    buttons: [
      { text: "📜 Règlement", url: "https://t.me/ton_lien_reglement" },
      { text: "📢 Canal officiel", url: "https://t.me/ton_canal" },
    ],
  },
  // Ajoute d'autres groupes ici, sur le même modèle :
  // {
  //   match: "-1001234567890",
  //   welcomeText: "Salut {name}, bienvenue dans {chatTitle} !",
  //   buttons: [],
  // },
];

const DEFAULT_WELCOME = {
  welcomeText: "Bienvenue {name} dans {chatTitle} ! 🌙",
  buttons: [],
};

/** Trouve la config de bienvenue pour ce chat (par username ou ID), sinon renvoie le défaut. */
export function getWelcomeConfig(chat) {
  const byUsername = chat.username ? `@${chat.username}` : null;
  const byId = String(chat.id);

  const found = welcomeConfigs.find(
    (c) => c.match === byUsername || c.match === byId
  );

  return found || DEFAULT_WELCOME;
}

/** Remplace {name} et {chatTitle} dans le template. */
export function formatWelcome(template, { name, chatTitle }) {
  return template.replace(/\{name\}/g, name).replace(/\{chatTitle\}/g, chatTitle);
}
