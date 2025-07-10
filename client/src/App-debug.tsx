import React, { useState, useEffect } from "react";

export default function AppDebug() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log("AppDebug mounted successfully");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-400">Wrench'd IVHC Debug</h1>
        <p className="text-green-100">React hooks are working: {count}</p>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test React State
        </button>
        <p className="text-green-100/60 text-sm">
          If you can see this and the counter works, React is functioning properly.
        </p>
      </div>
    </div>
  );
}