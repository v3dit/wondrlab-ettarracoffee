import React, { useEffect, useState } from "react";
import database from "../config/FirbaseConfig";
import "../styles/UserDashboard.css";

const UserDashboard = ({ loggedInUser }) => {
    const [userData, setUserData] = useState({
        activeCoupons: 0,
        lastAllocationDate: null,
        redemptionHistory: []
    });

    useEffect(() => {
        if (loggedInUser) {
            const userRef = database.ref(`UserCoupons/${loggedInUser}`);
            
            userRef.on('value', (snapshot) => {
                const data = snapshot.val() || {};
                setUserData({
                    activeCoupons: data.active_coupons || 0,
                    lastAllocationDate: data.last_allocation_date,
                    redemptionHistory: data.redemption_history || []
                });
            });

            return () => userRef.off();
        }
    }, [loggedInUser]);

    return (
        <div className="user-dashboard">
            <div className="coupon-status-card">
                <h2>My Coupons</h2>
                <div className="coupon-count">{userData.activeCoupons}</div>
                {userData.lastAllocationDate && (
                    <div className="allocation-info">
                        <p>Last Allocated: {new Date(userData.lastAllocationDate).toLocaleDateString()}</p>
                        <p>Valid Until: {new Date(userData.lastAllocationDate + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}</p>
                    </div>
                )}
            </div>

            <div className="redemption-history-card">
                <h2>Recent Redemptions</h2>
                <div className="history-list">
                    {userData.redemptionHistory.length > 0 ? (
                        userData.redemptionHistory.map((redemption, index) => (
                            <div key={index} className="history-item">
                                <span className="item-name">{redemption.item_name}</span>
                                <span className="redemption-date">
                                    {new Date(redemption.date).toLocaleDateString()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="no-history">No redemptions yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard; 