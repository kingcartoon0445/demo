// Import the functions you need from the SDKs you need
import * as firebase from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
const app = firebase.initializeApp({
    apiKey: "AIzaSyDE-_APRyXr4vyiNNiagYGo4zxSw8mXhsc",
    authDomain: "coka-crm.firebaseapp.com",
    databaseURL:
        "https://coka-crm-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "coka-crm",
    storageBucket: "coka-crm.appspot.com",
    messagingSenderId: "882931293778",
    appId: "1:882931293778:web:946051e071b47a65e6c98b",
    measurementId: "G-FW304NPHVX",
});

export const firebaseCloudMessaging = {
    //checking whether token is available in indexed DB
    tokenInlocalforage: async () => {
        return localStorage.getItem("fcm_token");
    },
    //initializing firebase app
    init: async function () {
        if (!firebase.getApps().length) {
            try {
                const messaging = getMessaging();
                const tokenInLocalForage = await this.tokenInlocalforage();
                //if FCM token is already there just return the token
                if (tokenInLocalForage !== null) {
                    return tokenInLocalForage;
                }
                //requesting notification permission from browser
                const status = await Notification.requestPermission();
                if (status && status === "granted") {
                    //getting token from FCM
                    const fcm_token = await getToken(messaging, {
                        vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
                    });
                    if (fcm_token) {
                        //setting FCM token in indexed db using localforage
                        localStorage.setItem("fcm_token", fcm_token);
                        //return the FCM token after saving it
                        return fcm_token;
                    }
                }
            } catch (error) {
                console.error(error);
                return null;
            }
        } else {
            try {
                const tokenInLocalForage = await this.tokenInlocalforage();
                //if FCM token is already there just return the token
                if (tokenInLocalForage !== null) {
                    return tokenInLocalForage;
                }
                const messaging = getMessaging();
                const status = await Notification.requestPermission();
                if (status && status === "granted") {
                    //getting token from FCM
                    const fcm_token = await getToken(messaging, {
                        vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
                    });
                    if (fcm_token) {
                        //setting FCM token in indexed db using localforage
                        localStorage.setItem("fcm_token", fcm_token);
                        //return the FCM token after saving it
                        return fcm_token;
                    }
                }
            } catch (error) {
                console.error(error);
                return null;
            }
        }
    },

    getMessage: async function () {
        if (firebase.getApps().length > 0) {
            try {
                const messaging = getMessaging();
                onMessage(messaging, (payload) => {
                    console.log("Message Received", payload);
                });
            } catch (error) {}
        }
    },
};

export const firebaseDb = getDatabase(app);
