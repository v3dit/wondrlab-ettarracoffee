import React, { useState, useEffect } from "react";
import database from "../config/FirbaseConfig";
import "../styles/CouponRedemption.css";
import firebase from "firebase/app";

const CouponRedemption = ({ loggedInUser, item, onRedeem }) => {
  const [activeCoupons, setActiveCoupons] = useState(0);
  const [lastAllocationDate, setLastAllocationDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loggedInUser) {
      console.log("CouponRedemption: Starting with loggedInUser:", loggedInUser);
      
      const user = firebase.auth().currentUser;
      console.log("Current Firebase user:", user);
      
      if (user && user.email) {
        console.log("User email:", user.email);
        const sanitizedEmail = user.email.replace(/\./g, '_').replace(/@/g, '_at_');
        console.log("Sanitized email for path:", sanitizedEmail);
        
        const userCouponsRef = database.ref(`UserCoupons/${sanitizedEmail}`);
        console.log("Fetching coupons from:", `UserCoupons/${sanitizedEmail}`);
        
        const handleCouponUpdates = (snapshot) => {
          const data = snapshot.val();
          console.log("Coupon data received:", data);
          
          if (data) {
            setActiveCoupons(data.active_coupons || 0);
            setLastAllocationDate(data.last_allocation_date || null);
            console.log("Updated coupon state:", {
              active_coupons: data.active_coupons || 0,
              last_allocation_date: data.last_allocation_date || null
            });
          }
          setLoading(false);
        };

        userCouponsRef.on('value', handleCouponUpdates, (error) => {
          console.error("Error in coupon listener:", error);
        });

        return () => {
          console.log("Cleaning up coupon listener");
          userCouponsRef.off();
        };
      }
    }
  }, [loggedInUser]);

  const handleRedeem = async () => {
    try {
      const userRef = database.ref(`UserCoupons/${loggedInUser}`);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val();
      
      if (userData && userData.active_coupons > 0) {
        await userRef.update({
          active_coupons: userData.active_coupons - 1,
          redemption_history: firebase.database.ServerValue.push({
            item_name: item.Name,
            item_price: item.Price,
            date: Date.now(),
            category: item.Category
          })
        });

        // Update analytics
        await database.ref('Reports_Access_Data/Coupons/analytics').update({
          total_redemptions: firebase.database.ServerValue.increment(1),
          [`redemptions_by_date/${Date.now()}`]: {
            user_id: loggedInUser,
            item_name: item.Name
          }
        });

        onRedeem(true);
      } else {
        alert("No coupons available!");
        onRedeem(false);
      }
    } catch (error) {
      console.error("Error redeeming coupon:", error);
      onRedeem(false);
    }
  };

  if (loading) return null;

  return activeCoupons > 0 ? (
    <div className="coupon-redemption">
      <button 
        className="redeem-button"
        onClick={handleRedeem}
      >
        Redeem Coupon ({activeCoupons} left)
      </button>
    </div>
  ) : null;
};

export default CouponRedemption; 