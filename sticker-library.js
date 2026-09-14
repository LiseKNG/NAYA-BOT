// sticker-library.js
// Bibliothèque de stickers que Naya peut envoyer selon son humeur.
//
// Pour récupérer le file_id d'un sticker :
//   1. Envoie le sticker que tu veux dans n'importe quel chat avec le bot
//   2. Transfère ce message vers @RawDataBot (ou @JsonDumpBot)
//   3. Dans le JSON renvoyé, cherche "file_id" dans la section "sticker" — colle-le ici
//
// Ajoute/retire des humeurs librement, mais garde les mêmes noms de clés
// que dans la liste STICKER_MOODS de tools.js si tu en ajoutes de nouvelles.

export const stickers = {
  happy: "CAACAgQAAxkBAAEik3xqqF-HewidAjgkzCrrPwLmth18ngACqCYAArVuQVGprGGJMpGTXT0E",
  love: "CAACAgQAAxkBAAEik3pqqF8nrm7h-WOCH_7FpVj5O7FoDwAC5B4AAv7pQFHQYuWWHIuCCz0E",
  sad: "CAACAgQAAxkBAAEik4BqqF_C-gIXM6Moe2Qk9Yw4SZ2CtwACFyYAAuqQQFEd6CqqPcbqqj0E",
  laugh: "CAACAgQAAxkBAAEik4JqqF_p53OyWi1UDc8vT6_VL_HocAACMiMAAnw0QVGcrEVaeocEjj0E",
  surprised: "CAACAgQAAxkBAAEik4ZqqGAR8EZ3dCYmhrAvcf8zrzKy3gACCyUAAvhOQFG4b-wjEv-UHz0E",
  wave: "CAACAgQAAxkBAAEik3ZqqF7D63gmI5dH3_MrxhOkQexXOgACkx4AAkyuSVFNGkpQyJ8DDz0E",
  shy: "CAACAgQAAxkBAAEik3hqqF73ci6bIwdh-E-XV7BtSJwfOwACSx4AAoqfSVEAAeSEtncCQ149BA",
  angry: "CAACAgQAAxkBAAEik1xqqFkbWPsFma7arCVWEsc6iMQGYwAC8B4AAvUvQVFIFrHdxowE1D0E",
};
