import React, { useEffect, useState } from 'react';
import { X, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, getCollectionName } from '../../firebase/config';
import { Ward, Patient } from '../../types';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface QuickTransferModalProps {
  patient: Patient;
  onClose: () => void;
}

export default function QuickTransferModal({ patient, onClose }: QuickTransferModalProps) {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWards = async () => {
      try {
        const snap = await getDocs(collection(db, getCollectionName('wards')));
        const w = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ward));
        setWards(w.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        toast.error("Failed to load wards");
      } finally {
        setLoading(false);
      }
    };
    fetchWards();
  }, []);

  const handleSelectWard = async (wardId: string) => {
    setTransferring(wardId);
    try {
      const pRef = doc(db, getCollectionName('patients'), patient.id);
      await updateDoc(pRef, { 
        requiredWardId: wardId,
        updatedAt: Date.now()
      });
      navigate('/allocation', { state: { patientId: patient.id } });
    } catch (e) {
      console.error(e);
      toast.error('Failed to initiate transfer');
      setTransferring(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Select Target Ward</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Transfer: {patient.fullName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : wards.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No wards available</div>
          ) : (
            <div className="space-y-2">
              {wards.filter(w => w.id !== patient.currentWardId).map(ward => (
                <button
                  key={ward.id}
                  onClick={() => handleSelectWard(ward.id)}
                  disabled={transferring !== null}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                      <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{ward.name}</p>
                      <p className="text-xs text-slate-500">{ward.type}</p>
                    </div>
                  </div>
                  {transferring === ward.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
