import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '../services/todoService';
import type { CreateTodoRequest, UpdateTodoRequest } from '../types/todo';

export const QUERY_KEYS = {
  todos: ['todos'] as const,
  todo: (id: number) => ['todos', id] as const,
};

// Get all todos
export const useTodos = () => {
  return useQuery({
    queryKey: QUERY_KEYS.todos,
    queryFn: todoApi.getTodos,
  });
};

// Get a single todo
export const useTodo = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.todo(id),
    queryFn: () => todoApi.getTodo(id),
    enabled: !!id,
  });
};

// Create a todo
export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (todo: CreateTodoRequest) => todoApi.createTodo(todo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos });
    },
  });
};

// Update a todo
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, todo }: { id: number; todo: UpdateTodoRequest }) =>
      todoApi.updateTodo(id, todo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos });
    },
  });
};

// Delete a todo
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => todoApi.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos });
    },
  });
};
