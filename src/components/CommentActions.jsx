// src/components/CommentActions.jsx (Actualizado con botón de Edición)
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageSquare, Trash2, Edit } from 'lucide-react';

export const CommentActions = ({ onLike, onReply, onDelete, onEdit, isAuthor, isEditing, likeCount, userHasLiked }) => {
    const { user } = useAuth();

    // No mostramos los botones si el comentario se está editando
    if (isEditing) {
        return null;
    }

    return (
        <div className="flex items-center gap-4">
            <button 
                onClick={onLike} 
                disabled={!user} 
                className={`flex items-center gap-1 text-xs font-bold transition-colors disabled:cursor-not-allowed ${userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
                <Heart size={14} fill={userHasLiked ? 'currentColor' : 'none'} /> 
                {likeCount > 0 ? likeCount : 'Me gusta'}
            </button>
            <button 
                onClick={onReply} 
                disabled={!user} 
                className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary disabled:cursor-not-allowed"
            >
                <MessageSquare size={14} /> Responder
            </button>
            {isAuthor && (
                <>
                    <button onClick={onEdit} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary">
                        <Edit size={14} />
                    </button>
                    <button onClick={onDelete} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-500">
                        <Trash2 size={14} />
                    </button>
                </>
            )}
        </div>
    );
};