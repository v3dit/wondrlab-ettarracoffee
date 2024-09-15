import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

import database from './config/FirbaseConfig';

import Landing from './pages/Landing';
import BestMenu from './pages/BestMenu';
import Games from './pages/Games';
import Game from './pages/Game';
import PageNotFound from './pages/PageNotFound';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KDS from './pages/KDS';
import Reports from './pages/Reports';

function App() {
  const [loggedInUser, setLoggedInUser] = useState('');
  // Retrieve wishlist from localStorage or initialize as an empty array
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('looksEttarraWishlist')) || []);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [userName, setUserName] = useState(JSON.parse(localStorage.getItem('looksEttarraUserName')) || null);
  const [placedOrder, setPlacedOrder] = useState([]);
  const [placedOrderOpen, setPlacedOrderOpen] = useState(false);

  useEffect(() => {
    // Update localStorage whenever the wishlist changes
    localStorage.setItem('looksEttarraWishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    // Update localStorage whenever the wishlist changes
    localStorage.setItem('looksEttarraUserName', JSON.stringify(userName));
    // localStorage.removeItem('looksEttarraUserName');
  }, [userName]);

  useEffect(() => {
    const getPlacedOrders = async () => {
      try {
        const snapshot = await database.ref(`orders/${userName}`).once("value");
        if (snapshot.val() !== null) {
          const ordersObject = snapshot.val();
          // Convert object to array and sort by 'created_on'
          const sortedOrders = Object.keys(ordersObject)
            .map(key => ({ ...ordersObject[key], id: key })) // Add an id for uniqueness
            .sort((a, b) => new Date(b.created_on) - new Date(a.created_on)); // Sort by date

          setPlacedOrder(sortedOrders);
        }

        // Attach an on-value event listener to listen for real-time updates
        const unsubscribe = database.ref(`orders/${userName}`).on("value", (snapshot) => {
          if (snapshot.val() !== null) {
            const ordersObject = snapshot.val();
            // Convert object to array and sort by 'created_on'
            const sortedOrders = Object.keys(ordersObject)
              .map(key => ({ ...ordersObject[key], id: key }))
              .sort((a, b) => new Date(b.created_on) - new Date(a.created_on)); // Sort by date

            setPlacedOrder(sortedOrders);
          }
        });

        // Clean up the listener when the component unmounts
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error(error.message);
      }
    };

    // Call the function only once when the component mounts
    getPlacedOrders();
  }, [userName]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            setLoggedInUser(user.uid); // Update logged-in state
          }
        });
      }
      catch (error) {
        console.error(error.message)
      }
    }
    checkAuth();
  }, []);

  const itemAdd = (item, size, price, category) => {
    try {
      const existingItemIndex = wishlist.findIndex(
        (wishlistItem) => wishlistItem.Name === item.Name && wishlistItem.Size === size && wishlistItem.Category === category
      );

      if (existingItemIndex !== -1) {
        const updatedWishlist = [...wishlist];
        updatedWishlist[existingItemIndex].Count += 1;
        setWishlist(updatedWishlist);
      } else {
        setWishlist([...wishlist, { Name: item.Name, Size: size, Price: price, Count: 1, Category: category }]);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const itemRemove = (item, size) => {
    try {
      const existingItemIndex = wishlist.findIndex(
        (wishlistItem) => wishlistItem.Name === item.Name && wishlistItem.Size === size
      );

      if (existingItemIndex !== -1) {
        const updatedWishlist = [...wishlist];
        const updatedItem = updatedWishlist[existingItemIndex];

        if (updatedItem.Count > 1) {
          updatedItem.Count -= 1;
          setWishlist(updatedWishlist);
        } else {
          updatedWishlist.splice(existingItemIndex, 1);
          setWishlist(updatedWishlist);
        }
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      let customer_name = userName;

      if (window.confirm("Confirm and Proceed")) {
        // Prompt for name if it's null or invalid
        if (!userName || userName === 'undefined' || userName === '' || userName === 'Enter here') {
          let name = window.prompt("Please enter your name", "");
          while (!name || name === 'undefined' || name === '' || name === 'Enter here') {
            name = window.prompt("Please enter your name", "Enter here");
          }

          // Append the date to the name
          const timestamp0 = new Date();
          name = name + " " + timestamp0.toLocaleString().replace(/\//g, '').replace(/, /g, '').replace(/:/g, '').replace(' ', '');

          // Save to localStorage and state
          localStorage.setItem('looksEttarraUserName', JSON.stringify(name));
          setUserName(name);

          // Wait for state update
          customer_name = name;
        }

        // Use the updated customer_name for order placement
        const timestamp = new Date();
        for (const item in wishlist) {
          wishlist[item]['status'] = "Pending";
          wishlist[item]['customer_name'] = customer_name;  // Use updated customer_name
          wishlist[item]['order_id'] = timestamp.toLocaleString().replace(/\//g, '').replace(/, /g, '').replace(/:/g, '').replace(' ', '');
          wishlist[item]['order_item_id'] = timestamp.toLocaleString().replace(/\//g, '').replace(/, /g, '').replace(/:/g, '').replace(' ', '') + item;
          wishlist[item]['created_on'] = timestamp.toLocaleString();
          wishlist[item]['created_on_date'] = timestamp.toLocaleDateString();
          wishlist[item]['created_on_time'] = timestamp.toLocaleTimeString();
          await database.ref(`orders/${customer_name}/${wishlist[item]['order_id']}${item}`).set(wishlist[item]);
          await database.ref(`KDS/new/${wishlist[item]['order_id']}${item}`).set(wishlist[item]);
        }

        // Clear the wishlist and localStorage after order is placed
        setWishlist([]);
        localStorage.removeItem('looksEttarraWishlist');
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login setLoggedInUser={setLoggedInUser} />} />
          <Route
            path="/dashboard/"

          >
            <Route index element={
              loggedInUser ? (
                <div>
                  <Dashboard loggedInUser={loggedInUser} />
                </div>
              ) : (
                <Navigate to="/login" />
              )
            } />
            <Route
              path="KDS"
              element={
                loggedInUser ? (
                  <div>
                    <KDS loggedInUser={loggedInUser} />
                  </div>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="Reports"
              element={
                loggedInUser ? (
                  <div>
                    <Reports loggedInUser={loggedInUser} />
                  </div>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Route>
          <Route path="/Menus" element={<Landing />} />
          <Route path="Menu/">
            <Route index element={<PageNotFound />} />
            <Route path="ColdCoffeeMenu" element={<BestMenu WHICH={"ColdCoffeeMenu"} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="HotCoffeeMenu" element={<BestMenu WHICH={"HotCoffeeMenu"} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="SavouryMenu" element={<BestMenu WHICH={"SavouryMenu"} wishlist={wishlist} setWishlist={setWishlist} />} />
          </Route>
          <Route path="/Games" element={<Games />} />
          <Route path="/Game" element={<Game />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>

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
                <div className="itemRemove" onClick={() => itemRemove(item, item.Size)}>-</div>
                <div className="itemCount">{item.Count}</div>
                <div className="itemAdd" onClick={() => itemAdd(item, item.Size, item.Price, item.Category)}>+</div>
              </div>
              <div className='wishlistItemSize'>{item.Size}</div>
            </div>
          ))}

          <div className="placeOrderBar" onClick={() => handlePlaceOrder()}>Place Order</div>
        </div>
      ) : (
        <>
          {wishlist.length !== 0 ? (
            <div className={placedOrder.length !== 0 ? 'placedOrderOpenWishlistBar' : 'wishlistBar'} onClick={() => setWishlistOpen(true)}>
              Wishlist
            </div>
          ) : " "}
        </>
      )}
      {placedOrderOpen ? (
        <div className='placedOrder'>
          <div className='closePlacedOrder' onClick={() => setPlacedOrderOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#291A02">
              <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
            </svg>
          </div>
          {placedOrder && Object.keys(placedOrder).map((item) => (
            <div key={`${placedOrder[item].order_item_id}`} className='placedOrderItem'>
              <div className='placedOrderItemName'>{placedOrder[item].Name}</div>
              <div className="placedOrderToggler">
                {/* Conditionally render based on placedOrder[item].status */}
                {placedOrder[item].status === "Pending" && (
                  <div>
                    <span>Pending</span>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="000">
                      <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
                    </svg>
                  </div>
                )}

                {placedOrder[item].status === "Preparing" && (
                  <div>
                    <span>Preparing</span>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#DA954B">
                      <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
                    </svg>
                  </div>
                )}

                {placedOrder[item].status === "Served" && (
                  <div>
                    <span>Served</span>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="green">
                      <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                    </svg>
                  </div>
                )}

                {placedOrder[item].status === "Cancelled" && (
                  <div>
                    <span>Cancelled</span>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="red">
                      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className='placedOrderItemSize'>Size: <strong>{placedOrder[item].Size}</strong>&nbsp;&nbsp;Count: <strong>{placedOrder[item].Count}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {placedOrder.length !== 0 ? (
            <div className='placedOrderBar' onClick={() => setPlacedOrderOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" height="42px" viewBox="0 -960 960 960" width="42px" fill="#FFFFFF"><path d="M286.67-613.33V-680H840v66.67H286.67Zm0 166.66v-66.66H840v66.66H286.67Zm0 166.67v-66.67H840V-280H286.67ZM153.33-613.33q-13.66 0-23.5-9.84Q120-633 120-647q0-14 9.83-23.5 9.84-9.5 23.84-9.5t23.5 9.58q9.5 9.59 9.5 23.75 0 13.67-9.59 23.5-9.58 9.84-23.75 9.84Zm0 166.66q-13.66 0-23.5-9.83-9.83-9.83-9.83-23.83 0-14 9.83-23.5 9.84-9.5 23.84-9.5t23.5 9.58q9.5 9.58 9.5 23.75 0 13.67-9.59 23.5-9.58 9.83-23.75 9.83Zm0 166.67q-13.66 0-23.5-9.83-9.83-9.84-9.83-23.84t9.83-23.5q9.84-9.5 23.84-9.5t23.5 9.59q9.5 9.58 9.5 23.75 0 13.66-9.59 23.5-9.58 9.83-23.75 9.83Z" /></svg>
            </div>
          ) : " "}
        </>
      )}
    </div>
  );
}

export default App;
