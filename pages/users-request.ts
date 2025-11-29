import { APIRequestContext } from "@playwright/test";
import { User } from "./models/user";
import { IRequest } from "./IRequest";
import { Post, Todo } from "./models/";

export class UsersRequest implements IRequest {
  readonly request: APIRequestContext;
  readonly endpoint: string = "/public/v2/users";
  readonly headers?: any;

  constructor(request: APIRequestContext, headers?: any) {
    this.request = request;
    this.headers = headers;
  }

  #parameterizedEndpoint = (userId: number) => `${this.endpoint}/${userId}`;

  getUsers = async (params?: any) =>
    await this.request.get(this.endpoint, {
      headers: this.headers,
      params: params,
    });

  getSingleUser = async (userId: number) =>
    await this.request.get(this.#parameterizedEndpoint(userId), {
      headers: this.headers,
    });

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

  editUser = async (userId: number, user: Partial<User>) =>
    await this.request.patch(this.#parameterizedEndpoint(userId), {
      headers: this.headers,
      data: user,
    });
}
