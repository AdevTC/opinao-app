// src/pages/NotificationsPage.jsx (Actualizado)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/helpers';
import { Bell, UserPlus, MessageSquare, Vote } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

const NotificationIcon = ({ type }) => {
    switch (type) {
        case 'follow':
            return <UserPlus className="h-6 w-6 text-blue-500" />;
        case 'comment':
            return <MessageSquare className="h-6 w-6 text-green-500" />;
        case 'vote':
            return <Vote className="h-6 w-6 text-primary" />;
        default:
            return <Bell className="h-6 w-6 text-gray-500" />;
    }
};

const NotificationItem = ({ notif }) => {
    const linkTo = notif.type === 'follow' ? `/profile/${notif.fromUid}` : `/poll/${notif.pollId}`;
    
    return (
        <Link to={linkTo} className={`block p-4 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors ${!notif.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
            <div className="flex items-start gap-4">
                <NotificationIcon type={notif.type} />
                <div className="flex-1">
                    <p className="text-gray-800 dark:text-gray-200">
                        <span className="font-bold">{notif.fromUsername}</span>
                        {' '}
                        {notif.type === 'follow' && 'ha comenzado a seguirte.'}
                        {notif.type === 'comment' && `ha comentado en tu encuesta: "${notif.pollQuestion}"`}
                        {notif.type === 'vote' && `ha votado en tu encuesta: "${notif.pollQuestion}"`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(notif.createdAt)}</p>
                </div>
                 {!notif.read && <div className="h-3 w-3 rounded-full bg-primary flex-shrink-0 mt-1" title="No leída"></div>}
            </div>
        </Link>
    );
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndMarkRead = async () => {
            if (!user) return;
            setLoading(true);

            try {
                const notifRef = collection(db, 'users', user.uid, 'notifications');
                const q = query(notifRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setNotifications(notifs);

                const unreadDocs = notifs.filter(n => !n.read);
                if (unreadDocs.length > 0) {
                    const batch = writeBatch(db);
                    unreadDocs.forEach(notifToUpdate => {
                        const docRef = doc(db, 'users', user.uid, 'notifications', notifToUpdate.id);
                        batch.update(docRef, { read: true });
                    });
                    await batch.commit();
                }
            } catch (error) {
                console.error("Error al cargar o actualizar notificaciones:", error);
                toast.error("No se pudieron cargar las notificaciones.");
            } finally {
                setLoading(false);
            }
        };

        fetchAndMarkRead();
    }, [user]);

    if (loading) return <p className="text-center mt-8">Cargando notificaciones...</p>;

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-display font-bold mb-8 text-center">Notificaciones</h1>
            <div className="bg-light-container dark:bg-dark-container p-2 sm:p-4 rounded-xl shadow-xl">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.map(notif => (
                            <NotificationItem key={notif.id} notif={notif} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<Bell />}
                        title="Todo en calma"
                        message="No tienes notificaciones nuevas. ¡Interactúa con la comunidad para recibir noticias!"
                    />
                )}
            </div>
        </div>
    );
}