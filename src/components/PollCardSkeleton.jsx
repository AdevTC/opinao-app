// src/components/PollCardSkeleton.jsx (Actualizado con animación suave)

import React from 'react';

export const PollCardSkeleton = () => {
  return (
    // --- Usamos un estilo de pulso más lento y sutil ---
    <div className="bg-light-container dark:bg-dark-container p-6 rounded-xl shadow-lg animate-pulse" style={{ animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      <div className="flex flex-col justify-between h-full">
        <div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>

          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
        </div>
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-full mt-6"></div>
      </div>
    </div>
  );
};