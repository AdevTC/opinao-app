// ============== ARCHIVO: src/firebase.js (Corregido con Storage) ==============
// Este archivo inicializa la conexión con Firebase y exporta los servicios
// que usaremos en toda la aplicación (Autenticación, Base de datos, etc.).

// Importamos las funciones necesarias desde las librerías de Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- ¡Importamos la función de Storage!

// Tu configuración personal de Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyA_w75jvfxPgvL8fGATh7N_5BghIhfnYWQ",
  authDomain: "opinao-app.firebaseapp.com",
  projectId: "opinao-app",
  storageBucket: "gs://opinao-app.firebasestorage.app",
  messagingSenderId: "217342055887",
  appId: "1:217342055887:web:64731dedeb5a77b1592eba",
  measurementId: "G-F244JPNFG1"
};

// Inicializamos la aplicación de Firebase con tu configuración
const app = initializeApp(firebaseConfig);

// Creamos y exportamos instancias de los servicios que vamos a utilizar.
export const auth = getAuth(app);      // Para manejar la autenticación (login, registro)
export const db = getFirestore(app); // Para interactuar con la base de datos Firestore
export const storage = getStorage(app); // <-- ¡Exportamos el servicio de Storage!