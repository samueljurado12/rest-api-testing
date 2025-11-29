import { APIRequestContext, expect } from "@playwright/test";
import { Post, User, Todo } from "../../pages/models";
import HttpStatusCode, {
  generateRandomValidUser,
  InvalidAuthTokenHeader,
} from "../../utils";
import { UsersRequest } from "../../pages";
import { executeHTTPRequest } from "../../pages/request";
import { Response } from "../../pages/models/response";

/**
 * Create a UsersRequest with auth headers
 */
export const authUsersRequest = (request: APIRequestContext, headers: any) =>
  new UsersRequest(request, headers);

/**
 * Create a user and return both the user and a cleanup function
 */
export const createUserWithCleanup = async (
  request: APIRequestContext,
  headers: any,
  userData?: Partial<User>
) => {
  const usersReq = authUsersRequest(request, headers);
  const userPayload: User = {
    ...generateRandomValidUser(),
    ...userData,
  } as User;
  const res = await usersReq.createUser(userPayload);
  const created = await res.json();

  return {
    status: res.status(),
    user: created,
    cleanup: async () => {
      if (created?.id) await usersReq.deleteUser(created.id);
    },
  };
};

/**
 * Create a post for a user and return both response and post data
 * (Cleanup happens via user deletion cascade)
 */
export const createPost = async (
  request: APIRequestContext,
  headers: any,
  userId: number,
  postPayload: Post
) => {
  const usersReq = authUsersRequest(request, headers);
  const response = await usersReq.addPost(userId, postPayload);
  const body = await response.json();
  return { status: response.status(), body };
};

/**
 * Create a todo for a user and return both response and todo data
 * (Cleanup happens via user deletion cascade)
 */
export const createTodo = async (
  request: APIRequestContext,
  headers: any,
  userId: number,
  todoPayload: Todo
) => {
  const usersReq = authUsersRequest(request, headers);
  const response = await usersReq.addTodo(userId, todoPayload);
  const body = await response.json();
  return { status: response.status(), body };
};

/**
 * Updates a user with the specified user ID and payload.
 * Returns both the response and the updated user data.
 */
export const updateUser = async (
  request: APIRequestContext,
  headers: any,
  userId: number,
  userPayload: Partial<User>
): Promise<Response<User>> => {
  const response = await executeHTTPRequest<User>(
    (req) =>
      req.patch(`/public/v2/users/${userId}`, {
        headers,
        data: userPayload,
      }),
    request
  );

  return response;
};

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
