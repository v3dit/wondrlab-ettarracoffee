import React, { useEffect, useState } from "react";
import database from "../config/FirbaseConfig";
import "../styles/CouponManagement.css";

const CouponManagement = ({ loggedInUser }) => {
  const [activeCoupons, setActiveCoupons] = useState(0);
  const [redemptionHistory, setRedemptionHistory] = useState([]);

  useEffect(() => {
    if (loggedInUser) {
      const userCouponsRef = database.ref(`UserCoupons/${loggedInUser}`);
      
      const handleCouponUpdates = (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setActiveCoupons(data.active_coupons || 0);
          setRedemptionHistory(data.redemption_history || []);
        }
      };

      userCouponsRef.on('value', handleCouponUpdates);
      return () => userCouponsRef.off('value', handleCouponUpdates);
    }
  }, [loggedInUser]);

  return (
    <div className="coupon-management">
      <h1>My Coupons</h1>
      
      <div className="coupon-status">
        <h2>Active Coupons: {activeCoupons}</h2>
      </div>

      <div className="redemption-history">
        <h2>Redemption History</h2>
        {redemptionHistory.length > 0 ? (
          <ul>
            {redemptionHistory.map((redemption, index) => (
              <li key={index}>
                {redemption.item} - {new Date(redemption.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No redemptions yet</p>
        )}
      </div>
    </div>
  );
};

export default CouponManagement; 