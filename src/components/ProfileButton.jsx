import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfileButton.css';

const ProfileButton = ({ userName }) => {
    const navigate = useNavigate();
    const firstLetter = userName ? userName.charAt(0).toUpperCase() : 'P';

    return (
        <button 
            className="profile-circle-button"
            onClick={() => navigate('/profile')}
            title="View Profile"
        >
            {firstLetter}
        </button>
    );
};

export default ProfileButton; 