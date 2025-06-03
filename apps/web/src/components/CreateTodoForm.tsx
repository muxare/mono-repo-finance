import React, { useState } from 'react';
import { useCreateTodo } from '../hooks/useTodos';
import type { CreateTodoRequest } from '../types/todo';

interface CreateTodoFormProps {
  onCancel?: () => void;
}

export const CreateTodoForm: React.FC<CreateTodoFormProps> = ({ onCancel }) => {
  const [formData, setFormData] = useState<CreateTodoRequest>({
    title: '',
    description: '',
  });

  const createTodoMutation = useCreateTodo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await createTodoMutation.mutateAsync(formData);
      setFormData({ title: '', description: '' });
      onCancel?.();
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        required
        placeholder="What needs to be done?"
      />
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Add a description (optional)"
        rows={2}
      />
      
      <div className="form-actions">
        <button 
          type="submit" 
          disabled={createTodoMutation.isPending || !formData.title.trim()}
          className="btn-primary"
        >
          {createTodoMutation.isPending ? 'Creating...' : '✨ Create Todo'}
        </button>
        
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="btn"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
