import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

import Landing from './pages/Landing';
import BestMenu from './pages/BestMenu';
import Games from './pages/Games';
import Game from './pages/Game';
import PageNotFound from './pages/PageNotFound';

function App() {
  const [loggedInUser, setLoggedInUser] = useState('');
  // Retrieve wishlist from localStorage or initialize as an empty array
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
  const [wishlistOpen, setWishlistOpen] = useState(false);


  useEffect(() => {
    // Update localStorage whenever the wishlist changes
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

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
        console.log(error.message)
      }
    }
    checkAuth();
  }, []);


  const itemAdd = (item, size, price) => {
    const existingItemIndex = wishlist.findIndex(
      (wishlistItem) => wishlistItem.Name === item.Name && wishlistItem.Size === size
    );

    if (existingItemIndex !== -1) {
      const updatedWishlist = [...wishlist];
      updatedWishlist[existingItemIndex].Count += 1;
      setWishlist(updatedWishlist);
    } else {
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
        updatedItem.Count -= 1;
        setWishlist(updatedWishlist);
      } else {
        updatedWishlist.splice(existingItemIndex, 1);
        setWishlist(updatedWishlist);
      }
    }
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/Menus" element={<Landing />} />
          <Route path="Menu/">
            <Route index element={<PageNotFound />} />
            <Route path="CoffeeMenu" element={<BestMenu WHICH={"CoffeeMenu"} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="FoodMenu" element={<BestMenu WHICH={"FoodMenu"} wishlist={wishlist} setWishlist={setWishlist} />} />
            {/* <Route path="SweetMenu" element={<BestMenu WHICH={"SweetMenu"} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="SavouryMenu" element={<BestMenu WHICH={"SavouryMenu"} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="ManualBrewMenu" element={<BestMenu WHICH={"ManualBrewMenu"} wishlist={wishlist} setWishlist={setWishlist} />} />
            <Route path="NotCoffeeMenu" element={<BestMenu WHICH={"NotCoffeeMenu"} wishlist={wishlist} setWishlist={setWishlist} />} /> */}
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
                <div className="itemAdd" onClick={() => itemAdd(item, item.Size, item.Price)}>+</div>
              </div>
              <div className='wishlistItemSize'>{item.Size}</div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {wishlist.length !== 0 ? (
            <div className='wishlistBar' onClick={() => setWishlistOpen(true)}>
              Wishlist
            </div>
          ) : " "}
        </>
      )}
    </div>
  );
}

export default App;
