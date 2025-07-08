// src/components/Reply.jsx (Actualizado con Edición)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, increment, arrayUnion, arrayRemove, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { CornerDownRight, Edit } from 'lucide-react'; // Importamos el icono de Editar
import { formatDate } from '../utils/helpers';

import { CommentHeader } from './CommentHeader';
import { CommentActions } from './CommentActions';

export const Reply = ({ replyData, onReply, onHighlight, parentCommentPath }) => {
    const { user } = useAuth();
    const [reply, setReply] = useState(replyData);
    const isAuthor = user?.uid === reply.authorUid;

    // --- 1. Nuevos estados para el modo de edición ---
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(replyData.text);

    useEffect(() => {
        const docRef = doc(db, replyData.path);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setReply({ ...data, id: doc.id, path: doc.ref.path });
                if (!isEditing) {
                    setEditText(data.text);
                }
            }
        });
        return unsubscribe;
    }, [replyData.path, isEditing]);

    const handleLike = async () => {
        if (!user) return;
        const replyRef = doc(db, reply.path);
        const userHasLiked = reply.likes?.includes(user.uid);
        await updateDoc(replyRef, {
            likes: userHasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
            likeCount: increment(userHasLiked ? -1 : 1)
        });
    };

    const handleDelete = async () => {
        if (!isAuthor) return;
        if (window.confirm("¿Estás seguro de que quieres eliminar esta respuesta?")) {
            try {
                const batch = writeBatch(db);
                batch.delete(doc(db, reply.path));
                batch.update(doc(db, parentCommentPath), { replyCount: increment(-1) });
                await batch.commit();
                toast.success("Respuesta eliminada");
            } catch (error) {
                toast.error("No se pudo eliminar la respuesta.");
            }
        }
    };

    // --- 2. Nueva función para guardar la respuesta editada ---
    const handleUpdateReply = async () => {
        if (!editText.trim()) {
            return toast.error("La respuesta no puede estar vacía.");
        }
        const replyRef = doc(db, reply.path);
        try {
            await updateDoc(replyRef, { text: editText });
            toast.success("Respuesta actualizada.");
            setIsEditing(false);
        } catch (error) {
            toast.error("No se pudo actualizar la respuesta.");
        }
    };

    return (
        <div className="flex gap-3 pt-3" id={reply.id}>
            <CommentHeader authorUid={reply.authorUid} authorAvatarUrl={reply.authorAvatarUrl} authorUsername={reply.authorUsername} />

            <div className="flex-1">
                <div className={`bg-light-bg dark:bg-dark-bg p-3 rounded-lg ${onHighlight.id === reply.id ? 'highlight-comment' : ''}`}>
                    {/* --- 3. Renderizado condicional: o texto o editor --- */}
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full text-sm p-2 rounded-lg bg-white dark:bg-gray-700 border-2 border-primary focus:outline-none min-h-[60px]"
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditing(false)} className="text-xs font-bold px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-600">Cancelar</button>
                                <button onClick={handleUpdateReply} className="text-xs font-bold px-3 py-1 rounded-md bg-primary text-white">Guardar</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-1">
                                <Link to={`/profile/${reply.authorUid}`} className="font-bold text-sm text-primary hover:underline">
                                    {reply.authorUsername}
                                </Link>
                                <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
                            </div>
                            <p className="text-sm break-words">
                                {reply.parentAuthorUsername && (
                                    <button onClick={() => onHighlight.action(reply.parentId)} className="mr-1.5 px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-bold inline-flex items-center gap-1 hover:bg-primary/20">
                                        <CornerDownRight size={12} /> {reply.parentAuthorUsername}
                                    </button>
                                )}
                                {reply.text}
                            </p>
                        </>
                    )}
                </div>
                <div className="mt-1">
                    <CommentActions
                        onLike={handleLike}
                        onReply={() => onReply(reply.authorUsername)}
                        onDelete={handleDelete}
                        onEdit={() => setIsEditing(true)}
                        isAuthor={isAuthor}
                        isEditing={isEditing}
                        likeCount={reply.likeCount}
                        userHasLiked={reply.likes?.includes(user?.uid)}
                    />
                </div>
            </div>
        </div>
    );
};