import { Record } from "./base";

export interface Response<T extends Record> {
  status: number;
  body: T;
}
