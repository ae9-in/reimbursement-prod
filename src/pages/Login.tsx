import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signOut, user, profile } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp({ email, password, fullName, department: "General" });
        toast.success("Account created!");
        navigate("/dashboard");
      } else {
        await signIn(email, password);
        toast.success("Signed in successfully");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Plane className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Employee Portal</CardTitle>
          <CardDescription>{isSignUp ? "Create your account" : "Sign in to manage your travel claims"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          {user && (
            <div className="mt-4 p-3 bg-muted rounded-md text-xs text-center space-y-2">
              <p>You are currently signed in as <strong>{profile?.full_name || user.email}</strong></p>
              <Button variant="outline" size="sm" onClick={signOut} className="w-full">Sign Out to Switch Accounts</Button>
            </div>
          )}
          {!isSignUp && (
            <div className="mt-6 pt-4 border-t text-center">
              <button onClick={() => navigate("/admin/login")} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Are you an Administrator? <span className="underline">Access Admin Portal</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
