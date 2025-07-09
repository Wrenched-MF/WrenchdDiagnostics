import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import LoadingPage from "@/pages/loading";
import HomePage from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import AuthPage from "@/pages/auth-page";
import UserSettings from "@/pages/user-settings";
import CreateJob from "@/pages/create-job";
import InspectionDashboard from "@/pages/inspection-dashboard";
import JobCard from "@/pages/job-card";
import PreInspection from "@/pages/pre-inspection";
import NotFound from "@/pages/not-found";
import { getQueryFn } from "./lib/queryClient";

// VHC Component with task selection functionality
function VHCPage() {
  const [selectedTasks, setSelectedTasks] = useState(["Wheels and tyres"]);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const availableInspections = [
    { name: "Wheels and tyres", required: true },
    { name: "Exhaust inspection", required: false },
    { name: "Brake inspection", required: false },
    { name: "Suspension inspection", required: false },
    { name: "Servicing", required: false },
    { name: "Air Conditioning", required: false },
    { name: "Vehicle safety check", required: false },
    { name: "Winter / Summer checks", required: false },
  ];

  const handleTaskToggle = (taskName: string) => {
    if (taskName === "Wheels and tyres") return; // Always required
    
    if (selectedTasks.includes(taskName)) {
      setSelectedTasks(selectedTasks.filter(t => t !== taskName));
    } else {
      setSelectedTasks([...selectedTasks, taskName]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-2">Vehicle Health Check</h1>
          <p className="text-gray-300">Professional vehicle inspection system</p>
        </div>

        <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Inspection Tasks</h2>
            <button
              onClick={() => setShowTaskModal(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm font-medium"
            >
              + Add Task
            </button>
          </div>

          <div className="space-y-3">
            {selectedTasks.map((task, index) => (
              <div key={index} className="bg-white/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{task}</span>
                  {task === "Wheels and tyres" && (
                    <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs border border-green-500/30">
                      Required
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg text-white font-medium">
              Start VHC Inspection
            </button>
          </div>
        </div>

        {/* Task Selection Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-white text-lg font-semibold mb-4">Select Inspection Tasks</h3>
              <div className="space-y-3 mb-6">
                {availableInspections.map((inspection, index) => (
                  <button
                    key={index}
                    onClick={() => handleTaskToggle(inspection.name)}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      selectedTasks.includes(inspection.name)
                        ? 'bg-green-600/20 border-green-500 text-green-400'
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    } ${inspection.required ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={inspection.required}
                  >
                    <div className="flex items-center justify-between">
                      <span>{inspection.name}</span>
                      {inspection.required && (
                        <span className="text-green-400 text-xs">(Required)</span>
                      )}
                      {selectedTasks.includes(inspection.name) && !inspection.required && (
                        <span className="text-green-400">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="bg-white/10 border border-white/30 text-white hover:bg-white/20 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Router() {
  const [showLoading, setShowLoading] = useState(true);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || showLoading) {
    return <LoadingPage onComplete={() => setShowLoading(false)} />;
  }

  const isAuthenticated = !!user;

  return (
    <Switch>
      {isAuthenticated ? (
        <>
          <Route path="/" component={HomePage} />
          <Route path="/dashboard" component={InspectionDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/settings" component={UserSettings} />
          <Route path="/create-job" component={CreateJob} />
          <Route path="/jobs/:id" component={JobCard} />
          <Route path="/pre-inspection/:jobId" component={PreInspection} />
          <Route path="/vhc/:jobId" component={VHCPage} />
        </>
      ) : (
        <Route path="/" component={AuthPage} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
