import { Record } from "./base";

export interface Todo extends Record {
  id?: number;
  user_id?: number;
  due_on?: string;
  title: string;
  status: string;
}
