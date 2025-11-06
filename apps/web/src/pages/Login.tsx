import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Authentication failed';
      
      if (err.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase Authentication is not configured. Please enable Email/Password authentication in Firebase Console.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden">
      {/* Background Image with enhanced styling */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-700 ease-out"
        style={{
          backgroundImage: 'url(/mine-tunnel-bg.jpg)',
          filter: 'brightness(0.7) contrast(1.1)',
        }}
      />
      
      {/* Gradient overlay - darker at edges, lighter in center for focus */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/70" />
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.8) 100%)',
        }}
      />
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      
      {/* Radial gradient background glow - enhanced */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] radial-glow opacity-15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
      </div>
      
      <Card className="relative z-10 w-full max-w-md bg-card/80 backdrop-blur-xl border-cyan-400/40 shadow-2xl shadow-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text">Minewise AI</CardTitle>
          <CardDescription className="text-gray-400">
            {isSignUp ? 'Create an account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive/30">{error}</div>}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-white">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-background/50 border-cyan-400/20 text-white placeholder:text-gray-500 focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/50"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-white">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-background/50 border-cyan-400/20 text-white placeholder:text-gray-500 focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/50"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
