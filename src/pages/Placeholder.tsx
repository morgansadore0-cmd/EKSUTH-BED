import React from 'react';
import { useLocation } from 'react-router-dom';

export default function Placeholder() {
  const location = useLocation();
  const title = location.pathname.split('/').pop()?.replace('-', ' ') || 'Page';
  
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">{title}</h2>
        <p className="text-gray-500">
          This module is part of the future extensibility plan and will be implemented in a subsequent phase.
        </p>
      </div>
    </div>
  );
}
