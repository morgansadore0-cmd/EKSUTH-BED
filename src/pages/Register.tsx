import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, query, collection, where, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (e.target.name === 'staffId') {
      value = value.toUpperCase().trim();
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    
    setLoading(true);
    
    try {
      // 1. Verify Staff ID against authorized registry
      const registryRef = doc(db, 'staffRegistry', formData.staffId);
      const registrySnap = await getDoc(registryRef);
      
      if (!registrySnap.exists()) {
        toast.error("Staff ID could not be verified. Please check your Staff ID or contact the hospital administrator.");
        setLoading(false);
        return;
      }
      
      const registryData = registrySnap.data() as StaffRegistry;
      
      if (registryData.status === 'ASSIGNED') {
        toast.error("This Staff ID is already associated with an account.");
        setLoading(false);
        return;
      }
      
      if (registryData.status === 'SUSPENDED' || registryData.status === 'DEACTIVATED') {
        toast.error("This Staff ID is currently inactive. Please contact the hospital administrator.");
        setLoading(false);
        return;
      }
      
      if (registryData.email.toLowerCase() !== formData.email.toLowerCase()) {
        toast.error("The provided email does not match the authorized email for this Staff ID.");
        setLoading(false);
        return;
      }

      // 2. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // 3. Create User Document with Role derived from Registry
      const newUser: User = {
        id: user.uid,
        name: formData.fullName,
        email: formData.email,
        role: registryData.role, // NEVER trust frontend, use the registry role
        staffId: formData.staffId,
        department: formData.department,
        phone: formData.phone,
        status: 'PENDING_APPROVAL', // New accounts must be approved
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };
      
      await setDoc(doc(db, 'users', user.uid), newUser);
      
      // 4. Update Staff Registry to ASSIGNED
      await updateDoc(doc(db, 'staffRegistry', formData.staffId), {
        status: 'ASSIGNED',
        linkedUserId: user.uid,
        updatedAt: Date.now()
      });
      
      toast.success("Your staff account has been created and is awaiting administrator approval.");
      
      // Sign out immediately because they are pending
      await auth.signOut();
      navigate('/login');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/network-request-failed') {
        toast.error("Network error. Please check your connection or try opening the app in a new tab.");
      } else {
        toast.error(error.message || "Failed to register account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <img src={building} alt="Hospital Building" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-emerald-950/80 mix-blend-multiply" />
      </div>
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center">
          <img className="h-12 w-12 object-contain rounded-lg shadow-sm mb-4" src={logo} alt="EKSUTH Logo" />
          <h2 className="text-center text-3xl font-extrabold text-gray-900">CREATE STAFF ACCOUNT</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Register your authorized EKSUTH staff account.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input name="fullName" type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={formData.fullName} onChange={handleChange} disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Staff ID</label>
              <input name="staffId" type="text" required pattern="^EKSUTH-[A-Z]+-\d{4}-\d+$" title="Format: EKSUTH-[ROLE]-[YEAR]-[NUMBER]" placeholder="EKSUTH-NUR-2026-001" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={formData.staffId} onChange={handleChange} disabled={loading} />
              <p className="mt-1 text-[11px] text-gray-500">Your Staff ID is provided by EKSUTH administration.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input name="email" type="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={formData.email} onChange={handleChange} disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input name="phone" type="tel" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={formData.phone} onChange={handleChange} disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select name="department" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={formData.department} onChange={handleChange} disabled={loading}>
                <option value="">Select Department</option>
                <option value="Emergency">Emergency</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Surgery">Surgery</option>
                <option value="Obstetrics & Gynaecology">Obstetrics & Gynaecology</option>
                <option value="Paediatrics">Paediatrics</option>
                <option value="Orthopaedics">Orthopaedics</option>
                <option value="Intensive Care">Intensive Care</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
            <div className="md:col-span-2 border-t border-gray-200 mt-2 pt-4"></div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input name="password" type="password" required minLength={6} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={formData.password} onChange={handleChange} disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input name="confirmPassword" type="password" required minLength={6} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={formData.confirmPassword} onChange={handleChange} disabled={loading} />
            </div>
          </div>
          <div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'CREATE ACCOUNT'}
            </button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
