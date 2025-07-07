// src/contexts/AuthContext.jsx
import React, { useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let profileListener = () => {};
        let notificationListener = () => {}; // <-- Listener para notificaciones

        const authListener = onAuthStateChanged(auth, (firebaseUser) => {
            profileListener();
            notificationListener(); // Limpiamos los listeners anteriores al cambiar de usuario

            if (firebaseUser) {
                // Listener para el perfil del usuario (como antes)
                const userDocRef = doc(db, "users", firebaseUser.uid);
                profileListener = onSnapshot(userDocRef, (userDoc) => {
                    const profileData = userDoc.data();
                    const profileComplete = userDoc.exists();
                    
                    // Listener anidado para las notificaciones no leídas
                    const notifRef = collection(db, "users", firebaseUser.uid, "notifications");
                    const q = query(notifRef, where("read", "==", false));
                    notificationListener = onSnapshot(q, (notifSnapshot) => {
                        // Actualizamos el objeto de usuario con la info del perfil Y las notificaciones
                        setUser({ 
                            uid: firebaseUser.uid, 
                            email: firebaseUser.email, 
                            profileComplete, 
                            ...profileData,
                            unreadNotifications: notifSnapshot.size // Añadimos el contador de no leídas
                        });
                        setLoading(false);
                    });
                }, (error) => {
                    console.error("Error escuchando el perfil:", error);
                    setUser(null);
                    setLoading(false);
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        // Limpieza final cuando el AuthProvider se desmonta
        return () => {
            authListener();
            profileListener();
            notificationListener();
        };
    }, []);

    const value = {
        user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}