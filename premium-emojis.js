// premium-emojis.js
// Configuration des emojis premium Telegram utilisés par Naya.
//
// Un emoji premium a besoin d'un "custom_emoji_id" fourni par Telegram.
// Pour récupérer cet ID :
//   1. Un compte Telegram Premium doit envoyer l'emoji premium dans un chat
//   2. Transfère ce message vers @JsonDumpBot (ou @RawDataBot)
//   3. Dans le JSON renvoyé, cherche "custom_emoji_id" — c'est ce nombre qu'il faut coller ici
//
// "fallback" est l'emoji normal affiché si jamais l'entité premium ne s'affiche pas
// (par exemple pour les personnes sans Telegram Premium, dans certains clients).

export const premiumEmojis = {
  sparkle: { fallback: "✨", customEmojiId: "5843930170217469833" },
  heart: { fallback: "💕", customEmojiId: "5870615549351827005" },
  moon: { fallback: "🌙", customEmojiId: "5226662903569989373" },
  wave: { fallback: "👋", customEmojiId: "5199885118214255386" },
};

/**
 * Transforme un texte contenant des raccourcis :sparkle:, :heart:, etc.
 * en { text, entities } prêt à envoyer via l'API Telegram avec les emojis premium.
 * Les raccourcis inconnus ou sans ID configuré sont simplement laissés en emoji normal.
 */
export function renderWithPremiumEmojis(rawText) {
  const pattern = /:([a-z_]+):/g;
  let text = "";
  const entities = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(rawText)) !== null) {
    const shortcode = match[1];
    const config = premiumEmojis[shortcode];

    // Texte avant le raccourci, ajouté tel quel
    text += rawText.slice(lastIndex, match.index);

    if (config && config.customEmojiId && config.customEmojiId !== "REMPLACE_PAR_L_ID") {
      const offset = [...text].length; // longueur en UTF-16 code units gérée ci-dessous
      const emojiChar = config.fallback;
      entities.push({
        type: "custom_emoji",
        offset: Buffer.from(text, "utf16le").length / 2,
        length: emojiChar.length,
        custom_emoji_id: config.customEmojiId,
      });
      text += emojiChar;
    } else if (config) {
      // Pas d'ID configuré : on affiche juste le fallback, sans entité premium
      text += config.fallback;
    } else {
      // Raccourci inconnu : on le laisse tel quel
      text += match[0];
    }

    lastIndex = pattern.lastIndex;
  }

  text += rawText.slice(lastIndex);

  return { text, entities };
}
