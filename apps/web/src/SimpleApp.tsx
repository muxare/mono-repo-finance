import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>MonoRepo Financial App</h1>
        <p>A modern financial application built with .NET Core and React TypeScript</p>
      </header>
      <main className="app-main">
        <div style={{ padding: '20px' }}>
          <h2>Simple Test Page</h2>
          <p>This is a basic test to see if the app is running correctly.</p>
          
          <div style={{ 
            padding: '20px', 
            border: '1px solid #ccc', 
            margin: '20px 0',
            borderRadius: '8px'
          }}>
            <h3>Environment Check</h3>
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>Local Storage Available:</strong> {typeof Storage !== 'undefined' ? 'Yes' : 'No'}</p>
          </div>
          
          <button 
            onClick={() => {
              fetch('http://localhost:5042/api/market/analysis/ema-fan?limit=3')
                .then(response => response.json())
                .then(data => {
                  alert(`API Test: Got ${data.length} companies`);
                })
                .catch(error => {
                  alert(`API Error: ${error.message}`);
                });
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Test API Connection
          </button>
        </div>
      </main>
      <footer className="app-footer">
        <p>Built with ❤️ using .NET Core, React, TypeScript, and Vite</p>
      </footer>
    </div>
  );
}

export default App;
