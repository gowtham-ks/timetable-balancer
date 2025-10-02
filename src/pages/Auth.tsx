import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Calendar, Clock, Users, Sparkles } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    await signIn(email, password);
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const role = formData.get('role') as 'admin' | 'teacher' | 'student';
    
    await signUp(email, password, fullName, role);
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background animate-gradient-x" 
           style={{ backgroundSize: '200% 200%' }} />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse floating opacity-40" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl animate-pulse floating opacity-30" 
           style={{ animationDelay: '1s', animationDuration: '4s' }} />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl floating opacity-20" 
           style={{ animationDelay: '2s', animationDuration: '5s' }} />
      
      {/* Decorative icons */}
      <div className="absolute top-10 right-10 opacity-10 animate-bounce-in" style={{ animationDelay: '0.5s' }}>
        <Calendar className="w-12 h-12 text-primary" />
      </div>
      <div className="absolute bottom-10 left-10 opacity-10 animate-bounce-in" style={{ animationDelay: '0.7s' }}>
        <Clock className="w-16 h-16 text-primary-glow" />
      </div>
      <div className="absolute top-1/3 left-10 opacity-10 animate-bounce-in" style={{ animationDelay: '0.9s' }}>
        <Users className="w-10 h-10 text-primary" />
      </div>
      
      <Card className="w-full max-w-md relative z-10 glass border-primary/20 shadow-glow animate-scale-in backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center shadow-glow animate-bounce-in">
            <Calendar className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-2 animate-fade-in-delay-1">
            <CardTitle className="text-3xl font-bold gradient-text neon-glow">
              Timetable Balancer
            </CardTitle>
            <CardDescription className="text-base flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              Smart Academic Scheduling System
              <Sparkles className="w-4 h-4 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="animate-fade-in-delay-2">
          <Tabs defaultValue="signin" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm p-1">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="animate-fade-in space-y-4">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2 group">
                  <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="h-11 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2 group">
                  <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 hover:scale-[1.02] font-medium" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="animate-fade-in space-y-4">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2 group">
                  <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    className="h-11 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2 group">
                  <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="h-11 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2 group">
                  <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    className="h-11 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 hover:border-primary/50"
                    required
                  />
                </div>
                <div className="space-y-2 group">
                  <Label htmlFor="signup-role" className="text-sm font-medium">Role</Label>
                  <Select name="role" required>
                    <SelectTrigger className="h-11 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-300 hover:border-primary/50">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/20">
                      <SelectItem value="student" className="focus:bg-primary/20">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Student
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher" className="focus:bg-primary/20">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Teacher
                        </div>
                      </SelectItem>
                      <SelectItem value="admin" className="focus:bg-primary/20">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 hover:scale-[1.02] font-medium" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;