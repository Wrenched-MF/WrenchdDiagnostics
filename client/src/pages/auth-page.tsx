import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Wrench, Lock, User, Mail, Eye, EyeOff } from "lucide-react";
import wrenchdLogo from "@assets/wrenchd_ivhc_icon_512x512_1752010342000.png";
import { useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: any) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: any) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    await loginMutation.mutateAsync(data);
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...userData } = data;
    await registerMutation.mutateAsync(userData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl shadow-2xl">
                <img 
                  src={wrenchdLogo}
                  alt="Wrench'd IVHC Logo" 
                  className="w-16 h-16"
                />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Wrench'd IVHC</h1>
              <p className="text-green-400 font-medium">Professional Vehicle Health Check</p>
            </div>
          </div>

          {/* Auth Forms */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/20">
                <TabsTrigger value="login" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <CardHeader>
                  <CardTitle className="text-white">Welcome Back</CardTitle>
                  <CardDescription className="text-white/80">
                    Sign in to access your inspection dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username" className="text-white">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="login-username"
                          {...loginForm.register("username")}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          placeholder="Enter your username"
                        />
                      </div>
                      {loginForm.formState.errors.username && (
                        <p className="text-red-400 text-sm">{loginForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-white">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          {...loginForm.register("password")}
                          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          placeholder="Enter your password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-white/60" />
                          ) : (
                            <Eye className="h-4 w-4 text-white/60" />
                          )}
                        </Button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-red-400 text-sm">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <CardHeader>
                  <CardTitle className="text-white">Create Account</CardTitle>
                  <CardDescription className="text-white/80">
                    Join Wrench'd IVHC to start professional vehicle inspections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-white">First Name</Label>
                        <Input
                          id="firstName"
                          {...registerForm.register("firstName")}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-white">Last Name</Label>
                        <Input
                          id="lastName"
                          {...registerForm.register("lastName")}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-username" className="text-white">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="register-username"
                          {...registerForm.register("username")}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          placeholder="Choose a username"
                        />
                      </div>
                      {registerForm.formState.errors.username && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="email"
                          type="email"
                          {...registerForm.register("email")}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      {registerForm.formState.errors.email && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-white">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          {...registerForm.register("password")}
                          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          placeholder="Create a password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-white/60" />
                          ) : (
                            <Eye className="h-4 w-4 text-white/60" />
                          )}
                        </Button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          {...registerForm.register("confirmPassword")}
                          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          placeholder="Confirm your password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-white/60" />
                          ) : (
                            <Eye className="h-4 w-4 text-white/60" />
                          )}
                        </Button>
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>

                    <Alert className="bg-yellow-500/10 border-yellow-500/20">
                      <AlertDescription className="text-yellow-200 text-sm">
                        New accounts require admin approval before access is granted.
                      </AlertDescription>
                    </Alert>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Right Panel - Hero Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-green-600/20 to-green-800/20">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-4">
            <Wrench className="w-24 h-24 text-green-400 mx-auto" />
            <h2 className="text-4xl font-bold text-white">
              Professional Vehicle Inspections
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Streamline your vehicle health checks with our tablet-optimized platform. 
              Generate comprehensive reports and manage all inspection data efficiently.
            </p>
          </div>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/80">Professional branded reports</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/80">Tablet-optimized interface</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/80">Comprehensive inspection tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/80">Secure data management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}