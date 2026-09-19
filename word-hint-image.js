// word-hint-image.js
// Génère l'image affichant l'indice du mot à deviner (lettres masquées),
// dans un style carte sombre. Utilise Jimp 0.22.x (API stable) pour le texte.

import Jimp from "jimp";

const WIDTH = 800;
const HEIGHT = 300;
const BACKGROUND_COLOR = 0x1c2333ff; // bleu-nuit sombre, façon carte

/**
 * Génère l'image de l'indice (ex: "P _ _ _ _  (5 lettres)").
 * @param {string} hintText - l'indice déjà formaté (lettres + nombre de lettres)
 * @returns {Promise<Buffer>} - image PNG
 */
export async function generateWordHintImage(hintText) {
  const image = await new Jimp(WIDTH, HEIGHT, BACKGROUND_COLOR);

  const fontEmoji = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontHint = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

  image.print(
    fontEmoji,
    0,
    40,
    { text: "🔤 DEVINE LE MOT", alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    WIDTH
  );

  image.print(
    fontHint,
    0,
    140,
    { text: hintText, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    WIDTH
  );

  return image.getBufferAsync(Jimp.MIME_PNG);
}
