import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import '../styles/ProfileButton.css';

const ProfileButton = ({ userName }) => {
    const navigate = useNavigate();
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        const fetchProfileImage = async () => {
            const user = firebase.auth().currentUser;
            if (user && user.photoURL) {
                setProfileImage(user.photoURL);
            }
        };

        fetchProfileImage();
    }, []);

    const firstLetter = userName ? userName.charAt(0).toUpperCase() : 'P';

    return (
        <button
            className="profile-circle-button"
            onClick={() => navigate('/profile')}
        >
            {profileImage ? (
                <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="profile-button-image"
                />
            ) : (
                firstLetter
            )}
        </button>
    );
};

export default ProfileButton; 