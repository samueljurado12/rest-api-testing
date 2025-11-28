import { User, Post, ErrorMessage } from "../pages/models";

export const authFailedResponse: ErrorMessage = {
  message: "Authentication failed",
};

export const invalidTokenResponse: ErrorMessage = {
  message: "Invalid token",
};

export const NotFoundResponse: ErrorMessage = {
  message: "Resource not found",
};

export const InvalidAuthTokenHeader = {
  Authorization: "Bearer InvalidToken",
};
