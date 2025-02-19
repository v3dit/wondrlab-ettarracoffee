import React, { useState, useEffect } from 'react';
import database from '../config/FirbaseConfig';
import '../styles/Cart.css';

const Cart = ({ wishlist, loggedInUser, onPlaceOrder }) => {
    const [availableCoupons, setAvailableCoupons] = useState(0);
    const [redeemedItems, setRedeemedItems] = useState([]);

    useEffect(() => {
        if (loggedInUser) {
            const couponRef = database.ref(`UserCoupons/${loggedInUser}`);
            couponRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setAvailableCoupons(data.active_coupons || 0);
                }
            });
            return () => couponRef.off();
        }
    }, [loggedInUser]);

    const handleCouponRedeem = async (item) => {
        try {
            if (!loggedInUser) {
                alert("Please login to redeem coupons");
                return;
            }

            const userRef = database.ref(`UserCoupons/${loggedInUser}`);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val() || {};

            if (userData.active_coupons > 0) {
                // Create redemption entry
                const redemptionData = {
                    item_name: item.Name,
                    item_price: item.Price,
                    date: Date.now(),
                    category: item.Category,
                    redeemed_at: new Date().toISOString()
                };

                await userRef.update({
                    active_coupons: (userData.active_coupons || 0) - 1,
                    email: userData.email || '',
                    redemption_history: [...(userData.redemption_history || []), redemptionData],
                    last_redemption_date: new Date().toISOString(),
                    total_redemptions: (userData.total_redemptions || 0) + 1
                });

                setRedeemedItems([...redeemedItems, item.Name]);
                alert("Coupon redeemed successfully!");
            } else {
                alert("No coupons available to redeem");
            }
        } catch (error) {
            console.error("Error redeeming coupon:", error);
            alert("Error redeeming coupon. Please try again.");
        }
    };

    const calculateTotal = () => {
        return wishlist.reduce((total, item) => {
            if (redeemedItems.includes(item.Name)) {
                return total; // Item is free
            }
            return total + (item.Price * item.Count);
        }, 0);
    };

    return (
        <div className="cart-container">
            <h2>Your Cart</h2>
            
            {wishlist.map((item) => (
                <div key={item.Name} className="cart-item">
                    <div className="item-details">
                        <h3>{item.Name}</h3>
                        <p>Quantity: {item.Count}</p>
                        <p className="price">
                            {redeemedItems.includes(item.Name) ? 
                                <span className="coupon-applied">Free (Coupon Applied)</span> : 
                                `₹${item.Price * item.Count}`
                            }
                        </p>
                    </div>
                    
                    {availableCoupons > 0 && !redeemedItems.includes(item.Name) && (
                        <button 
                            className="redeem-coupon-btn"
                            onClick={() => handleCouponRedeem(item)}
                        >
                            Use Coupon
                            <span className="coupon-count">({availableCoupons} left)</span>
                        </button>
                    )}
                </div>
            ))}

            <div className="cart-summary">
                <div className="available-coupons">
                    Available Coupons: {availableCoupons}
                </div>
                <div className="total">
                    Total: ₹{calculateTotal()}
                </div>
                <button 
                    className="place-order-btn"
                    onClick={() => onPlaceOrder(calculateTotal(), redeemedItems)}
                >
                    Place Order
                </button>
            </div>
        </div>
    );
};

export default Cart;