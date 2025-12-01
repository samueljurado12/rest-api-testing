import { APIRequestContext } from "@playwright/test";

export interface Request {
  readonly request: APIRequestContext;
  readonly endpoint: string;
  readonly headers?: any;
}
