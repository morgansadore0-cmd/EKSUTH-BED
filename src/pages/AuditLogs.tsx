import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AuditLog } from '../types';
import { Search, Filter, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  useEffect(() => {
    // Fetch last 500 audit logs to keep it manageable on the client
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(500));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesEntity = entityFilter === 'ALL' || log.entity === entityFilter;
      
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        (log.userName?.toLowerCase() || '').includes(term) ||
        (log.action?.toLowerCase() || '').includes(term) ||
        (log.details?.toLowerCase() || '').includes(term) ||
        (log.entityId?.toLowerCase() || '').includes(term);
        
      return matchesEntity && matchesSearch;
    });
  }, [logs, searchTerm, entityFilter]);

  const getEntityColor = (entity: string) => {
    switch (entity) {
      case 'BED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PATIENT': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'STAFF': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ALLOCATION': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'WARD': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-emerald-600" />
          System Audit Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">Review system activities, access histories, and status changes.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            placeholder="Search by user, action, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-5 w-5 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="block w-full sm:w-48 pl-3 pr-10 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          >
            <option value="ALL">All Entities</option>
            <option value="BED">Bed</option>
            <option value="PATIENT">Patient</option>
            <option value="STAFF">Staff</option>
            <option value="ALLOCATION">Allocation</option>
            <option value="WARD">Ward</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                      No audit logs match your search criteria.
                    </td>
                  </tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {format(log.timestamp, 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900">{log.userName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx(
                        "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border",
                        getEntityColor(log.entity)
                      )}>
                        {log.entity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                      <div className="truncate" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
