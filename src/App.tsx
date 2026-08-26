import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Beds from './pages/Beds';
import Patients from './pages/Patients';
import Allocation from './pages/Allocation';
import Wards from './pages/Wards';
import Staff from './pages/Staff';
import PendingApprovals from './pages/PendingApprovals';
import AuditLogs from './pages/AuditLogs';
import Placeholder from './pages/Placeholder';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="beds" element={<Beds />} />
            <Route path="wards" element={<Wards />} />
            <Route path="patients" element={<Patients />} />
            <Route path="allocation" element={<Allocation />} />
            <Route path="admissions" element={<Placeholder />} />
            <Route path="transfers" element={<Placeholder />} />
            <Route path="reports" element={<Placeholder />} />
            <Route path="notifications" element={<Placeholder />} />
            <Route 
              path="audit-logs" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              } 
            />
            <Route path="settings" element={<Placeholder />} />
            <Route 
              path="staff" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <Staff />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="approvals" 
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <PendingApprovals />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} aria-label="Notifications" />
    </AuthProvider>
  );
}

export default App;
