import React, { useEffect, useState } from 'react';
import database from '../config/FirbaseConfig';
import MenuItem from '../components/MenuItem';
import '../styles/BestMenu.css'; // Import CSS for styling
import { useNavigate } from 'react-router-dom';

const KaapiFest = ({ WHICH, wishlist, setWishlist, loggedInUser, itemAdd, itemRemove }) => {
    const [Data, setData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null); // New state to handle selected item
    const navigate = useNavigate();

    useEffect(() => {
        const getData = async () => {
            const snapshot = await database.ref(`Menus/${WHICH}`).once('value');
            if (snapshot.exists()) { // Check if snapshot exists
                const snapshotData = snapshot.val();
                setData(snapshotData);
            }
        };
        getData();

        // Attach an on-value event listener to listen for real-time updates
        const ref = database.ref(`Menus/${WHICH}`);
        const unsubscribe = ref.on("value", (snapshot) => {
            if (snapshot.exists()) { // Check if snapshot exists
                const snapshotData2 = snapshot.val();
                setData(snapshotData2);
            }
        });

        // Clean up the listener when the component unmounts
        return () => {
            ref.off("value", unsubscribe); // Properly detach the listener
        };
    }, [WHICH]);

    const handleOrder = (item) => {
        // Add item to wishlist (cart)
        const existingItem = wishlist.find(i => i.Name === item.Name);
        if (existingItem) {
            itemAdd(item);
        } else {
            setWishlist(prev => [...prev, { ...item, Count: 1 }]);
        }
    };

    const BackButton = (e) => {
        const timestamp = new Date();
        window.gtag("event", `Looks_${e}_Click`, { 'timestamp': timestamp.toLocaleString("en-GB"), "click": e });
        // window.fbq('track', `${e}_Click`, { 'timestamp': timestamp.toLocaleString("en-GB"), "click": e });
        window.location.href = "/";
    };

    const openDetailedCard = (item) => {
        const timestamp = new Date();
        window.gtag("event", `Looks_${item.Name}_Card_Opened`, { 'timestamp': timestamp.toLocaleString("en-GB"), "itemName": item.Name, "itemDetails": item });
        setSelectedItem(item); // Update the state with the selected item
    };

    const closeDetailedCard = () => {
        setSelectedItem(null); // Reset the selected item when closing the detailed view
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <div className="best-menu-container">
            <button className="profile-button" onClick={handleProfileClick}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#FFF9E3">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
            </button>
            {selectedItem ? (
                // Render the detailed card view when an item is selected
                <div className="openDetailedCardContainer">
                    {selectedItem.Stock === 0 ? <div className="Unavailable">Unavailable</div> : ""}
                    <div className="closeButton" onClick={closeDetailedCard}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#291A02">
                        <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
                    </svg>
                    </div>
                    <div className="detailed-item-card">
                        {selectedItem['Img'] && (
                            <div className="detailed-item-card-img">
                                <img src={selectedItem['Img']} alt={selectedItem.Name} />
                            </div>
                        )}
                        <div className="detailed-item-card-info">
                            <div className="detailed-item-card-name">{selectedItem.Name}</div>
                            <div className="detailed-item-card-desc">{selectedItem.Desc}</div>
                            <div className="detailed-item-card-price">
                                {Object.entries(selectedItem.Price).map(([size, price]) => (
                                    <div key={size} className="detailed-price-row">
                                        <span className="detailed-size">{size}</span> {/* <span className="detailed-price">{price}</span> */}
                                        <div className="wishlistToggler">
                                            <div className="itemRemove" onClick={() => itemRemove(selectedItem, size)}>-</div>
                                            <div className="itemCount">
                                                {wishlist.find(i => i.Name === selectedItem.Name && i.Size === size)?.Count || 0}
                                            </div>
                                            <div className={`itemAdd ${selectedItem.Stock === 0 ? "Disabled" : ""}`} onClick={() => itemAdd(selectedItem, size, price, WHICH)}>+</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Render the menu list when no item is selected
                <>
                    <div className='best-menu-container-top' onClick={() => BackButton('Back_Button')}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#291A02">
                            <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
                        </svg>
                        <div className='cookies'>we use Cookies*</div>
                    </div>
                    {Data ? (
                        Data.map((item) => (
                            <MenuItem 
                                key={`${item.Name}_${item.Desc}`}
                                item={item}
                                loggedInUser={loggedInUser}
                                onOrder={handleOrder}
                            />
                        ))
                    ) : (
                        <div className="loading">Loading...</div>
                    )}
                    <br /><br /><br />
                </>
            )}
        </div>
    );
};

export default KaapiFest;
