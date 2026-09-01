import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import logo from '../assets/images/1146_company_logo.jpg';
import building from '../assets/images/images.jpg';
import { Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { loginMock } = useAuth();
  
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    localStorage.removeItem('demo_mode');
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter email and password");
    
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      loginMock('SUPER_ADMIN'); 
      toast.success("Successfully logged in as Admin");
      setLoading(false);
      navigate(from, { replace: true });
    }, 800);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background with overlay */}
      <div className="absolute inset-0 -z-10">
        <img 
          src={building} 
          alt="EKSUTH Hospital Building" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-950/90 mix-blend-multiply" />
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl relative z-10 border-t-4 border-emerald-600">
        <div className="flex flex-col items-center">
          <img
            className="h-16 w-16 object-contain rounded-lg shadow-sm mb-4"
            src={logo}
            alt="EKSUTH Logo"
          />
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Authorized administrative access only.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">Admin Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In as Admin'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Return to Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
}
