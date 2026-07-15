import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader as Loader2, LogIn, Chrome as Home, CircleAlert as AlertCircle, ShieldCheck, Delete } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';

type Role = 'customer' | 'technician' | 'admin';

const roleRedirects: Record<Role, string> = {
  customer: '/dashboard',
  technician: '/technician',
  admin: '/admin',
};

const PIN_LENGTH = 8;
const ADMIN_STORAGE_KEY = 'vattams_admin_session';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, session, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  // Admin PIN state
  const [pin, setPin] = useState('');
  const [pinSubmitting, setPinSubmitting] = useState(false);

  useEffect(() => {
    if (pendingRedirect && session && !authLoading) {
      setPendingRedirect(false);
      const fromPath = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(fromPath || roleRedirects[role]);
    }
  }, [pendingRedirect, session, authLoading, navigate, role, location]);

  useEffect(() => {
    if (session && !authLoading && !pendingRedirect && role !== 'admin') {
      const fromPath = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(fromPath || roleRedirects[role]);
    }
  }, [session, authLoading, navigate, role, pendingRedirect, location]);

  const submitPin = useCallback(
    async (fullPin: string) => {
      setPinSubmitting(true);
      setError(null);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/admin-pin-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify({ pin: fullPin }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invalid PIN');
          setPin('');
          return;
        }
        const adminSession = { token: data.token, expiresAt: data.expiresAt };
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminSession));
        navigate('/admin', { replace: true });
      } catch {
        setError('Unable to connect. Please check your internet connection and try again.');
        setPin('');
      } finally {
        setPinSubmitting(false);
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (role === 'admin' && pin.length === PIN_LENGTH && !pinSubmitting) {
      submitPin(pin);
    }
  }, [pin, pinSubmitting, role, submitPin]);

  const handlePinDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH || pinSubmitting) return;
    setError(null);
    setPin(pin + digit);
  };

  const handlePinDelete = () => {
    if (pinSubmitting) return;
    setError(null);
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role === 'admin') return;
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError);
        setLoading(false);
        return;
      }
      setPendingRedirect(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.';
      setError(message);
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const pinKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-12">
      <div className="w-full max-w-md">
        {/* VATTAMS Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">VATTAMS</h1>
          <p className="mt-1 text-sm text-slate-500">Home Services across Tamil Nadu</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <p className="text-sm text-slate-500">
              {isAdmin ? 'Enter your 8-digit Admin PIN' : 'Sign in to your account to continue'}
            </p>
          </CardHeader>

          <CardContent>
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['customer', 'technician', 'admin'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setError(null); setPin(''); }}
                    className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      role === r
                        ? r === 'admin'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {r === 'admin' && <ShieldCheck className="h-3.5 w-3.5" />}
                    {r === 'admin' ? 'Admin PIN' : r}
                  </button>
                ))}
              </div>
            </div>

            {isAdmin ? (
              /* Admin PIN Login */
              <div className="mt-6 space-y-4">
                {/* PIN dots */}
                <div className="flex justify-center gap-2">
                  {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 w-4 rounded-full transition-all duration-200 ${
                        i < pin.length ? 'bg-blue-600 scale-110' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Error / Loading */}
                <div className="h-6 text-center">
                  {error && <p className="text-sm font-medium text-red-600 animate-pulse">{error}</p>}
                  {pinSubmitting && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying PIN...
                    </div>
                  )}
                </div>

                {/* PIN Keypad */}
                <div className="grid grid-cols-3 gap-3">
                  {pinKeys.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handlePinDigit(k)}
                      disabled={pinSubmitting}
                      className="flex h-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-semibold text-slate-800 transition-all duration-150 hover:bg-slate-50 active:scale-95 disabled:opacity-40"
                    >
                      {k}
                    </button>
                  ))}
                  <div />
                  <button
                    type="button"
                    onClick={() => handlePinDigit('0')}
                    disabled={pinSubmitting}
                    className="flex h-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-semibold text-slate-800 transition-all duration-150 hover:bg-slate-50 active:scale-95 disabled:opacity-40"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handlePinDelete}
                    disabled={pinSubmitting || pin.length === 0}
                    className="flex h-14 items-center justify-center rounded-xl text-slate-500 transition-all duration-150 hover:bg-slate-100 active:scale-95 disabled:opacity-20"
                  >
                    <Delete className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Customer / Technician Login */
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-orange-600 hover:text-orange-700"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          {!isAdmin && (
            <div className="flex flex-col items-center gap-2 px-6 pb-6">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-orange-600 hover:text-orange-700">
                  Sign up
                </Link>
              </p>
              <p className="text-xs text-slate-400">
                Need help? Call us at <span className="font-medium text-slate-600">8189800757</span>
              </p>
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} VATTAMS Home Services. All rights reserved.
        </p>
      </div>
    </div>
  );
}
