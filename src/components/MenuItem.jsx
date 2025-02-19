import React from "react";

const MenuItem = ({ item, loggedInUser, onOrder }) => {
  return (
    <div className="menu-item">
      <h3>{item.Name}</h3>
      <p className="price">₹{item.Price}</p>
      <button 
        className="order-button"
        onClick={() => onOrder({...item})}
      >
        Add to Order (₹{item.Price})
      </button>
    </div>
  );
};

export default MenuItem; 