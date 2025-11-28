import { ErrorMessage } from "./error-message";

export interface FieldErrorMessage extends ErrorMessage {
  message: string;
  field: string;
}
