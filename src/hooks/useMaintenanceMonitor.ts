import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs, setDoc, doc } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Bed } from '../types';

export function useMaintenanceMonitor() {
  const { isAdmin } = useAuth();
  const alertedBeds = useRef(new Set<string>());

  useEffect(() => {
    if (!isAdmin) return;

    let localBeds: Bed[] = [];
    
    // We only query beds currently in MAINTENANCE to minimize read operations
    const q = query(collection(db, getCollectionName('beds')), where('status', '==', 'MAINTENANCE'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      localBeds = snapshot.docs.map(document => ({ id: document.id, ...document.data() } as Bed));
      checkBeds(localBeds);
    }, (error) => {
      console.error("Maintenance Monitor Error:", error);
    });

    const checkBeds = (beds: Bed[]) => {
      const now = Date.now();
      const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

      beds.forEach(async (bed) => {
        const timeInState = now - (bed.updatedAt || bed.createdAt || 0);
        
        if (timeInState > FORTY_EIGHT_HOURS && !alertedBeds.current.has(bed.id)) {
          alertedBeds.current.add(bed.id);
          
          // Trigger the visual UI toast for the admin
          toast.warning(
            `System Alert: Bed ${bed.bedNumber} has been in MAINTENANCE for over 48 hours. Please review.`,
            {
              autoClose: false,
              toastId: `maintenance-alert-${bed.id}`,
            }
          );

          // Optionally, persist to the notifications collection for a future Notifications center
          try {
            await setDoc(doc(db, 'notifications', `maintenance-alert-${bed.id}`), {
              title: 'Prolonged Maintenance',
              message: `Bed ${bed.bedNumber} in Ward ${bed.wardId} has been in MAINTENANCE for over 48 hours.`,
              category: 'SYSTEM',
              isRead: false,
              timestamp: now
            }, { merge: true });
          } catch (e) {
            console.error("Failed to write notification", e);
          }
        }
      });
    };

    // Set up an interval to check periodically if any bed crosses the 48h threshold while the app is open
    // Check every minute
    const interval = setInterval(() => {
      checkBeds(localBeds);
    }, 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isAdmin]);
}
