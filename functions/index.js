// functions/index.js (Sintaxis v1 - Estable y compatible)

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Notificación para nuevos seguidores
exports.createFollowNotification = functions.firestore
  .document("users/{followedUid}/followers/{followerUid}")
  .onCreate(async (snapshot, context) => {
    const { followerUid, followedUid } = context.params;

    if (followerUid === followedUid) {
      console.log("Un usuario no puede seguirse a sí mismo.");
      return null;
    }

    const followerDoc = await db.collection("users").doc(followerUid).get();
    if (!followerDoc.exists) {
      console.error(`El seguidor con UID ${followerUid} no existe.`);
      return null;
    }
    const followerData = followerDoc.data();

    const notification = {
      type: "follow",
      fromUid: followerUid,
      fromUsername: followerData.username,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      pollId: "",
      pollQuestion: "",
    };

    await db
      .collection("users")
      .doc(followedUid)
      .collection("notifications")
      .add(notification);

    console.log(`Notificación creada para ${followedUid} de parte de ${followerUid}`);
    return null;
  });

// Limpieza de datos de usuario al borrar la cuenta
exports.cleanupUser = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;
  const batch = db.batch();

  const userDocRef = db.collection("users").doc(uid);
  batch.delete(userDocRef);

  const pollsRef = db.collection("polls");
  const userPollsQuery = pollsRef.where("authorUid", "==", uid);
  const userPollsSnapshot = await userPollsQuery.get();
  userPollsSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  try {
    await batch.commit();
    console.log(`Datos del usuario ${uid} eliminados correctamente.`);
    return null;
  } catch (error) {
    console.error(`Error al limpiar datos del usuario ${uid}:`, error);
    return null;
  }
});