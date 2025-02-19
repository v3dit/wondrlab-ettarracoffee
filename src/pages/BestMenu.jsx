import React, { useEffect, useState } from 'react';
import database from '../config/FirbaseConfig';
import '../styles/BestMenu.css'; // Import CSS for styling
import { useNavigate } from 'react-router-dom';
import ProfileButton from '../components/ProfileButton';
import firebase from 'firebase/compat/app';

const BestMenu = ({ WHICH, wishlist, setWishlist, itemAdd, itemRemove }) => {
    const [Data, setData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null); // New state to handle selected item
    const [userName, setUserName] = useState('');
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

    useEffect(() => {
        const fetchUserName = async () => {
            const user = firebase.auth().currentUser;
            if (user) {
                try {
                    const userRef = database.ref(`users/${user.uid}`);
                    const snapshot = await userRef.once('value');
                    const userData = snapshot.val();
                    if (userData && userData.name) {
                        setUserName(userData.name);
                    }
                } catch (error) {
                    console.error("Error fetching user name:", error);
                }
            }
        };

        fetchUserName();
    }, []);

    const BackButton = (e) => {
        const timestamp = new Date();
        window.gtag("event", `Looks_${e}_Click`, { 'timestamp': timestamp.toLocaleString("en-GB"), "click": e });
        // Use React Router instead of window.location for smoother navigation
        navigate("/menu");  // Add useNavigate hook
    };

    const openDetailedCard = (item) => {
        const timestamp = new Date();
        window.gtag("event", `Looks_${item.Name}_Card_Opened`, { 'timestamp': timestamp.toLocaleString("en-GB"), "itemName": item.Name, "itemDetails": item });
        setSelectedItem(item); // Update the state with the selected item
    };

    const closeDetailedCard = () => {
        setSelectedItem(null); // Reset the selected item when closing the detailed view
    };

    return (
        <div className="best-menu-container">
            <ProfileButton userName={userName} />
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
                            <div className={`item-card ${item.Stock === 0 ? "Disabled" : ""}`} key={`${item.Name}_${item.Desc}`} onClick={() => openDetailedCard(item)}>
                                {item.Stock === 0 ? <div className="Unavailable">Unavailable</div> : ""}
                                <div className="item-card-info">
                                    <div className="item-card-name">{item.Name}</div>
                                    {/* <div className="item-card-desc">{item['Img'] === '' ? <>{item.Desc}</> : <>{item['Desc'].length > 50 ? `${item.Desc.slice(0, 50)} ...` : item.Desc} */}
                                    <div className="item-card-desc">{item['Desc'].length > 50 ? `${item.Desc.slice(0, 50)} ...` : item.Desc}
                                        {item['Desc'].length > 50 && (
                                            <span className="read-more">(Read more)</span>
                                        )}</div>
                                    <div className="item-card-price">
                                        {Object.entries(item.Price).map(([size, price]) => (
                                            <div key={size} className="price-row">
                                                <span className="size">{size}</span>{/* <span className="price">{price}</span>*/}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {item['Img'] && (
                                    <div className="item-card-img">
                                        <img src={item['Img']} alt={item.Name} />
                                    </div>
                                )}
                                <span className='addIcon'>Add +</span>
                            </div>
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

export default BestMenu;
