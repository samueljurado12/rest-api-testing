import { User, Post, ErrorMessage } from "../pages/models";

export const authFailedResponse: ErrorMessage = {
  message: "Authentication failed",
};

export const invalidTokenResponse: ErrorMessage = {
  message: "Invalid token",
};

export const baseUser: User = {
  name: "Test",
  email: "Test@email.com",
  gender: "male",
  status: "active",
};

export const basePost: Post = {
  title: "This is a test for a Post. This is the title.",
  body: "This is a test for a Post. This is the body.",
};
