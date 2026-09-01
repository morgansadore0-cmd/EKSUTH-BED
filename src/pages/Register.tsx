import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, setDoc, getDocs, query, collection, where, updateDoc } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { User, StaffRegistry } from '../types';
import { toast } from 'react-toastify';
import logo from '../assets/images/1146_company_logo.jpg';
import building from '../assets/images/images.jpg';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    staffId: '',
    department: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    try {
      // 1. Verify staff ID in the registry
      const registryRef = query(collection(db, getCollectionName('staffRegistry')), where('staffId', '==', formData.staffId));
      const registrySnap = await getDocs(registryRef);

      if (registrySnap.empty) {
        toast.error("Staff ID not found in hospital registry. Please contact IT.");
        setLoading(false);
        return;
      }

      const staffRecord = registrySnap.docs[0].data() as StaffRegistry;
      const staffRecordId = registrySnap.docs[0].id;

      if (staffRecord.status !== 'AVAILABLE') {
        toast.error("This Staff ID is already registered or deactivated.");
        setLoading(false);
        return;
      }

      // Mock creation (bypassing Firebase Auth)
      const mockUid = 'user_' + Date.now().toString();

      // 3. Create Firestore User Profile
      const userProfile: User = {
        id: mockUid,
        name: staffRecord.fullName,
        email: staffRecord.email,
        role: staffRecord.role,
        staffId: staffRecord.staffId,
        department: staffRecord.department,
        phone: staffRecord.phone,
        status: 'PENDING_APPROVAL',
        createdAt: Date.now(),
        lastLogin: Date.now()
      };

      await setDoc(doc(db, getCollectionName('users'), mockUid), userProfile);

      // 4. Update Registry status
      await updateDoc(doc(db, getCollectionName('staffRegistry'), staffRecordId), {
        status: 'ASSIGNED',
        linkedUserId: mockUid,
        updatedAt: Date.now()
      });

      toast.success("Account created! Please await admin approval.");
      navigate('/login');
    } catch (error: any) {
      console.error(error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        <div className="absolute inset-0 bg-emerald-950/80 mix-blend-multiply" />
      </div>

      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-2xl relative z-10 my-8">
        <div className="flex flex-col items-center mb-8">
          <img
            className="h-12 w-12 object-contain rounded-lg shadow-sm mb-4"
            src={logo}
            alt="EKSUTH Logo"
          />
          <h2 className="text-center text-2xl font-extrabold text-gray-900">
            Staff Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your EKSUTH Staff ID to link your account.
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleRegister}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="staffId">EKSUTH Staff ID</label>
              <input
                id="staffId"
                name="staffId"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={formData.staffId}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 mt-4"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Register Account'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
