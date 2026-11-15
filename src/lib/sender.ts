const defaultSenderAccountId = "5e61f1760a6567";
const defaultSenderFormId = "aQWP37";

export const senderAccountId = import.meta.env.PUBLIC_SENDER_ACCOUNT_ID || defaultSenderAccountId;
export const senderFormId = import.meta.env.PUBLIC_SENDER_FORM_ID || defaultSenderFormId;
export const senderEmbedReady =
  /^[A-Za-z0-9_-]+$/.test(senderAccountId) && /^[A-Za-z0-9_-]+$/.test(senderFormId);
