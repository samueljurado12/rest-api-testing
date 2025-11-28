import { APIRequestContext } from "@playwright/test";
import { IRequest } from "./IRequest";

export class PostsRequest implements IRequest {
  readonly request: APIRequestContext;
  readonly endpoint: string = "/public/v2/posts";
  readonly headers?: any;

  constructor(request: APIRequestContext, headers?: any) {
    this.request = request;
    this.headers = headers;
  }

  deletePost = async (postId: number) => {
    await this.request.delete(`${this.endpoint}/${postId}`, {
      headers: this.headers,
    });
  };

  getPosts = async (params?: any) => {
    await this.request.get(this.endpoint, {
      params: params,
    });
  };
}
