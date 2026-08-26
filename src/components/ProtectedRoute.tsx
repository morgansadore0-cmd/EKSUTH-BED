import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!userData) {
    // Edge case: user is authenticated but no firestore record yet.
    return <Navigate to="/login" replace />;
  }

  if (userData.role === 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Approval Pending</h2>
          <p className="text-gray-600">Your staff account is currently pending approval by an administrator. You will be able to access the system once approved.</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && userData.role !== 'SUPER_ADMIN' && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
