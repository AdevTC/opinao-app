// src/components/ReplyForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Send } from 'lucide-react';

export const ReplyForm = ({ commentPath, mentioning, onReplySuccess }) => {
    const { user } = useAuth();
    const [newReply, setNewReply] = useState('');
    const replyInputRef = useRef(null);

    // Enfoca el input automáticamente cuando el formulario aparece
    useEffect(() => {
        replyInputRef.current?.focus();
    }, []);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!newReply.trim() || !user) return;

        const repliesRef = collection(db, `${commentPath}/replies`);
        const commentRef = doc(db, commentPath);

        // Añadimos el nuevo documento de respuesta
        await addDoc(repliesRef, {
            text: newReply,
            authorUid: user.uid,
            authorUsername: user.username,
            authorAvatarUrl: user.avatarUrl || '',
            createdAt: serverTimestamp(),
            likes: [],
            likeCount: 0,
            parentAuthorUsername: mentioning,
            parentId: commentRef.id // Guardamos el ID del comentario padre
        });

        // Incrementamos el contador de respuestas en el comentario padre
        await updateDoc(commentRef, { replyCount: increment(1) });

        setNewReply('');
        if (onReplySuccess) {
            onReplySuccess();
        }
    };

    return (
        <form onSubmit={handleReplySubmit} className="flex gap-2 mt-2">
            <input
                ref={replyInputRef}
                type="text"
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder={`Respondiendo a @${mentioning}...`}
                className="w-full p-2 text-sm rounded-lg bg-white dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:outline-none"
            />
            <button type="submit" className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                <Send size={16} />
            </button>
        </form>
    );
};