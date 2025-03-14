import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import database from "./config/FirbaseConfig";
import UserLogin from "./pages/UserLogin";
import ProtectedUserRoute from "./components/ProtectedUserRoute";
import UserDashboard from "./pages/UserDashboard";
import LandingKaapiFest from "./pages/LandingKaapiFest";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import "./config/FirebaseConfig"; // Import this to ensure Firebase is initialized
import KDS from "./pages/KDS";
import Reports from "./pages/Reports";
import Stocks from "./pages/Stocks";
import CouponManagement from "./pages/CouponManagement";
import AdminCouponManagement from "./pages/AdminCouponManagement";
import BestMenu from "./pages/BestMenu";
import PageNotFound from "./pages/PageNotFound";
import KaapiFest from "./pages/KaapiFest";
import UserProfile from './pages/UserProfile';
import "./styles/App.css";
import { calculateTotalAfterDiscount, isCouponApplicable } from './utils/couponRules';
import notify from "./assets/notify.mp3";
import CouponAnalyticsPage from './pages/CouponAnalyticsPage';
import Games from "./pages/Games";

const ProtectedAnalyticsRoute = ({ children }) => {
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = firebase.auth().currentUser;

    useEffect(() => {
        const checkAccess = async () => {
            if (!user) {
                navigate('/');
                return;
            }

            try {
                const accessSnapshot = await database.ref(`Coupon_Access/${user.uid}`).once('value');
                const hasAccess = accessSnapshot.val();

                if (!hasAccess) {
                    navigate('/dashboard');
                    return;
                }

                setHasAccess(true);
            } catch (error) {
                console.error('Error checking access:', error);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [user, navigate]);

    if (loading) return null;
    if (!hasAccess) return null;

    return children;
};

// Add email encoding function at the top level
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

// Add safe Firebase operation wrapper
const safeFirebaseOperation = async (operation) => {
    try {
        return await operation();
    } catch (error) {
        console.log('Firebase operation error:', error);
        return null;
    }
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

const AppContent = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('looksEttarraWishlist')) || []);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState([]);
  const [placedOrderOpen, setPlacedOrderOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [userName, setUserName] = useState(JSON.parse(localStorage.getItem('looksEttarraUserName')) || null);
  const [userCoupons, setUserCoupons] = useState(null);
  const [redeemedItems, setRedeemedItems] = useState({});
  const [pendingCouponRedemptions, setPendingCouponRedemptions] = useState({});
  const [totalPendingCoupons, setTotalPendingCoupons] = useState(0);
  const [showNoCouponsModal, setShowNoCouponsModal] = useState(false);

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setLoggedInUser(user.uid);
        console.log("User is logged in:", user.uid);
        // The user's email will be used in the userName state
        if (!userName) {
          setUserName(user.email);
          localStorage.setItem('looksEttarraUserName', JSON.stringify(user.email));
        }
      } else {
        setLoggedInUser(null);
        setPlacedOrder([]);
        console.log("No user logged in");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userName]);

  useEffect(() => {
    if (loggedInUser) {
      const user = firebase.auth().currentUser;
      if (user?.email) {
        const encodedEmail = encodeEmail(user.email);
        const couponQuery = database.ref('UserCoupons')
          .orderByChild('email')
          .equalTo(user.email);
        
        couponQuery.on('value', (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserCoupons(Object.values(data)[0]);
          }
        });

        return () => couponQuery.off();
      }
    }
  }, [loggedInUser]);

  useEffect(() => {
    const getPlacedOrders = async () => {
      try {
        if (!userName) return;
        
        const encodedUserName = encodeEmail(userName);
        const ordersRef = database.ref(`orders/${encodedUserName}`);

    // Listen for active orders in the 'new' collection
    const newOrdersRef = database.ref('new');
        const newOrdersListener = newOrdersRef.on('value', (snapshot) => {
      const newOrdersData = snapshot.val();
      const userActiveOrders = [];

      if (newOrdersData) {
        // Group items by order_id
        const orderGroups = {};
        
            Object.entries(newOrdersData).forEach(([key, item]) => {
          // Check if this order belongs to the current user
              if (item.customer_name && item.customer_name.startsWith(userName)) {
            if (!orderGroups[item.order_id]) {
              orderGroups[item.order_id] = {
                id: item.order_id,
                items: [],
                    status: 'Pending',
                    timestamp: item.created_on,
                customer_name: item.customer_name
              };
            }
            
            // Add this item to the order
            orderGroups[item.order_id].items.push({
              ...item,
              id: key
            });
            
            // Update order status based on item statuses
                if (item.status === 'Preparing') {
              orderGroups[item.order_id].status = 'Preparing';
            }
          }
        });
        
            // Convert order groups to array
        Object.values(orderGroups).forEach(order => {
          userActiveOrders.push(order);
        });
      }

      // Listen for completed orders
          const completedRef = database.ref('completed');
          const completedQuery = completedRef.orderByChild('customer_name').startAt(userName).endAt(userName + '\uf8ff');
          completedQuery.on('value', (completedSnapshot) => {
        const completedOrdersData = completedSnapshot.val();
        const userCompletedOrders = [];

        if (completedOrdersData) {
          // Group items by order_id
          const completedOrderGroups = {};
          
              Object.entries(completedOrdersData).forEach(([key, item]) => {
                if (item.customer_name && item.customer_name.startsWith(userName)) {
              if (!completedOrderGroups[item.order_id]) {
                completedOrderGroups[item.order_id] = {
                  id: item.order_id,
                  items: [],
                      status: item.status || 'Served',
                      timestamp: item.created_on,
                  customer_name: item.customer_name
                };
              }
              
              completedOrderGroups[item.order_id].items.push({
                ...item,
                id: key
              });
            }
          });
          
          Object.values(completedOrderGroups).forEach(order => {
            userCompletedOrders.push(order);
          });
        }

            // Also check orders collection for cancelled orders
            const ordersRef = database.ref(`orders/${encodedUserName}`);
            ordersRef.on('value', (ordersSnapshot) => {
              const ordersData = ordersSnapshot.val();
              const cancelledOrders = [];

              if (ordersData) {
                const cancelledOrderGroups = {};
                
                Object.entries(ordersData).forEach(([key, item]) => {
                  if (item.status === 'Cancelled') {
                    if (!cancelledOrderGroups[item.order_id]) {
                      cancelledOrderGroups[item.order_id] = {
                        id: item.order_id,
                        items: [],
                        status: 'Cancelled',
                        timestamp: item.created_on,
                        customer_name: item.customer_name
                      };
                    }
                    
                    cancelledOrderGroups[item.order_id].items.push({
                      ...item,
                      id: key
                    });
                  }
                });
                
                Object.values(cancelledOrderGroups).forEach(order => {
                  cancelledOrders.push(order);
                });
              }

              // Combine all orders and sort by timestamp (newest first)
              const allOrders = [...userActiveOrders, ...userCompletedOrders, ...cancelledOrders].sort((a, b) => {
                const dateA = new Date(a.timestamp.split(', ')[0].split('/').reverse().join('-') + 'T' + a.timestamp.split(', ')[1]);
                const dateB = new Date(b.timestamp.split(', ')[0].split('/').reverse().join('-') + 'T' + b.timestamp.split(', ')[1]);
                return dateB - dateA;
        });

        setPlacedOrder(allOrders);
            });
      });
    });

        // Cleanup function
    return () => {
          database.ref('new').off('value', newOrdersListener);
          ordersRef.off();
    };
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
  };

    getPlacedOrders();
  }, [userName]);

  // Handle cancelling an order
  const handleCancelItem = async (orderId) => {
    try {
      setLoading(true);
      
      const orderToCancel = placedOrder.find(order => order.id === orderId);
      if (!orderToCancel) {
        alert("Order not found");
        setLoading(false);
        return;
      }
      
      if (orderToCancel.status !== 'Pending') {
        alert("Only pending orders can be cancelled");
        setLoading(false);
        return;
      }
      
      if (window.confirm("Proceed with order cancellation?")) {
        const encodedUserName = encodeEmail(userName);
        
        // Count how many coupons were used in this order to refund them
        let couponsToRefund = 0;
        
        for (const item of orderToCancel.items) {
          await database.ref(`new/${item.id}`).remove();
          
          const timestamp = new Date();
          await database.ref(`orders/${encodedUserName}/${item.id}`).update({
            status: "Cancelled",
            cancelled_by: userName,
            cancelled_on: timestamp.toLocaleString("en-GB")
          });
          
          // Count coupons used for this item
          if (item.coupon_redeemed) {
            couponsToRefund += (item.coupon_quantity || 1);
          }
        }
        
        // Refund coupons if any were used
        if (couponsToRefund > 0) {
          try {
            const user = firebase.auth().currentUser;
            if (user && user.email) {
              // Get the coupon entry ID
              const couponQuery = database.ref('UserCoupons')
                .orderByChild('email')
                .equalTo(user.email);
              
              const snapshot = await couponQuery.once('value');
              const couponData = snapshot.val();
              
              if (couponData) {
                const [couponId] = Object.keys(couponData);
                
                // First get the current user coupon data
                const userCouponRef = database.ref(`UserCoupons/${couponId}`);
                const userCouponSnapshot = await userCouponRef.once('value');
                const userCouponData = userCouponSnapshot.val();
                
                // Add cancellation entry to history
                const cancellationEntry = {
                  date: Date.now(),
                  action: "refund",
                  reason: "order_cancelled",
                  order_id: orderId,
                  coupons_refunded: couponsToRefund,
                  refunded_at: new Date().toISOString()
                };
                
                // Create or update the cancellation history array
                const cancellationHistory = userCouponData.cancellation_history || [];
                cancellationHistory.push(cancellationEntry);
                
                // Update UserCoupons to add back the coupons
                await userCouponRef.update({
                  active_coupons: (userCouponData.active_coupons || 0) + couponsToRefund,
                  cancellation_history: cancellationHistory
                });
                
                console.log(`Refunded ${couponsToRefund} coupons for cancelled order ${orderId}`);
              }
            }
          } catch (error) {
            console.error("Error refunding coupons:", error);
            // Continue with order cancellation even if coupon refund fails
          }
        }
        
        alert("Order cancelled successfully!");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Error cancelling order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('looksEttarraWishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const validateWishlistItem = (item) => {
    const price = parseFloat(item.Price);
    const count = parseInt(item.Count);
    return {
      ...item,
      Price: isNaN(price) ? 0 : Math.max(0, price),
      Count: isNaN(count) ? 0 : Math.max(0, count)
    };
  };

  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem('looksEttarraWishlist')) || [];
    // Validate prices when loading from localStorage
    setWishlist(savedWishlist.map(validateWishlistItem));
  }, []);

  const itemAdd = (item, size, price, category) => {
    const existingItemIndex = wishlist.findIndex(
      (wishlistItem) => 
        wishlistItem.Name === item.Name && 
        wishlistItem.Size === size && 
        wishlistItem.Category === category &&
        // Add syrup to the matching criteria
        JSON.stringify(wishlistItem.syrup) === JSON.stringify(item.syrup)
    );

    if (item.Stock <= 0) {
      alert("This item is out of stock.");
      return;
    }

    const currentWishlistCount = wishlist[existingItemIndex]?.Count || 0;

    if (currentWishlistCount >= item.Stock) {
      alert(`Only ${item.Stock} ${item.Name} Available`);
      return;
    }

    if (existingItemIndex !== -1) {
      const updatedWishlist = [...wishlist];
      updatedWishlist[existingItemIndex].Count += 1;
      updatedWishlist[existingItemIndex].Stock = item.Stock;
      setWishlist(updatedWishlist);
    } else {
      setWishlist([...wishlist, { 
        Name: item.Name, 
        Size: size, 
        Price: price, 
        Count: 1, 
        Category: category, 
        Stock: item.Stock, 
        Desc: item.Desc,
        syrup: item.syrup // Add syrup information to the wishlist item
      }]);
    }

    // Safely call analytics
    try {
      const timestamp = new Date();
      if (typeof window.gtag === 'function') {
        window.gtag("event", `Looks_Item_Added`, { 
          'timestamp': timestamp.toLocaleString("en-GB"), 
          "Item": item 
        });
      }
    } catch (error) {
      console.warn("Analytics error:", error);
    }
  };

  const itemRemove = (item, size, category) => {
    const existingItemIndex = wishlist.findIndex(
      (wishlistItem) => wishlistItem.Name === item.Name && wishlistItem.Size === size && wishlistItem.Category === category
    );

    if (existingItemIndex !== -1) {
      const updatedWishlist = [...wishlist];
      const updatedItem = updatedWishlist[existingItemIndex];
      const itemForAnalytics = { ...updatedItem };

      if (updatedItem.Count > 1) {
        updatedItem.Count -= 1;
        setWishlist(updatedWishlist);
      } else {
        updatedWishlist.splice(existingItemIndex, 1);
        setWishlist(updatedWishlist);
      }

      // Safely call analytics
      try {
        const timestamp = new Date();
        if (typeof window.gtag === 'function') {
          window.gtag("event", `Looks_Item_Removed`, { 
            'timestamp': timestamp.toLocaleString("en-GB"), 
            "Order": itemForAnalytics 
          });
        }
      } catch (error) {
        console.warn("Analytics error:", error);
      }
    }
  };

  const generateOrderId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  };

  const getTotalItemCount = () => {
    if (!wishlist || !Array.isArray(wishlist)) return 0;
    return wishlist.reduce((total, item) => total + (Number(item.Count) || 0), 0);
  };

  const placeOrder = async (items, user, section, redeemedItems = {}) => {
    try {
        setLoading(true);
        
        const timestamp = new Date();
        const timestampString = timestamp.toLocaleString("en-GB");
        const [datePart, timePart] = timestampString.split(", ");
        const orderId = `${datePart.split('/').join('')}${timePart.split(':').join('')}`;
        
        const encodedUser = encodeEmail(user);
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemId = `${orderId}${i}`;
            const isCouponRedeemed = redeemedItems && redeemedItems[item.Name] > 0;
            
            // Calculate total price including syrup if present
            const basePrice = parseFloat(item.Price) || 0;
            const syrupPrice = item.syrup ? parseFloat(item.syrup.price) || 0 : 0;
            const totalPrice = basePrice; // Base price already includes syrup price from earlier
            
            const itemData = {
                Name: item.Name,
                Price: totalPrice,
                Section: section || "Main",
                Size: item.Size || "",
                Stock: item.Stock || 0,
                Category: item.Category || "",
                Count: item.Count || 1,
                Desc: item.Desc || "",
                created_on: timestampString,
                created_on_date: datePart,
                created_on_time: timePart,
                customer_name: user, // Just use the customer name without the orderId
                order_id: orderId,
                order_item_id: itemId,
                status: "Pending",
                coupon_redeemed: isCouponRedeemed,
                coupon_quantity: isCouponRedeemed ? redeemedItems[item.Name] : 0
            };

            // Add syrup information if present
            if (item.syrup) {
                itemData.syrup = {
                    name: item.syrup.name,
                    price: item.syrup.price,
                    total_price: totalPrice
                };
                itemData.has_syrup = true;
            }
            
            // Log the item data before saving
            console.log("Saving item data:", itemData);
            
            await database.ref(`new/${itemId}`).set(itemData);
            await database.ref(`orders/${encodedUser}/${itemId}`).set(itemData);
        }
        
        setLoading(false);
        return true;
    } catch (error) {
        console.error("Error placing order:", error);
        setLoading(false);
        return false;
    }
};

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      
      if (!userCoupons || userCoupons.active_coupons <= 0) {
        setShowNoCouponsModal(true);
        setLoading(false);
        return;
      }

      let customer_name = userName;

      // Check if user has enough coupons for all items
      const totalItems = getTotalItemCount();
      if (totalItems > userCoupons.active_coupons) {
        alert(`You have ${userCoupons.active_coupons} coupons but trying to order ${totalItems} items. Please adjust your cart or get more coupons.`);
        setLoading(false);
        return;
      }

      if (window.confirm("Confirm and Proceed")) {
        // Prompt for name if it's null or invalid
        if (!userName || userName === 'undefined' || userName === '' || userName === 'Enter here') {
          let name = window.prompt("Please enter your name", "");
          while (!name || name === 'undefined' || name === '' || name === 'Enter here') {
            name = window.prompt("Please enter your name", "Enter here");
          }
          customer_name = name;
          setUserName(name);
          localStorage.setItem('looksEttarraUserName', JSON.stringify(name));
        }

        // Process coupon redemptions
        const redeemedItemsMap = {};
        let remainingCoupons = userCoupons.active_coupons;
        
        // Apply coupons to items (one coupon per item)
        for (const item of wishlist) {
          if (remainingCoupons > 0) {
            const couponsForThisItem = Math.min(item.Count, remainingCoupons);
            redeemedItemsMap[item.Name] = couponsForThisItem;
            remainingCoupons -= couponsForThisItem;
          }
        }

        // Place the order
        const success = await placeOrder(wishlist, customer_name, localStorage.getItem('looksEttarraSection'), redeemedItemsMap);
        
        if (success) {
          try {
            const user = firebase.auth().currentUser;
            if (user && user.email) {
              // Get the coupon entry ID
              const couponQuery = database.ref('UserCoupons')
                .orderByChild('email')
                .equalTo(user.email);
              
              const snapshot = await couponQuery.once('value');
              const couponData = snapshot.val();
              
              if (couponData) {
                const [couponId] = Object.keys(couponData);
                
                // Create redemption history entries
                const redemptionHistory = wishlist
                  .filter(item => redeemedItemsMap[item.Name] > 0)
                  .map(item => ({
                    item_name: item.Name,
                    item_price: item.Price,
                    date: Date.now(),
                    category: item.Category || "Unknown",
                    redeemed_at: new Date().toISOString(),
                    quantity: redeemedItemsMap[item.Name]
                  }));
                
                // Update UserCoupons
                await database.ref(`UserCoupons/${couponId}`).update({
                  active_coupons: userCoupons.active_coupons - totalItems,
                  redemption_history: [...(userCoupons.redemption_history || []), ...redemptionHistory],
                  last_redemption_date: new Date().toISOString(),
                  total_redemptions: (userCoupons.total_redemptions || 0) + totalItems
                });
              }
            }
          } catch (error) {
            console.error("Error updating coupon count:", error);
            // Continue with order confirmation even if coupon update fails
          }
          
          playNotificationSound();
          setWishlist([]);
          localStorage.removeItem('looksEttarraWishlist');
          setWishlistOpen(false);
          alert("Order Placed Successfully!");
        } else {
          alert("Failed to place order. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error in handlePlaceOrder:", error);
      alert(error.message || "An error occurred while placing the order");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderComplete = async (orderId) => {
    try {
      // Check if order qualifies for coupon reward
      const orderRef = await database.ref(`Orders/${orderId}`).once('value');
      const orderData = orderRef.val();
      
      if (orderData && orderData.items && qualifiesForCouponReward(orderData)) {
        // Award new coupon
        await database.ref(`UserCoupons/${loggedInUser}`).update({
          active_coupons: firebase.database.ServerValue.increment(1),
          earned_history: firebase.database.ServerValue.increment(1)
        });
      }
    } catch (error) {
      console.error("Error processing coupon reward:", error);
    }
  };

  const calculateTotal = (items, redeemedItemsMap = {}) => {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((total, item) => {
      // Ensure Price and Count are numbers
      const price = Number(item.Price) || 0;
      const count = Number(item.Count) || 0;
      
      // Calculate how many items are paid for (after coupon redemption)
      const redeemedCount = redeemedItemsMap && redeemedItemsMap[item.Name] 
        ? Math.min(count, redeemedItemsMap[item.Name]) 
        : 0;
      const paidCount = count - redeemedCount;
      
      // Calculate subtotal and ensure it's a valid number
      const subtotal = price * paidCount;
      return total + (isNaN(subtotal) ? 0 : subtotal);
    }, 0);
  };

  const qualifiesForCouponReward = (orderData) => {
    if (!orderData || !orderData.items) return false;
    const orderTotal = calculateTotal(orderData.items);
    return orderTotal >= 500; // Award coupon for orders over Rs. 500
  };

  const playNotificationSound = () => {
    const audio = new Audio(notify); // Make sure to import the notify sound
    audio.play();
  };

  const handleCouponRedeem = (item) => {
    try {
      if (!userCoupons || userCoupons.active_coupons <= 0) {
        alert("No coupons available!");
        return;
      }

      const currentItemRedemptions = pendingCouponRedemptions[item.Name] || 0;
      if (currentItemRedemptions >= item.Count) {
        alert("You've already selected maximum coupons for this item!");
        return;
      }

      if (totalPendingCoupons >= userCoupons.active_coupons) {
        alert("You don't have enough coupons!");
        return;
      }

      // Only update the pending redemptions, don't actually redeem yet
      setPendingCouponRedemptions(prev => ({
        ...prev,
        [item.Name]: (prev[item.Name] || 0) + 1
      }));
      setTotalPendingCoupons(prev => prev + 1);
    } catch (error) {
      console.error("Error setting pending coupon:", error);
      alert("Error applying coupon. Please try again.");
    }
  };

  const removePendingCoupon = (item) => {
    setPendingCouponRedemptions(prev => ({
      ...prev,
      [item.Name]: Math.max(0, (prev[item.Name] || 0) - 1)
    }));
    setTotalPendingCoupons(prev => prev - 1);
  };

  const clearPendingRedemptions = () => {
    setPendingCouponRedemptions({});
    setTotalPendingCoupons(0);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {placedOrderOpen ? (
        <div className='wishlist'>
          <div className='closeWishlist' onClick={() => setPlacedOrderOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#291A02">
              <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
            </svg>
            <div className='cookies-notice'>Order Status</div>
          </div>
          
          <h2 className="wishlist-title">Your Orders</h2>
          
          {placedOrder && placedOrder.length > 0 ? (
            <div className="order-status-container">
              {placedOrder.map((order) => (
                <div key={order.id} className={`order-status-card status-${order.status.toLowerCase()}`}>
                  <div className="order-status-header">
                    <div className="order-id">Order #{order.id.slice(-6)}</div>
                    <div className="order-timestamp">{order.timestamp}</div>
                    {order.status === 'Pending' && (
                      <div className="cancel-order" onClick={() => handleCancelItem(order.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="#d32f2f">
                          <path d="M0 0h24v24H0z" fill="none"/>
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-status-badge">
                    {order.status === 'Pending' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="#f57c00">
                          <path d="M0 0h24v24H0z" fill="none"/>
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                          <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        <span>Pending</span>
                      </>
                    )}
                    
                    {order.status === 'Preparing' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="#ff9800">
                          <path d="M0 0h24v24H0z" fill="none"/>
                          <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                        </svg>
                        <span>Preparing</span>
                      </>
                    )}
                    
                    {order.status === 'Served' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="#4caf50">
                          <path d="M0 0h24v24H0z" fill="none"/>
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span>Served</span>
                      </>
                    )}
                    
                    {order.status === 'Cancelled' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="#d32f2f">
                          <path d="M0 0h24v24H0z" fill="none"/>
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        <span>Cancelled</span>
                      </>
                    )}
                  </div>
                  
                  <div className="order-items-list">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="order-item-name">{item.Name}</div>
                        <div className="order-item-size">{item.Size}</div>
                        <div className="order-item-count">x{item.Count}</div>
                        <div className={`order-item-status status-${item.status?.toLowerCase() || 'pending'}`}>
                          {item.status || 'Pending'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-orders">
              <div className="empty-orders-icon">📋</div>
              <p>You haven't placed any orders yet</p>
              <button className="continue-shopping" onClick={() => setPlacedOrderOpen(false)}>
                Back to Menu
              </button>
            </div>
          )}
        </div>
      ) : wishlistOpen ? (
        <div className='wishlist'>
          <div className='closeWishlist' onClick={() => setWishlistOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#291A02">
              <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
            </svg>
            <div className='cookies-notice'>we use Cookies*</div>
          </div>
          
          <h2 className="wishlist-title">Your Cart</h2>
          
          {wishlist && wishlist.length > 0 ? (
            <>
              <div className="wishlist-items">
                {wishlist.map((item, index) => {
                  // Calculate if this item will have coupons applied
                  const willApplyCoupon = userCoupons && userCoupons.active_coupons > 0 && 
                    index < Math.min(getTotalItemCount(), userCoupons.active_coupons);
                  
                  // Create a unique key that includes syrup info
                  const itemKey = `${item.Name}-${item.Size}-${item.syrup?.name || 'no-syrup'}`;
                  
                  return (
                    <div 
                      key={itemKey}
                      className={`wishlistItem ${willApplyCoupon ? 'has-coupon' : ''}`}
                    >
                      <div className='wishlistItemName'>
                        {item.Name}
                        {item.syrup && (
                          <span className="syrup-tag">
                            + {item.syrup.name} Syrup
                          </span>
                        )}
                      </div>
                      <div className="wishlistWishlistToggler">
                        <div className="itemRemove" onClick={() => itemRemove(item, item.Size, item.Category)}>-</div>
                        <div className="itemCount">{item.Count}</div>
                        <div className="itemAdd" onClick={() => itemAdd(item, item.Size, item.Price, item.Category)}>+</div>
                      </div>
                      <div className='wishlistItemSize'>{item.Size}</div>
                      {willApplyCoupon && (
                        <div className="coupon-tag">
                          <span className="coupon-tag-icon">🎟️</span>
                          <span>Coupon Applied</span>
                        </div>
                      )}
                      {item.syrup && (
                        <div className="item-price">
                          +₹{item.syrup.price}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="order-summary">
                {userCoupons && userCoupons.active_coupons > 0 && (
                  <div className="coupon-summary">
                    <div className="coupon-badge">
                      🎟️
                    </div>
                    <div className="coupon-message">
                      <div className="coupon-counter">
                        <div className="coupon-counter-available">
                          <span className="counter-number">{userCoupons.active_coupons}</span>
                          <span className="counter-label">Available</span>
                        </div>
                        <div className="coupon-counter-divider"></div>
                        <div className="coupon-counter-needed">
                          <span className="counter-number">{getTotalItemCount()}</span>
                          <span className="counter-label">Needed</span>
                        </div>
                      </div>
                      
                      <div className={`coupon-status ${getTotalItemCount() > userCoupons.active_coupons ? 'coupon-warning' : 'coupon-ok'}`}>
                        {getTotalItemCount() > userCoupons.active_coupons 
                          ? `Not enough coupons for all items`
                          : getTotalItemCount() === userCoupons.active_coupons
                            ? `Perfect match! All items covered`
                            : `All items will be covered by coupons`
                        }
                      </div>
                    </div>
                  </div>
                )}
                
                <div 
                  className={`placeOrderBar ${userCoupons && getTotalItemCount() > userCoupons.active_coupons && userCoupons.active_coupons > 0 ? 'has-warning' : ''}`} 
                  onClick={handlePlaceOrder}
                >
                  Place Order
                </div>
              </div>
            </>
          ) : (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <p>Your cart is empty</p>
              <button className="continue-shopping" onClick={() => setWishlistOpen(false)}>
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {wishlist.length > 0 && (
            <div className={placedOrder.length !== 0 ? 'placedOrderOpenWishlistBar' : 'wishlistBar'} onClick={() => setWishlistOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="#ffffff">
                <path d="M280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Zm134 280h280-280Z" />
              </svg> Cart
            </div>
          )}
          
          {placedOrder.length > 0 && (
            <div className='ordersBar' onClick={() => setPlacedOrderOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 0 24 24" width="28px" fill="#ffffff">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg> Orders
            </div>
          )}
        </>
      )}

      <Routes>
        {/* Root route */}
        <Route 
          path="/" 
          element={
            loggedInUser ? (
              <Navigate to="/menu" replace />
            ) : (
              <UserLogin setLoggedInUser={setLoggedInUser} />
            )
          } 
        />

        {/* Menu routes */}
        <Route
          path="/menu"
          element={
            loggedInUser ? (
              <LandingKaapiFest />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Nested menu routes */}
        <Route path="/menu">
          <Route index element={<LandingKaapiFest />} />
          <Route 
            path="tea" 
            element={
              loggedInUser ? (
                <BestMenu 
                  WHICH="TeaMenu" 
                  wishlist={wishlist} 
                  setWishlist={setWishlist}
                  itemAdd={itemAdd}
                  itemRemove={itemRemove}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route 
            path="coffee" 
            element={
              loggedInUser ? (
                <BestMenu 
                  WHICH="CoffeeMenu" 
                  wishlist={wishlist} 
                  setWishlist={setWishlist}
                  itemAdd={itemAdd}
                  itemRemove={itemRemove}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route 
            path="savoury" 
            element={
              loggedInUser ? (
                <BestMenu 
                  WHICH="SavouryMenu" 
                  wishlist={wishlist} 
                  setWishlist={setWishlist}
                  itemAdd={itemAdd}
                  itemRemove={itemRemove}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route 
            path="kaapi-fest" 
            element={
              loggedInUser ? (
                <KaapiFest 
                  WHICH="KaapiFestMenu" 
                  wishlist={wishlist} 
                  setWishlist={setWishlist}
                  itemAdd={itemAdd}
                  itemRemove={itemRemove}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Route>

        {/* Admin routes */}
        <Route 
          path="/admin/login" 
          element={<Login setLoggedInUser={setLoggedInUser} />} 
        />

        <Route path="/dashboard">
          <Route 
            index 
            element={
              loggedInUser ? (
                <Dashboard loggedInUser={loggedInUser} />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            } 
          />
          
          <Route
            path="KDS"
            element={
              loggedInUser ? (
                <KDS loggedInUser={loggedInUser} />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />

          <Route
            path="Stocks"
            element={
              loggedInUser ? (
                <Stocks loggedInUser={loggedInUser} />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />

          <Route
            path="Reports"
            element={
              loggedInUser ? (
                <Reports loggedInUser={loggedInUser} />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />

          <Route
            path="coupon-management"
            element={
              loggedInUser ? (
                <AdminCouponManagement loggedInUser={loggedInUser} />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />

          <Route
            path="coupon-analytics"
            element={
              loggedInUser ? (
                <CouponAnalyticsPage loggedInUser={loggedInUser} />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
        </Route>

        {/* User routes */}
        <Route
          path="/user-dashboard"
          element={
            loggedInUser ? (
              <UserDashboard loggedInUser={loggedInUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/profile"
          element={
            loggedInUser ? (
              <UserProfile loggedInUser={loggedInUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Coupon Analytics route */}
        <Route 
          path="/coupon-analytics" 
          element={
            <ProtectedAnalyticsRoute>
              <CouponAnalyticsPage />
            </ProtectedAnalyticsRoute>
          } 
        />

        {/* Menu/KaapiFest route */}
        <Route path="/Menu/KaapiFest" element={<KaapiFest />} />

        {/* Games route */}
        <Route path="/Games" element={<Games />} />

        {/* Catch all - redirect to user login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showNoCouponsModal && (
        <NoCouponsModal onClose={() => setShowNoCouponsModal(false)} />
      )}
    </>
  );
};

const NoCouponsModal = ({ onClose }) => {
  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="no-coupons-modal">
        <div className="no-coupons-content">
          <div className="no-coupons-title">Busted! 🕵️‍♂️</div>
          
          <div className="emoji-container">
            <div className="coffee-emoji">☕</div>
            <div className="thief-emoji">🏃‍♂️</div>
          </div>
          
          <div className="no-coupons-message">
            Sneaking coffee without coupons?
            <br />
            That's not very brew-tiful of you!
          </div>
          
          <button className="no-coupons-button" onClick={onClose}>
            Bean caught, need coupons! 
          </button>
        </div>
      </div>
    </>
  );
};

export default App; 