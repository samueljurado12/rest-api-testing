import { expect } from "@playwright/test";
import HttpStatusCode from "../../utils";

/**
 * Assert that a response is 401 Unauthorized with the expected body
 */
export const expectUnauthorized = async (response: any, expectedBody: any) => {
  expect(response.status()).toBe(HttpStatusCode.UNAUTHORIZED);
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
  expect(response.status()).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
  const body = await response.json();
  expect(body).toHaveLength(count);
  expect(body).toContainEqual({ field, message });
};
