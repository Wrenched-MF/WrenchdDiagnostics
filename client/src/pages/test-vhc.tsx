import { useState } from "react";
import { useParams } from "wouter";

export default function TestVHC() {
  const { jobId } = useParams();
  const [test, setTest] = useState("Working");

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold text-green-400">Test VHC Component</h1>
      <p>Job ID: {jobId}</p>
      <p>State: {test}</p>
      <button 
        onClick={() => setTest("Clicked")}
        className="bg-green-600 text-white px-4 py-2 rounded mt-4"
      >
        Test Button
      </button>
    </div>
  );
}