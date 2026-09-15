// leaderboard-image.js
// Génère l'image du classement en utilisant le template graphique
// assets/leaderboard-template.jpg comme fond, avec les noms écrits dessus.

import { Jimp, JimpMime } from "jimp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, "assets", "leaderboard-template.jpg");

// Zone de la liste sur le template (à ajuster si tu changes de template)
const LIST_START_X = 90;
const LIST_START_Y = 110;
const LIST_ROW_HEIGHT = 38;
const LIST_MAX_WIDTH = 780;

const medals = ["🥇", "🥈", "🥉"];

/**
 * Génère une image de classement en s'appuyant sur le template graphique.
 * @param {Array<{name: string, points: number}>} board - classement trié, déjà limité (ex: top 10)
 * @param {string} title - titre affiché en haut de l'image
 * @returns {Promise<Buffer>} - image PNG
 */
export async function generateLeaderboardImage(board, title) {
  const image = await Jimp.read(TEMPLATE_PATH);

  const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontRow = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

  image.print({
    font: fontTitle,
    x: LIST_START_X,
    y: 30,
    text: title,
    maxWidth: LIST_MAX_WIDTH,
  });

  board.slice(0, 10).forEach((entry, i) => {
    const y = LIST_START_Y + i * LIST_ROW_HEIGHT;
    const rank = medals[i] || `${i + 1}.`;
    const line = `${rank}  ${entry.name} — ${entry.points} pts`;

    image.print({
      font: fontRow,
      x: LIST_START_X,
      y,
      text: line,
      maxWidth: LIST_MAX_WIDTH,
    });
  });

  return image.getBuffer(JimpMime.png);
}
