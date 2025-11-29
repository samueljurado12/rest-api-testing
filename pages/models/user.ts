import { Record } from "./base";

export interface User extends Record {
  id?: number;
  name: string;
  email: string;
  gender: string;
  status: string;
}
