import { APIRequestContext } from "@playwright/test";
import { Request } from "./request";

export class TodosRequest implements Request {
  readonly request: APIRequestContext;
  readonly endpoint: string = "/public/v2/todos";
  readonly headers?: any;

  constructor(request: APIRequestContext, headers?: any) {
    this.request = request;
    this.headers = headers;
  }

  getTodos = async (params?: any) =>
    await this.request.get(this.endpoint, {
      params: params,
    });
}
