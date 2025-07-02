// src/contexts/AuthContext.jsx
import React, { useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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

        const authListener = onAuthStateChanged(auth, (firebaseUser) => {
            profileListener(); // Limpia el listener de perfil anterior

            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                // Escuchamos en tiempo real los cambios del perfil
                profileListener = onSnapshot(userDocRef, (userDoc) => {
                    const profileComplete = userDoc.exists();
                    setUser({ 
                        uid: firebaseUser.uid, 
                        email: firebaseUser.email, 
                        profileComplete, 
                        ...userDoc.data() 
                    });
                    setLoading(false);
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        // Limpiamos los listeners cuando el componente se desmonte
        return () => {
            authListener();
            profileListener();
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
