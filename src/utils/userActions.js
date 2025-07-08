// src/utils/userActions.js
import { doc, writeBatch, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

export const toggleFollow = async (currentUserUid, profileUserUid, isFollowing) => {
    if (currentUserUid === profileUserUid) return;

    const batch = writeBatch(db);
    const currentUserRef = doc(db, 'users', currentUserUid);
    const profileUserRef = doc(db, 'users', profileUserUid);

    // Referencias a los documentos de seguimiento para la Cloud Function
    const followerDocRef = doc(db, `users/${profileUserUid}/followers/${currentUserUid}`);

    try {
        if (isFollowing) {
            // Dejar de seguir
            batch.update(currentUserRef, {
                following: arrayRemove(profileUserUid),
                followingCount: increment(-1)
            });
            batch.update(profileUserRef, {
                followers: arrayRemove(currentUserUid),
                followerCount: increment(-1)
            });
            // Al dejar de seguir, borramos el documento que activa la función
            batch.delete(followerDocRef);
        } else {
            // Empezar a seguir
            batch.update(currentUserRef, {
                following: arrayUnion(profileUserUid),
                followingCount: increment(1)
            });
            batch.update(profileUserRef, {
                followers: arrayUnion(currentUserUid),
                followerCount: increment(1)
            });
            // Al seguir, creamos el documento que activará la Cloud Function
            batch.set(followerDocRef, { createdAt: new Date() });
        }

        await batch.commit();
    } catch (error) {
        console.error("Error al seguir/dejar de seguir:", error);
        toast.error("Ocurrió un error. Inténtalo de nuevo.");
    }
};