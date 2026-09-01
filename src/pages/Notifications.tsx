import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, getCollectionName } from '../firebase/config';
import { AuditLog } from '../types';
import { Bell, AlertCircle, Wrench, UserPlus, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function Notifications() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, getCollectionName('auditLogs')), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getIcon = (action: string) => {
    if (action.includes('MAINTENANCE') || action.includes('CLEANING')) return <Wrench className="w-5 h-5 text-amber-500" />;
    if (action.includes('PATIENT')) return <UserPlus className="w-5 h-5 text-blue-500" />;
    if (action.includes('ALLOCATED') || action.includes('ADMITTED')) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    return <AlertCircle className="w-5 h-5 text-slate-500" />;
  };

  const getBgColor = (action: string) => {
    if (action.includes('MAINTENANCE') || action.includes('CLEANING')) return 'bg-amber-50 dark:bg-amber-900/20';
    if (action.includes('PATIENT')) return 'bg-blue-50 dark:bg-blue-900/20';
    if (action.includes('ALLOCATED') || action.includes('ADMITTED')) return 'bg-emerald-50 dark:bg-emerald-900/20';
    return 'bg-slate-50 dark:bg-slate-800/50';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Live feed of hospital bed management activities</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div></div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">No notifications found.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {logs.map((log) => (
              <div key={log.id} className={clsx("p-4 sm:px-6 hover:bg-slate-50/50 dark:hover:bg-slate-750 transition-colors flex items-start gap-4", getBgColor(log.action))}>
                <div className="shrink-0 mt-1 bg-white dark:bg-slate-800 rounded-full p-2 shadow-sm border border-slate-200 dark:border-slate-700">
                  {getIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <time className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </time>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {log.details}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                    <span className="font-medium">User:</span> {log.userName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
