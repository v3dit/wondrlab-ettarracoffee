import React, { useEffect, useState } from "react";
import database from "../config/FirbaseConfig";
import * as XLSX from "xlsx";
import "../styles/Reports.css";

// Add email encoding function
const encodeEmail = (email) => {
    if (!email) return '';
    return email.toString()
        .replace(/\./g, '-dot-')
        .replace(/@/g, '-at-')
        .replace(/\$/g, '-dollar-')
        .replace(/\[/g, '-lbracket-')
        .replace(/\]/g, '-rbracket-')
        .replace(/#/g, '-hash-');
};

const Reports = ({ loggedInUser }) => {
  const [reportsAccess, setReportsAccess] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
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
        const snapshot = await database.ref('completed').once('value');
        const data = snapshot.val();
        
        const parsedData = data ? Object.entries(data).map(([key, item]) => {
          // Safe price parsing function
          const parsePrice = (priceStr) => {
            if (typeof priceStr === 'number') return priceStr;
            if (!priceStr) return 0;
            // Handle string price formats
            const numericPrice = priceStr.toString().replace(/[^0-9.]/g, '');
            return parseFloat(numericPrice) || 0;
          };

          const price = parsePrice(item.Price);
          const quantity = parseInt(item.Count) || 0;
          const customerEmail = item.customer_name ? item.customer_name.split(' ').slice(0, -1).join(' ') : 'Unknown';
          const encodedEmail = encodeEmail(customerEmail);

          return {
            id: key,
            order_id: item.order_id,
            order_item_id: item.order_item_id,
            created_on: item.created_on,
            created_on_date: item.created_on_date,
            created_on_time: item.created_on_time,
            prep_start_time: item.prep_start_time,
            served_time: item.served_time,
            item_name: item.Name,
            category: item.Category,
            size: item.Size,
            quantity: quantity,
            price: price,
            total: price * quantity,
            customer: customerEmail,
            customer_encoded: encodedEmail,
            status: item.status,
            section: item.Section,
            prepared_by: item.prepared_by_email ? encodeEmail(item.prepared_by_email) : '-',
            served_by: item.served_by_email ? encodeEmail(item.served_by_email) : '-',
            description: item.Desc
          };
        }) : [];
        
        console.log("Fetched completed orders:", parsedData);
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
    let filtered = [...data];
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        (item.item_name && item.item_name.toLowerCase().includes(searchTerm)) ||
        (item.customer && item.customer.toLowerCase().includes(searchTerm)) ||
        (item.order_id && item.order_id.toLowerCase().includes(searchTerm)) ||
        (item.category && item.category.toLowerCase().includes(searchTerm))
      );
    }
    
    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }
    
    if (start) {
      const startDate = new Date(start);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_on_date.split('/').reverse().join('-'));
        return itemDate >= startDate;
      });
    }
    
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_on_date.split('/').reverse().join('-'));
        return itemDate <= endDate;
      });
    }
    
    setFilteredData(filtered);
    calculateTotals(filtered);
  };

  const calculateTotals = (data) => {
    const quantity = data.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
    const amount = data.reduce((total, item) => total + (Number(item.total) || 0), 0);
    
    setTotalQuantity(quantity);
    setTotalAmount(amount);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Order ID': item.order_id,
      'Order Date': item.created_on_date,
      'Order Time': item.created_on_time,
      'Preparation Start': item.prep_start_time,
      'Served Time': item.served_time,
      'Item Name': item.item_name,
      'Category': item.category,
      'Size': item.size,
      'Quantity': item.quantity,
      'Price': `Rs. ${item.price.toFixed(2)}`,
      'Total': `Rs. ${item.total.toFixed(2)}`,
      'Customer': item.customer,
      'Status': item.status,
      'Section': item.section,
      'Prepared By': item.prepared_by,
      'Served By': item.served_by
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "Sales_Report.xlsx");
  };

  if (!reportsAccess) {
    return <div className="reports-container">You don't have access to the reports.</div>;
  }

  return (
    <div className="reports-container">
      <h1>Sales Reports</h1>
      
      <div className="reports-controls">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by name, customer, or order ID"
            value={search}
            onChange={handleSearch}
          />
          
          <select value={categoryFilter} onChange={handleCategoryFilter}>
            <option value="">All Categories</option>
            <option value="HotCoffeeMenu">Hot Coffee</option>
            <option value="ColdCoffeeMenu">Cold Coffee</option>
            <option value="SavouryMenu">Savoury</option>
          </select>
        </div>
        
        <div className="date-filter">
          <div className="date-input">
            <label>From:</label>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
            />
          </div>
          
          <div className="date-input">
            <label>To:</label>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
            />
          </div>
        </div>
        
        <button className="export-btn" onClick={exportToExcel}>
          Export to Excel
        </button>
      </div>
      
      <div className="reports-summary">
        <div className="summary-item">
          <span className="summary-label">Total Items:</span>
          <span className="summary-value">{totalQuantity}</span>
        </div>
        
        <div className="summary-item">
          <span className="summary-label">Total Amount:</span>
          <span className="summary-value">Rs. {totalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      {filteredData.length === 0 ? (
        <div className="no-data-message">
          No data found for the selected filters.
        </div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Time</th>
                <th>Prep Start</th>
                <th>Served</th>
                <th>Name</th>
                <th>Category</th>
                <th>Size</th>
                <th>Count</th>
                <th>Price</th>
                <th>Total</th>
                <th>Customer</th>
                <th>Prepared By</th>
                <th>Served By</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index}>
                  <td>{item.order_id}</td>
                  <td>{item.created_on_date}</td>
                  <td>{item.created_on_time}</td>
                  <td>{item.prep_start_time?.split(', ')[1] || '-'}</td>
                  <td>{item.served_time?.split(', ')[1] || '-'}</td>
                  <td>{item.item_name}</td>
                  <td>{item.category}</td>
                  <td>{item.size}</td>
                  <td>{item.quantity}</td>
                  <td className="price-cell">Rs. {item.price.toFixed(2)}</td>
                  <td className="price-cell">Rs. {item.total.toFixed(2)}</td>
                  <td className="customer-cell">{item.customer}</td>
                  <td>{item.prepared_by}</td>
                  <td>{item.served_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
