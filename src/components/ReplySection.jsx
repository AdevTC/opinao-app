// src/components/ReplySection.jsx (Corregido)

import React, { useState, useEffect } from 'react';
// Importamos onSnapshot en lugar de getDocs
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Reply } from './Reply';

export const ReplySection = ({ commentPath, replyCount, onHighlight, onReply }) => {
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);

    // --- INICIO DE LA CORRECCIÓN ---
    // Este useEffect ahora escucha cambios en tiempo real.
    useEffect(() => {
        // Si no estamos mostrando las respuestas, no hacemos nada.
        if (!showReplies) {
            setReplies([]); // Limpiamos las respuestas al ocultarlas.
            return;
        }

        setLoadingReplies(true);
        const repliesRef = collection(db, `${commentPath}/replies`);
        const q = query(repliesRef, orderBy("createdAt", "asc"));

        // onSnapshot devuelve una función para "desuscribirse" del escucha.
        // Esto es crucial para evitar fugas de memoria.
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedReplies = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, path: doc.ref.path }));
            setReplies(fetchedReplies);
            setLoadingReplies(false);
        }, (error) => {
            console.error("Error al cargar respuestas en tiempo real:", error);
            setLoadingReplies(false);
        });

        // La función de limpieza de useEffect: se llama cuando el componente
        // se "desmonta" o cuando sus dependencias cambian.
        return () => {
            unsubscribe();
        };
    }, [showReplies, commentPath]); // Se ejecuta cada vez que cambia `showReplies` o `commentPath`.
    // --- FIN DE LA CORRECCIÓN ---

    const handleToggleReplies = () => {
        setShowReplies(!showReplies);
    };

    if (replyCount === 0) {
        return null;
    }

    return (
        <div className="mt-2">
            <button onClick={handleToggleReplies} disabled={loadingReplies} className="text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">
                {loadingReplies ? 'Cargando...' : (showReplies ? '— Ocultar respuestas' : `— Ver las ${replyCount} respuestas`)}
            </button>

            {showReplies && (
                <div className="pl-5 border-l-2 border-gray-200 dark:border-gray-700 mt-2 space-y-1">
                    {replies.map(reply => (
                        <Reply 
                            key={reply.id} 
                            replyData={reply} 
                            onReply={onReply} 
                            onHighlight={onHighlight}
                            parentCommentPath={commentPath} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};