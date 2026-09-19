// welcome-config.js
// Configuration des messages de bienvenue par groupe, en HTML soigné.
// Ajoute une entrée par groupe où tu veux un message personnalisé.
//
// - match : le username du groupe (@monGroupe) OU son ID numérique (-100...)
// - welcomeText : le message envoyé au nouveau membre, en HTML Telegram. Tu peux utiliser :
//     {name}      -> prénom du nouveau membre
//     {chatTitle} -> nom du groupe
//   Balises HTML supportées par Telegram : <b>gras</b>, <i>italique</i>,
//   <u>souligné</u>, <blockquote>citation encadrée</blockquote>, <a href="...">lien</a>
// - buttons (optionnel) : boutons cliquables sous le message
// - image (optionnel) : URL d'une image envoyée avec le message (bannière de bienvenue)
//
// Si aucune config ne correspond au groupe, un message générique par défaut est utilisé.

export const welcomeConfigs = [
  {
    match: "@remplace_par_le_username_du_groupe",
    image: "https://exemple.com/ta-banniere.jpg",
    welcomeText:
      "🌌 <b>Bienvenue {name} !</b> 🌌\n\n" +
      "<blockquote>Tu viens de rejoindre <b>{chatTitle}</b>.\n" +
      "Installe-toi, fais un tour, et n'hésite pas à te présenter 💫</blockquote>\n\n" +
      "Je suis <b>Naya</b>, l'assistante du groupe — dis mon nom si tu as besoin de moi 🌙",
    buttons: [
      { text: "👥 Chat Group", url: "https://t.me/ton_lien_groupe" },
      { text: "📢 Join our channel", url: "https://t.me/ton_canal" },
    ],
  },
  // Ajoute d'autres groupes ici, sur le même modèle :
  // {
  //   match: "-1001234567890",
  //   welcomeText: "🌌 <b>Bienvenue {name}</b> dans <b>{chatTitle}</b> !",
  //   buttons: [],
  // },
];

const DEFAULT_WELCOME = {
  welcomeText:
    "🌌 <b>Bienvenue {name} !</b> 🌌\n\n" +
    "<blockquote>Content(e) de t'avoir dans <b>{chatTitle}</b> 💫</blockquote>",
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
