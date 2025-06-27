import React, { useState, useEffect } from 'react';
import { Chrome, UserCheck, Shield, Clock, Zap, Brain, Stethoscope, UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import MetricsDisplay from '../MetricsDisplay';
import { supabase } from '../../utils/supabaseClient';

interface LoginScreenProps {
  updateState: (updates: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ updateState }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        updateState({
          isLoggedIn: true,
          currentPage: 'home',
          currentUser: session.user
        });
      }
    };
    checkSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        updateState({
          isLoggedIn: true,
          currentPage: 'home',
          currentUser: session.user
        });
      } else {
        updateState({
          isLoggedIn: false,
          currentUser: null
        });
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [updateState]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      alert('Google sign-in failed: ' + error.message);
      setIsLoading(false);
    }
    // On success, Supabase will handle redirect and session
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      updateState({ 
        isLoggedIn: true,
        currentPage: 'home',
        currentUser: {
          email: 'guest@rescufast.ai',
          user_metadata: {
            full_name: 'Guest User'
          },
          isGuest: true
        }
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Basic validation
    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
    }

    // Simulate authentication
    setTimeout(() => {
      updateState({ 
        isLoggedIn: true,
        currentPage: 'home',
        currentUser: {
          email: formData.email,
          user_metadata: {
            full_name: formData.fullName || formData.email.split('@')[0]
          },
          isGuest: false
        }
      });
      setIsLoading(false);
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-white flex relative">
      {/* Bolt.new Badge - Responsive positioning */}
      <a 
        href="https://bolt.new/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 z-50 hover:scale-105 transition-transform duration-200"
        title="Powered by Bolt.new"
      >
        <img 
          src="/black_circle_360x360.png" 
          alt="Powered by Bolt.new" 
          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 drop-shadow-lg hover:drop-shadow-xl transition-all duration-200"
        />
      </a>

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-700 to-red-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-32 left-32 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full"></div>
        </div>
        
        {/* Content - Adjusted padding to avoid badge overlap */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white pt-20">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Emergency Care
              <br />
              <span className="text-red-200">Reimagined</span>
            </h1>
            <p className="text-xl text-red-100 leading-relaxed mb-8">
              Bangladesh's first AI-powered ambulance service. Fast, intelligent, and always there when you need us most.
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI-Powered Dispatch</h3>
                <p className="text-red-100">Intelligent routing and fastest response times</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Real-Time Tracking</h3>
                <p className="text-red-100">Live GPS tracking with precise ETA</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI-Powered Hospital Matching</h3>
                <p className="text-red-100">Smart hospital matching based on real-time traffic, bed availability, and nearest location</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Medical Assessment</h3>
                <p className="text-red-100">Smart AI gives you fast health checks and finds the right hospital for you</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">24/7 Availability</h3>
                <p className="text-red-100">Always ready when emergencies happen</p>
              </div>
            </div>
          </div>
          
          {/* Live Stats */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold mb-4 text-red-100">Live System Performance</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">8.3min</div>
                <div className="text-red-200 text-sm">Avg Response</div>
                <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-2 animate-pulse"></div>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">94.7%</div>
                <div className="text-red-200 text-sm">AI Accuracy</div>
                <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-2 animate-pulse"></div>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">47</div>
                <div className="text-red-200 text-sm">Active Units</div>
                <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login/Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md pt-16 sm:pt-20 lg:pt-8">
          {/* Logo for mobile - Adjusted margin to avoid badge overlap */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Rescufast.ai
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Emergency medical services</p>
            
            {/* Mobile Live Stats */}
            <div className="mt-6 bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-red-600">8.3min</div>
                  <div className="text-xs text-gray-600">Response</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">94.7%</div>
                  <div className="text-xs text-gray-600">AI Accuracy</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">47</div>
                  <div className="text-xs text-gray-600">Active</div>
                </div>
              </div>
              <div className="flex items-center justify-center mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-gray-500">Live data</span>
              </div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 text-base sm:text-lg px-2">
              {isSignUp 
                ? 'Join Rescufast.ai for emergency medical services' 
                : 'Sign in to access emergency medical services'
              }
            </p>
          </div>

          {/* Auth Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                !isSignUp 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                isSignUp 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                  required
                  minLength={isSignUp ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm your password"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg text-base font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {isSignUp ? <UserPlus className="h-5 w-5 mr-2" /> : <Mail className="h-5 w-5 mr-2" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">or continue with</span>
            </div>
          </div>

          {/* Social Login & Guest */}
          <div className="space-y-3">
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-lg text-base font-medium hover:border-gray-300 hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-3 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Chrome className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform duration-200" />
              <span>Continue with Google</span>
            </button>

            {/* Guest Login */}
            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full bg-gray-100 border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-lg text-base font-medium hover:bg-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserCheck className="h-5 w-5 text-gray-600" />
              <span>Continue as Guest</span>
            </button>
          </div>

          {/* Forgot Password Link (only for sign in) */}
          {!isSignUp && (
            <div className="text-center mt-4">
              <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                Forgot your password?
              </button>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-2">
              <Shield className="h-4 w-4" />
              <span>Secure authentication</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed px-2">
              {isSignUp 
                ? 'By creating an account, you agree to our Terms of Service and Privacy Policy. Your medical data is encrypted and secure.'
                : 'Guest mode provides full demo access. Sign up to save your medical history and preferences.'
              }
            </p>
          </div>

          {/* Mobile Features - Adjusted spacing */}
          <div className="lg:hidden mt-8 grid grid-cols-1 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <Clock className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 text-sm">8min Response</h3>
              <p className="text-gray-600 text-xs">Average arrival time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;