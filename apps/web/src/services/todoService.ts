import { api } from '../lib/api';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types/todo';

export const todoApi = {
  // Get all todos
  getTodos: async (): Promise<Todo[]> => {
    const response = await api.get<Todo[]>('/todos');
    return response.data;
  },

  // Get a single todo
  getTodo: async (id: number): Promise<Todo> => {
    const response = await api.get<Todo>(`/todos/${id}`);
    return response.data;
  },

  // Create a new todo
  createTodo: async (todo: CreateTodoRequest): Promise<Todo> => {
    const response = await api.post<Todo>('/todos', todo);
    return response.data;
  },

  // Update a todo
  updateTodo: async (id: number, todo: UpdateTodoRequest): Promise<Todo> => {
    const response = await api.put<Todo>(`/todos/${id}`, todo);
    return response.data;
  },

  // Delete a todo
  deleteTodo: async (id: number): Promise<void> => {
    await api.delete(`/todos/${id}`);
  },
};
