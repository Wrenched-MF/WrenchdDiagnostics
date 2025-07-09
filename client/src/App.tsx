import { useState } from "react";

function App() {
  const [message, setMessage] = useState("Wrench'd IVHC - System Initializing");

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-green-400">Wrench'd IVHC</h1>
        <p className="text-gray-300 text-lg">{message}</p>
        <button 
          onClick={() => setMessage("System Ready - Please login to continue")}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-medium transition-colors"
        >
          Initialize System
        </button>
      </div>
    </div>
  );
}

export default App;
