import { APIRequestContext } from "@playwright/test";

export interface IRequest {
  readonly request: APIRequestContext;
  readonly endpoint: string;
  readonly headers?: any;
}
