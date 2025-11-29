import { APIRequestContext } from "@playwright/test";
import { UsersRequest } from "../../pages/users-request";
import { expect } from "@playwright/test";

/**
 * Create a UsersRequest with auth headers
 */
export const authUsersRequest = (request: APIRequestContext, headers: any) =>
  new UsersRequest(request, headers);

/**
 * Assert that a response is 401 Unauthorized with the expected body
 */
export const expectUnauthorized = async (response: any, expectedBody: any) => {
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body).toEqual(expectedBody);
};

/**
 * Assert that a response is 422 Unprocessable Entity with field validation error(s)
 */
export const expectFieldValidationError = async (
  response: any,
  field: string,
  message: string,
  count = 1
) => {
  expect(response.status()).toBe(422);
  const body = await response.json();
  expect(body).toHaveLength(count);
  expect(body).toContainEqual({ field, message });
};
