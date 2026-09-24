// word-hint-image.js
// Génère l'image affichant l'indice du mot à deviner (catégorie + lettres
// masquées), sur le fond thème jeu assets/word-game-template.jpg.
// Un bandeau sombre semi-transparent est ajouté derrière le texte pour
// garder un bon contraste quel que soit le fond utilisé.
// Utilise Jimp 0.22.x (API stable) pour le texte.

import Jimp from "jimp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, "assets", "word-game-template.jpg");

/**
 * Génère l'image de l'indice (catégorie + lettres, ex: "Catégorie : Animal\nP _ _ _ _  (5 lettres)").
 * @param {string} hintText - l'indice déjà formaté (catégorie + lettres + nombre de lettres)
 * @returns {Promise<Buffer>} - image PNG
 */
export async function generateWordHintImage(hintText) {
  const image = await Jimp.read(TEMPLATE_PATH);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  const [categoryLine, lettersLine] = hintText.split("\n");

  // Bandeau sombre semi-transparent derrière le texte, pour rester lisible
  // même sur un fond clair.
  const bandHeight = Math.round(height * 0.32);
  const bandY = Math.round(height * 0.55);
  const band = new Jimp(width, bandHeight, 0x00000099);
  image.composite(band, 0, bandY);

  const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontHint = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

  image.print(
    fontTitle,
    0,
    bandY + 24,
    { text: "🔤 DEVINE LE MOT", alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    width
  );

  image.print(
    fontTitle,
    0,
    bandY + 80,
    { text: categoryLine, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    width
  );

  image.print(
    fontHint,
    0,
    bandY + 130,
    { text: lettersLine, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER },
    width
  );

  return image.getBufferAsync(Jimp.MIME_PNG);
}
