import { describe, expect, it } from "vitest";
import {
  HUMAN_PASSWORD_ENTROPY_BITS,
  HUMAN_PASSWORD_SUFFIX_RANGE,
  HUMAN_PASSWORD_WORD_COUNT,
  HUMAN_PASSWORD_WORDS,
  generateHumanPassword,
} from "../src/client/ui";

describe("senha manual gerada", () => {
  it("mantem pelo menos 50 bits de entropia com lista sem duplicatas", () => {
    expect(new Set(HUMAN_PASSWORD_WORDS).size).toBe(HUMAN_PASSWORD_WORDS.length);
    expect(HUMAN_PASSWORD_ENTROPY_BITS).toBeGreaterThanOrEqual(50);
  });

  it("gera a quantidade de palavras e o sufixo numerico esperados", () => {
    for (let i = 0; i < 25; i++) {
      const parts = generateHumanPassword().split("-");
      expect(parts).toHaveLength(HUMAN_PASSWORD_WORD_COUNT + 1);

      const words = parts.slice(0, -1);
      expect(words.every((word) => (HUMAN_PASSWORD_WORDS as readonly string[]).includes(word))).toBe(true);

      const suffix = parts[parts.length - 1];
      expect(suffix).toMatch(/^\d{3}$/);
      expect(Number(suffix)).toBeLessThan(HUMAN_PASSWORD_SUFFIX_RANGE);
    }
  });
});
