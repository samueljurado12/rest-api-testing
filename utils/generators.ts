import { LoremIpsum } from "lorem-ipsum";
import { Post, User } from "../pages/models";

const lorem: LoremIpsum = new LoremIpsum({
  sentencesPerParagraph: { min: 2, max: 4 },
  wordsPerSentence: { min: 5, max: 10 },
});

export const generateText = (characters: number) =>
  lorem.generator.generateRandomSentence(characters).substring(0, characters);

export const generateRandomValidUser = (keyword?: string): User => {
  const randomWord = lorem.generateWords(1);
  const gender =
    lorem.generator.generateRandomInteger(1, 2) === 1 ? "male" : "female";
  const status =
    lorem.generator.generateRandomInteger(1, 2) === 1 ? "active" : "inactive";
  return {
    name: `Test User ${randomWord} ${keyword}`,
    email: `TestUser_${randomWord}_${keyword}@email.test`,
    gender,
    status,
  };
};

export const generateRandomValidPost = (userId?: number): Post => {
  const basePost: Post = {
    title: lorem.generateSentences(1),
    body: lorem.generateParagraphs(2),
  };
  if (userId) basePost.user_id = userId;

  return basePost;
};
