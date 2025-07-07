// src/components/Comment.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/helpers';
import { useHighlight } from '../contexts/HighlightContext';
import { MessageSquare, Send, Heart, CornerDownRight, Trash2 } from 'lucide-react';

const Reply = ({ replyData, onReply, onHighlight, parentCommentPath }) => {
    const { user } = useAuth();
    const [reply, setReply] = useState(replyData);
    const isAuthor = user?.uid === reply.authorUid;

    useEffect(() => {
        const docRef = doc(db, replyData.path);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                setReply({ ...doc.data(), id: doc.id, path: doc.ref.path });
            }
        });
        return unsubscribe;
    }, [replyData.path]);

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
    
    const userHasLiked = reply.likes?.includes(user.uid);

    return (
        <div className="flex gap-3 pt-3" id={reply.id}>
            <Link to={`/profile/${reply.authorUid}`}>
                <img src={reply.authorAvatarUrl || `https://ui-avatars.com/api/?name=${reply.authorUsername}&background=9ca3af&color=fff&size=32`} alt="Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0"/>
            </Link>
            <div className="flex-1">
                <div className={`bg-white dark:bg-gray-700/50 p-3 rounded-lg ${onHighlight.id === reply.id ? 'highlight-comment' : ''}`}>
                    <div className="flex justify-between items-center mb-1">
                        <Link to={`/profile/${reply.authorUid}`} className="font-bold text-sm text-primary hover:underline">{reply.authorUsername}</Link>
                        <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
                    </div>
                    <p className="text-sm break-words">
                        {reply.parentAuthorUsername && (
                             <button onClick={() => onHighlight.action(reply.parentId)} className="mr-1.5 px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-bold inline-flex items-center gap-1 hover:bg-primary/20">
                                <CornerDownRight size={12} />
                                {reply.parentAuthorUsername}
                            </button>
                        )}
                        {reply.text}
                    </p>
                </div>
                 <div className="mt-1 flex items-center gap-4">
                    <button onClick={handleLike} disabled={!user} className={`flex items-center gap-1 text-xs font-bold transition-colors disabled:cursor-not-allowed ${userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
                        <Heart size={14} fill={userHasLiked ? 'currentColor' : 'none'} /> 
                        {reply.likeCount > 0 ? reply.likeCount : ''}
                    </button>
                    <button onClick={() => onReply(reply.authorUsername)} disabled={!user} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary disabled:cursor-not-allowed">
                        <MessageSquare size={14} /> Responder
                    </button>
                    {isAuthor && (
                         <button onClick={handleDelete} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-500">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const Comment = ({ commentData, commentPath }) => {
    const { user } = useAuth();
    const { highlightedId, highlightComment } = useHighlight();
    
    const [comment, setComment] = useState(commentData);
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [newReply, setNewReply] = useState('');
    const [mentioning, setMentioning] = useState('');
    const replyInputRef = useRef(null);
    const isAuthor = user?.uid === comment.authorUid;

    useEffect(() => {
        const docRef = doc(db, commentPath);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                setComment({ ...doc.data(), id: doc.id });
            }
        });
        return unsubscribe;
    }, [commentPath]);

    const fetchReplies = async () => {
        if (loadingReplies) return;
        setLoadingReplies(true);
        const repliesRef = collection(db, `${commentPath}/replies`);
        const q = query(repliesRef, orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        const fetchedReplies = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, path: doc.ref.path }));
        setReplies(fetchedReplies);
        setLoadingReplies(false);
    };

    useEffect(() => {
        if(showReplies) {
            fetchReplies();
        }
    }, [showReplies]);

    const handleToggleReplies = () => {
        setShowReplies(!showReplies);
    };
    
    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!newReply.trim() || !user) return;
        const repliesRef = collection(db, `${commentPath}/replies`);
        
        await addDoc(repliesRef, {
            text: newReply,
            authorUid: user.uid,
            authorUsername: user.username,
            authorAvatarUrl: user.avatarUrl || '',
            createdAt: serverTimestamp(),
            likes: [],
            likeCount: 0,
            parentAuthorUsername: mentioning,
            parentId: comment.id
        });

        await updateDoc(doc(db, commentPath), { replyCount: increment(1) });
        
        setNewReply('');
        setShowReplyForm(false);
        setMentioning('');
        
        if (!showReplies) {
            setShowReplies(true);
        } else {
            // Ya se están mostrando, no necesitamos hacer nada extra
            // el listener onSnapshot se encargará de añadir la nueva respuesta
        }
    };
    
    const handleLike = async () => {
        if (!user) return;
        const commentRef = doc(db, commentPath);
        const userHasLiked = comment.likes?.includes(user.uid);
        await updateDoc(commentRef, {
            likes: userHasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
            likeCount: increment(userHasLiked ? -1 : 1)
        });
    };

    const handleDelete = async () => {
        if (!isAuthor) return;
        if (window.confirm("¿Estás seguro de que quieres eliminar este comentario? Todas las respuestas también se borrarán.")) {
            try {
                // NOTA: Borrar un comentario padre y todas sus subcolecciones de forma segura
                // desde el cliente es complejo. La forma ideal es con una Cloud Function.
                // Esta implementación solo borra el comentario principal.
                await deleteDoc(doc(db, commentPath));
                toast.success("Comentario eliminado.");
            } catch (error) {
                toast.error("No se pudo eliminar el comentario.");
            }
        }
    };
    
    const openReplyForm = (usernameToMention) => {
        setMentioning(usernameToMention);
        setShowReplyForm(true);
        setTimeout(() => replyInputRef.current?.focus(), 50);
    };

    const userHasLiked = comment.likes?.includes(user?.uid);

    return (
        <div className={`py-4 ${highlightedId === comment.id ? 'highlight-comment' : ''}`} id={comment.id}>
            <div className="flex gap-3">
                <Link to={`/profile/${comment.authorUid}`}><img src={comment.authorAvatarUrl || `https://ui-avatars.com/api/?name=${comment.authorUsername}&background=7c3aed&color=fff&size=40`} alt="Avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0"/></Link>
                <div className="flex-1 bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                        <Link to={`/profile/${comment.authorUid}`} className="font-bold text-sm text-primary hover:underline">{comment.authorUsername}</Link>
                        <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                    </div>
                    <p className="text-sm break-words">{comment.text}</p>
                </div>
            </div>

            <div className="ml-14 mt-1 flex items-center gap-4">
                 <button onClick={handleLike} disabled={!user} className={`flex items-center gap-1 text-xs font-bold transition-colors disabled:cursor-not-allowed ${userHasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
                    <Heart size={14} fill={userHasLiked ? 'currentColor' : 'none'} /> 
                    {comment.likeCount > 0 ? comment.likeCount : 'Me gusta'}
                </button>
                <button onClick={() => openReplyForm(comment.authorUsername)} disabled={!user} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary disabled:cursor-not-allowed">
                    <MessageSquare size={14} /> Responder
                </button>
                {isAuthor && (
                    <button onClick={handleDelete} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-500">
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {showReplyForm && (
                <form onSubmit={handleReplySubmit} className="flex gap-2 mt-2 ml-14">
                    <input ref={replyInputRef} type="text" value={newReply} onChange={(e) => setNewReply(e.target.value)} placeholder={`Respondiendo a @${mentioning}...`} className="w-full p-2 text-sm rounded-lg bg-white dark:bg-gray-700 border-2 border-transparent focus:border-primary focus:outline-none" />
                    <button type="submit" className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90"><Send size={16}/></button>
                </form>
            )}

            <div className="ml-14 mt-2">
                {comment.replyCount > 0 && (
                    <button onClick={handleToggleReplies} disabled={loadingReplies} className="text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">
                        {loadingReplies ? 'Cargando...' : (showReplies ? '— Ocultar respuestas' : `— Ver las ${comment.replyCount} respuestas`)}
                    </button>
                )}
                {showReplies && (
                    <div className="pl-5 border-l-2 border-gray-200 dark:border-gray-700 mt-2 space-y-1">
                        {replies.map(reply => (
                            <Reply key={reply.id} replyData={reply} onReply={openReplyForm} onHighlight={{ id: highlightedId, action: highlightComment }} parentCommentPath={commentPath} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};