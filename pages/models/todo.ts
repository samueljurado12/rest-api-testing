export default interface Todo {
  id?: number;
  user_id?: number;
  due_on?: string;
  title: string;
  status: string;
}
