  import { useState, useEffect } from "react";
  import { Switch, Route } from "wouter";
  import { QueryClientProvider } from "@tanstack/react-query";
  import { queryClient } from "./lib/queryClient";
  import { Toaster } from "@/components/ui/toaster";
  import { OfflineBanner } from "@/components/offline-indicator";
  import { offlineStorage } from "./lib/offline-storage";

  import HomePage from "@/pages/home";
  import AdminDashboard from "@/pages/admin-dashboard";
  import UserSettings from "@/pages/user-settings";
  import CreateJob from "@/pages/create-job";
  import InspectionDashboard from "@/pages/inspection-dashboard";
  import JobCard from "@/pages/job-card";
  import PreInspection from "@/pages/pre-inspection";
  import VHC from "@/pages/vhc";
  import WheelsInspection from "@/pages/wheels-inspection";
  import BrakeInspection from "@/pages/brake-inspection";
  import ExhaustInspection from "@/pages/exhaust-inspection";
  import AirConditioningInspection from "@/pages/air-conditioning-inspection";
  import SummerChecks from "@/pages/summer-checks";
  import WinterChecks from "@/pages/winter-checks";
  import ServiceInspection from "@/pages/service-inspection";
  import FitAndFinish from "@/pages/fit-and-finish";
  import NotFound from "@/pages/not-found";
  import LoadingPage from "@/pages/loading";

  function Router() {
    const [showLoading, setShowLoading] = useState(true);

    if (showLoading) {
      return <LoadingPage onComplete={() => setShowLoading(false)} />;
    }

    return (
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/dashboard" component={InspectionDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/settings" component={UserSettings} />
        <Route path="/create-job" component={CreateJob} />
        <Route path="/jobs/:id" component={JobCard} />
        <Route path="/pre-inspection/:jobId">
          {(params) => {
            console.log("Pre-inspection route matched with params:", params);
            return <PreInspection />;
          }}
        </Route>
        <Route path="/vhc/:jobId" component={VHC} />
        <Route path="/wheels-inspection/:jobId" component={WheelsInspection} />
        <Route path="/brake-inspection/:jobId" component={BrakeInspection} />
        <Route path="/exhaust-inspection/:jobId" component={ExhaustInspection} />
        <Route path="/air-conditioning-inspection/:jobId" component={AirConditioningInspection} />
        <Route path="/summer-checks/:jobId" component={SummerChecks} />
        <Route path="/winter-checks/:jobId" component={WinterChecks} />
        <Route path="/service-inspection/:jobId" component={ServiceInspection} />
        <Route path="/fit-and-finish/:jobId" component={FitAndFinish} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  export default function App() {
    useEffect(() => {
      offlineStorage.init().catch(console.error);
    }, []);

    return (
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
        <OfflineBanner />
      </QueryClientProvider>
    );
  }