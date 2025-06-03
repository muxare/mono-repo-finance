import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoList } from './components/TodoList';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <header className="app-header">
          <h1>MonoRepo Todo App</h1>
          <p>A modern todo application built with .NET Core and React TypeScript</p>
        </header>
        
        <main className="app-main">
          <TodoList />
        </main>
        
        <footer className="app-footer">
          <p>Built with ❤️ using .NET Core, React, TypeScript, and Vite</p>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
