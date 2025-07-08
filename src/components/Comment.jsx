// src/components/Comment.jsx (Actualizado con Edición)

import React, { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, increment, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useHighlight } from '../contexts/HighlightContext';
import { toast } from 'react-hot-toast';

import { CommentHeader } from './CommentHeader';
import { CommentBody } from './CommentBody';
import { CommentActions } from './CommentActions';
import { ReplyForm } from './ReplyForm';
import { ReplySection } from './ReplySection';

export const Comment = ({ commentData, commentPath }) => {
    const { user } = useAuth();
    const { highlightedId, highlightComment } = useHighlight();

    const [comment, setComment] = useState(commentData);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [mentioning, setMentioning] = useState('');

    // --- 1. Nuevos estados para el modo de edición ---
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(commentData.text);

    const isAuthor = user?.uid === comment.authorUid;

    useEffect(() => {
        const docRef = doc(db, commentPath);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setComment({ ...data, id: doc.id });
                // Sincronizamos el texto de edición si no estamos editando activamente
                if (!isEditing) {
                    setEditText(data.text);
                }
            }
        });
        return unsubscribe;
    }, [commentPath, isEditing]);

    const handleLike = useCallback(async () => {
        if (!user) return;
        const commentRef = doc(db, commentPath);
        const userHasLiked = comment.likes?.includes(user.uid);
        await updateDoc(commentRef, {
            likes: userHasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
            likeCount: increment(userHasLiked ? -1 : 1)
        });
    }, [user, commentPath, comment.likes]);

    const handleDelete = useCallback(async () => {
        if (!isAuthor) return;
        if (window.confirm("¿Estás seguro de que quieres eliminar este comentario? Todas las respuestas también se borrarán.")) {
            try {
                await deleteDoc(doc(db, commentPath));
                toast.success("Comentario eliminado.");
            } catch (error) {
                toast.error("No se pudo eliminar el comentario.");
            }
        }
    }, [isAuthor, commentPath]);

    const toggleReplyForm = useCallback((usernameToMention) => {
        setMentioning(usernameToMention);
        setShowReplyForm(prev => !prev);
    }, []);

    // --- 2. Nueva función para guardar el comentario editado ---
    const handleUpdateComment = async () => {
        if (!editText.trim()) {
            return toast.error("El comentario no puede estar vacío.");
        }
        const commentRef = doc(db, commentPath);
        try {
            await updateDoc(commentRef, {
                text: editText,
            });
            toast.success("Comentario actualizado.");
            setIsEditing(false);
        } catch (error) {
            toast.error("No se pudo actualizar el comentario.");
        }
    };

    return (
        <div className={`py-4 ${highlightedId === comment.id ? 'highlight-comment' : ''}`} id={comment.id}>
            <div className="flex gap-3">
                <CommentHeader authorUid={comment.authorUid} authorAvatarUrl={comment.authorAvatarUrl} authorUsername={comment.authorUsername} />
                <div className="flex-1 bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
                    {/* --- 3. Renderizado condicional: o texto o editor --- */}
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full text-sm p-2 rounded-lg bg-white dark:bg-gray-700 border-2 border-primary focus:outline-none min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditing(false)} className="text-xs font-bold px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-600">Cancelar</button>
                                <button onClick={handleUpdateComment} className="text-xs font-bold px-3 py-1 rounded-md bg-primary text-white">Guardar</button>
                            </div>
                        </div>
                    ) : (
                        <CommentBody authorUid={comment.authorUid} authorUsername={comment.authorUsername} createdAt={comment.createdAt} text={comment.text} />
                    )}
                </div>
            </div>

            <div className="ml-14 mt-1">
                <CommentActions
                    onLike={handleLike}
                    onReply={() => toggleReplyForm(comment.authorUsername)}
                    onDelete={handleDelete}
                    onEdit={() => setIsEditing(true)} // Pasamos la función para activar la edición
                    isAuthor={isAuthor}
                    isEditing={isEditing} // Informamos si ya se está editando
                    likeCount={comment.likeCount}
                    userHasLiked={comment.likes?.includes(user?.uid)}
                />

                {showReplyForm && (
                    <ReplyForm
                        commentPath={commentPath}
                        mentioning={mentioning}
                        onReplySuccess={() => setShowReplyForm(false)}
                    />
                )}

                <ReplySection
                    commentPath={commentPath}
                    replyCount={comment.replyCount}
                    onHighlight={{ id: highlightedId, action: highlightComment }}
                    onReply={toggleReplyForm}
                />
            </div>
        </div>
    );
};