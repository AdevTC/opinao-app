// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, profileRequired = false }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (profileRequired && !user.profileComplete) {
        return <Navigate to="/complete-profile" replace />;
    }
    
    return children;
}
