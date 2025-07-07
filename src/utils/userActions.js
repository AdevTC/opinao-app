// src/utils/userActions.js
import { doc, writeBatch, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

export const toggleFollow = async (currentUserUid, profileUserUid, isFollowing) => {
    if (currentUserUid === profileUserUid) return;

    const batch = writeBatch(db);
    const currentUserRef = doc(db, 'users', currentUserUid);
    const profileUserRef = doc(db, 'users', profileUserUid);

    try {
        if (isFollowing) {
            // Dejar de seguir (normalmente no se notifica)
            batch.update(currentUserRef, {
                following: arrayRemove(profileUserUid),
                followingCount: increment(-1)
            });
            batch.update(profileUserRef, {
                followers: arrayRemove(currentUserUid),
                followerCount: increment(-1)
            });
        } else {
            // --- Seguir ---
            batch.update(currentUserRef, {
                following: arrayUnion(profileUserUid),
                followingCount: increment(1)
            });
            batch.update(profileUserRef, {
                followers: arrayUnion(currentUserUid),
                followerCount: increment(1)
            });

            // ========================================================================
            // PUNTO DE NOTIFICACIÓN #1: Nuevo seguidor
            // 
            // Aquí es donde llamarías a una Cloud Function para crear la notificación.
            // La función recibiría (currentUserUid, profileUserUid) y crearía un 
            // documento en la subcolección /users/{profileUserUid}/notifications.
            // 
            // Ejemplo de llamada a una futura función:
            // await createFollowNotification(currentUserUid, profileUserUid);
            // ========================================================================
        }

        await batch.commit();
    } catch (error) {
        console.error("Error al seguir/dejar de seguir:", error);
        toast.error("Ocurrió un error. Inténtalo de nuevo.");
    }
};