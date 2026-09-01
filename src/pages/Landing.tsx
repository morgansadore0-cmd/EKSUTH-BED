import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Activity, Shield, Clock, Users, ArrowRight, LayoutDashboard, Search } from 'lucide-react';
import logo from '../assets/images/1146_company_logo.jpg';
import building from '../assets/images/images.jpg';

const features = [
  {
    name: 'Real-Time Bed Management',
    description: 'Monitor available, occupied, reserved, maintenance and cleaning beds in real time.',
    icon: Activity,
  },
  {
    name: 'Automated Bed Allocation',
    description: 'Automatically identify suitable beds based on patient requirements, ward compatibility and clinical priority.',
    icon: Search,
  },
  {
    name: 'Hospital-Wide Visibility',
    description: 'View hospital capacity across wards from one centralized dashboard.',
    icon: LayoutDashboard,
  },
  {
    name: 'Secure Access',
    description: 'Protect hospital operations with secure authentication and role-based access.',
    icon: Shield,
  },
  {
    name: 'Responsive Access',
    description: 'Use the system on phones, tablets, laptops and desktop computers.',
    icon: Users,
  },
  {
    name: 'Better Patient Flow',
    description: 'Reduce unnecessary waiting and improve hospital admission efficiency.',
    icon: Clock,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { loginMock } = useAuth();

  const handleDemoMode = () => {
    localStorage.setItem('demo_mode', 'true');
    loginMock('NURSE');
    toast.info('Interactive Demo Sandbox Launched');
    navigate('/dashboard');
  };

  const handleLiveMode = () => {
    localStorage.removeItem('demo_mode');
  };
  return (
    <div className="bg-white min-h-screen font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EKSUTH Logo" className="h-12 w-12 object-contain rounded-md" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-emerald-900 leading-tight">EKSUTH</span>
              <span className="text-xs text-emerald-700 font-medium tracking-wider">BED MANAGEMENT SYSTEM</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" onClick={handleLiveMode} className="text-sm font-medium text-gray-700 hover:text-emerald-700 px-3 py-2">
              Staff Login
            </Link>
            <button
              onClick={handleDemoMode}
              className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
            >
              Try Demo
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <div className="relative isolate pt-14 pb-20 sm:pt-24 sm:pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img 
              src={building} 
              alt="EKSUTH Hospital Building" 
              className="w-full h-full object-cover opacity-10" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/95" />
          </div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-emerald-950 sm:text-6xl">
              Smart Bed Management for Better Patient Care
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              A secure, real-time bed allocation and hospital capacity management platform designed to help Ekiti State University Teaching Hospital improve patient flow, optimize bed utilization and make faster allocation decisions.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/login"
                onClick={handleLiveMode}
                className="rounded-md bg-emerald-700 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all flex items-center gap-2"
              >
                Staff Login <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleDemoMode}
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-emerald-700 shadow-sm border border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                Interactive Demo
              </button>
              <a href="#features" className="text-base font-semibold leading-6 text-emerald-900 hover:text-emerald-700">
                Explore the System <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Feature Section */}
        <div id="features" className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-emerald-700">Faster Workflows</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need to manage capacity
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Allocate the right bed to the right patient as quickly and safely as possible while giving authorized hospital staff real-time visibility of hospital capacity.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.name} className="flex flex-col bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                        <feature.icon className="h-6 w-6 text-emerald-700" aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-emerald-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
          <img src={logo} alt="EKSUTH Logo" className="h-10 w-10 object-contain rounded mb-6 brightness-90" />
          <p className="text-sm leading-6 text-emerald-200 font-medium">Ekiti State University Teaching Hospital</p>
          <p className="text-sm leading-6 text-emerald-200/70">Ado-Ekiti, Ekiti State, Nigeria</p>
          <p className="text-sm leading-6 text-emerald-200/50 mt-4">EKSUTH Automated Bed Allocation System &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
