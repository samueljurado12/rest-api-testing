import { ErrorMessage } from "./error-message";

export interface FieldErrorMessage extends ErrorMessage {
  field: string;
}
