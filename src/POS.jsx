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
    const [cartModified, setCartModified] = useState(false);
    const [tableModified, setTableModified] = useState({});
    const [orderHistory, setOrderHistory] = useState([
        { order_id: 'ORD-99120', table_number: '1', type: 'Dine-In', total: 450.00, time: '2026-06-17T18:30:00Z', status: 'PAID' },
        { order_id: 'ORD-99121', table_number: '2', type: 'Dine-In', total: 551.92, time: '2026-06-17T19:15:00Z', status: 'PAID' },
        { order_id: 'ORD-99122', table_number: 'Takeaway', type: 'Takeaway', total: 320.00, time: '2026-06-17T19:45:00Z', status: 'PAID' }
    ]);
    const [orderType, setOrderType] = useState('DINE-IN');
    const [tableId, setTableId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [tablesData, setTablesData] = useState(FALLBACK_TABLES);
    const [tableCarts, setTableCarts] = useState({});
    const [currentView, setCurrentView] = useState('Order'); // Default to Order dashboard

    // UI Page States
    const [posSettings, setPosSettings] = useState({
        restaurantName: 'Big Ben Restaurant',
        address: '1st Flr, Sun Mill Compound, Lower Parel',
        taxRate: 5.00,
        serviceCharge: 10.00
    });
    const [staffList, setStaffList] = useState([
        { id: 100, name: 'Alex M.', role: 'Waiter', status: 'Active', ordersHandled: 12 },
        { id: 101, name: 'Ravi S.', role: 'Manager', status: 'Active', ordersHandled: 4 },
        { id: 102, name: 'Priya K.', role: 'Chef', status: 'Active', ordersHandled: 25 },
        { id: 103, name: 'Amit P.', role: 'Waiter', status: 'On Break', ordersHandled: 8 },
        { id: 104, name: 'Neha R.', role: 'Cashier', status: 'Active', ordersHandled: 0 }
    ]);
    const [newCatName, setNewCatName] = useState('');
    const [showAddItemForm, setShowAddItemForm] = useState(false);
    const [newItemData, setNewItemData] = useState({
        item_name: '',
        price: '',
        dietary_info: 'Veg',
        category_id: ''
    });
    const [showAddStaffForm, setShowAddStaffForm] = useState(false);
    const [newStaffData, setNewStaffData] = useState({
        name: '',
        role: 'Waiter',
        status: 'Active'
    });
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [historyTypeFilter, setHistoryTypeFilter] = useState('All');
    const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

    const handleAddCategory = () => {
        if (!newCatName.trim()) return;
        const nextId = String(categories.length + 5);
        setMenuData(prev => ({
            ...prev,
            categories: [...prev.categories, { category_id: nextId, category_name: newCatName, items: [] }]
        }));
        setNewCatName('');
    };

    // Derived states (defined above effects so they are accessible inside hooks)
    const categories = menuData.categories || [];
    const menuItems = categories.reduce((acc, cat) => [...acc, ...(cat.items || [])], []);
    const categoriesList = ['All', ...categories.map(cat => cat.category_name)];

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
        const mergeLocalStatus = (nextData, prev) => {
            const mergeTablesList = (list) => {
                return (list || []).map(t => {
                    const prevTable = (() => {
                        if (prev && prev.tables) {
                            const found = prev.tables.find(pt => pt.table_number === t.table_number);
                            if (found) return found;
                        }
                        if (prev && prev.sections) {
                            for (const sec of prev.sections) {
                                const found = (sec.tables || []).find(pt => pt.table_number === t.table_number);
                                if (found) return found;
                            }
                        }
                        return null;
                    })();

                    if (prevTable) {
                        if (prevTable.status === 'Dirty') {
                            return {
                                ...t,
                                status: 'Dirty',
                                current_session: prevTable.current_session
                            };
                        }
                        if (prevTable.status === 'Occupied' && (t.status === 'Available' || !t.current_session)) {
                            return {
                                ...t,
                                status: 'Occupied',
                                current_session: prevTable.current_session
                            };
                        }
                    }
                    return t;
                });
            };

            let merged = { ...nextData };
            if (merged.tables && merged.tables.length > 0) {
                merged.tables = mergeTablesList(merged.tables);
            } else if (merged.sections && merged.sections.length > 0) {
                merged.sections = merged.sections.map(sec => ({
                    ...sec,
                    tables: mergeTablesList(sec.tables)
                }));
            }
            return merged;
        };

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
                    setTablesData(prev => mergeLocalStatus(FALLBACK_TABLES, prev));
                } else {
                    setTablesData(prev => mergeLocalStatus(parsedData, prev));
                }
            } catch (error) {
                console.warn("Using fallback tables data because API fetch failed:", error.message);
                setTablesData(prev => mergeLocalStatus(FALLBACK_TABLES, prev));
            }
        };

        fetchTables();
        const interval = setInterval(fetchTables, 10000); // Poll every 10 seconds to sync orders placed on e-menu
        return () => clearInterval(interval);
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
        
        // Save current cart of the previous table if switching to a different table
        if (prevTableId && prevTableId !== tableId) {
            setTableCarts(prev => ({
                ...prev,
                [prevTableId]: cart
            }));
            setTableModified(prev => ({
                ...prev,
                [prevTableId]: cartModified
            }));
        }

        // Load cart for the new table
        if (tableId) {
            setCartModified(tableModified[tableId] || false);
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
                    const targetSubtotal = (session.current_total || 0) / (1 + (posSettings.taxRate + posSettings.serviceCharge) / 100);

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
    }, [tableId]);

    // Real-time synchronization of carts when tablesData updates from API polling
    useEffect(() => {
        if (!tablesData) return;

        // Extract list of all tables from tablesData
        let currentTables = [];
        if (tablesData.tables && tablesData.tables.length > 0) {
            currentTables = tablesData.tables;
        } else if (tablesData.sections && tablesData.sections.length > 0) {
            tablesData.sections.forEach(sec => {
                if (sec && sec.tables) {
                    currentTables.push(...sec.tables);
                }
            });
        }

        const generateSessionCart = (table) => {
            if (table.status !== 'Occupied' || !table.current_session) return {};
            const session = table.current_session;
            const totalQty = session.total_items || 1;
            const targetSubtotal = (session.current_total || 0) / (1 + (posSettings.taxRate + posSettings.serviceCharge) / 100);

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
            return newCart;
        };

        // Sync local carts based on table status updates from polling
        currentTables.forEach(t => {
            const tNum = t.table_number;
            const isCurrentTable = tNum === tableId;
            const isModified = isCurrentTable ? cartModified : (tableModified[tNum] || false);
            const currentTableCart = isCurrentTable ? cart : tableCarts[tNum];

            if (t.status === 'Occupied') {
                // Only sync/overwrite if the cart is not modified (no waiter changes in progress)
                if (!isModified) {
                    // Check if current total differs from what is in our cart
                    const cartTotal = Object.values(currentTableCart || {}).reduce((sum, item) => sum + (item.price * item.qty), 0) * 1.15;
                    const sessionTotal = t.current_session?.current_total || 0;
                    
                    if (Math.abs(cartTotal - sessionTotal) > 0.01 || Object.keys(currentTableCart || {}).length === 0) {
                        const syncedCart = generateSessionCart(t);
                        if (isCurrentTable) {
                            setCart(syncedCart);
                        } else {
                            setTableCarts(prev => ({ ...prev, [tNum]: syncedCart }));
                        }
                    }
                }
            } else {
                // Table is Available, Dirty, or Reserved - clear any active session items if not modified
                if (currentTableCart && Object.keys(currentTableCart).length > 0 && !isModified) {
                    if (isCurrentTable) {
                        setCart({});
                    } else {
                        setTableCarts(prev => ({ ...prev, [tNum]: {} }));
                    }
                }
            }
        });
    }, [tablesData]);

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
        setCartModified(true);
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
        setCartModified(true);
    };

    const removeItem = (id) => {
        setCart(prevCart => {
            const newCart = { ...prevCart };
            delete newCart[id];
            return newCart;
        });
        setCartModified(true);
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
        const taxPercentage = menuItem ? parseFloat(menuItem.tax_percentage || posSettings.taxRate) : posSettings.taxRate;
        const itemCost = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
        return sum + ((itemCost * item.qty) * taxPercentage / 100);
    }, 0);

    const serviceCharge = subtotal * (posSettings.serviceCharge / 100);
    const grandTotal = subtotal + tax + serviceCharge;

    // --- Place Order to Kitchen API Call ---
    const sendOrderToKitchen = async () => {
        if (Object.keys(cart).length === 0) {
            alert("Cart is empty!");
            return;
        }

        const mappedOrderType = orderType.charAt(0).toUpperCase() + orderType.slice(1).toLowerCase();
        const mappedTable = tableId.startsWith("#") ? tableId.replace("#", "T-") : (tableId.startsWith("Table ") ? tableId.replace("Table ", "T-") : tableId);

        const payloadItems = cartItems.map(item => {
            const parsedItemId = parseInt(item.item_id);
            const isNumericId = !isNaN(parsedItemId);
            
            return {
                item_id: isNumericId ? parsedItemId : item.item_id,
                name: item.name,
                quantity: item.qty,
                unit_price: item.price,
                total_price: item.price * item.qty,
                variant_id: item.selectedVariant ? (parseInt(item.selectedVariant.id) || item.selectedVariant.id) : null,
                addons: item.selectedVariant ? [
                    {
                        addon_id: parseInt(item.selectedVariant.id) || 1,
                        addon_name: item.selectedVariant.name,
                        addon_quantity: 1,
                        addon_unit_price: parseFloat(item.selectedVariant.price || 0),
                        addon_total_price: parseFloat(item.selectedVariant.price || 0)
                    }
                ] : [],
                notes: item.notes || null
            };
        });

        const orderPayload = {
            order_meta: {
                restaurant_id: 10001,
                staff_id: 100,
                order_type: orderType.toUpperCase().replace("-", "_"),
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
            status: "PENDING",
            created_at: new Date().toISOString()
        };

        console.log("Sending Order to Kitchen. Payload:", orderPayload);

        const generatedOrderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

        const markTableAsOccupiedInState = () => {
            setTablesData(prev => {
                const updatedSections = (prev.sections || []).map(sec => ({
                    ...sec,
                    tables: (sec.tables || []).map(t => t.table_number === tableId ? { 
                        ...t, 
                        status: 'Occupied', 
                        current_session: { 
                            active_order_id: generatedOrderId, 
                            staff_id: 100,
                            staff_name: user?.username || 'Ravi',
                            guest_count: t.capacity || 4,
                            updated_at: new Date().toISOString(),
                            total_items: cartItems.reduce((sum, item) => sum + item.qty, 0),
                            current_total: parseFloat(grandTotal.toFixed(2))
                        } 
                    } : t)
                }));
                const updatedTables = (prev.tables || []).map(t => t.table_number === tableId ? { 
                    ...t, 
                    status: 'Occupied', 
                    current_session: { 
                        active_order_id: generatedOrderId, 
                        staff_id: 100,
                        staff_name: user?.username || 'Ravi',
                        guest_count: t.capacity || 4,
                        updated_at: new Date().toISOString(),
                        total_items: cartItems.reduce((sum, item) => sum + item.qty, 0),
                        current_total: parseFloat(grandTotal.toFixed(2))
                    } 
                } : t);
                return { ...prev, sections: updatedSections, tables: updatedTables };
            });
        };

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
            
            markTableAsOccupiedInState();
            setCartModified(false);
            setTableCarts(prev => ({ ...prev, [tableId]: cart }));
            setTableModified(prev => ({ ...prev, [tableId]: false }));

            const newHistoryItem = {
                order_id: data.data?.order_id || data.order_id || generatedOrderId,
                table_number: mappedTable || "T-12",
                type: orderType.charAt(0).toUpperCase() + orderType.slice(1).toLowerCase(),
                total: parseFloat(grandTotal.toFixed(2)),
                time: new Date().toISOString(),
                status: 'PENDING'
            };
            setOrderHistory(prev => [newHistoryItem, ...prev]);

            alert(`Order sent to kitchen successfully!\nOrder ID: ${data.data?.order_id || data.order_id || generatedOrderId}\nStatus: ${data.data?.order_status || data.order_status || 'PENDING'}\nTotal: ₹${data.data?.grand_total || data.grand_total || grandTotal.toFixed(2)}`);
            setCurrentView('Tables');
        } catch (error) {
            console.warn("Live API save failed, simulating local success. Error:", error.message);
            
            markTableAsOccupiedInState();
            setCartModified(false);
            setTableCarts(prev => ({ ...prev, [tableId]: cart }));
            setTableModified(prev => ({ ...prev, [tableId]: false }));

            const newHistoryItem = {
                order_id: generatedOrderId,
                table_number: mappedTable || "T-12",
                type: orderType.charAt(0).toUpperCase() + orderType.slice(1).toLowerCase(),
                total: parseFloat(grandTotal.toFixed(2)),
                time: new Date().toISOString(),
                status: 'PENDING'
            };
            setOrderHistory(prev => [newHistoryItem, ...prev]);

            alert(`[Mock Success] Order sent to kitchen successfully!\nOrder ID: ${generatedOrderId}\nStatus: PENDING\nGrand Total: ₹${grandTotal.toFixed(2)}`);
            setCurrentView('Tables');
        }
    };

    // --- Process Payment and Checkout ---
    const checkoutAndPay = async () => {
        if (Object.keys(cart).length === 0) {
            alert("Cart is empty!");
            return;
        }

        // If there are unsaved modifications, prompt the waiter to send them to the kitchen first
        if (cartModified) {
            const confirmPay = window.confirm("You have unsaved changes in the cart. Do you want to place the order and process payment?");
            if (!confirmPay) return;
            await sendOrderToKitchen();
        }

        // Process checkout and mark table as Dirty
        setTablesData(prev => {
            const updatedSections = (prev.sections || []).map(sec => ({
                ...sec,
                tables: (sec.tables || []).map(t => t.table_number === tableId ? { 
                    ...t, 
                    status: 'Dirty', 
                    current_session: { 
                        last_order_id: activeTableInfo?.current_session?.active_order_id || `ORD-${Math.floor(10000 + Math.random() * 90000)}`, 
                        updated_at: new Date().toISOString() 
                    } 
                } : t)
            }));
            const updatedTables = (prev.tables || []).map(t => t.table_number === tableId ? { 
                ...t, 
                status: 'Dirty', 
                current_session: { 
                    last_order_id: activeTableInfo?.current_session?.active_order_id || `ORD-${Math.floor(10000 + Math.random() * 90000)}`, 
                    updated_at: new Date().toISOString() 
                } 
            } : t);
            return { ...prev, sections: updatedSections, tables: updatedTables };
        });

        alert(`Payment processed successfully for Table ${tableId}!\nTotal Amount Paid: ₹${grandTotal.toFixed(2)}\nStatus changed to Dirty (Needs cleaning).`);
        
        setOrderHistory(prev => prev.map(oh => oh.table_number === tableId && oh.status === 'PENDING' ? { ...oh, status: 'PAID' } : oh));

        setCart({});
        setCartModified(false);
        setTableCarts(prev => ({ ...prev, [tableId]: {} }));
        setTableModified(prev => ({ ...prev, [tableId]: false }));
        setCurrentView('Tables');
    };

    const getMinutesElapsed = (isoString) => {
        if (!isoString) return '0m';
        const diffMs = Date.now() - new Date(isoString).getTime();
        const mins = Math.max(0, Math.floor(diffMs / 60000));
        return `${mins}m`;
    };

    const payNow = (tNum) => {
        const tableInfo = tablesList.find(t => t.table_number === tNum);
        const activeOrd = tableInfo?.current_session?.active_order_id;
        
        setTablesData(prev => {
            const updatedSections = (prev.sections || []).map(sec => ({
                ...sec,
                tables: (sec.tables || []).map(t => t.table_number === tNum ? { ...t, status: 'Dirty', current_session: { last_order_id: activeOrd || `ORD-${Math.floor(10000 + Math.random() * 90000)}`, updated_at: new Date().toISOString() } } : t)
            }));
            const updatedTables = (prev.tables || []).map(t => t.table_number === tNum ? { ...t, status: 'Dirty', current_session: { last_order_id: activeOrd || `ORD-${Math.floor(10000 + Math.random() * 90000)}`, updated_at: new Date().toISOString() } } : t);
            return { ...prev, sections: updatedSections, tables: updatedTables };
        });

        if (activeOrd) {
            setOrderHistory(prev => prev.map(oh => oh.order_id === activeOrd ? { ...oh, status: 'PAID' } : oh));
        } else {
            setOrderHistory(prev => prev.map(oh => oh.table_number === tNum && oh.status === 'PENDING' ? { ...oh, status: 'PAID' } : oh));
        }

        setCart({});
        setCartModified(false);
        setTableCarts(prev => ({ ...prev, [tNum]: {} }));
        setTableModified(prev => ({ ...prev, [tNum]: false }));
        alert(`Payment processed for Table ${tNum}! Status changed to Dirty.`);
    };

    const handlePrintBillFromTable = (tNum) => {
        setTableId(tNum);
        setCurrentView('Order');
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleAddItems = (tNum) => {
        setTableId(tNum);
        setCurrentView('Order');
    };

    const handlePrintKOT = () => {
        if (cartItems.length === 0) {
            alert("Cart is empty! Cannot print KOT.");
            return;
        }
        window.print();
    };

    const printDirectToPrinter = async () => {
        if (cartItems.length === 0) {
            alert("Cart is empty! Cannot print.");
            return;
        }

        if (!navigator.serial) {
            alert("Web Serial is not supported in this browser. Please use Chrome/Edge or standard Browser Print.");
            return;
        }

        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            
            const writer = port.writable.getWriter();
            const encoder = new TextEncoder();
            
            // ESC/POS commands
            const escInit = "\x1b\x40";
            const escCenter = "\x1b\x61\x01";
            const escLeft = "\x1b\x61\x00";
            const escBoldOn = "\x1b\x45\x01";
            const escBoldOff = "\x1b\x45\x00";
            const escCut = "\x1d\x56\x41\x03"; // Cut paper command

            let receipt = escInit + escCenter + escBoldOn + `${posSettings.restaurantName}\n` + escBoldOff;
            receipt += `${posSettings.address}\n`;
            receipt += "--------------------------------\n";
            receipt += escLeft;
            receipt += `Table: ${tableId || 'N/A'}    Type: ${orderType}\n`;
            receipt += `Order: #1023        Date: ${new Date().toLocaleDateString()}\n`;
            receipt += "--------------------------------\n";
            
            cartItems.forEach(item => {
                const totalItemPrice = (item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0)) * item.qty;
                let namePart = `${item.name} x${item.qty}`;
                let pricePart = `Rs.${totalItemPrice.toFixed(0)}`;
                let spaces = 32 - namePart.length - pricePart.length;
                if (spaces < 1) spaces = 1;
                receipt += namePart + " ".repeat(spaces) + pricePart + "\n";
                if (item.selectedVariant) {
                    receipt += `  Option: ${item.selectedVariant.name}\n`;
                }
                if (item.notes) {
                    receipt += `  * ${item.notes}\n`;
                }
            });
            
            receipt += "--------------------------------\n";
            receipt += `Subtotal:           Rs.${subtotal.toFixed(0)}\n`;
            receipt += `Tax (${posSettings.taxRate}%):           Rs.${tax.toFixed(0)}\n`;
            receipt += `Service (${posSettings.serviceCharge}%):      Rs.${serviceCharge.toFixed(0)}\n`;
            receipt += escBoldOn + `GRAND TOTAL:        Rs.${grandTotal.toFixed(0)}\n` + escBoldOff;
            receipt += "--------------------------------\n";
            receipt += escCenter + "Thank You! Visit Again\n\n\n\n" + escCut;

            await writer.write(encoder.encode(receipt));
            writer.releaseLock();
            await port.close();
            alert("Direct print command sent successfully!");
        } catch (error) {
            console.error("Direct printing failed:", error);
            alert("Direct printing failed: " + error.message);
        }
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


    const renderMenuView = () => {
        const handleAddNewItem = (e) => {
            e.preventDefault();
            if (!newItemData.item_name || !newItemData.price || !newItemData.category_id) {
                alert("Please fill all required fields!");
                return;
            }
            const item_id = String(menuItems.length + 100);
            const newItem = {
                item_id,
                category_id: newItemData.category_id,
                item_name: newItemData.item_name,
                price: parseFloat(newItemData.price).toFixed(2),
                tax_percentage: String(posSettings.taxRate),
                dietary_info: newItemData.dietary_info,
                variants: [],
                addons: []
            };

            setMenuData(prev => {
                const categoriesCopy = prev.categories.map(cat => {
                    if (cat.category_id === newItem.category_id) {
                        return {
                            ...cat,
                            items: [...(cat.items || []), newItem]
                        };
                    }
                    return cat;
                });
                return { ...prev, categories: categoriesCopy };
            });

            setNewItemData({
                item_name: '',
                price: '',
                dietary_info: 'Veg',
                category_id: ''
            });
            setShowAddItemForm(false);
            alert("Menu item added successfully!");
        };

        const deleteMenuItem = (itemId, catId) => {
            if (!window.confirm("Are you sure you want to delete this menu item?")) return;
            setMenuData(prev => {
                const categoriesCopy = prev.categories.map(cat => {
                    if (cat.category_id === catId) {
                        return {
                            ...cat,
                            items: (cat.items || []).filter(item => item.item_id !== itemId)
                        };
                    }
                    return cat;
                });
                return { ...prev, categories: categoriesCopy };
            });
        };

        return (
            <div className="container-fluid py-4 bg-slate-50" style={{ flex: 1, minHeight: 'calc(100vh - 112px)', overflowY: 'auto' }}>
                <div className="row g-4">
                    <div className="col-md-3">
                        <div className="card shadow-sm border-0 rounded-3 bg-white">
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-3">Menu Categories</h6>
                                <div className="list-group list-group-flush mb-4">
                                    {categories.map((cat) => (
                                        <div key={cat.category_id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center bg-transparent">
                                            <span className="fw-medium text-slate-800">{cat.category_name}</span>
                                            <span className="badge bg-secondary rounded-pill text-white">{cat.items?.length || 0} items</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-top pt-3">
                                    <label className="form-label text-muted small fw-bold text-uppercase">Add Category</label>
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Category Name" 
                                            value={newCatName}
                                            onChange={(e) => setNewCatName(e.target.value)}
                                        />
                                        <button className="btn btn-dark" onClick={handleAddCategory}>Add</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-9">
                        <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <div>
                                        <h5 className="fw-bold text-slate-900 mb-1">Menu Directory</h5>
                                        <p className="text-muted small mb-0">Manage items, pricing, and configurations</p>
                                    </div>
                                    <button 
                                        className="btn btn-primary text-white fw-bold"
                                        onClick={() => {
                                            setShowAddItemForm(!showAddItemForm);
                                            if (!newItemData.category_id && categories.length > 0) {
                                                setNewItemData(prev => ({ ...prev, category_id: categories[0].category_id }));
                                            }
                                        }}
                                    >
                                        {showAddItemForm ? "✕ Close Form" : "+ Add Menu Item"}
                                    </button>
                                </div>

                                {showAddItemForm && (
                                    <form onSubmit={handleAddNewItem} className="bg-light p-4 rounded-3 border mb-4">
                                        <h6 className="fw-bold mb-3 text-dark">Add New Menu Item</h6>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label small fw-bold">Item Name</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    placeholder="E.g., Chicken Tikka" 
                                                    required
                                                    value={newItemData.item_name}
                                                    onChange={(e) => setNewItemData(prev => ({ ...prev, item_name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label small fw-bold">Category</label>
                                                <select 
                                                    className="form-select"
                                                    value={newItemData.category_id}
                                                    onChange={(e) => setNewItemData(prev => ({ ...prev, category_id: e.target.value }))}
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label small fw-bold">Price (₹)</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01" 
                                                    className="form-control" 
                                                    placeholder="299.00" 
                                                    required
                                                    value={newItemData.price}
                                                    onChange={(e) => setNewItemData(prev => ({ ...prev, price: e.target.value }))}
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label small fw-bold">Dietary Info</label>
                                                <select 
                                                    className="form-select"
                                                    value={newItemData.dietary_info}
                                                    onChange={(e) => setNewItemData(prev => ({ ...prev, dietary_info: e.target.value }))}
                                                >
                                                    <option value="Veg">Veg (Green)</option>
                                                    <option value="Non-Veg">Non-Veg (Red)</option>
                                                    <option value="Vegan">Vegan (Leaf)</option>
                                                </select>
                                            </div>
                                            <div className="col-12 d-flex gap-2 justify-content-end mt-4">
                                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddItemForm(false)}>Cancel</button>
                                                <button type="submit" className="btn btn-success btn-sm px-4 text-white">Add to Menu</button>
                                            </div>
                                        </div>
                                    </form>
                                )}

                                <div className="row g-4">
                                    {menuItems.map((item) => {
                                        const catName = categories.find(c => c.category_id === item.category_id)?.category_name || 'Unassigned';
                                        return (
                                            <div className="col-md-4 col-lg-3" key={item.item_id}>
                                                <div className="menu-card d-flex flex-column align-items-start justify-content-between p-3 position-relative" style={{ minHeight: '135px' }}>
                                                    <div className="w-full d-flex justify-content-between align-items-start mb-2" style={{ width: '100%' }}>
                                                        <h6 className="m-0 text-slate-800 text-sm font-bold text-truncate" style={{ maxWidth: '75%' }}>{item.item_name}</h6>
                                                        <span className={`badge ${item.dietary_info === 'Veg' ? 'bg-success-subtle text-success border border-success/20' : 'bg-danger-subtle text-danger border border-danger/20'} font-normal text-[10px] py-1`}>
                                                            {item.dietary_info}
                                                        </span>
                                                    </div>
                                                    <div className="w-full text-slate-500 text-xs mb-2">{catName}</div>
                                                    <div className="w-full d-flex justify-content-between align-items-center mt-auto" style={{ width: '100%' }}>
                                                        <strong className="text-amber-500 font-bold">₹{parseFloat(item.price).toFixed(2)}</strong>
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger py-0.5 px-2 text-[10px] fw-bold"
                                                            onClick={() => deleteMenuItem(item.item_id, item.category_id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {menuItems.length === 0 && (
                                        <div className="col-12 text-center py-5">
                                            <div className="fs-1 opacity-20">🍽️</div>
                                            <p className="text-muted mt-2">No menu items found. Add some above!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStaffView = () => {
        const handleAddStaff = (e) => {
            e.preventDefault();
            if (!newStaffData.name) return;
            const newStaff = {
                id: staffList.length + 101,
                name: newStaffData.name,
                role: newStaffData.role,
                status: newStaffData.status,
                ordersHandled: 0
            };
            setStaffList(prev => [...prev, newStaff]);
            setNewStaffData({ name: '', role: 'Waiter', status: 'Active' });
            setShowAddStaffForm(false);
            alert("Staff member registered successfully!");
        };

        const toggleStaffStatus = (id) => {
            setStaffList(prev => prev.map(s => {
                if (s.id === id) {
                    const nextStatus = s.status === 'Active' ? 'On Break' : (s.status === 'On Break' ? 'Off Duty' : 'Active');
                    return { ...s, status: nextStatus };
                }
                return s;
            }));
        };

        const removeStaff = (id) => {
            if (!window.confirm("Remove this team member?")) return;
            setStaffList(prev => prev.filter(s => s.id !== id));
        };

        return (
            <div className="container-fluid py-4 bg-slate-50" style={{ flex: 1, minHeight: 'calc(100vh - 112px)', overflowY: 'auto' }}>
                <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white">
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="fw-bold text-slate-900 mb-1">Staff Directory</h5>
                                <p className="text-muted small mb-0">Manage floor servers, kitchen chefs, and terminal operators</p>
                            </div>
                            <button 
                                className="btn btn-primary text-white fw-bold"
                                onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                            >
                                {showAddStaffForm ? "✕ Close Form" : "+ Register Staff"}
                            </button>
                        </div>

                        {showAddStaffForm && (
                            <form onSubmit={handleAddStaff} className="bg-light p-4 rounded-3 border mb-4">
                                <h6 className="fw-bold mb-3">Register New Staff Member</h6>
                                <div className="row g-3">
                                    <div className="col-md-5">
                                        <label className="form-label small fw-bold">Full Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="E.g., Amit Patel" 
                                            required
                                            value={newStaffData.name}
                                            onChange={(e) => setNewStaffData(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-bold">Role</label>
                                        <select 
                                            className="form-select"
                                            value={newStaffData.role}
                                            onChange={(e) => setNewStaffData(prev => ({ ...prev, role: e.target.value }))}
                                        >
                                            <option value="Waiter">Waiter / Server</option>
                                            <option value="Chef">Kitchen Chef</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Cashier">Cashier</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold">Initial Status</label>
                                        <select 
                                            className="form-select"
                                            value={newStaffData.status}
                                            onChange={(e) => setNewStaffData(prev => ({ ...prev, status: e.target.value }))}
                                        >
                                            <option value="Active">Active / On Duty</option>
                                            <option value="On Break">On Break</option>
                                            <option value="Off Duty">Off Duty</option>
                                        </select>
                                    </div>
                                    <div className="col-12 d-flex gap-2 justify-content-end mt-3">
                                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddStaffForm(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-success btn-sm px-4 text-white">Register Member</button>
                                    </div>
                                </div>
                            </form>
                        )}

                        <div className="row g-4">
                            {staffList.map((staff) => {
                                return (
                                    <div className="col-md-4 col-lg-3" key={staff.id}>
                                        <div className={`table-card-pos ${staff.status === 'Active' ? 'available' : (staff.status === 'On Break' ? 'occupied' : 'dirty')}`} style={{ minHeight: '210px' }}>
                                            <div className="card-header-pos" style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                                                {staff.status === 'Active' ? 'On Duty' : staff.status}
                                            </div>
                                            <div className="card-body-pos p-3 d-flex flex-column justify-content-between">
                                                <div>
                                                    <div className="table-title-pos mb-1" style={{ fontSize: '1.1rem' }}>{staff.name}</div>
                                                    <div className="text-muted small mb-2 fw-medium">{staff.role}</div>
                                                    <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />
                                                    <div className="text-secondary small mb-3">
                                                        Orders Handled: <strong className="text-dark">{staff.ordersHandled}</strong>
                                                    </div>
                                                </div>
                                                <div className="card-actions-pos" style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                    <button 
                                                        className="btn-action-pos btn-blue"
                                                        style={{ flex: 1.2, padding: '8px 4px', fontSize: '0.75rem', backgroundColor: '#2196f3', color: 'white' }}
                                                        onClick={() => toggleStaffStatus(staff.id)}
                                                    >
                                                        Shift Toggle
                                                    </button>
                                                    <button 
                                                        className="btn-action-pos btn-dark"
                                                        style={{ flex: 0.8, padding: '8px 4px', fontSize: '0.75rem', backgroundColor: '#ef4444', color: 'white' }}
                                                        onClick={() => removeStaff(staff.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSettingsView = () => {
        const handleSaveSettings = (e) => {
            e.preventDefault();
            alert("Settings saved successfully!");
        };

        return (
            <div className="container py-4 bg-slate-50" style={{ flex: 1, minHeight: 'calc(100vh - 112px)' }}>
                <div className="card shadow-sm border-0 rounded-3 mx-auto bg-white" style={{ maxWidth: '600px' }}>
                    <div className="card-body p-4">
                        <h5 className="fw-bold text-slate-900 mb-2">⚙️ POS Settings</h5>
                        <p className="text-muted small mb-4">Configure calculations, printer defaults, and branding info</p>

                        <form onSubmit={handleSaveSettings} className="space-y-4">
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Restaurant Name</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    required 
                                    value={posSettings.restaurantName}
                                    onChange={(e) => setPosSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Restaurant Address</label>
                                <textarea 
                                    className="form-control" 
                                    rows="2" 
                                    required 
                                    value={posSettings.address}
                                    onChange={(e) => setPosSettings(prev => ({ ...prev, address: e.target.value }))}
                                ></textarea>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label small fw-bold">Tax Rate (%)</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        className="form-control" 
                                        required 
                                        value={posSettings.taxRate}
                                        onChange={(e) => setPosSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label small fw-bold">Service Charge (%)</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        className="form-control" 
                                        required 
                                        value={posSettings.serviceCharge}
                                        onChange={(e) => setPosSettings(prev => ({ ...prev, serviceCharge: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>
                            
                            <hr className="my-4" />
                            <h6 className="fw-bold mb-3 text-slate-800">Hardware & Printers</h6>
                            <div className="mb-3 form-check form-switch">
                                <input className="form-check-input" type="checkbox" id="serialPrinterCheck" defaultChecked />
                                <label className="form-check-label text-slate-700" htmlFor="serialPrinterCheck">Enable Web Serial Direct Thermal Printing</label>
                            </div>
                            <div className="mb-4 form-check form-switch">
                                <input className="form-check-input" type="checkbox" id="autoCleanCheck" />
                                <label className="form-check-label text-slate-700" htmlFor="autoCleanCheck">Automatically clean tables when marked Dirty</label>
                            </div>

                            <button type="submit" className="btn btn-dark w-100 py-2.5 fw-bold">Save Configuration</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const renderHistoryView = () => {
        const filteredHistory = orderHistory.filter(order => {
            const matchesSearch = order.order_id.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                                 String(order.table_number).toLowerCase().includes(historySearchQuery.toLowerCase());
            const matchesType = historyTypeFilter === 'All' || 
                                order.type.toUpperCase() === historyTypeFilter.toUpperCase();
            const matchesStatus = historyStatusFilter === 'All' || 
                                  order.status.toUpperCase() === historyStatusFilter.toUpperCase();
            return matchesSearch && matchesType && matchesStatus;
        });

        return (
            <div className="container py-4 bg-slate-50" style={{ flex: 1, minHeight: 'calc(100vh - 112px)' }}>
                <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white">
                    <div className="card-body p-4">
                        <h5 className="fw-bold text-slate-900 mb-1">⏳ Order History</h5>
                        <p className="text-muted small mb-4">Search and view details of placed and paid orders</p>

                        <div className="row g-3 mb-4">
                            <div className="col-md-5">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Search by Order ID or Table..." 
                                    value={historySearchQuery}
                                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3">
                                <select 
                                    className="form-select"
                                    value={historyTypeFilter}
                                    onChange={(e) => setHistoryTypeFilter(e.target.value)}
                                >
                                    <option value="All">All Types</option>
                                    <option value="Dine-In">Dine-In</option>
                                    <option value="Takeaway">Takeaway</option>
                                    <option value="Delivery">Delivery</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <select 
                                    className="form-select"
                                    value={historyStatusFilter}
                                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="PAID">PAID</option>
                                    <option value="PENDING">PENDING</option>
                                </select>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light text-secondary">
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Table / Ref</th>
                                        <th>Type</th>
                                        <th>Date/Time</th>
                                        <th>Grand Total</th>
                                        <th>Status</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((order) => {
                                        const isPaid = order.status === 'PAID';
                                        return (
                                            <tr key={order.order_id}>
                                                <td>
                                                    <span className="fw-bold text-slate-900">{order.order_id}</span>
                                                </td>
                                                <td>Table {order.table_number}</td>
                                                <td>{order.type}</td>
                                                <td className="small text-muted">{new Date(order.time).toLocaleString()}</td>
                                                <td className="fw-bold text-slate-800">₹{parseFloat(order.total).toFixed(2)}</td>
                                                <td>
                                                    <span className={`badge ${isPaid ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <button 
                                                        className="btn btn-sm btn-outline-dark me-2"
                                                        onClick={() => setSelectedHistoryOrder(order)}
                                                    >
                                                        Details
                                                    </button>
                                                    {!isPaid && (
                                                        <button 
                                                            className="btn btn-sm btn-success text-white"
                                                            onClick={() => {
                                                                setOrderHistory(prev => prev.map(o => o.order_id === order.order_id ? { ...o, status: 'PAID' } : o));
                                                                alert(`Order ${order.order_id} marked as PAID.`);
                                                            }}
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4 text-muted">No orders found matching the filter.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {selectedHistoryOrder && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
                        <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-4" style={{ color: '#000' }}>
                            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                                <h6 className="fw-bold mb-0">Receipt: {selectedHistoryOrder.order_id}</h6>
                                <button className="btn-close" onClick={() => setSelectedHistoryOrder(null)}></button>
                            </div>
                            
                            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                <h5 style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{posSettings.restaurantName}</h5>
                                <p style={{ margin: '0', fontSize: '11px', color: '#555' }}>{posSettings.address}</p>
                                <h6 style={{ margin: '10px 0 5px 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', fontWeight: 'bold' }}>
                                    PAST ORDER RECEIPT
                                </h6>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
                                <span><strong>Table:</strong> {selectedHistoryOrder.table_number || 'N/A'}</span>
                                <span><strong>Type:</strong> {selectedHistoryOrder.type}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '15px' }}>
                                <span><strong>Status:</strong> {selectedHistoryOrder.status}</span>
                                <span><strong>Date:</strong> {new Date(selectedHistoryOrder.time).toLocaleString()}</span>
                            </div>

                            <div className="border-top border-bottom py-3 my-2 shadow-inner bg-light p-2 rounded" style={{ borderStyle: 'dashed' }}>
                                <div className="d-flex justify-content-between fw-bold mb-2" style={{ fontSize: '11px' }}>
                                    <span>SUMMARY OF ORDER</span>
                                    <span>₹{selectedHistoryOrder.total.toFixed(2)}</span>
                                </div>
                                <p className="text-muted small mb-0" style={{ fontSize: '10px' }}>
                                    This order has been archived. Subtotal, tax, and service charges were included in the total.
                                </p>
                            </div>

                            <div className="d-flex gap-2 justify-content-end mt-4">
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedHistoryOrder(null)}>Close</button>
                                <button 
                                    className="btn btn-sm btn-dark text-white" 
                                    onClick={() => {
                                        window.print();
                                    }}
                                >
                                    Print Receipt
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
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
        setTableCarts(prev => ({ ...prev, [tNum]: {} }));
        setTableModified(prev => ({ ...prev, [tNum]: false }));
        setTableId(tNum);
        setCart({});
        setCartModified(false);
        setCurrentView('Order');
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

            {currentView === 'Tables' && (
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
                                                <div className="card-actions-pos" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                        <button className="btn-action-pos btn-blue" style={{ flex: 1, padding: '10px 4px', fontSize: '0.8rem' }} onClick={() => handleAddItems(table.table_number)}>Add Items</button>
                                                        <button className="btn-action-pos btn-dark" style={{ flex: 1, padding: '10px 4px', fontSize: '0.8rem', backgroundColor: '#475569', color: 'white' }} onClick={() => handlePrintBillFromTable(table.table_number)}>Print Bill</button>
                                                    </div>
                                                    <button className="btn-action-pos btn-green" style={{ width: '100%', padding: '10px 4px', fontSize: '0.85rem' }} onClick={() => payNow(table.table_number)}>Pay Now</button>
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
            )}

            {currentView === 'Order' && (
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
                                <div className="bill-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                                    <button className="btn btn-outline-secondary" onClick={() => { setCart({}); setCartModified(false); setTableModified(prev => ({ ...prev, [tableId]: false })); }}>Cancel</button>
                                    <button className="btn btn-dark" onClick={handlePrintKOT}>Browser Print</button>
                                    <button className="btn !bg-blue-600 !hover:bg-blue-700 !text-white font-bold border-0 transition-colors" onClick={printDirectToPrinter}>Direct Print</button>
                                    {cartItems.length > 0 && (
                                        <button className="btn btn-order-premium text-white font-bold" onClick={sendOrderToKitchen}>Place Order</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            )}

            {currentView === 'Menu' && renderMenuView()}
            {currentView === 'Staff' && renderStaffView()}
            {currentView === 'Settings' && renderSettingsView()}
            {currentView === 'History' && renderHistoryView()}

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
            {/* hidden printable receipt container */}
            <div id="print-receipt-kot">
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h5 style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{posSettings.restaurantName}</h5>
                    <p style={{ margin: '0', fontSize: '11px', color: '#555' }}>{posSettings.address}</p>
                    <h6 style={{ margin: '10px 0 5px 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', fontWeight: 'bold' }}>
                        KOT / BILL RECEIPT
                    </h6>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
                    <span><strong>Table:</strong> {tableId || 'N/A'}</span>
                    <span><strong>Type:</strong> {orderType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
                    <span><strong>Order:</strong> #1023</span>
                    <span><strong>Date:</strong> {new Date().toLocaleString()}</span>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '10px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #000' }}>
                            <th style={{ textAlign: 'left', paddingBottom: '5px' }}>ITEM</th>
                            <th style={{ textAlign: 'center', paddingBottom: '5px', width: '40px' }}>QTY</th>
                            <th style={{ textAlign: 'right', paddingBottom: '5px', width: '70px' }}>AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cartItems.map((item) => {
                            const totalItemPrice = (item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0)) * item.qty;
                            return (
                                <React.Fragment key={item.id}>
                                    <tr style={{ verticalAlign: 'top' }}>
                                        <td style={{ paddingTop: '5px' }}>
                                            {item.name}
                                            {item.selectedVariant && (
                                                <div style={{ fontSize: '10px', color: '#666', marginLeft: '5px' }}>
                                                    Option: {item.selectedVariant.name}
                                                </div>
                                            )}
                                            {item.notes && (
                                                <div style={{ fontSize: '10px', color: '#666', marginLeft: '5px', fontStyle: 'italic' }}>
                                                    * {item.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center', paddingTop: '5px' }}>{item.qty}</td>
                                        <td style={{ textAlign: 'right', paddingTop: '5px' }}>₹{totalItemPrice.toFixed(2)}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
                
                <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Tax ({posSettings.taxRate}%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Service Charge ({posSettings.serviceCharge}%)</span>
                        <span>₹{serviceCharge.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold', fontSize: '13px', marginTop: '5px' }}>
                        <span>GRAND TOTAL</span>
                        <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px dashed #000', paddingTop: '10px', fontSize: '11px' }}>
                    <p style={{ margin: '0' }}>Thank You! Visit Again</p>
                </div>
            </div>
        </div>
    );
};

export default POS;