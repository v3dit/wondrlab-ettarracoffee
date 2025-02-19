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

const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('looksEttarraWishlist')) || []);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [userName, setUserName] = useState(JSON.parse(localStorage.getItem('looksEttarraUserName')) || null);
  const [userCoupons, setUserCoupons] = useState(null);
  const [redeemedItems, setRedeemedItems] = useState({});
  const [pendingCouponRedemptions, setPendingCouponRedemptions] = useState({});
  const [totalPendingCoupons, setTotalPendingCoupons] = useState(0);

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setLoggedInUser(user.uid);
        console.log("User is logged in:", user.uid);
      } else {
        setLoggedInUser(null);
        console.log("No user logged in");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      const user = firebase.auth().currentUser;
      if (user?.email) {
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
      (wishlistItem) => wishlistItem.Name === item.Name && wishlistItem.Size === size && wishlistItem.Category === category
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
        Desc: item.Desc 
      }]);
    }

    const timestamp = new Date();
    window.gtag("event", `Looks_Item_Added`, { 
      'timestamp': timestamp.toLocaleString("en-GB"), 
      "Item": item 
    });
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

      const timestamp = new Date();
      window.gtag("event", `Looks_Item_Removed`, { 
        'timestamp': timestamp.toLocaleString("en-GB"), 
        "Order": itemForAnalytics 
      });
    }
  };

  const generateOrderId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  };

  const handlePlaceOrder = async (wishlist) => {
    try {
      setLoading(true);
      const user = firebase.auth().currentUser;
      
      if (!user) {
        alert("Please login to place an order");
        setLoading(false);
        return;
      }

      // Get current user coupon data first
      const couponQuery = database.ref('UserCoupons')
        .orderByChild('email')
        .equalTo(user.email);
      
      const snapshot = await couponQuery.once('value');
      const couponData = snapshot.val();
      
      if (!couponData) {
        throw new Error('No coupon data found for user');
      }

      const [couponId] = Object.keys(couponData);
      const currentCoupons = couponData[couponId].active_coupons || 0;

      // Validate if user has enough coupons
      if (currentCoupons < totalPendingCoupons) {
        alert('Not enough coupons available');
        setLoading(false);
        return;
      }

      // Create order reference
      const orderRef = database.ref('Orders').push();
      const orderId = orderRef.key;

      // Create and save order data
      const orderData = {
        items: wishlist.map(item => ({
          ...item,
          Price: isNaN(parseFloat(item.Price)) ? 0 : Math.max(0, parseFloat(item.Price)),
          Count: isNaN(parseInt(item.Count)) ? 0 : Math.max(0, parseInt(item.Count))
        })),
        appliedCoupons: pendingCouponRedemptions || {},
        totalCouponsUsed: Number(totalPendingCoupons) || 0,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        status: 'new',
        user: user.email,
        userId: user.uid,
        total: Number(calculateTotal(wishlist).toFixed(2)) || 0
      };

      // Use a transaction to update coupons atomically
      await database.ref(`UserCoupons/${couponId}`).transaction((userData) => {
        if (userData) {
          return {
            ...userData,
            active_coupons: userData.active_coupons - totalPendingCoupons,
            redemption_history: [
              ...(userData.redemption_history || []),
              {
                order_id: orderId,
                items: Object.entries(pendingCouponRedemptions).map(([name, count]) => ({
                  item_name: name,
                  count: count,
                  date: Date.now()
                })),
                total_coupons: totalPendingCoupons,
                timestamp: Date.now()
              }
            ]
          };
        }
        return userData;
      });

      // Save the order after coupon update
      await orderRef.set(orderData);

      // Clear states after successful order
      setWishlist([]);
      setPendingCouponRedemptions({});
      setTotalPendingCoupons(0);
      
      alert("Order placed successfully!");
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

  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((total, item) => {
      // Ensure Price and Count are numbers
      const price = Number(item.Price) || 0;
      const count = Number(item.Count) || 0;
      const appliedCoupons = Number(pendingCouponRedemptions[item.Name]) || 0;
      const paidQuantity = Math.max(0, count - appliedCoupons);
      
      // Calculate subtotal and ensure it's a valid number
      const subtotal = price * paidQuantity;
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
    <Router>
      {wishlistOpen ? (
        <div className='wishlist'>
          <div className='closeWishlist' onClick={() => setWishlistOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#291A02">
              <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
            </svg>
            <div className='cookies'>we use Cookies*</div>
          </div>
          {wishlist && wishlist.map((item) => (
            <div key={`${item.Name}-${item.Size}`} className='wishlistItem'>
              <div className='wishlistItemName'>{item.Name}</div>
              <div className="wishlistWishlistToggler">
                <div className="itemRemove" onClick={() => itemRemove(item, item.Size, item.Category)}>-</div>
                <div className="itemCount">{item.Count}</div>
                <div className="itemAdd" onClick={() => itemAdd(item, item.Size, item.Price, item.Category)}>+</div>
              </div>
              <div className='wishlistItemSize'>{item.Size}</div>
              
              {userCoupons?.active_coupons > 0 && (pendingCouponRedemptions[item.Name] || 0) < item.Count && (
                <button 
                  className="coupon-btn"
                  onClick={() => handleCouponRedeem(item)}
                >
                  Use Coupon ({userCoupons.active_coupons - totalPendingCoupons} available)
                </button>
              )}
              
              {pendingCouponRedemptions[item.Name] > 0 && (
                <div className="coupon-controls">
                  <div className="coupon-applied">
                    {pendingCouponRedemptions[item.Name]} Coupon{pendingCouponRedemptions[item.Name] > 1 ? 's' : ''} Selected
                  </div>
                  <button 
                    className="remove-coupon-btn"
                    onClick={() => removePendingCoupon(item)}
                  >
                    Remove Coupon
                  </button>
                </div>
              )}
            </div>
          ))}
          <div className="order-summary">
            {totalPendingCoupons > 0 && (
              <div className="pending-coupons-info">
                Total Coupons to be Used: {totalPendingCoupons}
              </div>
            )}
            <div className="placeOrderBar" onClick={() => handlePlaceOrder(wishlist)}>
              Place Order() 
            </div>
          </div>
        </div>
      ) : (
        <>
          {wishlist.length !== 0 ? (
            <div className={placedOrder.length !== 0 ? 'placedOrderOpenWishlistBar' : 'wishlistBar'} onClick={() => setWishlistOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="#ffffff">
                <path d="M280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Zm134 280h280-280Z" />
              </svg> Cart
            </div>
          ) : null}
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
            path="cold-coffee" 
            element={
              loggedInUser ? (
                <BestMenu 
                  WHICH="ColdCoffeeMenu" 
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
            path="hot-coffee" 
            element={
              loggedInUser ? (
                <BestMenu 
                  WHICH="HotCoffeeMenu" 
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
    </Router>
  );
};

export default App; 