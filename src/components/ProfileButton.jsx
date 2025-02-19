import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import '../styles/ProfileButton.css';

const ProfileButton = ({ userName }) => {
    const navigate = useNavigate();
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileImage = async () => {
            try {
                const user = firebase.auth().currentUser;
                if (user) {
                    // Get fresh user data
                    const userRef = firebase.database().ref(`users/${user.uid}`);
                    const snapshot = await userRef.once('value');
                    const userData = snapshot.val();
                    
                    // Use Google profile photo or stored photo
                    setProfileImage(user.photoURL || userData?.photoURL);
                }
            } catch (error) {
                console.error("Error fetching profile image:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileImage();
    }, []);

    if (loading) return null;

    return (
        <button
            className="profile-circle-button"
            onClick={() => navigate('/profile')}
            aria-label="Profile"
        >
            {profileImage ? (
                <div className="profile-image-container">
                    <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="profile-button-image"
                    />
                </div>
            ) : (
                <div className="profile-initial">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
            )}
        </button>
    );
};

export default ProfileButton; 