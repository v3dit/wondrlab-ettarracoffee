import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "../styles/UserLogin.css";

const UserLogin = ({ setLoggedInUser }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                setLoggedInUser(user.uid);
                window.gtag("event", "user_login_success", {
                    event_category: "google_auth",
                    event_label: "logged_in",
                    user: user.email
                });
                navigate("/menu");
            }
            setLoading(false);
            setAuthChecked(true);
        });

        return () => unsubscribe();
    }, [setLoggedInUser, navigate]);

    const handleGoogleLogin = async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            
            // Get user profile data
            const userData = {
                name: user.displayName, // This gets their Google profile name
                email: user.email,
                photoURL: user.photoURL
            };

            // Save to Firebase database
            await firebase.database().ref(`users/${user.uid}`).set(userData);

            setLoggedInUser(user.uid);
            window.gtag("event", "user_login_success", {
                event_category: "google_auth",
                event_label: "logged_in",
                user: user.email
            });
            navigate("/menu");
        } catch (error) {
            console.error("Login Error:", error);
            setErrorMessage(error.message);
        }
    };

    if (!authChecked || loading) {
        return (
            <div className="login-container">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="logo-container">
                    <div className="logo">ಎ</div>
                </div>
                <div className="form-container">
                    <h1>Welcome</h1>
                    {errorMessage && (
                        <div className="error-message">
                            {errorMessage.split(":")[1] || errorMessage}
                        </div>
                    )}
                    <button 
                        className="google-signin-button" 
                        onClick={handleGoogleLogin}
                    >
                        <img 
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                            alt="Google logo" 
                        />
                        Continue with Google
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserLogin; 