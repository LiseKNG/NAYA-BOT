// leaderboard-image.js
// Génère une image PNG du classement, en plus de la version texte.
// Utilise Jimp (pur JS, sans dépendance native) donc compatible partout,
// y compris sur Railway sans configuration particulière.

import { Jimp, JimpMime } from "jimp";

const WIDTH = 640;
const ROW_HEIGHT = 60;
const HEADER_HEIGHT = 90;
const PADDING = 24;

/**
 * Génère une image de classement.
 * @param {Array<{name: string, points: number}>} board - classement trié, déjà limité (ex: top 10)
 * @param {string} title - titre affiché en haut de l'image
 * @returns {Promise<Buffer>} - image PNG
 */
export async function generateLeaderboardImage(board, title) {
  const height = HEADER_HEIGHT + board.length * ROW_HEIGHT + PADDING;
  const image = new Jimp({ width: WIDTH, height, color: 0x1a1a2eff });

  const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontRow = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

  image.print({
    font: fontTitle,
    x: PADDING,
    y: PADDING,
    text: title,
    maxWidth: WIDTH - PADDING * 2,
  });

  const medals = ["🥇", "🥈", "🥉"];

  board.forEach((entry, i) => {
    const y = HEADER_HEIGHT + i * ROW_HEIGHT;
    const rank = medals[i] || `${i + 1}.`;
    const line = `${rank}  ${entry.name} — ${entry.points} pts`;

    image.print({
      font: fontRow,
      x: PADDING,
      y: y + 18,
      text: line,
      maxWidth: WIDTH - PADDING * 2,
    });
  });

  return image.getBuffer(JimpMime.png);
}
