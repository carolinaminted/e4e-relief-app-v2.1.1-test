export const AI_GUARDRAILS = {
  // ~67 tokens. Enough for a detailed question, but prevents huge copy-pastes.
  MAX_CHAT_MESSAGE_CHARS: 250,
  
  // ~750 tokens. Allows for a detailed story, but caps excessive rambling.
  MAX_APPLICATION_DESCRIPTION_CHARS: 3000,
  
  // ~50 tokens. Addresses shouldn't be essays.
  MAX_ADDRESS_CHARS: 200, 

  // Prevents infinite loops or session camping.
  MAX_CHAT_TURNS_PER_SESSION: 50,
};