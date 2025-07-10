import { useEffect, useState } from "react";
import { Wrench, Settings, Database, Camera, FileText } from "lucide-react";
import wrenchdLogo from "@assets/wrenchd_ivhc_icon_512x512_1752010342000.png";

interface LoadingPageProps {
  onComplete: () => void;
}

export default function LoadingPage({ onComplete }: LoadingPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusStates, setStatusStates] = useState({
    database: false,
    camera: false,
    reports: false,
  });

  const loadingMessages = [
    "Initializing System...",
    "Connecting to Database...",
    "Loading Vehicle Profiles...",
    "Calibrating Sensors...",
    "Preparing Interface...",
    "Almost Ready..."
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 8 + 2;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 1000);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    const messageInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < loadingMessages.length - 1) {
          return prev + 1;
        }
        clearInterval(messageInterval);
        return prev;
      });
    }, 800);

    // Status updates
    setTimeout(() => setStatusStates(prev => ({ ...prev, database: true })), 1500);
    setTimeout(() => setStatusStates(prev => ({ ...prev, camera: true })), 2800);
    setTimeout(() => setStatusStates(prev => ({ ...prev, reports: true })), 4200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [onComplete]);

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Gear Animations */}
      <div className="absolute top-20 right-20 gear-rotate text-green-500">
        <Settings size={200} className="opacity-10" />
      </div>
      
      <div className="absolute bottom-32 left-16 gear-rotate text-white" 
           style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
        <Settings size={120} className="opacity-10" />
      </div>

      {/* Main Loading Container */}
      <div className="text-center space-y-12 max-w-md mx-auto px-8 animate-fade-in">
        
        {/* Logo Section */}
        <div className="space-y-6 animate-slide-up">
          {/* Logo Container */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-2xl logo-glow">
              <img 
                src={wrenchdLogo}
                alt="Wrench'd IVHC Logo" 
                className="w-20 h-20 mx-auto"
              />
            </div>
          </div>

          {/* App Title */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Wrench'd IVHC
            </h1>
            <p className="text-green-400 text-lg font-medium">
              Integrated Vehicle Health Check
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <span className="text-white text-sm font-medium">v3.0.0</span>
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          {/* Loading Message */}
          <div className="text-center space-y-4">
            <p className="text-white/80 text-lg">
              {loadingMessages[currentStep]}
            </p>
            
            {/* Loading Dots */}
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full loading-dot"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full loading-dot"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full loading-dot"></div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-sm mx-auto">
            <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
              <div 
                className="progress-bar h-2 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <div className="text-center mt-3">
              <span className="text-white/60 text-sm">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* System Status */}
          <div className="space-y-3 text-sm">
            <div className={`flex items-center justify-center space-x-3 transition-colors ${
              statusStates.database ? 'text-white' : 'text-white/60'
            }`}>
              <div className={`w-2 h-2 rounded-full transition-colors ${
                statusStates.database ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <Database size={16} className="mr-1" />
              <span>Database Connection</span>
            </div>
            <div className={`flex items-center justify-center space-x-3 transition-colors ${
              statusStates.camera ? 'text-white' : 'text-white/60'
            }`}>
              <div className={`w-2 h-2 rounded-full transition-colors ${
                statusStates.camera ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <Camera size={16} className="mr-1" />
              <span>Camera System</span>
            </div>
            <div className={`flex items-center justify-center space-x-3 transition-colors ${
              statusStates.reports ? 'text-white' : 'text-white/60'
            }`}>
              <div className={`w-2 h-2 rounded-full transition-colors ${
                statusStates.reports ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <FileText size={16} className="mr-1" />
              <span>Report Generator</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 animate-slide-up" style={{ animationDelay: '1s' }}>
          <p className="text-white/40 text-sm">
            Created by Luke Preece
          </p>
          <p className="text-white/30 text-xs">
            Professional Vehicle Inspection System
          </p>
        </div>
      </div>
    </div>
  );
}
