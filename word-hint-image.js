// word-hint-image.js
// Génère l'image affichant l'indice du mot à deviner (lettres masquées),
// dans un style carte sombre.

import { Jimp, JimpMime } from "jimp";

const WIDTH = 800;
const HEIGHT = 300;
const BACKGROUND_COLOR = 0x1c2333ff; // bleu-nuit sombre, façon carte

/**
 * Génère l'image de l'indice (ex: "P _ _ _ _  (5 lettres)").
 * @param {string} hintText - l'indice déjà formaté (lettres + nombre de lettres)
 * @returns {Promise<Buffer>} - image PNG
 */
export async function generateWordHintImage(hintText) {
  const image = new Jimp({ width: WIDTH, height: HEIGHT, color: BACKGROUND_COLOR });

  const fontEmoji = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontHint = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

  image.print({
    font: fontEmoji,
    x: 0,
    y: 40,
    text: "🔤 DEVINE LE MOT",
    maxWidth: WIDTH,
    alignmentX: "center",
  });

  image.print({
    font: fontHint,
    x: 0,
    y: 140,
    text: hintText,
    maxWidth: WIDTH,
    alignmentX: "center",
  });

  return image.getBuffer(JimpMime.png);
}
