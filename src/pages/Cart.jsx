import React, { useState, useEffect } from 'react';
import database from '../config/FirbaseConfig';
import firebase from 'firebase/compat/app';
import '../styles/Cart.css';

// Add email encoding function
const encodeEmail = (email) => {
    if (!email) return '';
    return email.toString()
        .replace(/\./g, '-dot-')
        .replace(/@/g, '-at-')
        .replace(/\$/g, '-dollar-')
        .replace(/\[/g, '-lbracket-')
        .replace(/\]/g, '-rbracket-')
        .replace(/#/g, '-hash-');
};

const Cart = ({ wishlist, setWishlist, loggedInUser, onPlaceOrder }) => {
    const [userCoupons, setUserCoupons] = useState(null);
    const [redeemedItems, setRedeemedItems] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loggedInUser) {
            const user = firebase.auth().currentUser;
            if (user && user.email) {
                const encodedEmail = encodeEmail(user.email);
                // Query UserCoupons by email
                const couponQuery = database.ref('UserCoupons')
                    .orderByChild('email')
                    .equalTo(user.email);
                
                couponQuery.on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        const couponData = Object.values(data)[0];
                        setUserCoupons(couponData);
                    }
                    setLoading(false);
                });

                return () => couponQuery.off();
            }
        }
    }, [loggedInUser]);

    const handleRedeemCoupon = async (item) => {
        try {
            if (!userCoupons || userCoupons.active_coupons <= 0) {
                alert("No coupons available!");
                return;
            }

            // Get the coupon entry ID
            const user = firebase.auth().currentUser;
            const couponQuery = database.ref('UserCoupons')
                .orderByChild('email')
                .equalTo(user.email);
            
            const snapshot = await couponQuery.once('value');
            const couponData = snapshot.val();
            const [couponId] = Object.keys(couponData);

            const redemptionData = {
                item_name: item.Name,
                item_price: item.Price,
                date: Date.now(),
                category: item.Category,
                redeemed_at: new Date().toISOString()
            };

            // Update UserCoupons
            await database.ref(`UserCoupons/${couponId}`).update({
                active_coupons: userCoupons.active_coupons - 1,
                redemption_history: [...(userCoupons.redemption_history || []), redemptionData],
                last_redemption_date: new Date().toISOString(),
                total_redemptions: (userCoupons.total_redemptions || 0) + 1
            });

            setRedeemedItems(prev => ({
                ...prev,
                [item.Name]: true
            }));
        } catch (error) {
            console.error("Error redeeming coupon:", error);
            alert("Error redeeming coupon. Please try again.");
        }
    };

    const calculateItemTotal = (item) => {
        return redeemedItems[item.Name] ? 0 : (item.Price * item.Count);
    };

    const calculateTotal = () => {
        return wishlist.reduce((total, item) => {
            return total + calculateItemTotal(item);
        }, 0);
    };

    // Calculate total item count
    const getTotalItemCount = () => {
        return wishlist.reduce((total, item) => {
            return total + (parseInt(item.Count) || 0);
        }, 0);
    };

    // Check if coupon limit is exceeded
    const isCouponLimitExceeded = () => {
        if (!userCoupons) return false;
        const totalItems = getTotalItemCount();
        const availableCoupons = userCoupons.active_coupons || 0;
        return totalItems > availableCoupons;
    };

    // Get coupon status message
    const getCouponStatusMessage = () => {
        if (!userCoupons) return "";
        
        const totalItems = getTotalItemCount();
        const availableCoupons = userCoupons.active_coupons || 0;
        
        if (totalItems > availableCoupons) {
            return `Warning: You have ${totalItems} items but only ${availableCoupons} coupons available.`;
        } else if (totalItems === availableCoupons) {
            return `Perfect! You have exactly ${availableCoupons} coupons for your ${totalItems} items.`;
        } else {
            return `You have ${availableCoupons} coupons available for ${totalItems} items.`;
        }
    };

    if (loading) {
        return <div className="cart-container">Loading...</div>;
    }

    return (
        <div className="cart-container">
            <h2>Your Cart</h2>
            
            {userCoupons && (
                <div className={`coupon-status ${isCouponLimitExceeded() ? 'coupon-warning' : 'coupon-ok'}`}>
                    {getCouponStatusMessage()}
                </div>
            )}
            
            {wishlist.map((item) => (
                <div key={item.Name} className="cart-item">
                    <div className="item-details">
                        <h3>{item.Name}</h3>
                        <p>Quantity: {item.Count}</p>
                        <p className="price">
                            {redeemedItems[item.Name] ? 
                                <span className="coupon-applied">Free (Coupon Applied)</span> : 
                                `₹${calculateItemTotal(item)}`
                            }
                        </p>
                    </div>
                    
                    {!redeemedItems[item.Name] && userCoupons && userCoupons.active_coupons > 0 && (
                        <button 
                            className="redeem-coupon-btn"
                            onClick={() => handleRedeemCoupon(item)}
                        >
                            Apply Coupon
                            <span className="coupon-count">
                                ({userCoupons.active_coupons} left)
                            </span>
                        </button>
                    )}
                </div>
            ))}

            <div className="cart-summary">
                <div className="total">Total: ₹{calculateTotal()}</div>
                <button 
                    className={`place-order-btn ${isCouponLimitExceeded() ? 'disabled' : ''}`}
                    onClick={() => onPlaceOrder(wishlist, redeemedItems)}
                    disabled={isCouponLimitExceeded()}
                >
                    {isCouponLimitExceeded() 
                        ? 'Adjust Cart (Coupon Limit Exceeded)' 
                        : 'Place Order'}
                </button>
            </div>
        </div>
    );
};

export default Cart; 