import React, { useState, useEffect } from 'react';
import './POS.css';
import { API_BASE_URL } from './config';

// Robust local fallback data matching the API schema in case backend server is offline
const FALLBACK_MENU = {
    "version": "1.0.0",
    "last_updated": "2026-05-15T10:30:00Z",
    "categories": [
        {
            "category_id": "5",
            "category_name": "Biryani",
            "image_url": "https://api.yoursite.com/images/burgers.jpg",
            "items": [
                {
                    "item_id": "5",
                    "category_id": "5",
                    "item_name": "Veg Biryani",
                    "price": "299.00",
                    "tax_percentage": "5.00",
                    "dietary_info": "Non-Veg",
                    "image": null,
                    "variants": [
                        {
                            "id": "OPT-01",
                            "name": "Rare",
                            "price": 0.00
                        },
                        {
                            "id": "OPT-02",
                            "name": "Medium Rare",
                            "price": 0.00
                        },
                        {
                            "id": "OPT-03",
                            "name": "Well Done",
                            "price": 0.00
                        }
                    ],
                    "addons": []
                }
            ]
        },
        {
            "category_id": "6",
            "category_name": "Starters",
            "image_url": "https://api.yoursite.com/images/burgers.jpg",
            "items": [
                {
                    "item_id": "6",
                    "category_id": "6",
                    "item_name": "Paneer Tikka",
                    "price": "399.00",
                    "tax_percentage": "5.00",
                    "dietary_info": "Veg",
                    "image": null,
                    "variants": [],
                    "addons": []
                }
            ]
        },
        {
            "category_id": "7",
            "category_name": "Main Course",
            "image_url": "https://api.yoursite.com/images/burgers.jpg",
            "items": []
        }
    ]
};

const FALLBACK_TABLES = {
    "total_tables": 6,
    "occupied_count": 2,
    "sections": [
        {
            "section_id": 1000,
            "section_name": "Main Dining Room",
            "tables": [
                {
                    "table_id": 1,
                    "table_number": "#1",
                    "capacity": 5,
                    "status": "Available",
                    "current_session": null,
                    "updated_at": "2026-05-31T18:15:00Z"
                },
                {
                    "table_id": 2,
                    "table_number": "#2",
                    "capacity": 6,
                    "status": "Occupied",
                    "current_session": {
                        "active_order_id": "ORD-99211",
                        "staff_id": 9,
                        "staff_name": "Alex M.",
                        "guest_count": 3,
                        "updated_at": "2026-05-31T18:15:00Z",
                        "total_items": 5,
                        "current_total": 551.92
                    }
                },
                {
                    "table_id": "3",
                    "table_number": "#3",
                    "capacity": 6,
                    "status": "Dirty",
                    "current_session": {
                        "last_order_id": "ORD-99180",
                        "updated_at": "2026-05-31T19:05:00Z"
                    }
                }
            ]
        },
        {
            "section_id": 1001,
            "section_name": "Outdoor",
            "tables": [
                {
                    "table_id": 9,
                    "table_number": "#9",
                    "capacity": 8,
                    "status": "Reserved",
                    "current_session": {
                        "reservation_id": 15,
                        "customer_name": "Sarah Jenkins",
                        "updated_at": "2026-05-31T19:30:00Z"
                    }
                }
            ]
        }
    ],
    "tables": []
};

const POS = ({ user, onLogout }) => {
    // States for data loaded from API or Fallback
    const [menuData, setMenuData] = useState(FALLBACK_MENU);
    const [loading, setLoading] = useState(true);

    // POS States
    const [cart, setCart] = useState({});
    const [orderType, setOrderType] = useState('DINE-IN');
    const [tableId, setTableId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [tablesData, setTablesData] = useState(FALLBACK_TABLES);
    const [tableCarts, setTableCarts] = useState({});
    const [currentView, setCurrentView] = useState('Order'); // Toggle POS dashboard tabs

    // Modifiers Dialog States
    const [selectedItemForModal, setSelectedItemForModal] = useState(null);
    const [chosenVariant, setChosenVariant] = useState(null);

    // Fetch menus from API
    useEffect(() => {
        const fetchMenus = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/menus/9`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                console.log("Fetched menus successfully:", data);
                setMenuData(data);
            } catch (error) {
                console.warn("Using fallback menu data because API fetch failed:", error.message);
                setMenuData(FALLBACK_MENU);
            } finally {
                setLoading(false);
            }
        };

        fetchMenus();
    }, []);

    // Fetch tables from API
    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/tables/9`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                console.log("Fetched tables successfully:", data);
                
                let parsedData = data;
                if (data && data.status === true && Array.isArray(data.data)) {
                    const hasSections = data.data.length > 0 && data.data[0].tables;
                    if (hasSections) {
                        parsedData = {
                            total_tables: data.data.reduce((sum, sec) => sum + (sec.tables || []).length, 0),
                            sections: data.data,
                            tables: []
                        };
                    } else {
                        parsedData = {
                            total_tables: data.data.length,
                            sections: [],
                            tables: data.data
                        };
                    }
                }
                
                const tempTablesList = parsedData.tables || [];
                const tempSectionsList = parsedData.sections || [];
                if (tempTablesList.length === 0 && tempSectionsList.length === 0) {
                    console.log("API returned empty tables. Loading FALLBACK_TABLES.");
                    setTablesData(FALLBACK_TABLES);
                } else {
                    setTablesData(parsedData);
                }
            } catch (error) {
                console.warn("Using fallback tables data because API fetch failed:", error.message);
                setTablesData(FALLBACK_TABLES);
            }
        };

        fetchTables();
    }, []);

    const tablesList = (() => {
        let list = [];
        if (tablesData && tablesData.tables && tablesData.tables.length > 0) {
            list = tablesData.tables;
        } else if (tablesData && tablesData.sections && tablesData.sections.length > 0) {
            tablesData.sections.forEach(sec => {
                if (sec && sec.tables) {
                    list.push(...sec.tables);
                }
            });
        }
        if (list.length === 0) {
            return [
                { table_id: 1, table_number: "T-1", status: "Available" },
                { table_id: 2, table_number: "T-2", status: "Available" },
                { table_id: 3, table_number: "T-3", status: "Available" }
            ];
        }
        return list;
    })();

    // Default select first table when list is loaded
    useEffect(() => {
        if (tablesList.length > 0 && !tableId) {
            setTableId(tablesList[0].table_number);
        }
    }, [tablesList]);

    const prevTableIdRef = React.useRef(tableId);

    // Save and load carts when table changes, populating occupied sessions dynamically
    useEffect(() => {
        const prevTableId = prevTableIdRef.current;
        
        // Save current cart of the previous table
        if (prevTableId) {
            setTableCarts(prev => ({
                ...prev,
                [prevTableId]: cart
            }));
        }

        // Load cart for the new table
        if (tableId) {
            if (tableCarts[tableId] !== undefined) {
                setCart(tableCarts[tableId]);
            } else {
                // If it is occupied and has an active session, populate it
                const tableInfo = (() => {
                    if (tablesData && tablesData.sections) {
                        for (const sec of tablesData.sections) {
                            const found = (sec.tables || []).find(t => t.table_number === tableId);
                            if (found) return found;
                        }
                    }
                    if (tablesData && tablesData.tables) {
                        return tablesData.tables.find(t => t.table_number === tableId);
                    }
                    return null;
                })();

                if (tableInfo && tableInfo.status === 'Occupied' && tableInfo.current_session) {
                    const session = tableInfo.current_session;
                    const totalQty = session.total_items || 1;
                    const targetSubtotal = (session.current_total || 0) / 1.15; // 5% tax + 10% service charge

                    const item1Ref = menuItems[0] || { item_id: '5', item_name: 'Veg Biryani', price: '299.00', category_id: '5' };
                    const item2Ref = menuItems[1] || menuItems[0] || { item_id: '6', item_name: 'Steam Rice', price: '159.00', category_id: '6' };

                    const newCart = {};
                    if (totalQty === 1) {
                        newCart[item1Ref.item_id] = {
                            id: item1Ref.item_id,
                            item_id: item1Ref.item_id,
                            name: `${item1Ref.item_name} (Active Order)`,
                            price: targetSubtotal,
                            qty: 1,
                            category_id: item1Ref.category_id,
                            selectedVariant: null,
                            notes: `Session Order: ${session.active_order_id || 'Active'}`
                        };
                    } else {
                        const qty1 = Math.floor(totalQty / 2) || 1;
                        const qty2 = totalQty - qty1;
                        
                        const defaultPrice1 = parseFloat(item1Ref.price) || 199.00;
                        const price1 = (targetSubtotal / 2 > defaultPrice1) ? defaultPrice1 : (targetSubtotal / totalQty);
                        const price2 = (targetSubtotal - (price1 * qty1)) / qty2;

                        newCart[item1Ref.item_id] = {
                            id: item1Ref.item_id,
                            item_id: item1Ref.item_id,
                            name: `${item1Ref.item_name} (Active Order)`,
                            price: price1,
                            qty: qty1,
                            category_id: item1Ref.category_id,
                            selectedVariant: null,
                            notes: `Session Order: ${session.active_order_id || 'Active'}`
                        };

                        const id2 = item2Ref.item_id === item1Ref.item_id ? `${item2Ref.item_id}_2` : item2Ref.item_id;
                        newCart[id2] = {
                            id: id2,
                            item_id: item2Ref.item_id,
                            name: `${item2Ref.item_name} (Active Order)`,
                            price: price2,
                            qty: qty2,
                            category_id: item2Ref.category_id,
                            selectedVariant: null,
                            notes: `Session Order: ${session.active_order_id || 'Active'}`
                        };
                    }
                    setCart(newCart);
                } else {
                    setCart({});
                }
            }
        }

        prevTableIdRef.current = tableId;
    }, [tableId, tablesData]);

    const activeTableInfo = (() => {
        if (!tableId) return null;
        if (tablesData && tablesData.sections) {
            for (const sec of tablesData.sections) {
                const found = (sec.tables || []).find(t => t.table_number === tableId);
                if (found) {
                    return { ...found, section_name: sec.section_name };
                }
            }
        }
        if (tablesData && tablesData.tables) {
            const found = tablesData.tables.find(t => t.table_number === tableId);
            if (found) {
                return { ...found, section_name: "" };
            }
        }
        return null;
    })();

    // Derived states
    const categories = menuData.categories || [];
    const menuItems = categories.reduce((acc, cat) => [...acc, ...(cat.items || [])], []);
    const categoriesList = ['All', ...categories.map(cat => cat.category_name)];

    // --- Filter Logic ---
    const filteredItems = menuItems.filter(item => {
        // Find category name for item.category_id
        const itemCategory = categories.find(c => c.category_id === item.category_id)?.category_name || '';
        const matchesCategory = selectedCategory === 'All' || itemCategory === selectedCategory;
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // --- Cart Logic ---
    const addToCart = (item, variant = null, notes = '') => {
        const cartKey = variant ? `${item.item_id}_${variant.id}` : item.item_id;

        setCart(prevCart => {
            const existing = prevCart[cartKey];
            if (existing) {
                return {
                    ...prevCart,
                    [cartKey]: { ...existing, qty: existing.qty + 1 }
                };
            }

            return {
                ...prevCart,
                [cartKey]: {
                    id: cartKey, // maintains compatibility with POS layout
                    item_id: item.item_id,
                    name: item.item_name,
                    price: parseFloat(item.price),
                    qty: 1,
                    category_id: item.category_id,
                    selectedVariant: variant,
                    notes: notes
                }
            };
        });
    };

    const handleItemClick = (item) => {
        if (item.variants && item.variants.length > 0) {
            setSelectedItemForModal(item);
            setChosenVariant(item.variants[0]);
        } else {
            addToCart(item);
        }
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
    const subtotal = cartItems.reduce((sum, item) => {
        const itemCost = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
        return sum + (itemCost * item.qty);
    }, 0);

    const tax = cartItems.reduce((sum, item) => {
        // Find matching menu item to read its tax percentage
        const menuItem = menuItems.find(mi => mi.item_id === item.item_id);
        const taxPercentage = menuItem ? parseFloat(menuItem.tax_percentage || 5) : 5;
        const itemCost = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
        return sum + ((itemCost * item.qty) * taxPercentage / 100);
    }, 0);

    const serviceCharge = subtotal * 0.10; // Standard 10% Service Charge
    const grandTotal = subtotal + tax + serviceCharge;

    // --- Place Order API Call ---
    const saveOrder = async () => {
        if (Object.keys(cart).length === 0) {
            alert("Cart is empty!");
            return;
        }

        const mappedOrderType = orderType.charAt(0).toUpperCase() + orderType.slice(1).toLowerCase(); // DINE-IN -> Dine-In
        const mappedTable = tableId.startsWith("#") ? tableId.replace("#", "T-") : (tableId.startsWith("Table ") ? tableId.replace("Table ", "T-") : tableId);

        // Map items to target format
        const payloadItems = cartItems.map(item => ({
            item_id: item.item_id,
            name: item.name,
            quantity: item.qty,
            unit_price: item.price,
            total_price: item.price * item.qty,
            modifiers: item.selectedVariant ? [
                {
                    modifier_id: item.selectedVariant.id,
                    name: item.selectedVariant.name,
                    extra_cost: parseFloat(item.selectedVariant.price || 0)
                }
            ] : [],
            notes: item.notes || ""
        }));

        // Compile payload
        const orderPayload = {
            order_meta: {
                location_id: "LOC-9921",
                terminal_id: "POS-04",
                staff_id: user?.username === 'Ravi' ? 'EMP-77' : 'EMP-01',
                order_type: mappedOrderType === "Dine-in" ? "Dine-In" : mappedOrderType,
                table_number: mappedTable || "T-12",
                guest_count: 4
            },
            items: payloadItems,
            totals: {
                subtotal: parseFloat(subtotal.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                service_charge: parseFloat(serviceCharge.toFixed(2)),
                discount_amount: 0.00,
                grand_total: parseFloat(grandTotal.toFixed(2))
            },
            status: "pending",
            created_at: new Date().toISOString()
        };

        console.log("Placing Order. Payload:", orderPayload);

        try {
            const response = await fetch(`${API_BASE_URL}/place-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Order saved successfully via live API:", data);
            alert("Order Saved Successfully via live API!");
            setCart({});
            setTableCarts(prev => ({ ...prev, [tableId]: {} }));
        } catch (error) {
            console.warn("Live API save failed, simulating local success. Error:", error.message);
            alert(`[Mock Success] Order Saved Successfully!\nCheck the browser console to review the generated JSON payload.`);
            setCart({});
            setTableCarts(prev => ({ ...prev, [tableId]: {} }));
        }
    };

    const getMinutesElapsed = (isoString) => {
        if (!isoString) return '0m';
        const diffMs = Date.now() - new Date(isoString).getTime();
        const mins = Math.max(0, Math.floor(diffMs / 60000));
        return `${mins}m`;
    };

    const payNow = (tNum) => {
        setTablesData(prev => {
            const updatedSections = (prev.sections || []).map(sec => ({
                ...sec,
                tables: (sec.tables || []).map(t => t.table_number === tNum ? { ...t, status: 'Dirty', current_session: { last_order_id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`, updated_at: new Date().toISOString() } } : t)
            }));
            const updatedTables = (prev.tables || []).map(t => t.table_number === tNum ? { ...t, status: 'Dirty', current_session: { last_order_id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`, updated_at: new Date().toISOString() } } : t);
            return { ...prev, sections: updatedSections, tables: updatedTables };
        });
        setCart({});
        setTableCarts(prev => ({ ...prev, [tNum]: {} }));
        alert(`Payment processed for Table ${tNum}! Status changed to Dirty.`);
    };

    const handleAddItems = (tNum) => {
        setTableId(tNum);
        setCurrentView('Order');
    };

    const markTableAsAvailable = (tNum) => {
        setTablesData(prev => {
            const updatedSections = (prev.sections || []).map(sec => ({
                ...sec,
                tables: (sec.tables || []).map(t => t.table_number === tNum ? { ...t, status: 'Available', current_session: null } : t)
            }));
            const updatedTables = (prev.tables || []).map(t => t.table_number === tNum ? { ...t, status: 'Available', current_session: null } : t);
            return { ...prev, sections: updatedSections, tables: updatedTables };
        });
        alert(`Table ${tNum} is now clean and available!`);
    };

    const checkInTable = (tNum) => {
        setTablesData(prev => {
            const updatedSections = (prev.sections || []).map(sec => ({
                ...sec,
                tables: (sec.tables || []).map(t => t.table_number === tNum ? { ...t, status: 'Occupied', current_session: { active_order_id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`, guest_count: t.capacity || 4, total_items: 0, current_total: 0.00 } } : t)
            }));
            const updatedTables = (prev.tables || []).map(t => t.table_number === tNum ? { ...t, status: 'Occupied', current_session: { active_order_id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`, guest_count: t.capacity || 4, total_items: 0, current_total: 0.00 } } : t);
            return { ...prev, sections: updatedSections, tables: updatedTables };
        });
        alert(`Checked in to Table ${tNum}! Starting a new order.`);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top Navigation Header */}
            <nav className="top-nav">
                <ul className="nav-links">
                    <li className={currentView === 'Menu' ? 'active' : ''} onClick={() => setCurrentView('Menu')}>☰ Menu</li>
                    <li className={currentView === 'Order' ? 'active' : ''} onClick={() => setCurrentView('Order')}>🛒 Order</li>
                    <li className={currentView === 'Tables' ? 'active' : ''} onClick={() => setCurrentView('Tables')}>🪟 Tables</li>
                    <li className={currentView === 'Staff' ? 'active' : ''} onClick={() => setCurrentView('Staff')}>👤 Staff</li>
                    <li className={currentView === 'Settings' ? 'active' : ''} onClick={() => setCurrentView('Settings')}>⚙️ Settings</li>
                    <li className={currentView === 'History' ? 'active' : ''} onClick={() => setCurrentView('History')}>⏳ History</li>
                </ul>
                <button className="btn-reservation" onClick={() => checkInTable(tablesList[Math.floor(Math.random() * tablesList.length)]?.table_number || '#1')}>+ New Reservation</button>
            </nav>

            {currentView === 'Tables' ? (
                /* Main Dashboard Layout */
                <div className="dashboard-container">
                    {/* Tables Grid Floor Plan Layout */}
                    <main className="floor-view">
                        {tablesList.map((table) => {
                            const cardClass = `table-card-pos ${table.status.toLowerCase()}`;
                            return (
                                <div key={table.table_id} className={cardClass}>
                                    <div className="card-header-pos">{table.status}</div>
                                    <div className="card-body-pos">
                                        <div className="table-title-pos">Table {table.table_number} | {table.capacity || 4} Seats</div>
                                        
                                        {table.status === 'Available' && (
                                            <div className="card-actions-pos" style={{ flexDirection: 'column' }}>
                                                <button className="btn-action-pos" onClick={() => checkInTable(table.table_number)}>Seat Guests</button>
                                                <button className="btn-action-pos" style={{ marginTop: '8px' }} onClick={() => checkInTable(table.table_number)}>Open Tab</button>
                                            </div>
                                        )}

                                        {table.status === 'Occupied' && (
                                            <>
                                                <div className="session-info">
                                                    <div>
                                                        <span className="label">Server</span>
                                                        <div className="value">{table.current_session?.staff_name || 'Alex M.'}</div>
                                                        <div className="value time-spent" style={{ fontSize: '1rem', marginTop: '4px' }}>
                                                            {getMinutesElapsed(table.current_session?.updated_at)}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span className="label">Current total</span>
                                                        <div className="value" style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>
                                                            ₹{(table.current_session?.current_total || 51.92).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-actions-pos">
                                                    <button className="btn-action-pos btn-blue" onClick={() => handleAddItems(table.table_number)}>Add Items</button>
                                                    <button className="btn-action-pos btn-blue" onClick={() => payNow(table.table_number)}>Pay Now</button>
                                                </div>
                                            </>
                                        )}

                                        {table.status === 'Dirty' && (
                                            <>
                                                <p style={{ marginTop: '10px', fontWeight: '500' }}>Needs Cleaning</p>
                                                <button className="btn-action-pos btn-grey" onClick={() => markTableAsAvailable(table.table_number)}>Table Cleaned</button>
                                            </>
                                        )}

                                        {table.status === 'Reserved' && (
                                            <>
                                                <div>
                                                    <div className="value" style={{ fontSize: '1.1rem', marginTop: '5px' }}>7:30 PM</div>
                                                    <div className="value" style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'normal' }}>
                                                        {table.current_session?.customer_name || 'Sarah Jenkins'}
                                                    </div>
                                                </div>
                                                <button className="btn-action-pos btn-blue" onClick={() => checkInTable(table.table_number)}>Arrived</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </main>

                    {/* Right Control Panel Info Sidebar */}
                    <aside className="sidebar">
                        <div className="sidebar-section">
                            <div className="sidebar-title">Live Metrics</div>
                            <div className="metric-group">
                                <div className="metric-label">Active Tables:</div>
                                <div className="metric-value">
                                    {tablesList.filter(t => t.status === 'Occupied').length}/{tablesList.length}
                                </div>
                            </div>
                            <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '10px 0' }} />
                            <div className="metric-group">
                                <div className="metric-label">Avg. Prep Time:</div>
                                <div className="metric-value">11m</div>
                            </div>
                            <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '10px 0' }} />
                            <div className="metric-group">
                                <div className="metric-label">Open Balance:</div>
                                <div className="metric-value">
                                    ₹{tablesList.reduce((sum, t) => {
                                        if (t.status === 'Occupied') {
                                            const bal = t.current_session?.current_total || (tableCarts[t.table_number] ? Object.values(tableCarts[t.table_number]).reduce((s, item) => s + (item.price * item.qty), 0) : 0);
                                            return sum + bal;
                                        }
                                        return sum;
                                    }, 0).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Live Notifications Panel Stack */}
                        <div className="notifications-header">
                            <span>Notifications</span>
                            <span>▲</span>
                        </div>
                        <ul className="notification-list">
                            {tablesList.filter(t => t.status === 'Dirty').map(t => (
                                <li key={t.table_id} className="notification-item">Table {t.table_number} needs busser</li>
                            ))}
                            <li className="notification-item">
                                New online reservation
                                <span className="time">7:30 PM</span>
                            </li>
                            {tablesList.filter(t => t.status === 'Dirty').map(t => (
                                <li key={t.table_id} className="notification-item">Table {t.table_number} guests are checked out</li>
                            ))}
                            <li className="notification-item">T-13 needs busser</li>
                        </ul>
                    </aside>
                </div>
            ) : (
                /* MAIN Ordering View */
                <main className="container-fluid p-0" style={{ flex: 1 }}>
                    <div className="row g-0">
                        {/* LEFT: CATEGORIES */}
                        <div className="col-md-2 bg-white pt-4 px-3" style={{ height: 'calc(100vh - 112px)', borderRight: '1px solid var(--border)' }}>
                            <p className="text-muted small fw-bold text-uppercase mb-3 px-2">Categories</p>
                            {categoriesList.map((cat, index) => (
                                <button 
                                    key={index} 
                                    className={`btn category-btn ${selectedCategory === cat ? 'btn-dark' : 'btn-outline-dark'}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* CENTER: MENU ITEMS */}
                        <div className="col-md-7 pt-4 px-4 bg-slate-50" style={{ height: 'calc(100vh - 112px)', overflowY: 'auto' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0">{selectedCategory} Items</h5>
                                <div className="position-relative" style={{ width: '300px' }}>
                                    <input 
                                        type="text" 
                                        className="form-control border-0 shadow-sm" 
                                        style={{ borderRadius: '10px', paddingLeft: '35px' }}
                                        placeholder="Search delicious food..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">🔍</span>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-warning" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="text-muted mt-2">Loading menus from API...</p>
                                </div>
                            ) : (
                                <div className="row g-4">
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map((item) => (
                                            <div className="col-md-4 col-lg-3" key={item.item_id}>
                                                <div 
                                                    className="menu-card d-flex flex-column align-items-start justify-content-between p-3"
                                                    onClick={() => handleItemClick(item)}
                                                >
                                                    <div className="w-full d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="m-0 text-slate-800 text-sm font-bold text-truncate" style={{ maxWidth: '75%' }}>{item.item_name}</h6>
                                                        <span className={`badge ${item.dietary_info === 'Veg' ? 'bg-success-subtle text-success border border-success/20' : 'bg-danger-subtle text-danger border border-danger/20'} font-normal text-[10px] py-1`}>
                                                            {item.dietary_info}
                                                        </span>
                                                    </div>
                                                    <div className="w-full d-flex justify-content-between align-items-center mt-2">
                                                        <strong className="text-amber-500 font-bold">₹{parseFloat(item.price).toFixed(2)}</strong>
                                                        {item.variants && item.variants.length > 0 && (
                                                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                ✨ Customize
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-12 text-center py-5">
                                            <div className="fs-1 mb-2">🤷‍♂️</div>
                                            <p className="text-muted">Oops! No items found matching your search.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: BILL PANEL */}
                        <div className="col-md-3 bill-panel" style={{ height: 'calc(100vh - 112px)' }}>
                            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="fw-bold mb-0">
                                        {activeTableInfo?.section_name ? `${activeTableInfo.section_name} - ` : ''}Table {tableId}
                                    </h6>
                                    <span className="text-muted small">Order #1023</span>
                                </div>
                                <span className="badge bg-primary text-white">Active</span>
                            </div>

                            {/* ITEMS */}
                            <div className="cart-scroll">
                                {activeTableInfo?.status === 'Dirty' ? (
                                    <div className="text-center py-5 px-3">
                                        <div className="fs-1 mb-2">🧹</div>
                                        <h6 className="fw-bold text-danger">Table Needs Cleaning</h6>
                                        <p className="text-muted small mt-2">
                                            Last Order: <strong>{activeTableInfo.current_session?.last_order_id || 'N/A'}</strong><br />
                                            Cleared at: {activeTableInfo.current_session?.updated_at ? new Date(activeTableInfo.current_session.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Recently'}
                                        </p>
                                        <button 
                                            className="btn btn-sm btn-outline-success fw-bold px-4 py-2 mt-3 w-100"
                                            onClick={() => markTableAsAvailable(tableId)}
                                        >
                                            Mark as Cleaned
                                        </button>
                                    </div>
                                ) : activeTableInfo?.status === 'Reserved' ? (
                                    <div className="text-center py-5 px-3">
                                        <div className="fs-1 mb-2">🔒</div>
                                        <h6 className="fw-bold text-warning">Table is Reserved</h6>
                                        <p className="text-muted small mt-2">
                                            Customer: <strong>{activeTableInfo.current_session?.customer_name || 'Guest'}</strong><br />
                                            Reservation ID: <strong>#{activeTableInfo.current_session?.reservation_id || 'N/A'}</strong><br />
                                            Time: {activeTableInfo.current_session?.updated_at ? new Date(activeTableInfo.current_session.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Scheduled'}
                                        </p>
                                        <button 
                                            className="btn btn-sm btn-warning fw-bold px-4 py-2 mt-3 w-100"
                                            onClick={() => checkInTable(tableId)}
                                        >
                                            Check In / Start Order
                                        </button>
                                    </div>
                                ) : cartItems.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="fs-1 opacity-20">🛒</div>
                                        <p className="text-muted mt-2">Your cart is empty</p>
                                    </div>
                                ) : (
                                    cartItems.map(item => {
                                        const totalItemPrice = (item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0)) * item.qty;
                                        return (
                                            <div key={item.id} className="cart-item">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <strong className="text-slate-900">{item.name}</strong>
                                                    <span className="fw-bold">₹{totalItemPrice.toFixed(2)}</span>
                                                </div>
                                                
                                                {item.selectedVariant && (
                                                    <div className="text-[11px] text-amber-600 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 mb-2 inline-block">
                                                        Option: {item.selectedVariant.name}
                                                    </div>
                                                )}

                                                {item.notes && (
                                                    <div className="text-[11px] text-slate-500 italic mb-2">
                                                        Note: "{item.notes}"
                                                    </div>
                                                )}

                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <button 
                                                            className="qty-btn"
                                                            onClick={() => updateQty(item.id, -1)}
                                                        >
                                                            −
                                                        </button>
                                                        <span className="fw-bold" style={{ minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                                                        <button 
                                                            className="qty-btn"
                                                            onClick={() => updateQty(item.id, 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <button 
                                                        className="btn btn-link text-danger p-0 text-decoration-none small"
                                                        onClick={() => removeItem(item.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* SUMMARY */}
                            <div className="p-3 bg-light border-top mt-auto">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Tax (5%)</span>
                                    <span>₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Service Charge (10%)</span>
                                    <span>₹{serviceCharge.toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <strong className="fs-5">Grand Total</strong>
                                    <strong className="fs-5 text-primary">₹{grandTotal.toFixed(2)}</strong>
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="bill-footer">
                                <button className="btn btn-outline-secondary" onClick={() => setCart({})}>Cancel</button>
                                <button className="btn btn-outline-warning">Hold</button>
                                <button className="btn btn-dark">Print KOT</button>
                                <button className="btn btn-success-premium" onClick={saveOrder}>Pay Now</button>
                            </div>
                        </div>
                    </div>
                </main>
            )}

            {/* Bottom Utility Operations Bar */}
            <footer className="bottom-bar">
                <div className="bottom-bar-left">
                    <button className="btn-bottom" onClick={() => setCurrentView('Menu')}>📋 Quick Menu</button>
                    <button className="btn-bottom" onClick={() => { setOrderType('TAKEAWAY'); setCurrentView('Order'); }}>🛍️ New Takeaway</button>
                    <button className="btn-bottom" onClick={() => { setOrderType('DELIVERY'); setCurrentView('Order'); }}>🚚 New Delivery</button>
                    <button className="btn-bottom" onClick={() => alert('Report view is coming soon!')}>📊 Reports</button>
                </div>
                <button className="btn-logout" onClick={onLogout}>Logout ({user?.username || "Ravi"})</button>
            </footer>

            {/* CUSTOMIZABLE MODIFIERS DIALOG */}
            {selectedItemForModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-800/80 flex justify-between items-center">
                            <div>
                                <h5 className="font-bold text-white text-base mb-1">{selectedItemForModal.item_name}</h5>
                                <span className="text-amber-500 font-bold text-sm">₹{parseFloat(selectedItemForModal.price).toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={() => setSelectedItemForModal(null)}
                                className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-850 p-2 rounded-full cursor-pointer border border-transparent hover:border-slate-700/50 text-xs"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-5 space-y-5">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                                    Select Variant Option
                                </label>
                                <div className="space-y-2">
                                    {selectedItemForModal.variants.map((v) => (
                                        <label 
                                            key={v.id}
                                            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                                                chosenVariant?.id === v.id 
                                                ? 'border-amber-500 bg-amber-500/10 text-white' 
                                                : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="radio" 
                                                    name="variant" 
                                                    checked={chosenVariant?.id === v.id}
                                                    onChange={() => setChosenVariant(v)}
                                                    className="accent-amber-500 h-4 w-4"
                                                />
                                                <span className="font-semibold text-sm">{v.name}</span>
                                            </div>
                                            {v.price > 0 && (
                                                <span className="text-xs font-semibold text-amber-500">+₹{v.price.toFixed(2)}</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Special Cooking Notes
                                </label>
                                <textarea 
                                    id="modifier-notes"
                                    placeholder="E.g., No onions, extra spicy, well cooked..." 
                                    className="w-full p-3 bg-slate-950/80 border border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 rounded-xl text-white text-xs outline-none transition-all resize-none h-20 placeholder-slate-600"
                                ></textarea>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex justify-end gap-3">
                            <button 
                                onClick={() => setSelectedItemForModal(null)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    const notesInput = document.getElementById('modifier-notes');
                                    addToCart(selectedItemForModal, chosenVariant, notesInput?.value || '');
                                    setSelectedItemForModal(null);
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.97] transition-all duration-200 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-amber-500/10"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;