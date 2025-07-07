// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import CreatePollPage from './pages/CreatePollPage';
import PollPage from './pages/PollPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ResultsPage from './pages/ResultsPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import FeedPage from './pages/FeedPage';
import NotificationsPage from './pages/NotificationsPage';
import TagPage from './pages/TagPage';
import SearchPage from './pages/SearchPage';
import TagsPage from './pages/TagsPage';
import EditPollPage from './pages/EditPollPage';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prevMode => !prevMode);

  const handleLogout = async (silent = false) => {
    try {
      await signOut(auth);
      if (!silent) toast.success('¡Has cerrado sesión!');
    } catch (error) {
      if (!silent) toast.error('Error al cerrar sesión.');
    }
  };
  
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <p>Cargando Opinao...</p>
      </div>
    );
  }

  return (
    <div className="bg-light-bg dark:bg-dark-bg min-h-screen font-sans text-gray-800 dark:text-gray-200 selection:bg-primary/30">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      <main className="container mx-auto p-4 md:p-8">
        <Routes>
          <Route path="/" element={user && !user.profileComplete ? <Navigate to="/complete-profile" /> : <HomePage />} />
          <Route path="/poll/:id" element={<PollPage />} />
          <Route path="/profile/:authorUid" element={<ProfilePage />} />
          <Route path="/tag/:tagName" element={<TagPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
          <Route path="/complete-profile" element={user && !user.profileComplete ? <CompleteProfilePage handleLogout={handleLogout} /> : <Navigate to="/" />} />
          
          <Route path="/feed" element={<ProtectedRoute profileRequired={true}><FeedPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute profileRequired={true}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute profileRequired={true}><CreatePollPage /></ProtectedRoute>} />
          <Route path="/poll/:id/edit" element={<ProtectedRoute profileRequired={true}><EditPollPage /></ProtectedRoute>} />
          <Route path="/poll/:id/results" element={<ProtectedRoute profileRequired={true}><ResultsPage /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute profileRequired={true}><EditProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute profileRequired={true}><AccountSettingsPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}