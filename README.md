# NAYA-BOT
Je t aime ma petite sœur préférée 


## Mode temporaire

Naya peut supprimer automatiquement certains messages/stickers après un délai.

Variable d'environnement :
NAYA_EPHEMERAL_SECONDS=60

En privé :
/ephemeral
active le mode temporaire pour les réponses texte de Naya.
/ephemeral off
désactive le mode temporaire.

Le bot ne reçoit pas d'événement fiable indiquant qu'un utilisateur a fermé/quitté la conversation privée.
La suppression repose donc sur une minuterie. Telegram impose aussi des limites aux suppressions de messages.
