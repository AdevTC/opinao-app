// src/utils/helpers.js
import { formatDistanceToNow, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (firebaseTimestamp) => {
    if (!firebaseTimestamp?.toDate) return "";
    return formatDistanceToNow(firebaseTimestamp.toDate(), { addSuffix: true, locale: es });
};

export const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), new Date(birthDate));
};

export const getAgeGroup = (age) => {
    if (age === null || age === undefined) return 'N/A';
    if (age < 18) return 'Menor de 18';
    if (age <= 25) return '18-25';
    if (age <= 35) return '26-35';
    if (age <= 50) return '36-50';
    return 'Mayor de 50';
};
