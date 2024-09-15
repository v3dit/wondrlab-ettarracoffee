import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import database from '../config/FirbaseConfig.js';

import '../styles/Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const timestamp = new Date().toLocaleString()
    const key = timestamp.replace('/', '_').replace('/', '_').replace(',', '_').replace(':', '_').replace(':', '_').replace(' ', '_').replace(' ', '_') + "______" + phoneNumber;
    await database.ref(`register/${key}`).update({name, phoneNumber, timestamp})

    // // Navigate to the next route with the data as parameters
    // navigate(`/formlinks?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phoneNumber)}`);

    navigate(`/Menus`);
  };

  return (
    <div className='Register'>
        <div className='content'>
          <form onSubmit={handleSubmit}>
            <input
              type='text'
              placeholder='Name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <br />
            <input
              type='tel'
              placeholder='Phone Number'
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            <br />
            <input type='submit' />
          </form>
        </div>
    </div>
  );
}

export default Register;
