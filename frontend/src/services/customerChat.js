export function startNewCustomerChat() {
  const sessionId = `web_chat_${crypto.randomUUID()}`;
  // A new page resets customer details and cancels requests belonging to the old chat.
  // The old conversation and its appointment remain saved on the server.
  window.location.assign(`/whatsapp?sessionId=${encodeURIComponent(sessionId)}`);
}
