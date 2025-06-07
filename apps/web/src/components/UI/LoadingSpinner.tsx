import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  const sizeClass = `spinner-${size}`;
  
  return (
    <div className="loading-spinner">
      <div className={`spinner ${sizeClass}`}></div>
      {message && <span className="loading-message">{message}</span>}
    </div>
  );
};

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry,
  title = 'Error'
}) => {
  return (
    <div className="error-message">
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Try Again
        </button>
      )}
    </div>
  );
};
