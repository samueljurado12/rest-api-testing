import { test, expect } from "@playwright/test";
import { UsersRequest } from "../pages/users-request";
import { User, Post, FieldErrorMessage } from "../pages/models";
import {
  authFailedResponse,
  generateRandomEmail,
  generateRandomValidPost,
  generateRandomValidTodo,
  generateRandomValidUser,
  generateText,
  invalidTokenResponse,
  NotFoundResponse,
} from "../utils";
import HttpStatusCode from "../utils";
import {
  authUsersRequest,
  createUserWithCleanup,
  createPost,
  createTodo,
  testInvalidTokenScenarios,
  testCreateUserValidation,
  testPostValidation,
  testTodoValidation,
  updateUser,
  testUpdateUserValidation,
} from "./helpers";

let headers: any;

test.beforeAll("Setup token", async () => {
  headers = {
    Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
  };
});

test.describe("1. Retrieve list of users", () => {
  // Todo check
  test.describe("Parameter search", () => {
    const user: User = generateRandomValidUser("Parameters");

    test.beforeAll(
      "Create user used for Parameter Search tests",
      async ({ request }) => {
        const { user: createdUser } = await createUserWithCleanup(
          request,
          headers,
          user
        );
        user.id = createdUser.id;
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
          email: user.email,
        };

        const response = await userRequest.getUsers(params);
        const responseBody = await response.json();

        expect(response.status()).toBe(HttpStatusCode.OK);
        expect(Array.isArray(responseBody)).toBeTruthy();
        expect(responseBody).toHaveLength(1);
        expect(responseBody[0].id).toBe(user.id);
        expect(responseBody[0].email).toBe(user.email);
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
    const responseBody = await response.json();
    expect(Array.isArray(responseBody)).toBeTruthy();
    expect(responseBody.length).toBeGreaterThanOrEqual(0);
  });
});

test.describe("4. Create a new user", () => {
  test.describe("Invalid token", () => {
    test("Should return Unauthorized if token is not present or invalid", async ({
      request,
    }) => {
      await testInvalidTokenScenarios(
        request,
        (ur) => ur.createUser(generateRandomValidUser()),
        HttpStatusCode.UNAUTHORIZED,
        authFailedResponse,
        HttpStatusCode.UNAUTHORIZED,
        invalidTokenResponse
      );
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

          const {
            status: responseStatus,
            user: createdUser,
            cleanup,
          } = await createUserWithCleanup(request, headers, user);

          expect(responseStatus).toBe(HttpStatusCode.CREATED);
          expect(createdUser.id).toBeTruthy();
          expect(createdUser).toEqual(
            expect.objectContaining(user as Record<string, any>)
          );

          await cleanup();
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
          const user = { ...generateRandomValidUser(), ...emptyData };
          const errorMessage =
            property === "gender"
              ? "can't be blank, can be male of female"
              : "can't be blank";

          await testCreateUserValidation(
            request,
            headers,
            user,
            property,
            errorMessage
          );
        });
      });

      test("Should return error if gender is not male or female", async ({
        request,
      }) => {
        const user = { ...generateRandomValidUser(), gender: "whatever" };

        await testCreateUserValidation(
          request,
          headers,
          user,
          "gender",
          "can't be blank, can be male of female"
        );
      });

      test("Should return error if status is not active or inactive", async ({
        request,
      }) => {
        const user = { ...generateRandomValidUser(), status: "disabled" };

        await testCreateUserValidation(
          request,
          headers,
          user,
          "status",
          "can't be blank"
        );
      });

      [
        { property: "name", maxLength: 200 },
        { property: "email", maxLength: 200 },
      ].forEach(({ property, maxLength }) => {
        test(`Should return error if ${property} exceeds ${maxLength}`, async ({
          request,
        }) => {
          const user = generateRandomValidUser();
          const generatedWrongValue =
            property === "email"
              ? generateRandomEmail(maxLength + 1)
              : generateText(maxLength + 1);

          (user as any)[`${property}`] = generatedWrongValue;

          await testCreateUserValidation(
            request,
            headers,
            user,
            property,
            `is too long (maximum is ${maxLength} characters)`
          );
        });
      });
    });
  });
});

test.describe("5. Create a user's post", () => {
  let createdUser: User;
  test.beforeAll("Create user", async ({ request }) => {
    const { user: created } = await createUserWithCleanup(
      request,
      headers,
      generateRandomValidUser("Post")
    );
    createdUser = created;
  });

  test.afterAll("Clean up", async ({ request }) => {
    const userRequest = authUsersRequest(request, headers);
    if (createdUser.id) await userRequest.deleteUser(createdUser.id);
  });

  test.describe.configure({ mode: "serial" });
  test.describe("Invalid token", () => {
    test("Should return Unauthorized if token is not present or invalid", async ({
      request,
    }) => {
      await testInvalidTokenScenarios(
        request,
        (ur) => ur.addPost(createdUser.id!, generateRandomValidPost()),
        HttpStatusCode.UNAUTHORIZED,
        authFailedResponse,
        HttpStatusCode.UNAUTHORIZED,
        invalidTokenResponse
      );
    });
  });
  test.describe("Valid token", () => {
    test("Should create a post if valid data is provided", async ({
      request,
    }) => {
      const postPayload: Post = generateRandomValidPost();
      const { status, body: post } = await createPost(
        request,
        headers,
        createdUser.id!,
        postPayload
      );

      expect(status).toBe(HttpStatusCode.CREATED);
      expect(post.id).toBeTruthy();
      expect(post.user_id).toBe(createdUser.id);
      expect(post).toEqual(
        expect.objectContaining(postPayload as Record<string, any>)
      );
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
        const emptyPropertyPost = generateRandomValidPost();
        (emptyPropertyPost as any)[property] = "";

        await testPostValidation(
          request,
          headers,
          createdUser.id!,
          emptyPropertyPost,
          property,
          "can't be blank"
        );
      });
    });
    [
      { property: "title", maxLength: 200 },
      { property: "body", maxLength: 500 },
    ].forEach(({ property, maxLength }) => {
      test(`Should return error if ${property} exceeds limit of ${maxLength} characters`, async ({
        request,
      }) => {
        const post = generateRandomValidPost();
        (post as any)[`${property}`] = generateText(maxLength + 1);

        await testPostValidation(
          request,
          headers,
          createdUser.id!,
          post,
          property,
          `is too long (maximum is ${maxLength} characters)`
        );
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
        user_id!,
        generateRandomValidPost()
      );
      const responseBody = await response.json();

      expect(response.status()).toBe(HttpStatusCode.UNPROCESSABLE_ENTITY);
      expect(responseBody).toHaveLength(2);
      expect(responseBody).toContainEqual(expectedErrorMessage);
    });
  });
});

test.describe("6. Create a user's todo.", () => {
  test.describe.configure({ mode: "serial" });
  let createdUser: User;
  test.beforeAll("Create user", async ({ request }) => {
    const { user: created } = await createUserWithCleanup(
      request,
      headers,
      generateRandomValidUser("Todo")
    );
    createdUser = created;
  });

  test.afterAll("Clean up", async ({ request }) => {
    const userRequest = authUsersRequest(request, headers);
    if (createdUser.id) await userRequest.deleteUser(createdUser.id);
  });

  test.describe("Invalid token", () => {
    test("Should return Unauthorized if token is not present or invalid", async ({
      request,
    }) => {
      await testInvalidTokenScenarios(
        request,
        (ur) => ur.addTodo(createdUser.id!, generateRandomValidTodo()),
        HttpStatusCode.UNAUTHORIZED,
        authFailedResponse,
        HttpStatusCode.UNAUTHORIZED,
        invalidTokenResponse
      );
    });
  });
  test.describe("Valid token", () => {
    [{ withDate: false }, { withDate: true }].forEach(({ withDate }) => {
      test(`Should create a ToDo if valid data is provided ${
        withDate ? "with" : "without"
      } date`, async ({ request }) => {
        const todoPayload = generateRandomValidTodo(withDate);

        const { status, body: responseToDo } = await createTodo(
          request,
          headers,
          createdUser.id!,
          todoPayload
        );

        if (responseToDo)
          responseToDo.due_on = new Date(
            responseToDo.due_on as any
          ).toISOString();

        expect(status).toBe(HttpStatusCode.CREATED);
        expect(responseToDo.id).toBeTruthy();
        expect(responseToDo).toEqual(expect.objectContaining(todoPayload));
      });
    });

    test("Should create a ToDo if valid data is provided, but provided Date isn't a Date", async ({
      request,
    }) => {
      const todoPayload = generateRandomValidTodo();
      todoPayload.due_on = "invalidDate";
      const { status, body: responseTodo } = await createTodo(
        request,
        headers,
        createdUser.id!,
        todoPayload
      );
      const expectedTodo = { ...todoPayload, due_on: null };

      expect(status).toBe(HttpStatusCode.CREATED);
      expect(responseTodo.id).toBeTruthy();
      expect(responseTodo).toEqual(expect.objectContaining(expectedTodo));
    });

    test("Should return error if status is not pending or completed", async ({
      request,
    }) => {
      const todoPayload = generateRandomValidTodo();
      todoPayload.status = "Progressing";

      await testTodoValidation(
        request,
        headers,
        createdUser.id!,
        todoPayload,
        "status",
        "can't be blank, can be pending or completed"
      );
    });

    test("Should return error if title is empty", async ({ request }) => {
      const todoPayload = generateRandomValidTodo();
      todoPayload.title = "";

      await testTodoValidation(
        request,
        headers,
        createdUser.id!,
        todoPayload,
        "title",
        "can't be blank"
      );
    });

    test(`Should return error if title exceeds limit of 200 characters`, async ({
      request,
    }) => {
      const todoPayload = generateRandomValidTodo();
      todoPayload.title = generateText(201);

      await testTodoValidation(
        request,
        headers,
        createdUser.id!,
        todoPayload,
        "title",
        "is too long (maximum is 200 characters)"
      );
    });
  });
});

test.describe("7. Change created user", () => {
  let createdUser: User;
  test.beforeAll("Create user", async ({ request }) => {
    const { user: created } = await createUserWithCleanup(
      request,
      headers,
      generateRandomValidUser("Change")
    );
    createdUser = created;
  });

  test.afterAll("Clean up", async ({ request }) => {
    const userRequest = authUsersRequest(request, headers);
    if (createdUser.id) await userRequest.deleteUser(createdUser.id);
  });

  test.describe("Invalid token", () => {
    test("Should return appropriate status if token is not present or invalid", async ({
      request,
    }) => {
      await testInvalidTokenScenarios(
        request,
        (ur) => ur.editUser(createdUser.id!, { name: "New Name" }),
        HttpStatusCode.UNAUTHORIZED,
        authFailedResponse,
        HttpStatusCode.UNAUTHORIZED,
        invalidTokenResponse
      );
    });
  });

  test.describe("Valid token", () => {
    test.describe("Successful updates", () => {
      let previousValues = createdUser;
      test.beforeEach("Save original user status", async ({ request }) => {
        previousValues = { ...createdUser };
      });

      test.afterEach("Revert changes made to user", async ({ request }) => {
        await updateUser(request, headers, createdUser.id!, previousValues);
        createdUser = { ...createdUser, ...previousValues };
      });
      [
        { property: "name", newValue: "New Name" },
        { property: "email", newValue: "NewEmail@test.email" },
        {
          property: "gender",
          newValue: "",
        },
        {
          property: "status",
          newValue: "",
        },
      ].forEach(({ property, newValue }) => {
        test(`Should change user ${property} if valid data is provided`, async ({
          request,
        }) => {
          if (property === "gender")
            newValue = createdUser.gender === "male" ? "female" : "male";
          if (property === "status")
            newValue = createdUser.status === "active" ? "inactive" : "active";
          const previousValue = (createdUser as any)[`${property}`];
          const updateData: Partial<User> = {};
          (updateData as any)[`${property}`] = newValue;

          const { status, body: responseBody } = await updateUser(
            request,
            headers,
            createdUser.id!,
            updateData
          );

          expect(status).toBe(HttpStatusCode.OK);
          expect(responseBody.id).toBe(createdUser.id);
          expect((responseBody as any)[`${property}`]).toBe(newValue);

          // Revert change for next iteration
          (createdUser as any)[`${property}`] = previousValue;
        });
      });

      test("Should update multiple fields at once", async ({ request }) => {
        const previousValues = { ...createdUser };
        const updateData: Partial<User> = {
          name: "Updated Name",
          email: generateRandomEmail(25),
          gender: createdUser.gender === "male" ? "female" : "male",
          status: createdUser.status === "active" ? "inactive" : "active",
        };

        const { status, body: responseBody } = await updateUser(
          request,
          headers,
          createdUser.id!,
          updateData
        );

        expect(status).toBe(HttpStatusCode.OK);
        expect(responseBody.id).toBe(createdUser.id);
        expect(responseBody).toEqual(
          expect.objectContaining(updateData as Record<string, any>)
        );

        createdUser = { ...createdUser, ...previousValues };
      });
    });

    test("Should return Not Found (404) if user does not exist", async ({
      request,
    }) => {
      const userRequest = new UsersRequest(request, headers);
    });
    test.describe("Body validations", () => {
      [
        { property: "name", newValue: "", expectedMessage: "can't be blank" },
        { property: "email", newValue: "", expectedMessage: "can't be blank" },
        {
          property: "email",
          newValue: "InvalidEmail",
          expectedMessage: "is invalid",
        },
        {
          property: "gender",
          newValue: "",
          expectedMessage: "can't be blank, can be male of female",
        },
        {
          property: "gender",
          newValue: "invalidGender",
          expectedMessage: "can't be blank, can be male of female",
        },
        { property: "status", newValue: "", expectedMessage: "can't be blank" },
        {
          property: "status",
          newValue: "InvalidStatus",
          expectedMessage: "can't be blank",
        },
      ].forEach(({ property, newValue, expectedMessage }) => {
        test(`Should return validation error if ${property} with value ${
          newValue ? newValue : "empty"
        } is provided`, async ({ request }) => {
          const updateData: Partial<User> = {};
          (updateData as any)[`${property}`] = newValue;

          await testUpdateUserValidation(
            request,
            headers,
            createdUser.id!,
            updateData,
            property,
            expectedMessage
          );
        });
      });

      [
        { property: "name", maxLength: 200 },
        { property: "email", maxLength: 200 },
      ].forEach(({ property, maxLength }) => {
        test(`Should return error if ${property} exceeds ${maxLength}`, async ({
          request,
        }) => {
          const invalidData = {};
          const generatedWrongValue =
            property === "email"
              ? generateRandomEmail(maxLength + 1)
              : generateText(maxLength + 1);

          (invalidData as any)[`${property}`] = generatedWrongValue;

          await testUpdateUserValidation(
            request,
            headers,
            createdUser.id!,
            invalidData,
            property,
            `is too long (maximum is ${maxLength} characters)`
          );
        });
      });
    });
  });
});

test.describe("8. Delete the changed user", () => {
  let createdUser: User;
  test.beforeAll("Create user", async ({ request }) => {
    const { user: created } = await createUserWithCleanup(
      request,
      headers,
      generateRandomValidUser("Delete")
    );
    createdUser = created;
  });

  test.afterAll("Clean up", async ({ request }) => {
    const userRequest = authUsersRequest(request, headers);
    if (createdUser.id) await userRequest.deleteUser(createdUser.id);
  });

  test.describe("Invalid Token", () => {
    test("Should return appropriate status if token is not present or invalid", async ({
      request,
    }) => {
      await testInvalidTokenScenarios(
        request,
        (ur) => ur.deleteUser(createdUser.id!),
        HttpStatusCode.UNAUTHORIZED,
        authFailedResponse,
        HttpStatusCode.UNAUTHORIZED,
        invalidTokenResponse
      );
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

      const response = await userRequest.deleteUser(createdUser.id!);

      expect(response.status()).toBe(HttpStatusCode.NO_CONTENT);
    });
  });
});
