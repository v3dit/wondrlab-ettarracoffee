import React, { useEffect, useState } from 'react';
import database from '../config/FirbaseConfig';
import '../styles/BestMenu.css'; // Import CSS for styling

const BestMenu = ({ WHICH, wishlist, setWishlist }) => {
    const [Data, setData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null); // New state to handle selected item

    useEffect(() => {
        const getData = async () => {
            const snapshot = await database.ref(`Menus/${WHICH}`).once('value');
            const snapshotData = snapshot.val();
            setData(snapshotData);
        };
        getData();
    }, [WHICH]);

    const BackButton = (e) => {
        const timestamp = new Date();
        window.gtag("event", `${e}_Click`, { 'timestamp': timestamp.toLocaleString(), "click": e });
        // window.fbq('track', `${e}_Click`, { 'timestamp': timestamp.toLocaleString(), "click": e });
        window.location.href = "/";
    };

    const openDetailedCard = (item) => {
        const timestamp = new Date();
        window.gtag("event", `${item.Name}_Card_Opened`, { 'timestamp': timestamp.toLocaleString(), "itemName": item.Name, "itemDetails": item });
        setSelectedItem(item); // Update the state with the selected item
    };

    const closeDetailedCard = () => {
        setSelectedItem(null); // Reset the selected item when closing the detailed view
    };


    const itemAdd = (item, size, price) => {
        // Find the item in the wishlist
        const existingItemIndex = wishlist.findIndex(
            (wishlistItem) => wishlistItem.Name === item.Name && wishlistItem.Size === size
        );
        if (existingItemIndex !== -1) {
            // Item exists, update the count
            const updatedWishlist = [...wishlist];
            updatedWishlist[existingItemIndex].Count += 1;
            setWishlist(updatedWishlist);
        } else {
            // Item doesn't exist, add it to the wishlist
            setWishlist([...wishlist, { Name: item.Name, Size: size, Price: price, Count: 1 }]);
        }
    };

    const itemRemove = (item, size) => {
        const existingItemIndex = wishlist.findIndex(
            (wishlistItem) => wishlistItem.Name === item.Name && wishlistItem.Size === size
        );

        if (existingItemIndex !== -1) {
            const updatedWishlist = [...wishlist];
            const updatedItem = updatedWishlist[existingItemIndex];

            if (updatedItem.Count > 1) {
                // Decrease the count
                updatedItem.Count -= 1;
                setWishlist(updatedWishlist);
            } else {
                // Remove item from wishlist if count reaches 0
                updatedWishlist.splice(existingItemIndex, 1);
                setWishlist(updatedWishlist);
            }
        }
    };


    return (
        <div className="best-menu-container">
            {selectedItem ? (
                // Render the detailed card view when an item is selected
                <div className="openDetailedCardContainer">
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
                                        <span className="detailed-size">{size}:</span> <span className="detailed-price">{price}</span>
                                        <div className="wishlistToggler">
                                            <div className="itemRemove" onClick={() => itemRemove(selectedItem, size)}>-</div>
                                            <div className="itemCount">
                                                {wishlist.find(i => i.Name === selectedItem.Name && i.Size === size)?.Count || 0}
                                            </div>
                                            <div className="itemAdd" onClick={() => itemAdd(selectedItem, size, price)}>+</div>
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
                            <div className="item-card" key={`${item.Name}_${item.Desc}`} onClick={() => openDetailedCard(item)}>
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
                                                <span className="size">{size}:</span> <span className="price">{price}</span>
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
