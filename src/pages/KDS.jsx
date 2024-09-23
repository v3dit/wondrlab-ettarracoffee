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

    const audio = new Audio(notify);

    useEffect(() => {
        const getAccess = async () => {
            try {
                const accessSnapshot1 = await database.ref(`KDS_Access/${loggedInUser}`).once('value');
                setKDSAccess(accessSnapshot1.val());
            } catch (error) {
                console.error(error);
            }
        };

        getAccess();
    }, [loggedInUser]);

    const playNotificationSound = () => {
        audio.play(); // Play the notification sound
    };

    useEffect(() => {

        const getPlacedOrders = async () => {
            try {
                setTime(new Date());
                const snapshot = await database.ref(`KDS/new`).once("value");
                updateOrders(snapshot);

                const unsubscribe = database.ref(`KDS/new`).on("value", updateOrders);

                // Detect when new orders are added (using onChildAdded)
                const onNewOrder = database.ref(`KDS/new`).on("child_added", (snapshot) => {
                    playNotificationSound(); // Play the sound when new order is added
                    // You can also trigger other notifications here (like browser notifications)
                });

                return () => {
                    unsubscribe();
                    database.ref(`KDS/new`).off("child_added", onNewOrder); // Cleanup event listeners
                };
            } catch (error) {
                console.error(error.message);
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
                    // Clear orders if snapshot.val() is null
                    setOrders({});
                }
            }
            catch (error) {
                console.error(error.message);
            }
        };

        getPlacedOrders();
    }, []);

    const handleCheckboxChange = async (orderId, itemId, isChecked) => {
        try {
            const newStatus = isChecked ? "Preparing" : "Pending";
            const timestamp = new Date();
            await database.ref(`KDS/new/${itemId}`).update({ status: newStatus, prepared: timestamp.toLocaleString(), prepared_by_id: firebase.auth().currentUser.uid, prepared_by_email: firebase.auth().currentUser.email });

            await database.ref(`orders/${orders[orderId][0]['customer_name']}/${itemId}/status`).set(newStatus);
        } catch (error) {
            console.error(error.message);
        }
    };

    const handleOrderCheckboxChange = async (orderId, isChecked) => {
        try {
            const newStatus = isChecked ? "Served" : "Pending";
            let itemIds = []
            for (const item in orders[orderId]) {
                itemIds = [...itemIds, orders[orderId][item]['order_item_id']];
            }

            // database.ref(`KDS/new/${itemId}/status`).set(newStatus);
            for (const itemId in itemIds) {
                const timestamp = new Date();
                await database.ref(`KDS/new/${itemIds[itemId]}`).update({ status: newStatus, served: timestamp.toLocaleString(), served_by_id: firebase.auth().currentUser.uid, served_by_email: firebase.auth().currentUser.email });
                await database.ref(`orders/${orders[orderId][0]['customer_name']}/${itemIds[itemId]}/status`).set(newStatus);
                const snapshot = await database.ref(`KDS/new/${itemIds[itemId]}`).once('value');
                await database.ref(`KDS/completed/${itemIds[itemId]}`).set(snapshot.val());
                await database.ref(`KDS/new/${itemIds[itemId]}`).remove();
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <div className="KDSContainer">
            {KDSAccess &&
                <>
                    {orders && Object.keys(orders).map((order_id) => (
                        <div className="KDSOrderCard" key={order_id}>
                            <div className="ODSOrderBar">
                                <div className="ODSOrderBarOrderID">
                                    Name: {orders[order_id][0]['customer_name'].substring(0, orders[order_id][0]['customer_name'].length - 15)}
                                    <br />
                                    {/* Order ID:  {order_id} */}
                                    {orders[order_id][0]['Section']}, {orders[order_id][0]['Table']}
                                </div>
                                <div className="ODSOrderBarTime">Time:<br /> {parseInt(((time) - Date.parse(orders[order_id][0]["created_on"])) / 60000)} mins</div>
                                <div className="ODSOrderStatus">
                                    Served: <input type="checkbox" checked={orders[order_id][0].status === 'Served'} onChange={(e) => (handleOrderCheckboxChange(order_id, e.target.checked))} />
                                </div>
                            </div>
                            <div className="ODSOrderItems">
                                {orders[order_id] && orders[order_id].map((item) => (
                                    <div className="ODSOrderItem" key={item['order_item_id']}>
                                        <div className="ODSOrderItemName">{item.Name}</div>
                                        <div className="ODSOrderItemCount">{item.Count}</div>
                                        <input
                                            className="ODSOrderItemStatus"
                                            type="checkbox"
                                            checked={item.status === 'Preparing'}
                                            onChange={(e) => handleCheckboxChange(order_id, item['order_item_id'], e.target.checked)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <br />
                    <br />
                    <br />
                </>
            }
        </div>
    );
};

export default KDS;
