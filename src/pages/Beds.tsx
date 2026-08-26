import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Bed, Ward, BedStatus } from '../types';
import { Search, Filter, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import BedHistoryLog from '../components/Beds/BedHistoryLog';
import BedTimelineModal from '../components/Beds/BedTimelineModal';
import MaintenanceAlert from '../components/Dashboard/MaintenanceAlert';

export default function Beds() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wards, setWards] = useState<Record<string, Ward>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const { hasRole, userData } = useAuth();
  
  const canEditBeds = hasRole(['SUPER_ADMIN', 'ADMIN', 'BED_MANAGER', 'NURSE', 'DOCTOR', 'ADMISSION_OFFICER']);

  useEffect(() => {
    // Load Wards
    const unsubWards = onSnapshot(collection(db, 'wards'), (snapshot) => {
      const wardsData: Record<string, Ward> = {};
      snapshot.forEach(doc => {
        wardsData[doc.id] = { id: doc.id, ...doc.data() } as Ward;
      });
      setWards(wardsData);
    });

    // Load Beds
    const q = query(collection(db, 'beds'));
    const unsubBeds = onSnapshot(q, (snapshot) => {
      const bedsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bed));
      setBeds(bedsData);
      setLoading(false);
      
      // Update selected bed if it's open
      setSelectedBed(prev => {
        if (!prev) return null;
        const updated = bedsData.find(b => b.id === prev.id);
        return updated || null;
      });
    });

    return () => {
      unsubWards();
      unsubBeds();
    };
  }, []);

  const handleStatusChange = async (bedId: string, currentStatus: string, newStatus: BedStatus) => {
    if (!canEditBeds) return toast.error("You don't have permission to update bed status");
    if (currentStatus === 'OCCUPIED' && newStatus !== 'OCCUPIED') {
      return toast.warning("Cannot manually change status of an occupied bed. Please discharge or transfer the patient first.");
    }
    
    try {
      const batch = writeBatch(db);
      const bedRef = doc(db, 'beds', bedId);
      
      batch.update(bedRef, {
        status: newStatus,
        updatedAt: Date.now()
      });

      const auditRef = doc(collection(db, 'auditLogs'));
      batch.set(auditRef, {
        userId: userData?.id || 'sys',
        userName: userData?.name || 'System',
        action: 'STATUS_CHANGED',
        entity: 'BED',
        entityId: bedId,
        timestamp: Date.now(),
        details: `Status changed from ${currentStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`
      });

      await batch.commit();
      toast.success("Bed status updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update bed status");
    }
  };

  const filteredBeds = beds.filter(bed => {
    const matchesSearch = bed.bedNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || bed.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'OCCUPIED': return 'bg-red-100 text-red-800 border-red-200';
      case 'RESERVED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MAINTENANCE': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CLEANING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OUT_OF_SERVICE': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 relative flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bed Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage hospital bed inventory</p>
        </div>
      </div>

      {!loading && <MaintenanceAlert beds={beds} />}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search bed number..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="RESERVED">Reserved</option>
            <option value="CLEANING">Cleaning</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBeds.map((bed) => (
              <div 
                key={bed.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
                onClick={() => setSelectedBed(bed)}
              >
                <div className="p-3 border-b border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-slate-900">{bed.bedNumber}</h3>
                  <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-bold border", getStatusColor(bed.status))}>
                    {bed.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ward:</span>
                    <span className="font-medium text-slate-900 text-right truncate max-w-[120px]" title={wards[bed.wardId]?.name}>
                      {wards[bed.wardId]?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-medium text-slate-900">{bed.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gender:</span>
                    <span className="font-medium text-slate-900">{bed.genderCompatibility}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 px-3 py-2 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                {canEditBeds && bed.status !== 'OCCUPIED' ? (
                  <select
                    className="block w-full text-[11px] border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500 py-1"
                    value={bed.status}
                    onChange={(e) => handleStatusChange(bed.id, bed.status, e.target.value as BedStatus)}
                  >
                    <option value="AVAILABLE">Mark Available</option>
                    <option value="RESERVED">Mark Reserved</option>
                    <option value="CLEANING">Mark Cleaning</option>
                    <option value="MAINTENANCE">Mark Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                ) : (
                  <div className="text-[11px] text-slate-500 italic w-full text-center py-1">
                    {bed.status === 'OCCUPIED' ? 'Patient Currently Admitted' : 'Read Only'}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredBeds.length === 0 && (
            <div className="col-span-full py-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-sm text-slate-500">No beds found matching your filters.</p>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Bed Detail Modal / Drawer */}
      {selectedBed && (
        <div className="absolute inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm rounded-xl overflow-hidden transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bed {selectedBed.bedNumber}</h2>
                <p className="text-[10px] font-medium text-slate-500">{wards[selectedBed.wardId]?.name}</p>
              </div>
              <button 
                onClick={() => setSelectedBed(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Status Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Current Status</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className={clsx("px-2 py-1 rounded text-xs font-bold border", getStatusColor(selectedBed.status))}>
                    {selectedBed.status.replace('_', ' ')}
                  </span>
                </div>
                
                {canEditBeds && selectedBed.status !== 'OCCUPIED' && (
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Update Status</label>
                    <select
                      className="block w-full text-sm border-slate-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500 py-1.5"
                      value={selectedBed.status}
                      onChange={(e) => handleStatusChange(selectedBed.id, selectedBed.status, e.target.value as BedStatus)}
                    >
                      <option value="AVAILABLE">Mark Available</option>
                      <option value="RESERVED">Mark Reserved</option>
                      <option value="CLEANING">Mark Cleaning</option>
                      <option value="MAINTENANCE">Mark Maintenance</option>
                      <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>
                  </div>
                )}
                {selectedBed.status === 'OCCUPIED' && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 mt-2">
                    Cannot manually change status. Patient is currently admitted in this bed.
                  </p>
                )}
              </div>

              {/* Attributes Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Bed Attributes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-400">Type</span>
                    <span className="text-xs font-bold text-slate-800">{selectedBed.type}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Gender</span>
                    <span className="text-xs font-bold text-slate-800">{selectedBed.genderCompatibility}</span>
                  </div>
                </div>
              </div>

              {/* History Log Section */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3 pl-1">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Activity History</h3>
                  <button 
                    onClick={() => setIsTimelineModalOpen(true)}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded transition-colors"
                  >
                    Expand
                  </button>
                </div>
                <BedHistoryLog bedId={selectedBed.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBed && (
        <BedTimelineModal 
          isOpen={isTimelineModalOpen} 
          onClose={() => setIsTimelineModalOpen(false)} 
          bed={selectedBed} 
        />
      )}
    </div>
  );
}
