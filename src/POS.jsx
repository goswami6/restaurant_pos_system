import React, { useState } from 'react';
import './POS.css';

// Mock Data updated with categories
const MENU_ITEMS = [
    { id: 1, name: 'Burger', price: 120, category: 'Main Course' },
    { id: 2, name: 'Pizza', price: 250, category: 'Main Course' },
    { id: 3, name: 'Pasta', price: 180, category: 'Main Course' },
    { id: 4, name: 'Fries', price: 90, category: 'Starters' },
    { id: 5, name: 'Garlic Bread', price: 110, category: 'Breads' },
    { id: 6, name: 'Cola', price: 50, category: 'Drinks' },
    { id: 7, name: 'Iced Tea', price: 70, category: 'Drinks' },
    { id: 8, name: 'Brownie', price: 140, category: 'Desserts' }
];

const CATEGORIES = ['All', 'Starters', 'Main Course', 'Breads', 'Drinks', 'Desserts'];

const POS = () => {
    // States
    const [cart, setCart] = useState({});
    const [orderType, setOrderType] = useState('DINE-IN');
    const [tableId, setTableId] = useState('Table T1');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    const TAX_PERCENT = 5;

    // --- Filter Logic ---
    const filteredItems = MENU_ITEMS.filter(item => {
        // 1. Check if it matches the selected category
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        
        // 2. Check if it matches the search query (case-insensitive)
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesCategory && matchesSearch;
    });

    // --- Cart Logic ---
    const addToCart = (item) => {
        setCart(prevCart => {
            const existing = prevCart[item.id];
            if (existing) {
                return {
                    ...prevCart,
                    [item.id]: { ...existing, qty: existing.qty + 1 }
                };
            }

            return {
                ...prevCart,
                [item.id]: { ...item, qty: 1 }
            };
        });
    };

    const updateQty = (id, delta) => {
        setCart(prevCart => {
            const existing = prevCart[id];
            if (!existing) return prevCart;

            const newQty = existing.qty + delta;
            if (newQty <= 0) {
                const { [id]: _, ...rest } = prevCart;
                return rest;
            }

            return {
                ...prevCart,
                [id]: { ...existing, qty: newQty }
            };
        });
    };

    const removeItem = (id) => {
        setCart(prevCart => {
            const newCart = { ...prevCart };
            delete newCart[id];
            return newCart;
        });
    };

    // --- Derived Calculations ---
    const cartItems = Object.values(cart);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = (subtotal * TAX_PERCENT) / 100;
    const grandTotal = subtotal + tax;

    // --- API Call ---
    const saveOrder = async () => {
        if (Object.keys(cart).length === 0) {
            alert("Cart is empty!");
            return;
        }

        const orderData = {
            order_type: orderType.replace("-", "_").toUpperCase(),
            table_id: 1,
            customer_id: null,
            cart: cart
        };

        console.log("Saving Order:", orderData);
        alert("Order Saved Successfully! Check console for data.");
        setCart({});
    };

    return (
        <div>
            {/* HEADER */}
            <div className="pos-header d-flex justify-content-between align-items-center">
                <div>
                    <strong>🍽 My Restaurant</strong>
                </div>

                <div className="d-flex gap-2">
                    <select 
                        className="form-select form-select-sm" 
                        value={orderType} 
                        onChange={(e) => setOrderType(e.target.value)}
                    >
                        <option>DINE-IN</option>
                        <option>TAKEAWAY</option>
                        <option>DELIVERY</option>
                    </select>

                    <select 
                        className="form-select form-select-sm"
                        value={tableId}
                        onChange={(e) => setTableId(e.target.value)}
                    >
                        <option>Table T1</option>
                        <option>Table T2</option>
                        <option>Table T3</option>
                    </select>

                    <button className="btn btn-sm btn-warning">
                        <i className="bi bi-person-plus"></i> Customer
                    </button>
                </div>

                <div>
                    Cashier: <strong>Ravi</strong> |
                    <a href="#logout" className="text-danger text-decoration-none ms-2">Logout</a>
                </div>
            </div>

            {/* MAIN */}
            <div className="container-fluid">
                <div className="row">
                    
                    {/* LEFT: CATEGORIES */}
                    <div className="col-md-2 bg-light pt-3" style={{ height: 'calc(100vh - 70px)', overflowY: 'auto' }}>
                        {CATEGORIES.map((cat, index) => (
                            <button 
                                key={index} 
                                // Dynamically apply active class based on selected category
                                className={`btn category-btn ${selectedCategory === cat ? 'btn-dark' : 'btn-outline-dark'}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* CENTER: MENU ITEMS */}
                    <div className="col-md-6 pt-3">
                        {/* Search Input bound to searchQuery state */}
                        <input 
                            type="text" 
                            className="form-control mb-3" 
                            placeholder="Search item..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        <div className="row g-3">
                            {/* Render filteredItems instead of MENU_ITEMS */}
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <div className="col-md-4" key={item.id}>
                                        <div 
                                            className="card menu-card text-center p-2"
                                            onClick={() => addToCart(item)}
                                        >
                                            <h6>{item.name}</h6>
                                            <strong>₹{item.price}</strong>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center text-muted mt-4">
                                    No items found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: BILL PANEL */}
                    <div className="col-md-4 bill-panel p-3">
                        <h6 className="border-bottom pb-2">{tableId} | Order #1023</h6>

                        {/* ITEMS */}
                        <div id="cart-items">
                            {cartItems.length === 0 ? (
                                <p className="text-muted">No items in cart</p>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.id} className="d-flex justify-content-between align-items-center mb-2">
                                        <div>
                                            <strong>{item.name}</strong><br />
                                            <button 
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => updateQty(item.id, -1)}
                                            >
                                                −
                                            </button>
                                            <span className="mx-2">{item.qty}</span>
                                            <button 
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => updateQty(item.id, 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div>
                                            ₹{(item.price * item.qty).toFixed(2)}
                                            <button 
                                                className="btn btn-sm btn-danger ms-2"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <hr />

                        {/* TOTALS */}
                        <div className="d-flex justify-content-between">
                            <span>Subtotal</span>
                            <strong>₹{subtotal.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span>Tax ({TAX_PERCENT}%)</span>
                            <strong>₹{tax.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between fs-5">
                            <strong>Grand Total</strong>
                            <strong>₹{grandTotal.toFixed(2)}</strong>
                        </div>

                        <hr />

                        {/* ACTIONS */}
                        <div className="bill-footer">
                            <button className="btn btn-secondary">Hold</button>
                            <button className="btn btn-warning">Print KOT</button>
                            <button className="btn btn-danger" onClick={() => setCart({})}>Cancel</button>
                            <button className="btn btn-success" onClick={saveOrder}>Pay</button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default POS;