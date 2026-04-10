import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useRegister, useLogin, useGetMe } from "@workspace/api-client-react";
import { saveAuthToken } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, CheckCircle, Star, Target, BarChart3, ArrowRight, TrendingUp, Zap } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [regError, setRegError] = useState("");

  const { data: user } = useGetMe({ query: { retry: false, enabled: !!localStorage.getItem("auth_token") } });

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user]);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        saveAuthToken(data.token);
        queryClient.invalidateQueries();
        setLocation("/dashboard");
      },
      onError: () => {
        setLoginError("Invalid email or password");
      },
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        saveAuthToken(data.token);
        queryClient.invalidateQueries();
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        setRegError(err?.data?.error || "Registration failed. Please try again.");
      },
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    loginMutation.mutate({ data: { email: loginEmail, password: loginPassword } });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    registerMutation.mutate({ data: { name: regName, email: regEmail, password: regPassword } });
  };

  const features = [
    { icon: BarChart3, title: "Resume Score", desc: "Instant score across overall quality, clarity, and impact" },
    { icon: Target, title: "Skills Analysis", desc: "Spot your strengths and the skills you need to add" },
    { icon: CheckCircle, title: "ATS Compatibility", desc: "Make sure your resume clears automated screening filters" },
    { icon: TrendingUp, title: "Career Guidance", desc: "Discover the best career paths matched to your background" },
    { icon: Star, title: "Resume Enhancement", desc: "Get specific, actionable before-and-after suggestions" },
    { icon: FileText, title: "Interview Prep", desc: "Receive relevant interview questions based on your resume" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-primary/20">
            <Zap className="h-4 w-4" />
            AI-Powered Resume Analysis
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
            Your Resume,{" "}
            <span className="text-primary">Perfected.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Get instant, AI-powered feedback on your resume. Score, analyze, and enhance
            your resume to stand out in any job market.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Features Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Everything you need to land your dream job</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0 mt-0.5">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="mt-8 p-5 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm font-semibold text-primary mb-3">How it works</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="bg-primary/20 text-primary font-semibold rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">1</span>
                  Upload your resume or paste the text
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="bg-primary/20 text-primary font-semibold rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">2</span>
                  Get your instant AI-powered score and analysis
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="bg-primary/20 text-primary font-semibold rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">3</span>
                  Apply suggestions and land more interviews
                </div>
              </div>
            </div>
          </div>

          {/* Auth Card */}
          <div>
            <Card className="shadow-xl border-border/50">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-3">
                  <div className="bg-primary rounded-2xl p-3 shadow-lg">
                    <FileText className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">ResuAI</CardTitle>
                <CardDescription>Your AI-powered resume assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Create Account</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                      </div>
                      {loginError && (
                        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{loginError}</p>
                      )}
                      <Button type="submit" className="w-full" disabled={loginMutation.isPending} size="lg">
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-name">Full Name</Label>
                        <Input
                          id="reg-name"
                          type="text"
                          placeholder="Your full name"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          required
                          autoComplete="name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="you@example.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="Create a strong password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          minLength={6}
                          autoComplete="new-password"
                        />
                      </div>
                      {regError && (
                        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{regError}</p>
                      )}
                      <Button type="submit" className="w-full" disabled={registerMutation.isPending} size="lg">
                        {registerMutation.isPending ? "Creating account..." : "Create Free Account"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Free to use. No credit card required.
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
