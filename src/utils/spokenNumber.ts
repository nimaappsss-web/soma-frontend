const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20,
};

const FUZZY: Record<string, number> = {
  "for": 4,  "fore": 4, "too": 2, "to": 2, "free": 3,
  "tree": 3, "ate": 8, "sex": 6, "tin": 10, "nein": 9,
};

export const spokenToNumber = (text: string): number | null => {
  const cleaned = text.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    const word = words[0];
    if (NUMBER_WORDS[word] !== undefined) return NUMBER_WORDS[word];
    if (FUZZY[word] !== undefined) return FUZZY[word];
    const direct = parseInt(word, 10);
    if (!isNaN(direct)) return direct;
  }

  if (words.length >= 1) {
    for (const word of words) {
      if (NUMBER_WORDS[word] !== undefined) return NUMBER_WORDS[word];
      if (FUZZY[word] !== undefined) return FUZZY[word];
    }
  }

  const digits = cleaned.replace(/\D/g, "");
  if (digits.length > 0) {
    const parsed = parseInt(digits, 10);
    if (!isNaN(parsed)) return parsed;
  }

  return null;
};
