import { APIRequestContext, expect } from "@playwright/test";
import { Post, User, Todo } from "../../pages/models";
import { authUsersRequest } from "./helpers";
import { generateRandomValidUser } from "../../utils";

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
  const post = await response.json();
  return { response, post };
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
  const todo = await response.json();
  return { response, todo };
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
) => {
  const usersReq = authUsersRequest(request, headers);
  const response = await usersReq.editUser(userId, userPayload);
  const updatedUser = await response.json();
  return { response, updatedUser };
};
