import { test, expect } from "@playwright/test";
import { UsersRequest } from "../pages/users-request";
import { User, Post, FieldErrorMessage, ErrorMessage } from "../pages/models";
import {
  authFailedResponse,
  generateRandomValidPost,
  generateRandomValidUser,
  generateText,
  invalidTokenResponse,
  NotFoundResponse,
} from "../utils";
import HttpStatusCode from "../utils";

let headers = {
  Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
};

test.beforeEach("Setup token", async () => {
  headers = {
    Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
  };
});

test.describe("1. Retrieve list of users", () => {
  // Todo check
  test.describe("Parameter search", () => {
    const user: User = {
      name: "Test Parameters",
      email: "ParamTest@email.test",
      gender: "female",
      status: "inactive",
    };

    test.beforeAll(
      "Create user used for Parameter Search tests",
      async ({ request }) => {
        const userRequest: UsersRequest = new UsersRequest(request, headers);
        const response = await userRequest.createUser(user);
        const { id } = await response.json();
        user.id = id;
      }
    );

    test.afterAll("Cleanup", async ({ request }) => {
      const userRequest: UsersRequest = new UsersRequest(request, headers);
      if (user.id) await userRequest.deleteUser(user.id);
    });

    test.fixme(
      "Should return one user searching by exact email",
      async ({ request }) => {
        const userRequest: UsersRequest = new UsersRequest(request);

        const params = {
          email: "ParamTest@email.test",
        };

        const response = await userRequest.getUsers(params);
        const responseBody = await response.json();

        expect(response.status()).toBe(HttpStatusCode.OK);
        expect(responseBody).toContain(user);
        expect(responseBody).toHaveLength(1);
      }
    );

    test("Should return empty array if nothing found", async ({ request }) => {
      const userRequest: UsersRequest = new UsersRequest(request);
      const params = { name: "NonExistingName" };

      const response = await userRequest.getUsers(params);
      const responseBody = await response.json();

      expect(response.status()).toBe(HttpStatusCode.OK);
      expect(responseBody).toHaveLength(0);
    });
  });

  test("Should return complete list of users", async ({ request }) => {
    const usersRequest = new UsersRequest(request);
    const response = await usersRequest.getUsers();

    expect(response.status()).toBe(HttpStatusCode.OK);
    expect(response.json()).toBeTruthy();
  });
});

test.describe("4. Create a new user", () => {
  test.describe("Invalid token", () => {
    test("Should return Unauthorized (401) if token is not present", async ({
      request,
    }) => {
      const userRequest = new UsersRequest(request);

      const response = await userRequest.createUser(generateRandomValidUser());

      const responseBody = await response.json();

      expect(response.status()).toBe(HttpStatusCode.UNAUTHORIZED);
      expect(responseBody).toEqual(authFailedResponse);
    });

    test("Should return Unauthorized (401) if token is invalid", async ({
      request,
    }) => {
      headers.Authorization = "Bearer testInvalidToken";

      const userRequest = new UsersRequest(request, headers);

      const response = await userRequest.createUser(generateRandomValidUser());
      const responseBody = await response.json();

      expect(response.status()).toBe(HttpStatusCode.UNAUTHORIZED);
      expect(responseBody).toEqual(invalidTokenResponse);
    });
  });

  test.describe("Valid token", () => {
    test.describe("Create users with valid data", () => {
      [
        { gender: "male", status: "active" },
        { gender: "female", status: "active" },
        { gender: "male", status: "inactive" },
        { gender: "female", status: "inactive" },
      ].forEach(({ gender, status }) => {
        test(`Should create user if valid data is provided. Case - gender: ${gender}, status: ${status}`, async ({
          request,
        }) => {
          const user: User = {
            ...generateRandomValidUser(),
            gender,
            status,
          };

          const userRequest: UsersRequest = new UsersRequest(request, headers);

          const response = await userRequest.createUser(user);

          expect(response.status()).toBe(HttpStatusCode.CREATED);

          const responseData = await response.json();
          await userRequest.deleteUser(responseData.id);
          expect(responseData.id).toBeTruthy();
          expect(responseData).toEqual(expect.objectContaining(user));
        });
      });
    });
    test.describe("Body validations", () => {
      // Todo: Test that multiple validations are executed at once

      [
        { emptyData: { name: "" }, property: "name" },
        { emptyData: { email: "" }, property: "email" },
        { emptyData: { gender: "" }, property: "gender" },
        { emptyData: { status: "" }, property: "status" },
      ].forEach(({ emptyData, property }) => {
        test(`Should return error message if ${property} is empty`, async ({
          request,
        }) => {
          const userRequest: UsersRequest = new UsersRequest(request, headers);

          const errorMessage =
            property === "gender"
              ? "can't be blank, can be male of female"
              : "can't be blank";

          const user = { ...generateRandomValidUser(), ...emptyData };
          const expectedResponseBody: FieldErrorMessage = {
            message: errorMessage,
            field: property,
          };

          const response = await userRequest.createUser(user);
          const responseBody = await response.json();

          expect(response.status()).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
          expect(responseBody).toHaveLength(1);
          expect(responseBody).toContainEqual(expectedResponseBody);
        });
      });
      test("Should return error if gender is not male or female", async ({
        request,
      }) => {
        const userRequest: UsersRequest = new UsersRequest(request, headers);
        const gender = "whatever";
        const user = { ...generateRandomValidUser(), gender };
        const expectedResponseBody: FieldErrorMessage = {
          message: "can't be blank, can be male of female",
          field: "gender",
        };

        const response = await userRequest.createUser(user);
        const responseBody = await response.json();

        expect(response.status()).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
        expect(responseBody).toHaveLength(1);
        expect(responseBody).toContainEqual(expectedResponseBody);
      });

      test("Should return error if status is not active or inactive", async ({
        request,
      }) => {
        const userRequest: UsersRequest = new UsersRequest(request, headers);
        const status = "disabled";
        const user = { ...generateRandomValidUser(), status: status };
        const expectedResponseBody: FieldErrorMessage = {
          message: "can't be blank",
          field: "status",
        };

        const response = await userRequest.createUser(user);
        const responseBody = await response.json();

        expect(response.status()).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
        expect(responseBody).toHaveLength(1);
        expect(responseBody).toContainEqual(expectedResponseBody);
      });
    });
  });
});

test.describe("Previous user is needed", () => {
  let createdUser: User;
  test.beforeAll("Create user", async ({ request }) => {
    const userRequest = new UsersRequest(request, headers);

    const response = await userRequest.createUser(
      generateRandomValidUser("Post")
    );
    createdUser = await response.json();
  });

  test.afterAll("Clean up", async ({ request }) => {
    const userRequest = new UsersRequest(request, headers);
    if (createdUser.id) await userRequest.deleteUser(createdUser.id);
  });

  test.describe("5. Create a user's post", () => {
    test.describe.configure({ mode: "serial" });
    test.describe("Invalid token", () => {
      test("Should return Unauthorized (401) if token is not present", async ({
        request,
      }) => {
        const userRequest = new UsersRequest(request);

        const response = await userRequest.addPost(createdUser.id, {});

        const responseBody = await response.json();

        expect(response.status()).toBe(HttpStatusCode.UNAUTHORIZED);
        expect(responseBody).toEqual(authFailedResponse);
      });

      test("Should return Unauthorized (401) if token is invalid", async ({
        request,
      }) => {
        headers.Authorization = "Bearer testInvalidToken";

        const userRequest = new UsersRequest(request, headers);

        const response = await userRequest.addPost(createdUser.id, {});
        const responseBody = await response.json();

        expect(response.status()).toBe(HttpStatusCode.UNAUTHORIZED);
        expect(responseBody).toEqual(invalidTokenResponse);
      });
    });
    test.describe("Valid token", () => {
      test("Should create a post if valid data is provided", async ({
        request,
      }) => {
        const userRequest = new UsersRequest(request, headers);
        const expectedPost: Post = generateRandomValidPost();

        const response = await userRequest.addPost(
          createdUser.id,
          expectedPost
        );
        const responseBody = await response.json();
        const { id, user_id } = responseBody;

        expect(response.status()).toBe(HttpStatusCode.CREATED);
        expect(id).toBeTruthy();
        expect(user_id).toBe(createdUser.id);
        expect(responseBody).toEqual(expect.objectContaining(expectedPost));
      });

      test("Should return error if user id does not exist", async ({
        request,
      }) => {
        const userRequest = new UsersRequest(request, headers);
        const invalidUserId = -1;
        const expectedErrorMessage: FieldErrorMessage = {
          field: "user",
          message: "must exist",
        };

        const response = await userRequest.addPost(
          invalidUserId,
          generateRandomValidPost()
        );
        const responseBody = await response.json();

        expect(response.status()).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
        expect(responseBody).toHaveLength(1);
        expect(responseBody).toContainEqual(expectedErrorMessage);
      });

      [{ property: "title" }, { property: "body" }].forEach(({ property }) => {
        test(`Should return error when sending empty ${property}`, async ({
          request,
        }) => {
          const userRequest = new UsersRequest(request, headers);
          let emptyPropertyPost = generateRandomValidPost();
          emptyPropertyPost[property] = "";
          const expectedErrorMessage: FieldErrorMessage = {
            field: `${property}`,
            message: "can't be blank",
          };

          const response = await userRequest.addPost(
            createdUser.id,
            emptyPropertyPost
          );
          const responseBody = await response.json();

          expect(response.status()).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
          expect(responseBody).toHaveLength(1);
          expect(responseBody).toContainEqual(expectedErrorMessage);
        });
      });
      [
        { property: "title", maxLength: 200 },
        { property: "body", maxLength: 500 },
      ].forEach(({ property, maxLength }) => {
        test(`Should return error if ${property} exceeds limit of ${maxLength} characters`, async ({
          request,
        }) => {
          const userRequest = new UsersRequest(request, headers);
          const expectedErrorMessage: FieldErrorMessage = {
            field: property,
            message: `is too long (maximum is ${maxLength} characters)`,
          };
          let post = generateRandomValidPost();
          post[`${property}`] = generateText(maxLength + 1);

          const response = await userRequest.addPost(createdUser.id, post);
          const responseBody = await response.json();

          expect(response.status()).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
          expect(responseBody).toHaveLength(1);
          expect(responseBody).toContainEqual(expectedErrorMessage);
        });
      });

      test.skip("Should return validation if user id is not a number", async ({
        request,
      }) => {
        const userRequest = new UsersRequest(request, headers);
        const expectedErrorMessage: FieldErrorMessage = {
          field: "user_id",
          message: "is not a number",
        };
        let user_id;

        const response = await userRequest.addPost(
          user_id,
          generateRandomValidPost()
        );
        const responseBody = await response.json();

        expect(response.status()).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
        expect(responseBody).toHaveLength(2);
        expect(responseBody).toContainEqual(expectedErrorMessage);
      });
    });
  });
});

test.describe("Delete the changed user", () => {
  let createdUser: User;
  test.beforeEach("Create user", async ({ request }) => {
    const userRequest = new UsersRequest(request, headers);
    const response = await userRequest.createUser(
      generateRandomValidUser("Delete")
    );
    createdUser = await response.json();
  });

  test.afterEach("Clean up", async ({ request }) => {
    const userRequest = new UsersRequest(request, headers);
    if (createdUser.id) await userRequest.deleteUser(createdUser.id);
  });

  test.describe("Invalid Token", () => {
    test("Should return Not Found (404) if token is not present", async ({
      request,
    }) => {
      const userRequest = new UsersRequest(request);

      const response = await userRequest.deleteUser(createdUser.id);

      const responseBody = await response.json();

      expect(response.status()).toBe(HttpStatusCode.NOT_FOUND);
      expect(responseBody).toEqual(NotFoundResponse);
    });

    test("Should return Unauthorized (401) if token is invalid", async ({
      request,
    }) => {
      headers.Authorization = "Bearer testInvalidToken";

      const userRequest = new UsersRequest(request, headers);

      const response = await userRequest.deleteUser(createdUser.id);
      const responseBody = await response.json();

      expect(response.status()).toBe(HttpStatusCode.UNAUTHORIZED);
      expect(responseBody).toEqual(invalidTokenResponse);
    });
  });

  test.describe("Valid token", () => {
    test("Should return Not Found (404) if user does not exist", async ({
      request,
    }) => {
      const userRequest = new UsersRequest(request, headers);

      const response = await userRequest.deleteUser(-1);
      const responseBody = await response.json();

      expect(response.status()).toBe(HttpStatusCode.NOT_FOUND);
      expect(responseBody).toEqual(NotFoundResponse);
    });
    test("Should delete user if everything is fine", async ({ request }) => {
      const userRequest = new UsersRequest(request, headers);

      const response = await userRequest.deleteUser(createdUser.id);

      expect(response.status()).toBe(HttpStatusCode.NO_CONTENT);
    });
  });
});
