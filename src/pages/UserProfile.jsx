import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import database from '../config/FirbaseConfig';
import '../styles/UserProfile.css';

const UserProfile = ({ loggedInUser }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userCoupons, setUserCoupons] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const user = firebase.auth().currentUser;
                if (!user) throw new Error("User not found");

                // Get user data from Firebase
                const userRef = database.ref(`users/${user.uid}`);
                const userSnapshot = await userRef.once('value');
                const userData = userSnapshot.val() || {};

                // Get fresh Google profile data
                const idToken = await user.getIdToken(true);
                const userProfile = {
                    name: user.displayName || userData.name,
                    email: user.email,
                    photoURL: user.photoURL || userData.photoURL
                };

                // Update profile in database with latest data
                await userRef.update(userProfile);
                setProfile(userProfile);

                // Get coupon data using email
                const sanitizedEmail = user.email.replace(/[.#$[\]]/g, '_');
                const couponRef = database.ref('UserCoupons').orderByChild('email').equalTo(user.email);
                const couponSnapshot = await couponRef.once('value');
                const couponData = couponSnapshot.val();

                if (couponData) {
                    const couponEntry = Object.values(couponData)[0];
                    // Get redemption history array safely
                    const redemptionHistory = Array.isArray(couponEntry.redemption_history) 
                        ? couponEntry.redemption_history 
                        : Object.values(couponEntry.redemption_history || {});
                    
                    setUserCoupons({
                        active_coupons: couponEntry.active_coupons || 0,
                        redemption_history: redemptionHistory,
                        total_redemptions: redemptionHistory.length || 0
                    });
                } else {
                    setUserCoupons({
                        active_coupons: 0,
                        redemption_history: [],
                        total_redemptions: 0
                    });
                }
            } catch (error) {
                console.error("Error:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (loggedInUser) {
            fetchUserData();
        }
    }, [loggedInUser]);

    const handleLogout = async () => {
        try {
            await firebase.auth().signOut();
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="profile-container">
            <div className="profile-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ←
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </div>

            <div className="profile-content">
                <div className="profile-section user-info">
                    <div className="profile-picture">
                        {profile?.photoURL ? (
                            <img src={profile.photoURL} alt="Profile" />
                        ) : (
                            <div className="profile-initial">
                                {profile?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    <h2>{profile?.name}</h2>
                    <p className="email">{profile?.email}</p>
                </div>

                <div className="profile-section">
                    <h3>My Coupons</h3>
                    <div className="coupon-stats">
                        <div className="coupon-card">
                            <div className="coupon-icon">🎟️</div>
                            <div className="coupon-info">
                                <span className="coupon-count">{userCoupons?.active_coupons || 0}</span>
                                <span className="coupon-label">Active Coupons</span>
                            </div>
                        </div>
                        <div className="coupon-card">
                            <div className="coupon-icon">✨</div>
                            <div className="coupon-info">
                                <span className="coupon-count">{userCoupons?.total_redemptions || 0}</span>
                                <span className="coupon-label">Total Redeemed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {userCoupons?.redemption_history?.length > 0 && (
                    <div className="profile-section">
                        <h3>Recent Activity</h3>
                        <div className="redemption-history">
                            {userCoupons.redemption_history.slice(-5).reverse().map((redemption, index) => (
                                <div key={index} className="history-item">
                                    <span className="history-date">
                                        {new Date(redemption.date).toLocaleDateString()}
                                    </span>
                                    <span className="history-action">
                                        Redeemed coupon
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile; 