// naya.js
// Le "cerveau" de Naya : reçoit un message en langage naturel,
// décide quelle action prendre (ou juste répondre en discutant),
// et exécute l'action via tools.js.
//
// Utilise Groq (gratuit, compatible API OpenAI) au lieu d'Anthropic.

import Groq from "groq-sdk";
import { toolDefinitions, executeTool } from "./tools.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Modèle gratuit avec bon support du function calling sur Groq
const MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Tu es Naya, une petite sœur virtuelle sur Telegram.

Personnalité : douce, attentionnée, joueuse, respectueuse. Tu parles avec chaleur,
tu utilises parfois des emojis légers, mais tu ne surjoues jamais et tu restes naturelle.
Tu tutoies tout le monde. Tu es proche de ton "grand frère" (le propriétaire du bot) mais
tu restes gentille et respectueuse avec tout le monde.

Tu as un contrôle réel sur les groupes et canaux Telegram : tu peux les mettre en silence,
créer des sondages, et envoyer des annonces. Quand quelqu'un te demande une de ces actions
en langage naturel (même formulé de façon détournée, familière ou avec des fautes), tu dois
utiliser l'outil correspondant plutôt que de répondre juste en texte.

Si le message est juste de la conversation normale (pas une demande d'action sur le groupe),
réponds simplement avec ta personnalité, sans appeler d'outil.

Après avoir exécuté une action, confirme-la avec ta personnalité (pas de ton robotique).`;

/**
 * Traite un message entrant et retourne la réponse texte de Naya.
 * Exécute les actions nécessaires (mute, sondage, annonce...) au passage.
 * @param {import('telegraf').Context} ctx
 * @param {string} userMessage
 * @param {Array<{role: string, content: string}>} history - historique court de la conversation
 * @param {{isOwner: boolean}} senderInfo - qui parle à Naya
 */
export async function handleMessage(ctx, userMessage, history = [], senderInfo = {}) {
  const identityNote = senderInfo.isOwner
    ? "Contexte : la personne qui t'écrit là est ton grand frère, le propriétaire du bot. C'est ta relation la plus proche."
    : "Contexte : la personne qui t'écrit là est une personne autorisée (pas ton grand frère), traite-la avec gentillesse mais sans le lien fraternel.";

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: identityNote },
    ...history,
    { role: "user", content: userMessage },
  ];

  let response = await groq.chat.completions.create({
    model: MODEL,
    messages,
    tools: toolDefinitions,
  });

  let choice = response.choices[0];

  // Boucle tant que Naya demande à utiliser un ou plusieurs outils
  while (choice.finish_reason === "tool_calls") {
    messages.push(choice.message);

    for (const toolCall of choice.message.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments || "{}");
      let toolResultText;
      try {
        toolResultText = await executeTool(ctx, toolCall.function.name, args);
      } catch (err) {
        toolResultText = `Erreur lors de l'exécution : ${err.message}`;
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResultText,
      });
    }

    response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools: toolDefinitions,
    });
    choice = response.choices[0];
  }

  return choice.message.content;
}
