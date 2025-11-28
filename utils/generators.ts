import { LoremIpsum } from "lorem-ipsum";

const lorem: LoremIpsum = new LoremIpsum({
  sentencesPerParagraph: { max: 10, min: 5 },
  wordsPerSentence: { min: 10, max: 15 },
});

export const generateText = (characters: number, paragraphs?: number) =>
  lorem.generator.generateRandomParagraph(paragraphs).substring(0, characters);
