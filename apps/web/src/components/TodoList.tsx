import React, { useState } from 'react';
import { useTodos } from '../hooks/useTodos';
import { TodoItem } from './TodoItem';
import { CreateTodoForm } from './CreateTodoForm';

type FilterType = 'all' | 'active' | 'completed';

export const TodoList: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const { data: todos, isLoading, error } = useTodos();
  if (isLoading) {
    return (
      <div className="todo-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your todos...</p>
        </div>
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="todo-list-container">
        <div className="error-state">
          <h3>Oops! Something went wrong</h3>
          <p>Error loading todos: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const filteredTodos = todos?.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.isCompleted;
      case 'completed':
        return todo.isCompleted;
      default:
        return true;
    }
  }) || [];

  const completedCount = todos?.filter(todo => todo.isCompleted).length || 0;
  const totalCount = todos?.length || 0;

  return (
    <div className="todo-list-container">      <div className="todo-header">
        <h2>Todo List</h2>
        <div className="todo-stats">
          {totalCount > 0 && (
            <>
              <div className="stat-item">
                <span>Total:</span>
                <span className="stat-number">{totalCount}</span>
              </div>
              <div className="stat-item completed">
                <span>Completed:</span>
                <span className="stat-number">{completedCount}</span>
              </div>
              <div className="stat-item pending">
                <span>Pending:</span>
                <span className="stat-number">{totalCount - completedCount}</span>
              </div>
            </>
          )}
        </div>
      </div>      <div className="todo-controls">
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          {showCreateForm ? '❌ Cancel' : '➕ Add New Todo'}
        </button>
        
        <div className="filter-buttons">
          <button 
            onClick={() => setFilter('all')}
            className={`btn-filter ${filter === 'all' ? 'active' : ''}`}
          >
            All ({totalCount})
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`btn-filter ${filter === 'active' ? 'active' : ''}`}
          >
            Active ({totalCount - completedCount})
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`btn-filter ${filter === 'completed' ? 'active' : ''}`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>      {showCreateForm && (
        <div className="todo-form-section">
          <CreateTodoForm onCancel={() => setShowCreateForm(false)} />
        </div>
      )}      <div className="todo-items">
        {filteredTodos.length === 0 ? (
          <div className="empty-state">
            <h3>
              {filter === 'all' 
                ? '🎯 Ready to get things done?' 
                : `No ${filter} todos found`
              }
            </h3>
            <p>
              {filter === 'all' 
                ? 'Create your first todo and start being productive!' 
                : `Switch to a different filter to see your todos.`
              }
            </p>
          </div>
        ) : (
          filteredTodos.map(todo => (
            <TodoItem key={todo.id} todo={todo} />
          ))
        )}
      </div>
    </div>
  );
};
