// word-hint-image.js
// Génère l'image affichant l'indice du mot à deviner (catégorie + lettres
// masquées), sur le fond thème jeu assets/word-game-template.jpg.
// Utilise Jimp 0.22.x (API stable) pour le texte.

import Jimp from "jimp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, "assets", "word-game-template.jpg");

const WIDTH = 1200;

/**
 * Génère l'image de l'indice (catégorie + lettres, ex: "Catégorie : Animal\nP _ _ _ _  (5 lettres)").
 * @param {string} hintText - l'indice déjà formaté (catégorie + lettres + nombre de lettres)
 * @returns {Promise<Buffer>} - image PNG
 */
export async function generateWordHintImage(hintText) {
  const image = await Jimp.read(TEMPLATE_PATH);

  const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontHint = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

  image.print(
    fontTitle,
    0,
    60,
    { text: "🔤 DEVINE LE MOT", alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    WIDTH
  );

  const [categoryLine, lettersLine] = hintText.split("\n");

  image.print(
    fontTitle,
    0,
    260,
    { text: categoryLine, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    WIDTH
  );

  image.print(
    fontHint,
    0,
    330,
    { text: lettersLine, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    WIDTH
  );

  return image.getBufferAsync(Jimp.MIME_PNG);
}
