import { APIRequestContext, expect } from "@playwright/test";
import HttpStatusCode, { InvalidAuthTokenHeader } from "../../utils";
import { UsersRequest, User, Post, Todo } from "../../pages";
import { authUsersRequest } from "./helpers";

/**
 * Test invalid token scenarios: missing token and invalid token
 * Executes the callback with no headers and with invalid headers
 * Supports different status codes for no-token vs invalid-token scenarios
 */
export const testInvalidTokenScenarios = async (
  request: APIRequestContext,
  testFn: (usersRequest: UsersRequest) => Promise<any>,
  expectedNoTokenStatus: number,
  expectedNoTokenResponse: any,
  expectedInvalidTokenStatus: number,
  expectedInvalidTokenResponse: any
) => {
  // Test: no token
  const noTokenRequest = new UsersRequest(request);
  const noTokenResponse = await testFn(noTokenRequest);
  expect(noTokenResponse.status()).toBe(expectedNoTokenStatus);
  const noTokenBody = await noTokenResponse.json();
  expect(noTokenBody).toEqual(expectedNoTokenResponse);

  // Test: invalid token
  const invalidTokenRequest = new UsersRequest(request, InvalidAuthTokenHeader);
  const invalidResponse = await testFn(invalidTokenRequest);
  expect(invalidResponse.status()).toBe(expectedInvalidTokenStatus);
  const invalidBody = await invalidResponse.json();
  expect(invalidBody).toEqual(expectedInvalidTokenResponse);
};

/**
 * Test body validation for user, post, or todo creation
 * Uses a callback to execute the API call and asserts the validation error
 */
export const testValidation = async (
  request: APIRequestContext,
  headers: any,
  testFn: (usersReq: UsersRequest) => Promise<any>,
  expectedField: string,
  expectedMessage: string
) => {
  const usersReq = authUsersRequest(request, headers);
  const response = await testFn(usersReq);

  expect(response.status()).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
  const responseBody = await response.json();
  expect(responseBody).toHaveLength(1);
  expect(responseBody).toContainEqual({
    field: expectedField,
    message: expectedMessage,
  });
};

/**
 * Test body validation for user creation
 * Creates a user with invalid data and asserts the validation error
 */
export const testUserValidation = async (
  request: APIRequestContext,
  headers: any,
  invalidUser: User,
  expectedField: string,
  expectedMessage: string
) => {
  await testValidation(
    request,
    headers,
    (usersReq) => usersReq.createUser(invalidUser),
    expectedField,
    expectedMessage
  );
};

/**
 * Test body validation for post creation
 * Creates a post with invalid data and asserts the validation error
 */
export const testPostValidation = async (
  request: APIRequestContext,
  headers: any,
  userId: number,
  invalidPost: Post,
  expectedField: string,
  expectedMessage: string
) => {
  await testValidation(
    request,
    headers,
    (usersReq) => usersReq.addPost(userId, invalidPost),
    expectedField,
    expectedMessage
  );
};

/**
 * Test body validation for todo creation
 * Creates a todo with invalid data and asserts the validation error
 */
export const testTodoValidation = async (
  request: APIRequestContext,
  headers: any,
  userId: number,
  invalidTodo: Todo,
  expectedField: string,
  expectedMessage: string
) => {
  await testValidation(
    request,
    headers,
    (usersReq) => usersReq.addTodo(userId, invalidTodo),
    expectedField,
    expectedMessage
  );
};
