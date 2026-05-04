import { AutoReplyMessage } from "../types/autoReply";

export function matchRuleToMessage(
  rules: AutoReplyMessage[],
  incomingText: string,
) {
  const normalizedMessage = incomingText.trim().toLowerCase();
  if (!normalizedMessage) {
    return null;
  }

  for (const rule of rules) {
    const phrases = (rule.incomingMessage || []).map((item) => item.toLowerCase());
    const normalizedRule = (rule.rule || "").toLowerCase();

    const hasMatch = phrases.some((phrase) => {
      if (normalizedRule.includes("smart") && normalizedRule.includes("intent")) {
        return false;
      }

      if (normalizedRule.includes("exact")) {
        return normalizedMessage === phrase;
      }

      if (normalizedRule.includes("start")) {
        return normalizedMessage.startsWith(phrase);
      }

      return normalizedMessage.includes(phrase);
    });

    if (hasMatch) {
      return rule;
    }
  }

  return null;
}
