import { Payload } from "./base/payload";

export interface ErrorMessage extends Payload {
  message: string;
}
