// src/utils/badges.js
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

// Aquí definimos todas las insignias disponibles en la aplicación.
// La clave (ej: 'POLLS_VOTED_1') es el ID único que guardaremos en la base de datos.
export const BADGE_DEFINITIONS = {
    // Insignias por Votar
    POLLS_VOTED_1:   { name: 'Primer Voto', description: 'Has votado en tu primera encuesta.', icon: '🗳️' },
    POLLS_VOTED_10:  { name: 'Participante Activo', description: 'Has votado en 10 encuestas.', icon: '🙋‍♂️' },
    POLLS_VOTED_50:  { name: 'Votante Veterano', description: 'Has votado en 50 encuestas.', icon: '✅' },
    
    // Insignias por Crear Encuestas
    POLLS_CREATED_1: { name: 'Creador Novato', description: 'Has creado tu primera encuesta.', icon: '📝' },
    POLLS_CREATED_5: { name: 'Creador Frecuente', description: 'Has creado 5 encuestas.', icon: '✍️' },
    POLLS_CREATED_20: { name: 'Mente Curiosa', description: 'Has creado 20 encuestas.', icon: '💡' },

    // Insignias por Acertar Quizzes
    QUIZ_CORRECT_1:  { name: 'Sabelotodo Jr.', description: 'Has acertado tu primer quiz.', icon: '🧠' },
    QUIZ_CORRECT_10: { name: 'Maestro de Quizzes', description: 'Has acertado 10 quizzes.', icon: '🏆' },
    QUIZ_CORRECT_25: { name: 'Genio de Opinao', description: 'Has acertado 25 quizzes.', icon: '👑' },
};

/**
 * Comprueba las estadísticas de un usuario y le otorga nuevas insignias si cumple los requisitos.
 * @param {object} userProfile - El objeto del perfil del usuario de Firestore.
 * @param {number} createdPollsCount - El número de encuestas que ha creado el usuario.
 */
export const checkAndAwardBadges = async (userProfile, createdPollsCount) => {
    if (!userProfile || !userProfile.uid) return;

    const existingBadges = userProfile.badges || [];
    const newlyAwardedBadges = [];

    const stats = {
        voted: userProfile.votedPolls?.length || 0,
        created: createdPollsCount,
        quizCorrect: userProfile.quizAnswersCorrect || 0,
    };

    // Lógica para comprobar cada tipo de insignia
    if (stats.voted >= 1 && !existingBadges.includes('POLLS_VOTED_1')) newlyAwardedBadges.push('POLLS_VOTED_1');
    if (stats.voted >= 10 && !existingBadges.includes('POLLS_VOTED_10')) newlyAwardedBadges.push('POLLS_VOTED_10');
    if (stats.voted >= 50 && !existingBadges.includes('POLLS_VOTED_50')) newlyAwardedBadges.push('POLLS_VOTED_50');

    if (stats.created >= 1 && !existingBadges.includes('POLLS_CREATED_1')) newlyAwardedBadges.push('POLLS_CREATED_1');
    if (stats.created >= 5 && !existingBadges.includes('POLLS_CREATED_5')) newlyAwardedBadges.push('POLLS_CREATED_5');
    if (stats.created >= 20 && !existingBadges.includes('POLLS_CREATED_20')) newlyAwardedBadges.push('POLLS_CREATED_20');

    if (stats.quizCorrect >= 1 && !existingBadges.includes('QUIZ_CORRECT_1')) newlyAwardedBadges.push('QUIZ_CORRECT_1');
    if (stats.quizCorrect >= 10 && !existingBadges.includes('QUIZ_CORRECT_10')) newlyAwardedBadges.push('QUIZ_CORRECT_10');
    if (stats.quizCorrect >= 25 && !existingBadges.includes('QUIZ_CORRECT_25')) newlyAwardedBadges.push('QUIZ_CORRECT_25');

    // Si hemos encontrado nuevas insignias que otorgar...
    if (newlyAwardedBadges.length > 0) {
        const userRef = doc(db, 'users', userProfile.uid);
        // Usamos arrayUnion para añadir las nuevas insignias sin duplicarlas
        await updateDoc(userRef, {
            badges: arrayUnion(...newlyAwardedBadges)
        });

        // Mostramos una notificación por cada nueva insignia ganada
        newlyAwardedBadges.forEach(badgeId => {
            const badge = BADGE_DEFINITIONS[badgeId];
            toast.success(`¡Insignia desbloqueada: ${badge.name}!`, { icon: badge.icon, duration: 5000 });
        });
    }
};