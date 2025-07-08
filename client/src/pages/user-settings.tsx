import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, FileText, Palette, Monitor, Settings, Smartphone, Wifi } from "lucide-react";
import { Link, useLocation } from "wouter";
import wrenchdLogo from "@assets/wrenchd_ivhc_icon_512x512_1752010342000.png";

export default function UserSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [wifiHintEnabled, setWifiHintEnabled] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState("blue");
  const [cameraPosition, setCameraPosition] = useState("left");

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <img src={wrenchdLogo} alt="Wrench'd IVHC" className="w-10 h-10" />
              <h1 className="text-xl font-bold text-white">User Settings</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/80 text-sm">
                {user?.firstName || user?.username}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Settings Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">
              {user?.firstName || user?.username}
            </h2>
            <p className="text-white/80 text-sm">
              SWITCH USER / LOG OUT
            </p>
          </div>

          {/* Settings Grid */}
          <Card className="bg-gradient-to-b from-blue-600 to-blue-700 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white text-center">Application Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Inspection Flow */}
                <div 
                  className="flex flex-col items-center space-y-3 p-4 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => toast({ title: "Inspection Flow", description: "Feature coming soon" })}
                >
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center text-white">
                    <div className="font-medium">Inspection Flow</div>
                    <div className="text-sm opacity-80">Dropdowns</div>
                  </div>
                </div>
                
                {/* Theme Selector */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-center text-white mb-2">
                    <div className="font-medium">Choose Theme</div>
                    <div className="text-sm opacity-80">{selectedTheme === "blue" ? "Blue Theme" : "White Theme"}</div>
                  </div>
                  <div className="flex flex-col space-y-2 w-full">
                    <div 
                      className={`flex flex-col items-center space-y-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTheme === "blue" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
                      }`}
                      onClick={() => setSelectedTheme("blue")}
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <Palette className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-white">Blue Theme</span>
                    </div>
                    <div 
                      className={`flex flex-col items-center space-y-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTheme === "white" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
                      }`}
                      onClick={() => setSelectedTheme("white")}
                    >
                      <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-xs text-white">White Theme</span>
                    </div>
                  </div>
                </div>
                
                {/* Camera Controls */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-center text-white mb-2">
                    <div className="font-medium">Camera Controls</div>
                    <div className="text-sm opacity-80">{cameraPosition}</div>
                  </div>
                  <div className="flex flex-col space-y-2 w-full">
                    <div 
                      className={`flex flex-col items-center space-y-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        cameraPosition === "left" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
                      }`}
                      onClick={() => setCameraPosition("left")}
                    >
                      <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-white">Left</span>
                    </div>
                    <div 
                      className={`flex flex-col items-center space-y-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        cameraPosition === "right" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
                      }`}
                      onClick={() => setCameraPosition("right")}
                    >
                      <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-white">Right</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* WiFi Toggle */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Wifi className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">Turn Off WiFi Antenna Hint</span>
                  </div>
                  <Switch 
                    checked={wifiHintEnabled}
                    onCheckedChange={setWifiHintEnabled}
                  />
                </div>
              </div>
              
              {/* Save Settings */}
              <div className="mt-8 flex justify-center">
                <Button 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 px-8"
                  onClick={() => {
                    toast({
                      title: "Settings Saved",
                      description: "Your preferences have been updated successfully.",
                    });
                  }}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* App Version */}
          <div className="text-center">
            <p className="text-white/60 text-sm">App version: 3.2.17 Live</p>
          </div>
        </div>
      </main>
    </div>
  );
}