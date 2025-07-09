import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
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
import VHC from "@/pages/vhc";
import WheelsInspection from "@/pages/wheels-inspection";
import NotFound from "@/pages/not-found";
import { getQueryFn } from "./lib/queryClient";

function Router() {
  const [showLoading, setShowLoading] = useState(true);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    // Show loading screen for at least 3 seconds on initial load
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading screen if auth is loading or during initial app load
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
          <Route path="/pre-inspection/:jobId">
            {(params) => {
              console.log('Pre-inspection route matched with params:', params);
              return <PreInspection />;
            }}
          </Route>
          <Route path="/vhc/:jobId" component={VHC} />
          <Route path="/wheels-inspection/:jobId" component={WheelsInspection} />
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
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
