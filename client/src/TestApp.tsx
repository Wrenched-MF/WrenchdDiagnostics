function TestApp() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, black, #1a1a1a)', 
      color: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#10b981' }}>
          Wrench'd IVHC - Test Component
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          Testing React without external dependencies
        </p>
        <button 
          style={{
            background: '#10b981',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
          onClick={() => alert('React is working!')}
        >
          Test Button
        </button>
      </div>
    </div>
  );
}

export default TestApp;