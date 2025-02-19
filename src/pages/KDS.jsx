import React, { useEffect, useState } from "react";
import database from "../config/FirbaseConfig";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "../styles/KDS.css";
import notify from "../assets/notify.mp3";

const KDS = ({ loggedInUser }) => {
    const [KDSAccess, setKDSAccess] = useState(false);
    const [orders, setOrders] = useState({});
    const [time, setTime] = useState(new Date());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getAccess = async () => {
            try {
                const accessSnapshot1 = await database.ref(`KDS_Access/${loggedInUser}`).once('value');
                setKDSAccess(accessSnapshot1.val());
            } catch (error) {
                console.error(error);
            }
        }

        getAccess();
    }, [loggedInUser]);

    useEffect(() => {
        const audio = new Audio(notify);

        const playNotificationSound = () => {
            audio.play();
        };

        const getPlacedOrders = async () => {
            try {
                setLoading(true);
                setTime(new Date());
                const snapshot = await database.ref(`KDS/new`).once("value");
                updateOrders(snapshot);

                const unsubscribe = database.ref(`KDS/new`).on("value", updateOrders);
                const onNewOrder = database.ref(`KDS/new`).on("child_added", () => {
                    playNotificationSound();
                });

                return () => {
                    unsubscribe();
                    database.ref(`KDS/new`).off("child_added", onNewOrder);
                };
            } catch (error) {
                console.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        const updateOrders = (snapshot) => {
            try {
                if (snapshot.val() !== null) {
                    const ordersObject = snapshot.val();
                    const sortedOrders = Object.keys(ordersObject)
                        .map(key => ({ ...ordersObject[key], id: key }))
                        .sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
                    
                    const groupedOrders = sortedOrders.reduce((acc, order) => {
                        const orderId = order.order_id;
                        if (!acc[orderId]) {
                            acc[orderId] = [];
                        }
                        acc[orderId].push(order);
                        return acc;
                    }, {});
                    setOrders(groupedOrders);
                } else {
                    setOrders({});
                }
            } catch (error) {
                console.error(error.message);
            }
        };

        getPlacedOrders();
        
        // Update time every minute
        const timeInterval = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timeInterval);
    }, []);

    const handleCheckboxChange = async (orderId, itemId, isChecked) => {
        try {
            setLoading(true);
            const newStatus = isChecked ? "Preparing" : "Pending";
            const timestamp = new Date();
            
            await database.ref(`KDS/new/${itemId}`).update({
                status: newStatus,
                prepared: timestamp.toLocaleString("en-GB"),
                prepared_by_id: firebase.auth().currentUser.uid,
                prepared_by_email: firebase.auth().currentUser.email
            });
            
            await database.ref(`orders/${orders[orderId][0]['customer_name']}/${itemId}/status`).set(newStatus);
        } catch (error) {
            console.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderCheckboxChange = async (orderId, isChecked) => {
        try {
            setLoading(true);
            const newStatus = isChecked ? "Served" : "Pending";
            const itemIds = orders[orderId].map(item => item.order_item_id);
            
            for (const itemId of itemIds) {
                const timestamp = new Date();
                await database.ref(`KDS/new/${itemId}`).update({
                    status: newStatus,
                    served: timestamp.toLocaleString("en-GB"),
                    served_by_id: firebase.auth().currentUser.uid,
                    served_by_email: firebase.auth().currentUser.email
                });
                
                await database.ref(`orders/${orders[orderId][0]['customer_name']}/${itemId}/status`).set(newStatus);
                
                if (newStatus === "Served") {
                    const snapshot = await database.ref(`KDS/new/${itemId}`).once('value');
                    await database.ref(`KDS/completed/${itemId}`).set(snapshot.val());
                    await database.ref(`KDS/new/${itemId}`).remove();
                }
            }
        } catch (error) {
            console.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const parseCustomTimestamp = (timestampString) => {
        const [datePart, timePart] = timestampString.split(", ");
        const [day, month, year] = datePart.split("/");
        const [hour, minute, second] = timePart.split(":");
        return new Date(year, month - 1, day, hour, minute, second);
    };

    if (loading) {
        return <div className='loading-overlay'><div className='spinner'></div><br /><div className='spinner-message'>Loading...</div></div>;
    }

    return (
        <div className="KDSContainer">
            {KDSAccess && (
                <>
                    <h1 className="KDSHeader">☕ Kitchen Display System</h1>
                    {Object.keys(orders).map((order_id) => {
                        const orderItems = orders[order_id];
                        if (!orderItems || !orderItems[0]) return null;
                        
                        const customerName = orderItems[0].customer_name;
                        const section = orderItems[0].Section;
                        const table = orderItems[0].Table;
                        const createdOn = orderItems[0].created_on;

                        return (
                            <div className="KDSOrderCard" key={order_id}>
                                <div className="ODSOrderBar">
                                    <div className="ODSOrderBarOrderID">
                                        {customerName && (
                                            <>
                                                Customer: {customerName.substring(0, customerName.length - 15)}
                                                <br />
                                            </>
                                        )}
                                        {section && table && `Location: ${section}, Table ${table}`}
                                    </div>
                                    <div className="time-display">
                                        Waiting time: {createdOn && 
                                            parseInt(((time) - parseCustomTimestamp(createdOn).getTime()) / 60000)} mins
                                    </div>
                                    <div className="ODSOrderStatus">
                                        <div className="checkbox-wrapper" data-tooltip="Mark order as served">
                                            Order Complete
                                            <input 
                                                type="checkbox" 
                                                checked={orderItems[0].status === 'Served'} 
                                                onChange={(e) => handleOrderCheckboxChange(order_id, e.target.checked)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="ODSOrderItems">
                                    {orderItems.map((item) => (
                                        <div className="ODSOrderItem" key={item.order_item_id}>
                                            <div className="ODSOrderItemName">{item.Name}</div>
                                            <div className="ODSOrderItemCount">×{item.Count}</div>
                                            <div className="checkbox-wrapper" data-tooltip="Mark as preparing">
                                                <input
                                                    className="ODSOrderItemStatus"
                                                    type="checkbox"
                                                    checked={item.status === 'Preparing'}
                                                    onChange={(e) => handleCheckboxChange(order_id, item.order_item_id, e.target.checked)}
                                                />
                                                <span className="status-label">
                                                    {item.status === 'Preparing' ? 'Preparing' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    <br /><br /><br />
                </>
            )}
        </div>
    );
};

export default KDS;
