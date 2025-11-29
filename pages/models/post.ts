import { Record } from "./base";

export interface Post extends Record {
  id?: number;
  user_id?: number;
  title: string;
  body: string;
}
