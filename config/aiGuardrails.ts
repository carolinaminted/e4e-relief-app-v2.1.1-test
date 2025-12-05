export const AI_GUARDRAILS = {
  // ~67 tokens. Enough for a detailed question, but prevents huge copy-pastes.
  MAX_CHAT_MESSAGE_CHARS: 250,
  
  // ~60 tokens. Concise description.
  MAX_APPLICATION_DESCRIPTION_CHARS: 250,
  
  // ~50 tokens. Addresses shouldn't be essays.
  MAX_ADDRESS_CHARS: 200, 

  // Prevents infinite loops or session camping.
  MAX_CHAT_TURNS_PER_SESSION: 50,
};