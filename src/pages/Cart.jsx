import React, { useState, useEffect } from 'react';
import database from '../config/FirbaseConfig';
import firebase from 'firebase/compat/app';
import '../styles/Cart.css';

const Cart = ({ wishlist, setWishlist, loggedInUser, onPlaceOrder }) => {
    const [userCoupons, setUserCoupons] = useState(null);
    const [redeemedItems, setRedeemedItems] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loggedInUser) {
            const user = firebase.auth().currentUser;
            if (user && user.email) {
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

    if (loading) {
        return <div className="cart-container">Loading...</div>;
    }

    return (
        <div className="cart-container">
            <h2>Your Cart</h2>
            
            {userCoupons && userCoupons.active_coupons > 0 && (
                <div className="available-coupons">
                    You have {userCoupons.active_coupons} coupons available to redeem!
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
                    className="place-order-btn"
                    onClick={() => onPlaceOrder(wishlist, redeemedItems)}
                >
                    Place Order
                </button>
            </div>
        </div>
    );
};

export default Cart; 