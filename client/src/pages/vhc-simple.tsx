import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function VHCSimple() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/jobs/${jobId}`)}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">VHC Test Page</h1>
        </div>
        
        <div className="bg-black/50 p-6 rounded-lg border border-green-500/30">
          <p className="text-white mb-4">Simple VHC test component for job: {jobId}</p>
          <Button className="bg-green-600 hover:bg-green-700">
            Test Button
          </Button>
        </div>
      </div>
    </div>
  );
}