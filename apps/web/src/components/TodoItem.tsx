import React, { useState } from 'react';
import { useUpdateTodo, useDeleteTodo } from '../hooks/useTodos';
import type { Todo, UpdateTodoRequest } from '../types/todo';

interface TodoItemProps {
  todo: Todo;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateTodoRequest>({
    title: todo.title,
    description: todo.description,
    isCompleted: todo.isCompleted,
  });

  const updateTodoMutation = useUpdateTodo();
  const deleteTodoMutation = useDeleteTodo();

  const handleToggleComplete = async () => {
    try {
      await updateTodoMutation.mutateAsync({
        id: todo.id,
        todo: { ...editData, isCompleted: !todo.isCompleted },
      });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      title: todo.title,
      description: todo.description,
      isCompleted: todo.isCompleted,
    });
  };

  const handleSaveEdit = async () => {
    if (!editData.title.trim()) return;

    try {
      await updateTodoMutation.mutateAsync({
        id: todo.id,
        todo: editData,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      title: todo.title,
      description: todo.description,
      isCompleted: todo.isCompleted,
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
      await deleteTodoMutation.mutateAsync(todo.id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };
  if (isEditing) {
    return (
      <div className={`todo-item editing ${todo.isCompleted ? 'completed' : ''}`}>
        <div className="todo-item-editor">
          <input
            type="text"
            name="title"
            value={editData.title}
            onChange={handleChange}
            className="edit-title"
            placeholder="Todo title"
          />
          <textarea
            name="description"
            value={editData.description}
            onChange={handleChange}
            className="edit-description"
            placeholder="Todo description"
            rows={2}
          />
          <div className="edit-actions">
            <button 
              onClick={handleSaveEdit}
              disabled={updateTodoMutation.isPending || !editData.title.trim()}
              className="btn-primary"
            >
              {updateTodoMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button 
              onClick={handleCancelEdit}
              className="btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`todo-item ${todo.isCompleted ? 'completed' : ''}`}>
      <div className="todo-content">
        <div className="todo-main">
          <input
            type="checkbox"
            checked={todo.isCompleted}
            onChange={handleToggleComplete}
            disabled={updateTodoMutation.isPending}
            className="todo-checkbox"
          />
          <div className="todo-text">
            <h3 className="todo-title">{todo.title}</h3>
            {todo.description && (
              <p className="todo-description">{todo.description}</p>
            )}
          </div>
        </div>
        
        <div className="todo-meta">
          <span className="todo-date">
            Created: {new Date(todo.createdAt).toLocaleDateString()}
          </span>
          {todo.completedAt && (
            <span className="todo-date completed-date">
              Completed: {new Date(todo.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
        <div className="todo-actions">
        <button 
          onClick={handleEdit}
          className="btn-action btn-edit"
          disabled={updateTodoMutation.isPending || deleteTodoMutation.isPending}
          title="Edit todo"
        >
          ✏️
        </button>
        <button 
          onClick={handleDelete}
          className="btn-action btn-delete"
          disabled={updateTodoMutation.isPending || deleteTodoMutation.isPending}
          title={deleteTodoMutation.isPending ? 'Deleting...' : 'Delete todo'}
        >
          {deleteTodoMutation.isPending ? '⏳' : '🗑️'}
        </button>
      </div>
    </div>
  );
};
