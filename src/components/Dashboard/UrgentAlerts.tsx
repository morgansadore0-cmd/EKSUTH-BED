import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, getCollectionName } from '../../firebase/config';
import { Patient, Bed } from '../../types';
import { AlertTriangle, ArrowRight, BellRing } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function UrgentAlerts() {
  const [waitingPatients, setWaitingPatients] = useState<Patient[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  
  // Use a ref to keep track of patients without causing re-subscribing in effect
  const patientsRef = useRef<Patient[]>([]);
  const prevAvailableCount = useRef(-1); // -1 means uninitialized
  
  useEffect(() => {
    // 1. Listen for waiting patients (CRITICAL or URGENT)
    const pQuery = query(collection(db, getCollectionName('patients')), where('admissionStatus', '==', 'WAITING'));
    const unsubP = onSnapshot(pQuery, (snap) => {
      const p = snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
      const urgentPatients = p.filter(x => x.priority === 'CRITICAL' || x.priority === 'URGENT');
      setWaitingPatients(urgentPatients);
      patientsRef.current = urgentPatients;
    });

    // 2. Listen for available beds
    const bQuery = query(collection(db, getCollectionName('beds')), where('status', '==', 'AVAILABLE'));
    const unsubB = onSnapshot(bQuery, (snap) => {
      const newBeds = snap.docs.map(d => ({ id: d.id, ...d.data() } as Bed));
      setAvailableBeds(newBeds);
      
      // Real-time Push Notification check
      if (prevAvailableCount.current !== -1) {
        if (newBeds.length > prevAvailableCount.current && patientsRef.current.length > 0) {
          toast.info(
            <div className="flex flex-col gap-1">
              <span className="font-bold">Bed Available!</span>
              <span className="text-sm">A new bed is now available for pending urgent admissions.</span>
            </div>, 
            { 
              autoClose: 8000,
              icon: <BellRing className="w-5 h-5 text-emerald-500 animate-pulse" />
            }
          );
        }
      }
      
      prevAvailableCount.current = newBeds.length;
    });

    return () => { 
      unsubP(); 
      unsubB(); 
    };
  }, []);

  if (waitingPatients.length === 0 || availableBeds.length === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 mt-0.5 shrink-0 animate-pulse" />
        <div>
          <h3 className="text-sm font-bold text-red-800 dark:text-red-400">Urgent Allocation Required</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {availableBeds.length} bed(s) are currently available, and {waitingPatients.length} critical/urgent patient(s) are waiting for admission.
          </p>
        </div>
      </div>
      <Link 
        to="/admissions"
        className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-colors flex items-center gap-2"
      >
        Review Queue <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
