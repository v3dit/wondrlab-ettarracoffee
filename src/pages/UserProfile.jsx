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
    const [userEmail, setUserEmail] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editedName, setEditedName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                setError(null);

                // First get the current user's email
                const user = firebase.auth().currentUser;
                if (!user || !user.email) {
                    throw new Error("User email not found");
                }

                // Fetch user profile data
                const userRef = database.ref(`users/${loggedInUser}`);
                const userSnapshot = await userRef.once('value');
                const userData = userSnapshot.val();

                if (userData) {
                    setProfile(userData);

                    // Query UserCoupons by email
                    const couponQuery = database.ref('UserCoupons')
                        .orderByChild('email')
                        .equalTo(user.email);
                    
                    const couponSnapshot = await couponQuery.once('value');
                    const couponData = couponSnapshot.val();

                    if (couponData) {
                        // Get the first entry (there should only be one)
                        const couponEntry = Object.values(couponData)[0];
                        setUserCoupons({
                            active_coupons: couponEntry.active_coupons || 0,
                            last_allocation_date: couponEntry.last_allocation_date,
                            last_redemption_date: couponEntry.last_redemption_date,
                            total_redemptions: couponEntry.total_redemptions || 0,
                            redemption_history: couponEntry.redemption_history || [],
                            email: user.email // Use the authenticated user's email
                        });
                    } else {
                        // Create a new entry with push()
                        const newCouponRef = database.ref('UserCoupons').push();
                        const initialCouponData = {
                            active_coupons: 0,
                            email: user.email,
                            redemption_history: [],
                            total_redemptions: 0,
                            created_at: new Date().toISOString()
                        };

                        await newCouponRef.set(initialCouponData);
                        setUserCoupons(initialCouponData);
                    }
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setError("Failed to load user data");
            } finally {
                setLoading(false);
            }
        };

        if (loggedInUser) {
            fetchUserData();
        }
    }, [loggedInUser]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Get user email from Firebase Auth
                const user = firebase.auth().currentUser;
                const userEmail = user ? user.email : null;

                const snapshot = await database.ref(`users/${loggedInUser}`).once('value');
                const userData = snapshot.val() || {};
                
                setProfile({
                    ...userData,
                    email: userEmail,
                    name: userData.name || 'Guest User'
                });
                setEditedName(userData.name || '');
                setLoading(false);
            } catch (err) {
                setError('Failed to load profile');
                setLoading(false);
            }
        };
        fetchProfile();
    }, [loggedInUser]);

    const handleNameSave = async () => {
        try {
            setLoading(true);
            await database.ref(`users/${loggedInUser}`).update({
                name: editedName
            });
            setProfile(prev => ({...prev, name: editedName}));
            setEditMode(false);
        } catch (err) {
            console.error("Failed to update name:", err);
            setError('Failed to update name. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await firebase.auth().signOut();
            navigate('/');
        } catch (error) {
            setError('Failed to logout');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Email: {userEmail}</p>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>

            <div className="profile-content">
                <div className="user-info-card">
                    <div className="info-row">
                        <h3>Name:</h3>
                        {editMode ? (
                            <div className="edit-name-container">
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="name-input"
                                />
                                <button onClick={handleNameSave} className="save-btn">Save</button>
                                <button onClick={() => setEditMode(false)} className="cancel-btn">Cancel</button>
                            </div>
                        ) : (
                            <div className="display-name">
                                <span>{profile.name}</span>
                                <button onClick={() => setEditMode(true)} className="edit-btn">Edit</button>
                            </div>
                        )}
                    </div>
                    <div className="info-row">
                        <h3>Email:</h3>
                        <span>{profile.email}</span>
                    </div>
                </div>

                <div className="coupon-section">
                    <h2>My Coupons</h2>
                    {userCoupons ? (
                        <div className="coupon-info">
                            <p className="coupon-count">Active Coupons: {userCoupons.active_coupons}</p>
                            {userCoupons.last_allocation_date && (
                                <p className="last-updated">
                                    Last Updated: {new Date(userCoupons.last_allocation_date).toLocaleDateString()}
                                </p>
                            )}
                            
                            {userCoupons.allocation_history && (
                                <div className="allocation-history">
                                    <h3>Recent Allocations</h3>
                                    <div className="history-list">
                                        {Object.entries(userCoupons.allocation_history)
                                            .sort(([a], [b]) => b - a) // Sort by timestamp (newest first)
                                            .slice(0, 5) // Show only last 5 allocations
                                            .map(([timestamp, data]) => (
                                                <div key={timestamp} className="history-item">
                                                    <span className="amount">+{data.amount} coupons</span>
                                                    <span className="date">
                                                        {new Date(parseInt(timestamp)).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="no-coupons">No coupons available</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile; 