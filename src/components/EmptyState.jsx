// src/components/EmptyState.jsx

import React from 'react';
import { Link } from 'react-router-dom';

export const EmptyState = ({ icon, title, message, actionText, actionTo }) => {
    return (
        <div className="text-center text-gray-500 p-8 rounded-xl bg-light-container dark:bg-dark-container my-8">
            <div className="mx-auto mb-4 text-primary w-16 h-16 flex items-center justify-center bg-primary/10 rounded-full">
                {React.cloneElement(icon, { size: 40 })}
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">{title}</h2>
            <p>{message}</p>
            {actionText && actionTo && (
                <Link to={actionTo} className="inline-block mt-4 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
                    {actionText}
                </Link>
            )}
        </div>
    );
};