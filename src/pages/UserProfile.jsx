import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import database from '../config/FirbaseConfig';
import '../styles/UserProfile.css';

const UserProfile = ({ loggedInUser }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userCoupons, setUserCoupons] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const user = firebase.auth().currentUser;
                if (!user) {
                    navigate('/');
                    return;
                }

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

                // Listen to UserCoupons collection for this user's email
                const couponQuery = database.ref('UserCoupons')
                    .orderByChild('email')
                    .equalTo(user.email);
                
                couponQuery.on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        const userCouponData = Object.values(data)[0];
                        setUserCoupons(userCouponData);
                        
                        // Get redemption history and sort by date
                        const history = userCouponData.redemption_history || [];
                        // Convert object to array if necessary
                        const historyArray = Array.isArray(history) ? history : Object.values(history);
                        const sortedHistory = historyArray
                            .filter(item => item && item.date) // Filter out any invalid entries
                            .sort((a, b) => b.date - a.date); // Sort by date instead of timestamp
                        setRecentActivity(sortedHistory);
                    }
                    setLoading(false);
                });

                return () => couponQuery.off();
            } catch (error) {
                console.error('Error fetching user data:', error);
                setError(error.message);
                setLoading(false);
            }
        };

        if (loggedInUser) {
            fetchUserData();
        }
    }, [loggedInUser, navigate]);

    const handleLogout = async () => {
        try {
            await firebase.auth().signOut();
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Invalid Date';
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="profile-container">
            <div className="profile-header">
                <button className="profile-back-button" onClick={() => navigate(-1)}>←</button>
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
                                <span className="coupon-count">{userCoupons?.total_redeemed || 0}</span>
                                <span className="coupon-label">Total Redeemed</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Recent Activity</h3>
                    <div className="activity-list">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, index) => (
                                <div key={index} className="activity-item">
                                    <div className="activity-date">
                                        {formatDate(activity.date)}
                                    </div>
                                    <div className="activity-details">
                                        <div className="activity-type">Redeemed coupon</div>
                                        <div className="activity-items">
                                            <div className="redeemed-item">
                                                <div className="redeemed-item-name">
                                                    {activity.item_name}
                                                    <span className="item-price">{activity.item_price}</span>
                                                </div>
                                                <div className="item-category">{activity.category}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-activity">
                                <div className="no-activity-icon">📋</div>
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile; 