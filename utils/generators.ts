import { LoremIpsum } from "lorem-ipsum";
import { Post, User } from "../pages/models";
import Todo from "../pages/models/todo";
import { toISOStringWithTimezone } from "./date-utils";

const lorem: LoremIpsum = new LoremIpsum({
  sentencesPerParagraph: { min: 2, max: 4 },
  wordsPerSentence: { min: 5, max: 10 },
});

const getRandomISODate = (from: Date, to: Date): string => {
  const fromTime = from.getTime();
  const toTime = to.getTime();
  return toISOStringWithTimezone(
    new Date(fromTime + Math.random() * (toTime - fromTime))
  );
};

const generateValueFromList = (list: any[]) => {
  if (!list) return "";

  return list[lorem.generator.generateRandomInteger(0, list.length - 1)];
};

export const generateText = (length: number) =>
  lorem.generator.generateRandomSentence(length).substring(0, length);

export const generateRandomValidUser = (keyword?: string): User => {
  const randomWord = lorem.generateWords(1);
  const gender = generateValueFromList(["male", "female"]);
  const status = generateValueFromList(["active", "inactive"]);
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

export const generateRandomValidTodo = (
  withDate: boolean = false,
  userId?: number
): Todo => {
  const baseTodo: Todo = {
    title: lorem.generateSentences(1),
    status: generateValueFromList(["pending", "completed"]),
  };

  if (withDate)
    baseTodo.due_on = getRandomISODate(new Date(2010, 1, 1), new Date());

  if (userId) baseTodo.user_id = userId;

  return baseTodo;
};

export const generateRandomEmail = (length: number) =>
  `${lorem
    .generateWords(length - 12)
    .substring(0, length)
    .replaceAll(" ", "_")}@email.test`;
