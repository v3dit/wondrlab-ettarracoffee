import React, { useEffect, useState } from "react";
import database from "../config/FirbaseConfig";
import * as XLSX from "xlsx";
import "../styles/Reports.css";

const Reports = ({ loggedInUser }) => {
  const [reportsAccess, setReportsAccess] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Date filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const getAccess = async () => {
      try {
        const accessSnapshot = await database.ref(`Reports_Access/${loggedInUser}`).once('value');
        setReportsAccess(accessSnapshot.val());
      } catch (error) {
        console.error(error);
      }
    };

    getAccess();
  }, [loggedInUser]);

  useEffect(() => {
    if (reportsAccess) {
      const fetchData = async () => {
        const snapshot = await database.ref('KDS/completed').once('value');
        const data = snapshot.val();
        const parsedData = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
        setData(parsedData);
        setFilteredData(parsedData);
        calculateTotals(parsedData);
      };
      fetchData();
    }
  }, [reportsAccess]);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    filterData(value, categoryFilter, startDate, endDate);
  };

  const handleCategoryFilter = (e) => {
    const value = e.target.value;
    setCategoryFilter(value);
    filterData(search, value, startDate, endDate);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    filterData(search, categoryFilter, e.target.value, endDate);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    filterData(search, categoryFilter, startDate, e.target.value);
  };

  const filterData = (searchTerm, category, start, end) => {
    const filtered = data.filter(item => {
      const itemDate = new Date(item.created_on_date);
      const startDate = new Date(start);
      const endDate = new Date(end);

      return (
        (item.Name.toLowerCase().includes(searchTerm) || item.customer_name.toLowerCase().includes(searchTerm)) &&
        (category ? item.Category === category : true) &&
        (!start || !end || (itemDate >= startDate && itemDate <= endDate))
      );
    });

    setFilteredData(filtered);
    calculateTotals(filtered);
  };

  const calculateTotals = (data) => {
    const totalQty = data.reduce((sum, item) => sum + (item.Count || 0), 0);
    const totalAmt = data.reduce((sum, item) => {
        if (!item.Price) return sum;
        const price = item.Price.toString().replace('Rs.', '')
            .replace(/\//g, '')
            .replace(/,/g, '')
            .replace(/:/g, '')
            .replace(/-/g, '')
            .replace(' ', '');
        return sum + parseFloat(price || 0);
    }, 0);
    
    setTotalQuantity(totalQty);
    setTotalAmount(totalAmt.toFixed(2));
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "Report.xlsx");
  };

  return (
    <div className="reports-container">
      <h1 className="reports-header">☕ Sales Reports</h1>
      
      <div className="reports-controls">
        <input
          type="text"
          placeholder="Search orders..."
          className="search-input"
          value={search}
          onChange={handleSearch}
        />
        
        <select 
          className="category-select"
          value={categoryFilter}
          onChange={handleCategoryFilter}
        >
          <option value="All Categories">All Categories</option>
          <option value="ColdCoffeeMenu">Cold Coffee</option>
          <option value="HotCoffeeMenu">Hot Coffee</option>
          <option value="SavouryMenu">Savoury Coffee</option>
        </select>
        
        <div className="date-inputs">
          <input
            type="date"
            className="date-input"
            value={startDate}
            onChange={handleStartDateChange}
          />
          <input
            type="date"
            className="date-input"
            value={endDate}
            onChange={handleEndDateChange}
          />
        </div>
        
        <button className="export-button" onClick={exportToExcel}>
          Export to Excel
        </button>
      </div>

      <div className="reports-summary">
        <div className="summary-card">
          <div className="summary-label">Total Quantity Sold</div>
          <div className="summary-value">{totalQuantity}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Amount</div>
          <div className="summary-value">Rs. {totalAmount}</div>
        </div>
      </div>

      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Date</th>
              <th>Time</th>
              <th>Name</th>
              <th>Category</th>
              <th>Count</th>
              <th>Price</th>
              <th>Size</th>
              <th>Customer</th>
              <th>Prepared On</th>
              <th>Prepared By</th>
              <th>Served On</th>
              <th>Served By</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={index}>
                <td className="timestamp-cell">{item.created_on}</td>
                <td>{item.created_on_date}</td>
                <td>{item.created_on_time}</td>
                <td>{item.Name}</td>
                <td>{item.Category}</td>
                <td>{item.Count}</td>
                <td className="price-cell">Rs. {item.Price}</td>
                <td>{item.Size}</td>
                <td className="customer-cell">{item.customer_name}</td>
                <td>{item.prepared}</td>
                <td>{item.prepared_by_email}</td>
                <td>{item.served}</td>
                <td>{item.served_by_email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
