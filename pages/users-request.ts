import { APIRequestContext } from "@playwright/test";
import { User } from "./models/user";
import { Request } from "./request";
import { Post, Todo } from "./models/";

export class UsersRequest implements Request {
  readonly request: APIRequestContext;
  readonly endpoint: string = "/public/v2/users";
  readonly headers?: any;

  constructor(request: APIRequestContext, headers?: any) {
    this.request = request;
    this.headers = headers;
  }

  #parameterizedEndpoint = (userId: number) => `${this.endpoint}/${userId}`;

  getUsers = async (params?: any, user_id?: number) => {
    let endpoint = this.endpoint;

    if (user_id) {
      endpoint = this.#parameterizedEndpoint(user_id);
      params = undefined;
    }

    return await this.request.get(endpoint, {
      headers: this.headers,
      params: params,
    });
  };

  createUser = async (user: User) =>
    await this.request.post(this.endpoint, {
      headers: this.headers,
      data: user,
    });

  deleteUser = async (userId: number) =>
    await this.request.delete(this.#parameterizedEndpoint(userId), {
      headers: this.headers,
    });

  addPost = async (userId: number, post: Post) =>
    await this.request.post(`${this.#parameterizedEndpoint(userId)}/posts`, {
      headers: this.headers,
      data: post,
    });

  addTodo = async (userId: number, toDo: Todo) =>
    await this.request.post(`${this.#parameterizedEndpoint(userId)}/todos`, {
      headers: this.headers,
      data: toDo,
    });

  updateUser = async (userId: number, user: Partial<User>) =>
    await this.request.patch(this.#parameterizedEndpoint(userId), {
      headers: this.headers,
      data: user,
    });
}
