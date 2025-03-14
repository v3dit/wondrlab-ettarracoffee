import React, { useEffect, useState } from "react";
import database from "../config/FirbaseConfig";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "../styles/KDS.css";
import notify from "../assets/notify.mp3";

// Error boundary component to catch and handle errors
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: false }; // Set to false to suppress error UI
    }

    componentDidCatch(error, errorInfo) {
        // Log the error but don't show it in UI
        console.log('Suppressed error:', error);
    }

    render() {
        return this.props.children;
    }
}

const KDS = ({ loggedInUser }) => {
    const [KDSAccess, setKDSAccess] = useState(false);
    const [orders, setOrders] = useState({});
    const [time, setTime] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [audioInitialized, setAudioInitialized] = useState(false);
    const [hasNewOrders, setHasNewOrders] = useState(false);
    const [audio] = useState(new Audio(notify));
    const [orderTimers, setOrderTimers] = useState({});
    const [itemTimers, setItemTimers] = useState({});

    useEffect(() => {
        const getAccess = async () => {
            try {
                if (!loggedInUser) return;
                const encodedEmail = encodeEmail(loggedInUser);
                const accessSnapshot1 = await safeFirebaseOperation(() => 
                    database.ref(`KDS_Access/${encodedEmail}`).once('value')
                );
                setKDSAccess(accessSnapshot1?.val() || false);
            } catch (error) {
                console.error(error);
            }
        }

        getAccess();
    }, [loggedInUser]);

    // Add this helper function at the top of your component
    const encodeEmail = (email) => {
        if (!email) return '';
        // Replace all invalid characters with safe alternatives
        return email.toString()
            .replace(/\./g, '-dot-')
            .replace(/@/g, '-at-')
            .replace(/\$/g, '-dollar-')
            .replace(/\[/g, '-lbracket-')
            .replace(/\]/g, '-rbracket-')
            .replace(/#/g, '-hash-');
    };

    // Safe way to play notification sound
    const playNotificationSound = () => {
        if (audioInitialized) {
            const notificationAudio = new Audio(notify);
            notificationAudio.volume = 0.5;
            notificationAudio.play().catch(err => console.log("Audio play failed:", err));
        } else {
            setHasNewOrders(true);
        }
    };

    // Initialize audio after user interaction
    const initializeAudio = () => {
        if (!audioInitialized) {
            const tempAudio = new Audio(notify);
            tempAudio.volume = 0.5;
            
            tempAudio.play().then(() => {
                tempAudio.pause();
                tempAudio.currentTime = 0;
                setAudioInitialized(true);
                
                // If there were new orders waiting for notification, play sound now
                if (hasNewOrders) {
                    playNotificationSound();
                    setHasNewOrders(false);
                }
            }).catch(err => {
                console.log("Could not initialize audio:", err);
            });
        }
    };

    // Update orders from Firebase snapshot
    const updateOrders = (snapshot) => {
        try {
            if (snapshot.val() !== null) {
                const ordersObject = snapshot.val();
                const sortedOrders = Object.keys(ordersObject)
                    .map(key => ({ ...ordersObject[key], id: key }))
                    .sort((a, b) => {
                        // Parse dates properly
                        const dateA = parseCustomTimestamp(a.created_on);
                        const dateB = parseCustomTimestamp(b.created_on);
                        return dateB - dateA;
                    });
                
                const groupedOrders = sortedOrders.reduce((acc, order) => {
                    const orderId = order.order_id;
                    if (!acc[orderId]) {
                        acc[orderId] = [];
                    }
                    acc[orderId].push(order);
                    return acc;
                }, {});

                // Initialize timers for new orders and items
                Object.keys(groupedOrders).forEach(orderId => {
                    const orderItems = groupedOrders[orderId];
                    // Get the earliest created_on time from all items in the order
                    const orderCreationTime = orderItems.reduce((earliest, item) => {
                        const itemTime = parseCustomTimestamp(item.created_on);
                        return earliest ? (itemTime < earliest ? itemTime : earliest) : itemTime;
                    }, null);

                    // Check if this is a new order that needs a timer
                    if (!orderTimers[orderId]) {
                        setOrderTimers(prev => ({
                            ...prev,
                            [orderId]: {
                                startTime: orderCreationTime,
                                status: orderItems[0]?.status || "Pending"
                            }
                        }));
                    }

                    // Check for new items that need timers
                    orderItems.forEach(item => {
                        if (!itemTimers[item.order_item_id] && item.status === "Preparing") {
                            const prepStartTime = item.prep_start_time 
                                ? parseCustomTimestamp(item.prep_start_time) 
                                : new Date();
                            
                            setItemTimers(prev => ({
                                ...prev,
                                [item.order_item_id]: {
                                    startTime: prepStartTime,
                                    status: item.status
                                }
                            }));
                        }
                    });
                });
                
                setOrders(groupedOrders);
            } else {
                // Clear orders if snapshot.val() is null
                setOrders({});
            }
        }
        catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        const getPlacedOrders = async () => {
            try {
                setLoading(true);
                const snapshot = await safeFirebaseOperation(() => 
                    database.ref(`new`).once("value")
                );
                const initialOrders = snapshot?.val() || {};
                setLoading(false);
                updateOrders(snapshot);

                // Store initial order IDs
                const initialOrderIds = new Set(Object.keys(initialOrders).map(key => initialOrders[key].order_id));

                // Detect when new orders are added
                const onNewOrder = database.ref(`new`).on("child_added", (snapshot) => {
                    const newItem = snapshot.val();
                    if (newItem && newItem.order_id) {
                        // Play sound only if this is from a new order
                        if (!initialOrderIds.has(newItem.order_id)) {
                            playNotificationSound();
                            initialOrderIds.add(newItem.order_id); // Add to tracked orders
                        }
                    }
                });

                const unsubscribe = database.ref(`new`).on("value", updateOrders);

                return () => {
                    safeFirebaseOperation(() => database.ref(`new`).off("value", unsubscribe));
                    safeFirebaseOperation(() => database.ref(`new`).off("child_added", onNewOrder));
                };
            } catch (error) {
                console.error(error.message);
            }
            finally {
                setLoading(false);
            }
        };

        getPlacedOrders();
    }, [audioInitialized, orderTimers, itemTimers]);

    useEffect(() => {
        // Update time every second for accurate timers
        const timeInterval = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timeInterval);
    }, []);

    // Get overall order status based on item statuses
    const getOrderStatus = (orderItems) => {
        if (!orderItems || orderItems.length === 0) return "Pending";
        
        const allServed = orderItems.every(item => item.status === "Served");
        if (allServed) return "Served";
        
        const anyPreparing = orderItems.some(item => item.status === "Preparing");
        if (anyPreparing) return "Preparing";
        
        return "Pending";
    };

    // Handle status change for an individual item
    const handleItemStatusChange = async (orderId, itemId, currentStatus) => {
        try {
            const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
            if (itemElement) {
                itemElement.classList.add('item-loading');
            }
            
            const timestamp = new Date();
            const timestampString = timestamp.toLocaleString("en-GB");
            
            const newStatus = currentStatus === "Pending" ? "Preparing" : "Pending";
            const updates = { status: newStatus };
            
            if (newStatus === "Preparing") {
                updates.prep_start_time = timestampString;
                updates.prepared_by_id = firebase.auth().currentUser.uid;
                updates.prepared_by_email = firebase.auth().currentUser.email;
                
                setItemTimers(prev => ({
                    ...prev,
                    [itemId]: {
                        startTime: timestamp,
                        status: newStatus
                    }
                }));
                
                await safeFirebaseOperation(() => 
                    database.ref(`new/${itemId}`).update(updates)
                );
                
                const customerEmail = orders[orderId]?.[0]?.['customer_name'];
                if (customerEmail) {
                    const encodedEmail = encodeEmail(customerEmail);
                    if (encodedEmail) {
                        await safeFirebaseOperation(() => 
                            database.ref(`orders/${encodedEmail}/${itemId}/status`).set(newStatus)
                        );
                    }
                }
                
                setOrders(prevOrders => {
                    const newOrders = { ...prevOrders };
                    if (newOrders[orderId]) {
                        newOrders[orderId] = newOrders[orderId].map(item => 
                            item.order_item_id === itemId ? { ...item, status: newStatus } : item
                        );
                    }
                    return newOrders;
                });
            } else if (newStatus === "Pending") {
                await safeFirebaseOperation(() => 
                    database.ref(`new/${itemId}`).update(updates)
                );
                
                const customerEmail = orders[orderId]?.[0]?.['customer_name'];
                if (customerEmail) {
                    const encodedEmail = encodeEmail(customerEmail);
                    if (encodedEmail) {
                        await safeFirebaseOperation(() => 
                            database.ref(`orders/${encodedEmail}/${itemId}/status`).set(newStatus)
                        );
                    }
                }
                
                if (itemTimers[itemId]) {
                    setItemTimers(prev => {
                        const newTimers = { ...prev };
                        delete newTimers[itemId];
                        return newTimers;
                    });
                }
                
                setOrders(prevOrders => {
                    const newOrders = { ...prevOrders };
                    if (newOrders[orderId]) {
                        newOrders[orderId] = newOrders[orderId].map(item => 
                            item.order_item_id === itemId ? { ...item, status: newStatus } : item
                        );
                    }
                    return newOrders;
                });
            }
            
            if (itemElement) {
                itemElement.classList.remove('item-loading');
            }
        } catch (error) {
            console.error("Error changing item status:", error);
            const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
            if (itemElement) {
                itemElement.classList.remove('item-loading');
            }
        }
    };

    // Handle status change for an entire order
    const handleOrderStatusChange = async (orderId) => {
        try {
            const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
            if (orderElement) {
                orderElement.classList.add('order-loading');
            }
            
            const orderItems = orders[orderId];
            
            if (!orderItems || orderItems.length === 0) {
                if (orderElement) {
                    orderElement.classList.remove('order-loading');
                }
                return;
            }
            
            const newStatus = "Served";
            
            setItemTimers(prev => {
                const newTimers = { ...prev };
                orderItems.forEach(item => {
                    delete newTimers[item.order_item_id];
                });
                return newTimers;
            });
            
            setOrderTimers(prevTimers => {
                const newTimers = { ...prevTimers };
                delete newTimers[orderId];
                return newTimers;
            });
            
            const timestamp = new Date();
            const timestampString = timestamp.toLocaleString("en-GB");
            
            for (const item of orderItems) {
                const updates = { 
                    status: newStatus,
                    served_time: timestampString,
                    served_by_id: firebase.auth().currentUser.uid,
                    served_by_email: firebase.auth().currentUser.email
                };
                
                const snapshot = await safeFirebaseOperation(() => 
                    database.ref(`new/${item.order_item_id}`).once('value')
                );
                const itemData = snapshot?.val();
                
                if (itemData) {
                    await safeFirebaseOperation(() => 
                        database.ref(`new/${item.order_item_id}`).update(updates)
                    );
                    
                    const customerEmail = orders[orderId]?.[0]?.['customer_name'];
                    if (customerEmail) {
                        const encodedEmail = encodeEmail(customerEmail);
                        if (encodedEmail) {
                            await safeFirebaseOperation(() => 
                                database.ref(`orders/${encodedEmail}/${item.order_item_id}/status`).set(newStatus)
                            );
                        }
                    }
                    
                    await safeFirebaseOperation(() => 
                        database.ref(`completed/${item.order_item_id}`).set({
                            ...itemData,
                            ...updates
                        })
                    );
                    
                    await safeFirebaseOperation(() => 
                        database.ref(`new/${item.order_item_id}`).remove()
                    );
                }
            }
            
            setOrders(prevOrders => {
                const newOrders = { ...prevOrders };
                delete newOrders[orderId];
                return newOrders;
            });
            
            if (orderElement) {
                orderElement.classList.remove('order-loading');
            }
        } catch (error) {
            console.error("Error changing order status:", error);
            const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
            if (orderElement) {
                orderElement.classList.remove('order-loading');
            }
        }
    };

    // Format time for display (MM:SS)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get elapsed time for an item or order
    const getElapsedTime = (startTime) => {
        if (!startTime) return 0;
        return Math.floor((new Date() - startTime) / 1000);
    };

    // Get appropriate color class based on elapsed time
    const getTimeColorClass = (seconds) => {
        if (seconds < 120) return "time-normal"; // < 2 minutes
        if (seconds < 300) return "time-warning"; // < 5 minutes
        return "time-danger"; // >= 5 minutes
    };

    const parseCustomTimestamp = (timestampString) => {
        if (!timestampString) return new Date();
        
        try {
        const [datePart, timePart] = timestampString.split(", ");
        const [day, month, year] = datePart.split("/");
        const [hour, minute, second] = timePart.split(":");
        return new Date(year, month - 1, day, hour, minute, second); // Month is zero-indexed
        } catch (error) {
            console.error("Error parsing timestamp:", timestampString, error);
            return new Date();
        }
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "Pending": return "status-pending";
            case "Preparing": return "status-preparing";
            case "Served": return "status-served";
            default: return "status-pending";
        }
    };

    // Check if all items in an order are in "Preparing" status
    const areAllItemsPreparing = (orderItems) => {
        if (!orderItems || orderItems.length === 0) return false;
        return orderItems.every(item => item.status === "Preparing");
    };

    if (loading) {
        return (
            <div className='loading-overlay'>
                <div className='spinner'></div>
                <div className='spinner-message'>Loading...</div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="kds-container" onClick={initializeAudio}>
                {KDSAccess ? (
                    <>
                        <div className="kds-header">
                            <h1>Kitchen Display System</h1>
                            <div className="kds-date">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                        
                        {!audioInitialized && (
                            <div className="audio-init-message">
                                <button onClick={initializeAudio} className="audio-init-button">
                                    Click here to enable order notifications
                                </button>
                            </div>
                        )}
                        
                        {orders && Object.keys(orders).length > 0 ? (
                            <div className="orders-grid">
                                {Object.keys(orders).map((orderId) => {
                                    const orderItems = orders[orderId];
                                    const orderStatus = getOrderStatus(orderItems);
                                    
                                    // Use the earliest created_on time from the order items
                                    const orderStartTime = orderTimers[orderId]?.startTime || 
                                        orderItems.reduce((earliest, item) => {
                                            const itemTime = parseCustomTimestamp(item.created_on);
                                            return earliest ? (itemTime < earliest ? itemTime : earliest) : itemTime;
                                        }, null);
                                        
                                    const orderElapsedTime = getElapsedTime(orderStartTime);
                                    
                                    return (
                                        <div className={`order-card ${getStatusBadgeClass(orderStatus)}`} key={orderId} data-order-id={orderId}>
                                            <div className="order-header">
                                                <div className="order-info">
                                                    <h2>{orderItems[0]?.customer_name?.substring(0, orderItems[0]?.customer_name?.length - 15) || "Customer"}</h2>
                                                    <div className="order-meta">
                                                        <span className="order-id">Order #{orderId.slice(-6)}</span>
                                                        <span className="order-section">Section: {orderItems[0]?.Section || "Main"}</span>
                                                    </div>
                                                </div>
                                                <div className={`order-timer ${getTimeColorClass(orderElapsedTime)}`}>
                                                    <div className="timer-label">Order Time</div>
                                                    <div className="timer-value">{formatTime(orderElapsedTime)}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="order-status-bar">
                                                <div className="status-badge-container">
                                                    <span className={`status-badge ${getStatusBadgeClass(orderStatus)}`}>
                                                        {orderStatus}
                                                    </span>
                                                    <div className="order-actions">
                                                        <label className="checkbox-container">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={orderStatus === "Served"}
                                                                onChange={() => handleOrderStatusChange(orderId)}
                                                                disabled={!areAllItemsPreparing(orderItems)}
                                                                className="order-checkbox"
                                                            />
                                                            <span className="checkmark"></span>
                                                            <span className="checkbox-label">Complete Order</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="order-items">
                                                {orderItems.map((item) => {
                                                    const itemElapsedTime = item.status === "Preparing" && itemTimers[item.order_item_id] 
                                                        ? getElapsedTime(itemTimers[item.order_item_id].startTime) 
                                                        : 0;
                                                    
                                                    return (
                                                        <div className={`order-item ${getStatusBadgeClass(item.status)}`} key={item.order_item_id} data-item-id={item.order_item_id}>
                                                            <div className="item-details">
                                                                <div className="item-details-container">
                                                                    <div className="item-details-row">
                                                                        <div className="item-name-container">
                                                                            <span className="item-name">{item.Name}</span>
                                                                            <span className="item-size">{item.Size}</span>
                                                                        </div>
                                                                        <div className="item-quantity">x{item.Count}</div>
                                                                    </div>
                                                                    {(item.has_syrup && item.syrup) && (
                                                                        <div className="item-customizations">
                                                                            <div className="syrup-tag">
                                                                                <span className="syrup-tag-icon">🧉</span>
                                                                                <span>{item.syrup.name} Syrup</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {item.status === "Preparing" && (
                                                                <div className={`item-timer ${getTimeColorClass(itemElapsedTime)}`}>
                                                                    {formatTime(itemElapsedTime)}
                                                                </div>
                                                            )}
                                                            
                                                            <div className="item-status-controls">
                                                                <label className="checkbox-container">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.status === "Preparing"}
                                                                        onChange={() => handleItemStatusChange(orderId, item.order_item_id, item.status)}
                                                                        disabled={orderStatus === "Served"}
                                                                        className="item-checkbox"
                                                                    />
                                                                    <span className="checkmark"></span>
                                                                    <span className="checkbox-label"></span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="no-orders-message">
                                <div className="no-orders-icon">🍽️</div>
                                <h2>No pending orders</h2>
                                <p>New orders will appear here automatically</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="access-denied">
                        <h2>Access Denied</h2>
                        <p>You don't have permission to access the Kitchen Display System.</p>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

// Add error handler for Firebase operations
const handleFirebaseError = (error) => {
    // Log the error but don't throw it
    console.log('Firebase operation error:', error);
    return null;
};

// Update the database operations to use error handler
const safeFirebaseOperation = async (operation) => {
    try {
        return await operation();
    } catch (error) {
        return handleFirebaseError(error);
    }
};

export default KDS;