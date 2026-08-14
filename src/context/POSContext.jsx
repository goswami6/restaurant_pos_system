/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';

export const POSContext = createContext(null);

export const usePOS = () => {
    const ctx = useContext(POSContext);
    if (!ctx) throw new Error('usePOS must be used inside POSProvider');
    return ctx;
};



export const POSProvider = ({ user, onLogout, children }) => {
    const navigate = useNavigate();

    // ── Data State ──────────────────────────────────────────────────────────
    const [menuData, setMenuData] = useState({ categories: [] });
    const [loading, setLoading] = useState(true);
    const [tablesData, setTablesData] = useState({ total_tables: 0, sections: [], tables: [] });
    const [orderHistory, setOrderHistory] = useState([]);
    const [paidOrderIds, setPaidOrderIds] = useState(() => {
        const saved = localStorage.getItem('pos_paid_order_ids');
        return saved ? JSON.parse(saved) : [];
    });
    const [posSettings, setPosSettings] = useState({
        restaurantName: 'Big Ben Restaurant',
        address: '1st Flr, Sun Mill Compound, Lower Parel',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400013',
        gstin: '27AAAAA0000A1Z5',
        fssaiNo: '10019022009876',
        taxRate: 5.00,
        cgst: 2.50,
        sgst: 2.50,
        serviceCharge: 10.00,
        enableThermalPrinting: true,
        autoCleanTables: false,
        isRestaurantServesLiquor: false,
        stateVatTaxRate: 0.00,
        isEnableTables: false
    });
    const [staffList, setStaffList] = useState([
        { id: 100, name: 'Alex M.', role: 'Waiter', status: 'Active', ordersHandled: 12 },
        { id: 101, name: 'Ravi S.', role: 'Manager', status: 'Active', ordersHandled: 4 },
        { id: 102, name: 'Priya K.', role: 'Chef', status: 'Active', ordersHandled: 25 },
        { id: 103, name: 'Amit P.', role: 'Waiter', status: 'On Break', ordersHandled: 8 },
        { id: 104, name: 'Neha R.', role: 'Cashier', status: 'Active', ordersHandled: 0 }
    ]);

    // ── Cart & UI State ──────────────────────────────────────────────────────
    const [cart, setCart] = useState({});
    const [cartModified, setCartModified] = useState(false);
    const [tableModified, setTableModified] = useState({});
    const [tableId, setTableId] = useState('');
    const [tableCarts, setTableCarts] = useState({});
    const [orderType, setOrderType] = useState('DINE-IN');
    const [selectedDetailOrder, setSelectedDetailOrder] = useState(null);

    // ── Reservation Modal State ──────────────────────────────────────────────
    const [showReservationModal, setShowReservationModal] = useState(false);
    const [resCustomerName, setResCustomerName] = useState('');
    const [resCustomerPhone, setResCustomerPhone] = useState('');
    const [resSelectedTableNum, setResSelectedTableNum] = useState('');
    const [resGuestCount, setResGuestCount] = useState(4);
    const [resTime, setResTime] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        const tzOffset = now.getTimezoneOffset() * 60000;
        return (new Date(now - tzOffset)).toISOString().slice(0, 16);
    });

    // ── Variant Modal State ──────────────────────────────────────────────────
    const [selectedItemForModal, setSelectedItemForModal] = useState(null);
    const [chosenVariant, setChosenVariant] = useState(null);

    // ── Toast (react-hot-toast, minimal clean text) ───────────────────────────
    const showToast = (arg1, arg2 = 'success', arg3 = '') => {
        let type = 'success';
        let message = '';

        if (arg1 === 'success' || arg1 === 'error' || arg1 === 'info') {
            type = arg1;
            message = arg3 || arg2 || 'Updated successfully';
        } else {
            message = arg1 || 'Updated successfully';
            type = (arg2 === 'error' || arg2 === 'info') ? arg2 : 'success';
        }

        const cleanMsg = String(message)
            .replace(/^Order Updated:\s*/i, '')
            .replace(/Order ID:\s*\w+[\s\S]*/i, 'Order sent to kitchen successfully')
            .trim();

        if (type === 'error') {
            toast.error(cleanMsg || 'An error occurred');
        } else if (type === 'info') {
            toast(cleanMsg || 'Info', { icon: 'ℹ️' });
        } else {
            toast.success(cleanMsg || 'Updated successfully');
        }
    };

    // ── Derived: categories & menu items ────────────────────────────────────
    const categories = menuData.categories || [];
    const menuItems = useMemo(() => categories.reduce((acc, cat) => [...acc, ...(cat.items || [])], []), [categories]);

    // ── mergeLocalStatus ────────────────────────────────────────────────────
    const mergeLocalStatus = (nextData, prev, currentOrders = orderHistory) => {
        // Map active table orders (excluding paid/completed/cancelled)
        const activeTableOrders = new Map();
        (currentOrders || []).forEach(ord => {
            const st = (ord.status || '').toUpperCase();
            const oidStr = String(ord.order_id || ord.id || '');
            const isPaid = (paidOrderIds || []).includes(oidStr) || st === 'PAID' || st === 'COMPLETED' || st === 'CANCELLED';
            if (!isPaid && (st === 'PREPARING' || st === 'PENDING' || st === 'READY' || st === 'CONFIRMED' || st === 'IN_PROGRESS')) {
                const rawTN = String(ord.table_number || '').trim();
                if (rawTN && rawTN.toUpperCase() !== 'N/A') {
                    activeTableOrders.set(rawTN.toLowerCase(), ord);
                    const numOnly = rawTN.replace(/[^0-9]/g, '');
                    if (numOnly) {
                        activeTableOrders.set(numOnly, ord);
                        activeTableOrders.set(`table #${numOnly}`, ord);
                        activeTableOrders.set(`table ${numOnly}`, ord);
                    }
                }
            }
        });

        const mergeTablesList = (list) => (list || []).map(t => {
            const tName = String(t.table_number || t.table_name || t.table_id || '').trim();
            const tNumOnly = tName.replace(/[^0-9]/g, '');
            const activeOrd = activeTableOrders.get(tName.toLowerCase()) || (tNumOnly ? activeTableOrders.get(tNumOnly) : null);

            const statusRaw = (t.status || 'Available').toUpperCase();
            const isOccupied = statusRaw !== 'AVAILABLE' && (statusRaw === 'OCCUPIED' || !!activeOrd);

            if (isOccupied) {
                return {
                    ...t,
                    status: 'Occupied',
                    current_session: t.current_session || (activeOrd ? {
                        active_order_id: activeOrd.order_id,
                        total_amount: activeOrd.total,
                        items_count: activeOrd.items?.length || 0,
                        order_type: activeOrd.type,
                        created_at: activeOrd.created_at || activeOrd.time,
                    } : null)
                };
            }

            const prevTable = (() => {
                if (prev?.tables) {
                    const found = prev.tables.find(pt => pt.table_number === t.table_number);
                    if (found) return found;
                }
                if (prev?.sections) {
                    for (const sec of prev.sections) {
                        const found = (sec.tables || []).find(pt => pt.table_number === t.table_number);
                        if (found) return found;
                    }
                }
                return null;
            })();

            if (prevTable && prevTable.status === 'Dirty') {
                return { ...t, status: 'Dirty', current_session: prevTable.current_session };
            }

            return {
                ...t,
                status: t.status || 'Available'
            };
        });

        let merged = { ...nextData };
        if (merged.tables?.length > 0) {
            merged.tables = mergeTablesList(merged.tables);
        } else if (merged.sections?.length > 0) {
            merged.sections = merged.sections.map(sec => ({ ...sec, tables: mergeTablesList(sec.tables) }));
        }
        return merged;
    };

    // ── fetchTables ──────────────────────────────────────────────────────────
    const fetchTables = async () => {
        const restaurantId = user?.restaurant_id || user?.restaurent_id || 9;

        const mapTableItem = (t) => {
            if (!t) return t;
            const statusRaw = (t.status || 'Available').toUpperCase();
            const statusMap = { 'AVAILABLE': 'Available', 'OCCUPIED': 'Occupied', 'DIRTY': 'Dirty', 'RESERVED': 'Reserved' };
            const statusFormatted = statusMap[statusRaw] || (statusRaw.charAt(0) + statusRaw.slice(1).toLowerCase());
            const tableId = t.table_id || t.id || String(Math.floor(1000 + Math.random() * 9000));
            const tableName = t.table_name || t.table_number || `Table #${tableId}`;
            return {
                table_id: tableId,
                table_name: tableName,
                table_number: tableName,   // keep same for lookup compatibility
                capacity: parseInt(t.capacity) || 4,
                status: statusFormatted,
                current_session: t.current_session || null,
                updated_at: t.updated_at || new Date().toISOString()
            };
        };

        try {
            const response = await fetch(`${API_BASE_URL}/tables/${restaurantId}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data?.status === true && Array.isArray(data.data)) {
                const hasSections = data.data.length > 0 && data.data[0].tables;
                let parsedData;
                if (hasSections) {
                    const mappedSections = data.data.map(sec => ({ ...sec, tables: (sec.tables || []).map(mapTableItem) }));
                    parsedData = { total_tables: mappedSections.reduce((s, sec) => s + (sec.tables || []).length, 0), sections: mappedSections, tables: [] };
                } else {
                    const mappedTables = data.data.map(mapTableItem);
                    parsedData = { total_tables: mappedTables.length, sections: [], tables: mappedTables };
                }
                setTablesData(prev => mergeLocalStatus(parsedData, prev));
            } else {
                throw new Error(data?.message || 'Invalid tables response');
            }
        } catch (error) {
            console.warn('API tables fetch failed:', error.message);
        }
    };

    // ── fetchOrders ──────────────────────────────────────────────────────────
    const prevOrderIdsRef = useRef(new Set());

    const fetchOrders = async () => {
        const restaurantId = user?.restaurant_id || user?.restaurent_id || 9;
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${restaurantId}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data?.status === true && Array.isArray(data.data)) {
                const mappedOrders = data.data.map(apiOrder => {
                    let typeFormatted = 'Dine-In';
                    if (apiOrder.order_type === 'TAKEAWAY') typeFormatted = 'Takeaway';
                    if (apiOrder.order_type === 'DELIVERY') typeFormatted = 'Delivery';

                    // Keep full table name to match tablesList.table_number (e.g. 'Table #1')
                    const tableNum = apiOrder.table_name || apiOrder.table_number_id || 'N/A';

                    const statusFormatted = (apiOrder.order_status || '').toUpperCase();

                    const orderTime = apiOrder.created_at || apiOrder.order_date || apiOrder.created_date || apiOrder.updated_at || apiOrder.timestamp || apiOrder.date;

                    const itemsMapped = (apiOrder.items || []).map(item => ({
                        id: item.menu_item_id ? String(item.menu_item_id) : String(item.id),
                        item_id: item.menu_item_id ? String(item.menu_item_id) : String(item.id),
                        name: item.name || item.item_name || 'Item',
                        price: parseFloat(item.unit_price || item.price || item.total_price || 0),
                        qty: parseInt(item.quantity || item.qty || 1),
                        selectedVariant: item.variant_name ? { id: item.variant_name, name: item.variant_name, price: 0 } : null,
                        notes: item.notes || ''
                    }));

                    const itemsSum = itemsMapped.reduce((s, i) => s + (i.price * i.qty), 0);
                    const calculatedTotal = parseFloat(
                        apiOrder.bill?.grand_total ?? 
                        apiOrder.grand_total ?? 
                        apiOrder.total_amount ?? 
                        apiOrder.total ?? 
                        (itemsSum > 0 ? itemsSum : 0)
                    );

                    return {
                        order_id: String(apiOrder.order_id),
                        table_number: tableNum,
                        table_number_id: apiOrder.table_number_id ? parseInt(apiOrder.table_number_id) : null,
                        type: typeFormatted,
                        time: orderTime,
                        created_at: orderTime,
                        updated_at: orderTime,
                        total: calculatedTotal,
                        status: statusFormatted,
                        subtotal: parseFloat(apiOrder.bill?.subtotal || calculatedTotal),
                        tax: parseFloat(apiOrder.bill?.tax_amount || 0),
                        serviceCharge: parseFloat(apiOrder.bill?.service_charge || 0),
                        items: itemsMapped
                    };
                });

                // Detect newly placed orders and trigger live Toast popup alert
                if (prevOrderIdsRef.current.size > 0) {
                    mappedOrders.forEach(ord => {
                        if (!prevOrderIdsRef.current.has(ord.order_id)) {
                            showToast('success', `🔔 New Order #${ord.order_id}!`, `${(posSettings?.isEnableTables && ord.table_number && ord.table_number !== 'N/A') ? `Placed for ${ord.table_number} • ` : ''}Total ₹${ord.total.toFixed(2)}`);
                        }
                    });
                }
                prevOrderIdsRef.current = new Set(mappedOrders.map(o => o.order_id));

                mappedOrders.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
                setOrderHistory(mappedOrders);
                setTablesData(prev => mergeLocalStatus(prev, prev, mappedOrders));
            }
        } catch (error) {
            console.warn('API orders fetch failed:', error.message);
        }
    };

    // ── Initial Fetches & Polling ────────────────────────────────────────────
    useEffect(() => {
        const fetchMenus = async () => {
            const restaurantId = user?.restaurant_id || user?.restaurent_id || 9;
            const cachedMenuStr = sessionStorage.getItem(`emenu_cached_pos_menu_${restaurantId}`);
            if (cachedMenuStr) {
                try {
                    const parsed = JSON.parse(cachedMenuStr);
                    setMenuData(parsed);
                    setLoading(false);
                    return;
                } catch (e) {
                    // cache invalid
                }
            }

            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/menus/${restaurantId}`);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const data = await response.json();
                setMenuData(data);
                sessionStorage.setItem(`emenu_cached_pos_menu_${restaurantId}`, JSON.stringify(data));
            } catch (error) {
                console.warn('API menu fetch failed:', error.message);
                setMenuData({ categories: [] });
            } finally {
                setLoading(false);
            }
        };
        fetchMenus();
    }, [user?.restaurant_id, user?.restaurent_id]);

    const fetchSettings = async () => {
        const restaurantId = user?.restaurant_id || user?.restaurent_id || 9;
        const parseSettingNum = (val, fallback) => {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? fallback : parsed;
        };
        const parseSettingBool = (val, fallback) => {
            if (val === undefined || val === null) return fallback;
            if (typeof val === 'boolean') return val;
            if (typeof val === 'number') return val === 1;
            if (typeof val === 'string') {
                const low = val.toLowerCase().trim();
                return low === 'true' || low === '1';
            }
            return !!val;
        };
        try {
            const response = await fetch(`${API_BASE_URL}/settings/pos/${restaurantId}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data) {
                const fetchedTaxRate = parseSettingNum(
                    data.tax_rate ?? data.financials?.tax_rate_percentage, 
                    5.00
                );
                const finalIsEnableTables = parseSettingBool(
                    data.is_enable_tables ?? data.hardware_and_preferences?.is_enable_tables, 
                    false
                );
                setPosSettings({
                    restaurantName: data.restaurant_name || data.restaurant_info?.name || 'Big Ben Restaurant',
                    address: data.restaurant_address || data.restaurant_info?.address || '1st Flr, Sun Mill Compound, Hinjewadi',
                    city: data.city || data.restaurant_info?.city || 'Pune',
                    state: data.state || data.restaurant_info?.state || 'Maharashtra',
                    pincode: data.pincode || data.restaurant_info?.pincode || '411056',
                    gstin: data.gstin || data.restaurant_info?.gstin || data.restaurant_info?.gst_number || '27CCCCCC0000A1Z5',
                    fssaiNo: data.fssai_no || data.restaurant_info?.fssai_no || data.restaurant_info?.fssai_number || '10019022009777',
                    taxRate: fetchedTaxRate,
                    cgst: parseSettingNum(data.cgst ?? data.financials?.cgst, fetchedTaxRate / 2),
                    sgst: parseSettingNum(data.sgst ?? data.financials?.sgst, fetchedTaxRate / 2),
                    serviceCharge: parseSettingNum(data.service_charge ?? data.financials?.service_charge_percentage, 5.00),
                    enableThermalPrinting: parseSettingBool(data.enable_thermal_printing ?? data.hardware_and_preferences?.enable_web_serial_thermal_printing, false),
                    autoCleanTables: parseSettingBool(data.auto_clean_tables ?? data.hardware_and_preferences?.auto_clean_dirty_tables, false),
                    isRestaurantServesLiquor: parseSettingBool(data.is_restaurant_serves_liquor ?? data.financials?.is_restaurant_serves_liquor, false),
                    stateVatTaxRate: parseSettingNum(data.state_vat_tax_rate ?? data.financials?.state_vat_tax_rate, 0.00),
                    isEnableTables: finalIsEnableTables
                });
            }
        } catch (error) {
            console.warn('Using fallback POS settings:', error.message);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [user?.restaurant_id, user?.restaurent_id]);

    useEffect(() => {
        fetchTables();
        fetchOrders();
    }, [user?.restaurant_id, user?.restaurent_id]);

    // ── tablesList (memoized, with order sessions merged) ───────────────────
    const tablesList = useMemo(() => {
        let list = [];
        if (tablesData?.tables?.length > 0) {
            list = tablesData.tables;
        } else if (tablesData?.sections?.length > 0) {
            tablesData.sections.forEach(sec => { if (sec?.tables) list.push(...sec.tables); });
        }

        return list.map(t => {
            const cleanTableNum = String(t.table_number || t.table_name || '').replace(/[^0-9]/g, '');
            const cleanTableId = String(t.table_id || '').replace(/[^0-9]/g, '');

            const activeOrder = orderHistory.find(oh => {
                const statusStr = String(oh.order_status || oh.status || '').toUpperCase();
                // Active order statuses that occupy a table
                if (statusStr === 'COMPLETED' || statusStr === 'CANCELLED' || statusStr === 'PAID') return false;

                const cleanOrderTableNum = String(oh.table_name || oh.table_number || '').replace(/[^0-9]/g, '');
                const orderTableId = String(oh.table_number_id || '');

                return (cleanTableNum && cleanOrderTableNum && cleanTableNum === cleanOrderTableNum) ||
                    (cleanTableId && orderTableId && cleanTableId === orderTableId);
            });

            const statusRaw = String(t.status || 'Available').toUpperCase();
            const isOccupied = statusRaw === 'OCCUPIED' || !!activeOrder;

            if (isOccupied) {
                const orderTime = activeOrder ? (activeOrder.created_at || activeOrder.updated_at || activeOrder.time) : (t.current_session?.updated_at || t.updated_at);
                const itemsList = activeOrder?.items || t.current_session?.items || [];
                const computedItemsTotal = itemsList.reduce((s, i) => s + (parseFloat(i.price || i.unit_price || 0) * parseInt(i.qty || i.quantity || 1)), 0);
                const totalAmount = activeOrder ? (activeOrder.total || activeOrder.bill?.grand_total || computedItemsTotal) : (t.current_session?.current_total || t.current_session?.total_amount || computedItemsTotal || 0);

                return {
                    ...t,
                    status: 'Occupied',
                    current_session: {
                        active_order_id: activeOrder?.order_id || t.current_session?.active_order_id || 'N/A',
                        order_status: activeOrder?.order_status || activeOrder?.status || t.current_session?.order_status || 'PENDING',
                        staff_name: activeOrder?.staff_name || activeOrder?.guest_name || t.current_session?.staff_name || user?.username || 'Ravi',
                        updated_at: orderTime,
                        created_at: orderTime,
                        current_total: totalAmount,
                        total_items: itemsList.reduce((s, i) => s + (parseInt(i.quantity || i.qty) || 1), 0),
                        items: itemsList
                    }
                };
            }

            if (statusRaw === 'DIRTY' || t.status === 'Dirty') {
                return { ...t, status: 'Dirty' };
            }
            if (statusRaw === 'RESERVED' || t.status === 'Reserved') {
                return { ...t, status: 'Reserved' };
            }

            return { ...t, status: 'Available', current_session: null };
        });
    }, [tablesData, orderHistory, user?.username]);

    // ── Default available table selection ──────────────────────────────────
    useEffect(() => {
        if (posSettings.isEnableTables && tablesList.length > 0) {
            if (!tableId) {
                const availableTable = tablesList.find(t => t.status === 'Available');
                setTableId(availableTable ? availableTable.table_number : tablesList[0].table_number);
            }
        } else if (!posSettings.isEnableTables && tableId) {
            setTableId('');
        }
    }, [tablesList, posSettings.isEnableTables, tableId]);

    // ── activeTableInfo ──────────────────────────────────────────────────────
    const activeTableInfo = useMemo(() => {
        if (!tableId) return null;
        const foundTable = tablesList.find(t => t.table_number === tableId);
        if (!foundTable) return null;
        let sectionName = '';
        if (tablesData?.sections) {
            for (const sec of tablesData.sections) {
                if ((sec.tables || []).some(t => t.table_number === tableId)) { sectionName = sec.section_name; break; }
            }
        }
        return { ...foundTable, section_name: sectionName };
    }, [tableId, tablesList, tablesData]);

    // ── Cart switch on tableId change ────────────────────────────────────────
    const prevTableIdRef = useRef(tableId);

    const generateSessionCart = (table) => {
        if (table.status !== 'Occupied' || !table.current_session) return {};
        const session = table.current_session;
        if (session.items?.length > 0) {
            const newCart = {};
            session.items.forEach(item => {
                const itemName = item.name || item.item_name || 'Item';
                const formattedName = String(itemName).endsWith('(Active Order)') ? String(itemName) : `${String(itemName)} (Active Order)`;
                const cartKey = item.variant_id ? `${item.item_id}_${item.variant_id}` : String(item.item_id || item.id || Math.random());
                newCart[cartKey] = {
                    id: cartKey,
                    item_id: String(item.item_id || item.id || '1'),
                    name: formattedName,
                    price: parseFloat(item.price !== undefined ? item.price : (item.unit_price !== undefined ? item.unit_price : 0)) || 0,
                    qty: parseInt(item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1)) || 1,
                    category_id: String(item.category_id || '5'),
                    selectedVariant: item.variant_id ? { id: item.variant_id, name: item.variant_name || 'Variant', price: 0 } : null,
                    notes: (item.notes && !item.notes.includes('Session Order')) ? item.notes : ''
                };
            });
            return newCart;
        }
        return {};
    };

    useEffect(() => {
        const prevTableId = prevTableIdRef.current;
        if (prevTableId && prevTableId !== tableId) {
            setTableCarts(prev => ({ ...prev, [prevTableId]: cart }));
            setTableModified(prev => ({ ...prev, [prevTableId]: cartModified }));
        }
        if (posSettings.isEnableTables && tableId) {
            const tableInfo = tablesList.find(t => t.table_number === tableId);
            const isModified = tableModified[tableId] || false;
            setCartModified(isModified);

            if (isModified && tableCarts[tableId] !== undefined) {
                setCart(tableCarts[tableId]);
            } else {
                if (tableInfo?.status === 'Occupied' && tableInfo.current_session) {
                    setCart(generateSessionCart(tableInfo));
                } else {
                    setCart({});
                }
            }
        }
        prevTableIdRef.current = tableId;
    }, [tableId, tablesList, tableCarts, tableModified, posSettings.isEnableTables]);

    // ── Derived cart calculations ────────────────────────────────────────────
    const cartItems = Object.values(cart);
    const subtotal = cartItems.reduce((sum, item) => {
        const cost = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
        return sum + cost * item.qty;
    }, 0);
    const tax = cartItems.reduce((sum, item) => {
        const menuItem = menuItems.find(mi => String(mi.item_id) === String(item.item_id));
        const parsedItemTax = menuItem ? parseFloat(menuItem.tax_percentage) : NaN;
        const taxPct = (!isNaN(parsedItemTax) && parsedItemTax > 0) ? parsedItemTax : posSettings.taxRate;
        const cost = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
        return sum + cost * item.qty * taxPct / 100;
    }, 0);
    const serviceCharge = subtotal * (posSettings.serviceCharge / 100);
    const grandTotal = subtotal + tax + serviceCharge;

    const parseUtcDate = (val) => {
        if (!val) return new Date();
        let str = String(val).trim();
        if (str.includes(' ') && !str.includes('T')) {
            str = str.replace(' ', 'T');
        }
        if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
            str += 'Z';
        }
        const d = new Date(str);
        return isNaN(d.getTime()) ? new Date(val) : d;
    };

    const getMinutesElapsed = (isoString) => {
        if (!isoString) return '1s';
        const date = parseUtcDate(isoString);
        if (isNaN(date.getTime())) return '1s';

        let diffMs = Date.now() - date.getTime();
        if (diffMs < 0) diffMs = 0;

        const secs = Math.max(1, Math.floor(diffMs / 1000));
        if (secs < 60) return `${secs}s`;
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hrs}h ${remMins}m`;
    };

    // ── Cart Actions ─────────────────────────────────────────────────────────
    const addToCart = (item, variant = null, notes = '') => {
        const cartKey = variant ? `${item.item_id}_${variant.id}` : item.item_id;
        setCart(prev => {
            const existing = prev[cartKey];
            if (existing) return { ...prev, [cartKey]: { ...existing, qty: existing.qty + 1 } };
            return { ...prev, [cartKey]: { id: cartKey, item_id: item.item_id, name: item.item_name, price: parseFloat(item.price), qty: 1, category_id: item.category_id, selectedVariant: variant, notes } };
        });
        setCartModified(true);
    };

    const handleItemClick = (item) => {
        if (item.variants?.length > 0) {
            setSelectedItemForModal(item);
            setChosenVariant(item.variants[0]);
        } else {
            addToCart(item);
        }
    };

    const updateQty = (id, delta) => {
        setCart(prev => {
            const existing = prev[id];
            if (!existing) return prev;
            const newQty = existing.qty + delta;
            if (newQty <= 0) { const { [id]: _, ...rest } = prev; return rest; }
            return { ...prev, [id]: { ...existing, qty: newQty } };
        });
        setCartModified(true);
    };

    const removeItem = (id) => {
        setCart(prev => { const n = { ...prev }; delete n[id]; return n; });
        setCartModified(true);
    };



    // ── sendOrderToKitchen ───────────────────────────────────────────────────
    const sendOrderToKitchen = async () => {
        if (Object.keys(cart).length === 0) { showToast('Cart is empty!', 'error', 'Cart Empty'); return; }

        const isAddItemsFlow = activeTableInfo?.status === 'Occupied' && activeTableInfo?.current_session?.active_order_id;

        if (isAddItemsFlow) {
            const existingOrderId = activeTableInfo.current_session.active_order_id;

            // Build update payload matching /order/update API spec
            const updatePayload = {
                order_id: parseInt(existingOrderId),
                items: cartItems.map(item => {
                    const parsedId = parseInt(item.item_id);
                    const unitPrice = parseFloat(item.price || 0);
                    const qty = parseInt(item.qty || 1);
                    return {
                        item_id: !isNaN(parsedId) ? parsedId : item.item_id,
                        quantity: qty,
                        unit_price: parseFloat(unitPrice.toFixed(2)),
                        total_price: parseFloat((unitPrice * qty).toFixed(2)),
                        notes: item.notes || "",
                        addons: item.selectedVariant ? [{
                            addon_id: parseInt(item.selectedVariant.id) || 1,
                            addon_name: item.selectedVariant.name,
                            addon_quantity: 1,
                            addon_unit_price: parseFloat(item.selectedVariant.price || 0),
                            addon_total_price: parseFloat(item.selectedVariant.price || 0)
                        }] : []
                    };
                }),
                totals: {
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    tax: parseFloat(tax.toFixed(2)),
                    service_charge: parseFloat(serviceCharge.toFixed(2)),
                    discount_amount: 0.00,
                    grand_total: parseFloat(grandTotal.toFixed(2))
                }
            };

            try {
                let response = await fetch(`${API_BASE_URL}/order/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_id: existingOrderId,
                        order_status: 'PENDING',
                        ...updatePayload
                    })
                });

                if (!response.ok) {
                    await fetch(`${API_BASE_URL}/order/update-status/${existingOrderId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_status: 'PENDING', status: 'PENDING' })
                    });
                }
            } catch (err) {
                console.warn('Order update API info:', err.message);
            } finally {
                fetchTables();
                fetchOrders();
            }

            setTablesData(prev => {
                const update = t => t.table_number === tableId ? { ...t, status: 'Occupied', current_session: { ...t.current_session, active_order_id: existingOrderId, updated_at: new Date().toISOString(), total_items: cartItems.reduce((s, i) => s + i.qty, 0), current_total: parseFloat(grandTotal.toFixed(2)) } } : t;
                return { ...prev, sections: (prev.sections || []).map(sec => ({ ...sec, tables: (sec.tables || []).map(update) })), tables: (prev.tables || []).map(update) };
            });
            setCartModified(false);
            setTableCarts(prev => ({ ...prev, [tableId]: cart }));
            setTableModified(prev => ({ ...prev, [tableId]: false }));
            setOrderHistory(prev => prev.map(oh => String(oh.order_id) === String(existingOrderId) ? { ...oh, items: cartItems, total: parseFloat(grandTotal.toFixed(2)), status: 'PENDING' } : oh));
            showToast('Order updated successfully', 'success');
            return;
        }

        const mappedTable = activeTableInfo?.table_id ? `T-${activeTableInfo.table_id}` : tableId?.replace('#', 'T-') || 'T-none';
        const generatedOrderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

        const orderPayload = {
            order_meta: {
                restaurant_id: parseInt(user?.restaurant_id || user?.restaurent_id) || 9,
                staff_id: parseInt(user?.id) || 5,
                order_type: orderType.toUpperCase().replace('-', '_'),
                table_number_id: orderType.toUpperCase().replace('-', '_') === 'DINE_IN' ? (parseInt(activeTableInfo?.table_id) || 11) : null,
                guest_count: orderType.toUpperCase().replace('-', '_') === 'DINE_IN' ? (activeTableInfo?.current_session?.guest_count || activeTableInfo?.capacity || 4) : 1
            },
            items: cartItems.map(item => {
                const parsedId = parseInt(item.item_id);
                const unitPrice = parseFloat(item.price || 0);
                const qty = parseInt(item.qty || 1);
                return {
                    item_id: !isNaN(parsedId) ? parsedId : item.item_id,
                    name: item.name,
                    quantity: qty,
                    unit_price: parseFloat(unitPrice.toFixed(2)),
                    total_price: parseFloat((unitPrice * qty).toFixed(2)),
                    variant_id: item.selectedVariant ? (parseInt(item.selectedVariant.id) || item.selectedVariant.id) : null,
                    addons: item.selectedVariant ? [{
                        addon_id: parseInt(item.selectedVariant.id) || 1,
                        addon_name: item.selectedVariant.name,
                        addon_quantity: 1,
                        addon_unit_price: parseFloat(parseFloat(item.selectedVariant.price || 0).toFixed(2)),
                        addon_total_price: parseFloat(parseFloat(item.selectedVariant.price || 0).toFixed(2))
                    }] : [],
                    notes: item.notes || null
                };
            }),
            totals: {
                subtotal: parseFloat(subtotal.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                service_charge: parseFloat(serviceCharge.toFixed(2)),
                discount_amount: 0.00,
                grand_total: parseFloat(grandTotal.toFixed(2))
            },
            status: 'PENDING',
            created_at: new Date().toISOString()
        };

        const markOccupied = (oid) => {
            setTablesData(prev => {
                const update = t => t.table_number === tableId ? { ...t, status: 'Occupied', current_session: { active_order_id: oid, staff_id: parseInt(user?.id) || 100, staff_name: user?.username || 'Ravi', guest_count: t.capacity || 4, updated_at: new Date().toISOString(), total_items: cartItems.reduce((s, i) => s + i.qty, 0), current_total: parseFloat(grandTotal.toFixed(2)) } } : t;
                return { ...prev, sections: (prev.sections || []).map(sec => ({ ...sec, tables: (sec.tables || []).map(update) })), tables: (prev.tables || []).map(update) };
            });
        };

        try {
            const response = await fetch(`${API_BASE_URL}/order/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const oid = data.data?.order_id || data.order_id || generatedOrderId;
            markOccupied(oid);
            setOrderHistory(prev => [{ order_id: oid, table_number: tableId, type: orderType.charAt(0).toUpperCase() + orderType.slice(1).toLowerCase(), total: parseFloat(grandTotal.toFixed(2)), subtotal: parseFloat(subtotal.toFixed(2)), tax: parseFloat(tax.toFixed(2)), serviceCharge: parseFloat(serviceCharge.toFixed(2)), items: cartItems, time: new Date().toISOString(), status: 'PENDING' }, ...prev]);
            fetchTables();
            fetchOrders();
            showToast(`Order ID: ${oid}\nStatus: PENDING\nTotal: ₹${grandTotal.toFixed(2)}`, 'success', 'Order Sent to Kitchen');
            setCart({});
            setCartModified(false);
            if (tableId) {
                setTableCarts(prev => ({ ...prev, [tableId]: {} }));
                setTableModified(prev => ({ ...prev, [tableId]: false }));
            }
            prevTableIdRef.current = null;
            setTableId('');
            if (posSettings.isEnableTables) {
                navigate('/tables');
            }
        } catch (error) {
            console.warn('Live API failed, using local fallback:', error.message);
            markOccupied(generatedOrderId);
            setOrderHistory(prev => [{ order_id: generatedOrderId, table_number: tableId, type: orderType.charAt(0).toUpperCase() + orderType.slice(1).toLowerCase(), total: parseFloat(grandTotal.toFixed(2)), subtotal: parseFloat(subtotal.toFixed(2)), tax: parseFloat(tax.toFixed(2)), serviceCharge: parseFloat(serviceCharge.toFixed(2)), items: cartItems, time: new Date().toISOString(), status: 'PENDING' }, ...prev]);
            showToast(`Order ID: ${generatedOrderId}\nStatus: PENDING\nTotal: ₹${generatedOrderId}\nOrder Sent to Kitchen`, 'success', '[Mock] Order Sent to Kitchen');
            setCart({});
            setCartModified(false);
            if (tableId) {
                setTableCarts(prev => ({ ...prev, [tableId]: {} }));
                setTableModified(prev => ({ ...prev, [tableId]: false }));
            }
            prevTableIdRef.current = null;
            setTableId('');
            if (posSettings.isEnableTables) {
                navigate('/tables');
            }
        }
    };

    // ── checkoutAndPay ───────────────────────────────────────────────────────
    const checkoutAndPay = async () => {
        if (Object.keys(cart).length === 0) { showToast('Cart is empty!', 'error', 'Cart Empty'); return; }
        if (cartModified) {
            if (!window.confirm('You have unsaved changes. Place order and process payment?')) return;
            await sendOrderToKitchen();
        }
        const activeOrd = activeTableInfo?.current_session?.active_order_id;
        const targetStatus = posSettings.autoCleanTables ? 'Available' : 'Dirty';

        setTablesData(prev => {
            const session = { last_order_id: activeOrd || `ORD-${Math.floor(10000 + Math.random() * 90000)}`, updated_at: new Date().toISOString() };
            const update = t => t.table_number === tableId ? { ...t, status: targetStatus, current_session: session } : t;
            return { ...prev, sections: (prev.sections || []).map(sec => ({ ...sec, tables: (sec.tables || []).map(update) })), tables: (prev.tables || []).map(update) };
        });
        showToast(`Total Paid: ₹${grandTotal.toFixed(2)}\nTable marked as ${targetStatus}.`, 'success', `Payment Processed for Table ${tableId}`);

        if (activeOrd) {
            setPaidOrderIds(prev => { const next = [...prev, String(activeOrd)]; localStorage.setItem('pos_paid_order_ids', JSON.stringify(next)); return next; });

            // 1. PUT API call to update backend database order status
            try {
                const tableIdNum = activeTableInfo?.table_id ? parseInt(activeTableInfo.table_id) : null;
                await fetch(`${API_BASE_URL}/order/update-status/${activeOrd}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_status: 'COMPLETED',
                        table_number_id: tableIdNum
                    })
                });
            } catch (err) {
                console.warn('Failed to update status on server:', err.message);
            }
        }



        setOrderHistory(prev => prev.map(oh => oh.table_number === tableId && oh.status === 'PENDING' ? { ...oh, status: 'PAID' } : oh));
        fetchOrders();
        fetchTables();
        setCart({}); setCartModified(false);
        setTableCarts(prev => ({ ...prev, [tableId]: {} }));
        setTableModified(prev => ({ ...prev, [tableId]: false }));
        navigate('/tables');
    };

    // ── payNow (from Tables page) ────────────────────────────────────────────
    const payNow = async (tNum) => {
        const tableInfo = tablesList.find(t => t.table_number === tNum);
        const activeOrd = tableInfo?.current_session?.active_order_id;
        const targetStatus = posSettings.autoCleanTables ? 'Available' : 'Dirty';

        setTablesData(prev => {
            const session = { last_order_id: activeOrd || `ORD-${Math.floor(10000 + Math.random() * 90000)}`, updated_at: new Date().toISOString() };
            const update = t => t.table_number === tNum ? { ...t, status: targetStatus, current_session: session } : t;
            return { ...prev, sections: (prev.sections || []).map(sec => ({ ...sec, tables: (sec.tables || []).map(update) })), tables: (prev.tables || []).map(update) };
        });
        if (activeOrd) {
            setPaidOrderIds(prev => { const next = [...prev, String(activeOrd)]; localStorage.setItem('pos_paid_order_ids', JSON.stringify(next)); return next; });
            setOrderHistory(prev => prev.map(oh => oh.order_id === activeOrd ? { ...oh, status: 'PAID' } : oh));

            // 1. PUT API call to update backend database
            try {
                const tableIdNum = tableInfo?.table_id ? parseInt(tableInfo.table_id) : null;
                await fetch(`${API_BASE_URL}/order/update-status/${activeOrd}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_status: 'COMPLETED',
                        table_number_id: tableIdNum
                    })
                });
            } catch (err) {
                console.warn('Failed to update status on server:', err.message);
            }
        } else {
            const pendingOrder = orderHistory.find(oh => oh.table_number === tNum && oh.status === 'PENDING');
            if (pendingOrder) {
                setPaidOrderIds(prev => { const next = [...prev, String(pendingOrder.order_id)]; localStorage.setItem('pos_paid_order_ids', JSON.stringify(next)); return next; });

                // 1. PUT API call to update backend database
                try {
                    const tableIdNum = tableInfo?.table_id ? parseInt(tableInfo.table_id) : null;
                    await fetch(`${API_BASE_URL}/order/update-status/${pendingOrder.order_id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            order_status: 'COMPLETED',
                            table_number_id: tableIdNum
                        })
                    });
                } catch (err) {
                    console.warn('Failed to update status on server:', err.message);
                }
            }
            setOrderHistory(prev => prev.map(oh => oh.table_number === tNum && oh.status === 'PENDING' ? { ...oh, status: 'PAID' } : oh));
        }



        fetchOrders();
        fetchTables();
        setCart({}); setCartModified(false);
        setTableCarts(prev => ({ ...prev, [tNum]: {} }));
        setTableModified(prev => ({ ...prev, [tNum]: false }));
        showToast(`Table marked as ${targetStatus}.`, 'success', `Payment Processed for Table ${tNum}`);
    };

    // ── markTableAsAvailable ─────────────────────────────────────────────────
    const markTableAsAvailable = async (tNum) => {


        setTablesData(prev => {
            const update = t => t.table_number === tNum ? { ...t, status: 'Available', current_session: null } : t;
            return { ...prev, sections: (prev.sections || []).map(sec => ({ ...sec, tables: (sec.tables || []).map(update) })), tables: (prev.tables || []).map(update) };
        });
        fetchTables();
        showToast(`Table ${tNum} is now clean and available!`, 'success', 'Table Cleaned');
    };

    // ── checkInTable ─────────────────────────────────────────────────────────
    const checkInTable = (tNum) => {
        setTableId(tNum);
        setCart({});
        setCartModified(false);
        if (tNum) {
            setTableCarts(prev => ({ ...prev, [tNum]: {} }));
            setTableModified(prev => ({ ...prev, [tNum]: false }));
        }
        navigate('/order');
        showToast('Starting a new order.', 'success', `Taking order for Table ${tNum}`);
    };
    // ── Confirm Modal State ──────────────────────────────────────────────────
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        confirmVariant: 'danger',
        onConfirm: null
    });

    const showConfirm = ({ title, message, confirmText = 'Confirm', confirmVariant = 'danger', onConfirm }) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            confirmText,
            confirmVariant,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                if (onConfirm) await onConfirm();
            }
        });
    };

    const closeConfirm = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    // ── cancelActiveOrder ────────────────────────────────────────────────────
    const cancelActiveOrder = (orderId, tableNum) => {
        const cleanOrderId = String(orderId || '').replace(/^#/, '');
        const cleanTableNum = tableNum ? String(tableNum).replace(/^Table\s*/i, '').trim() : '';

        showConfirm({
            title: `Cancel Order ${cleanOrderId}?`,
            message: `Are you sure you want to cancel Order ${cleanOrderId}?`,
            confirmText: 'Yes, Cancel Order',
            confirmVariant: 'danger',
            onConfirm: async () => {
                try {
                    const tableInfo = tablesList.find(t => t.table_number === tableNum);
                    const tableIdNum = tableInfo?.table_id ? parseInt(tableInfo.table_id) : null;

                    // 1. Update status to CANCELLED on backend
                    try {
                        await fetch(`${API_BASE_URL}/order/update-status/${orderId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                order_status: 'CANCELLED',
                                table_number_id: tableIdNum
                            })
                        });
                    } catch (err) {
                        console.warn('Failed to update status to CANCELLED on server:', err.message);
                    } finally {
                        fetchTables();
                        fetchOrders();
                    }

                    // 2. Update local state
                    setTablesData(prev => {
                        const update = t => t.table_number === tableNum ? { ...t, status: 'Available', current_session: null } : t;
                        return {
                            ...prev,
                            sections: (prev.sections || []).map(sec => ({ ...sec, tables: (sec.tables || []).map(update) })),
                            tables: (prev.tables || []).map(update)
                        };
                    });

                    // Update local order history status to CANCELLED
                    setOrderHistory(prev => prev.map(oh => String(oh.order_id) === String(orderId) ? { ...oh, status: 'CANCELLED' } : oh));

                    // Clear cart
                    setCart({});
                    setCartModified(false);
                    if (tableNum) {
                        setTableCarts(prev => ({ ...prev, [tableNum]: {} }));
                        setTableModified(prev => ({ ...prev, [tableNum]: false }));
                    }

                    fetchOrders();
                    fetchTables();

                    showToast(`Order #${orderId} cancelled`, 'success');
                } catch (error) {
                    console.error("Failed to cancel order:", error);
                    showToast("Failed to cancel order: " + error.message, 'error');
                }
            }
        });
    };

    // ── handleAddItems ────────────────────────────────────────────────────────
    const handleAddItems = (tNum) => { setTableId(tNum); navigate('/order'); };
    const handlePrintBillFromTable = (tNum) => { setTableId(tNum); navigate('/order'); setTimeout(() => window.print(), 300); };

    // ── handleAddTable ────────────────────────────────────────────────────────
    const handleAddTable = async (tableName, capacity, floor = null) => {
        const restaurantId = user?.restaurant_id || user?.restaurent_id || 9;
        try {
            const payload = {
                restaurent_id: parseInt(restaurantId),
                table_name: tableName,
                capacity: parseInt(capacity)
            };
            if (floor) payload.floor = floor;

            const response = await fetch(`${API_BASE_URL}/tables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            showToast(data.message || 'Table created successfully.', 'success', 'Table Created');
            fetchTables();
        } catch (error) {
            showToast('Failed to add table. ' + error.message, 'error', 'Add Table Failed');
        }
    };

    // ── handleCreateReservation ───────────────────────────────────────────────
    const handleCreateReservation = async (e) => {
        e.preventDefault();
        if (!resSelectedTableNum) { showToast('Please select a table.', 'error', 'Missing Table'); return; }
        try {
            const currentSessionObj = { active_order_id: null, staff_id: user?.id || 9, staff_name: user?.username || 'Ravi Sen', guest_count: parseInt(resGuestCount) || 4, customer_name: resCustomerName, customer_phone: resCustomerPhone, reservation_time: resTime, updated_at: new Date().toISOString(), total_items: 0, current_total: 0.00, items: [] };

            setTablesData(prev => {
                const update = t => t.table_number === resSelectedTableNum ? { ...t, status: 'Reserved', current_session: currentSessionObj } : t;
                return { ...prev, sections: (prev.sections || []).map(sec => ({ ...sec, tables: (sec.tables || []).map(update) })), tables: (prev.tables || []).map(update) };
            });
            setShowReservationModal(false);
            showToast(`Table ${resSelectedTableNum} reserved for ${resCustomerName}.`, 'success', 'Reservation Confirmed');
            setResCustomerName(''); setResCustomerPhone(''); setResSelectedTableNum(''); setResGuestCount(4);
        } catch (error) {
            showToast('Could not save reservation: ' + error.message, 'error', 'Reservation Error');
        }
    };

    // ── handleUpdateOrder ─────────────────────────────────────────────────────
    const handleUpdateOrder = async (updatedOrder) => {
        const updatePayload = {
            order_id: parseInt(updatedOrder.order_id),
            items: updatedOrder.items.map(item => {
                const parsedId = parseInt(item.item_id || item.id);
                const unitPrice = parseFloat(item.price || item.unit_price || 0);
                const qty = parseInt(item.qty || item.quantity || 1);
                return {
                    item_id: !isNaN(parsedId) ? parsedId : (item.item_id || item.id),
                    quantity: qty,
                    unit_price: parseFloat(unitPrice.toFixed(2)),
                    total_price: parseFloat((unitPrice * qty).toFixed(2)),
                    notes: item.notes || "",
                    addons: item.selectedVariant ? [{ addon_id: parseInt(item.selectedVariant.id) || 1, addon_name: item.selectedVariant.name, addon_quantity: 1, addon_unit_price: parseFloat(item.selectedVariant.price || 0), addon_total_price: parseFloat(item.selectedVariant.price || 0) }] : []
                };
            }),
            totals: {
                subtotal: parseFloat(parseFloat(updatedOrder.subtotal || subtotal).toFixed(2)),
                tax: parseFloat(parseFloat(updatedOrder.tax || tax).toFixed(2)),
                service_charge: parseFloat(parseFloat(updatedOrder.serviceCharge || serviceCharge).toFixed(2)),
                discount_amount: 0.00,
                grand_total: parseFloat(parseFloat(updatedOrder.total || updatedOrder.grand_total || grandTotal).toFixed(2))
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}/order/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            setOrderHistory(prev => prev.map(o => o.order_id === updatedOrder.order_id ? updatedOrder : o));
            const tNum = updatedOrder.table_number;
            const activeTable = tablesList.find(t => t.table_number === tNum);
            if (activeTable?.status === 'Occupied' && activeTable.current_session?.active_order_id === updatedOrder.order_id) {
                const newCart = {};
                updatedOrder.items.forEach(item => { newCart[item.id] = item; });
                if (tableId === tNum) { setCart(newCart); setCartModified(false); }
                setTableCarts(prev => ({ ...prev, [tNum]: newCart }));
                setTableModified(prev => ({ ...prev, [tNum]: false }));
                setTablesData(prev => {
                    const updateT = (list) => (list || []).map(t => t.table_number === tNum ? { ...t, current_session: { ...t.current_session, current_total: updatedOrder.total, total_items: updatedOrder.items.reduce((s, i) => s + i.qty, 0) } } : t);
                    if (prev.tables?.length > 0) return { ...prev, tables: updateT(prev.tables) };
                    return { ...prev, sections: prev.sections.map(sec => ({ ...sec, tables: updateT(sec.tables) })) };
                });
            }
            showToast('Order updated successfully!', 'success', 'Order Updated');
        } catch (error) {
            console.error('Failed to update order on API:', error);
            showToast('Failed to update order on server: ' + error.message, 'error', 'Update Failed');
        }
    };

    // ── handlePrintKOT ────────────────────────────────────────────────────────
    const handlePrintKOT = () => {
        if (cartItems.length === 0) { showToast('Cart is empty!', 'error', 'Print Failed'); return; }
        window.print();
    };

    const printDirectToPrinter = async () => {
        if (cartItems.length === 0) { showToast('Cart is empty!', 'error', 'Print Failed'); return; }
        if (!navigator.serial) { showToast('Web Serial not supported. Use Chrome/Edge.', 'error', 'Serial Port Error'); return; }
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            const writer = port.writable.getWriter();
            const encoder = new TextEncoder();
            const ESC = '\x1b', GS = '\x1d';

            const totalQty = cartItems.reduce((acc, item) => acc + item.qty, 0);
            const halfTaxRate = (posSettings.taxRate / 2).toFixed(1);
            const cgstAmt = tax / 2;
            const sgstAmt = tax / 2;
            const formattedDate = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            let receipt = `${ESC}@${ESC}a\x01${ESC}E\x01${posSettings.restaurantName}\n${ESC}E\x00${posSettings.address}\n`;
            if (posSettings.city || posSettings.state || posSettings.pincode) {
                receipt += `${[posSettings.city, posSettings.state, posSettings.pincode].filter(Boolean).join(', ')}\n`;
            }
            if (posSettings.gstin) receipt += `GSTIN: ${posSettings.gstin}\n`;
            if (posSettings.fssaiNo) receipt += `FSSAI NO: ${posSettings.fssaiNo}\n`;

            const staffRole = (posSettings?.isEnableTables || Boolean(tableId) || orderType === 'DINE-IN') ? 'Waiter' : 'Cashier';
            receipt += `--------------------------------\n${ESC}a\x00`;
            receipt += `Bill No: #${tableId ? `TBL-${tableId}` : '1001'}  Date: ${formattedDate}\n`;
            receipt += `Dine In: ${tableId || 'N/A'}     ${staffRole}: ${user?.username || user?.name || 'Ravi'}\n`;
            receipt += `--------------------------------\n`;
            receipt += `Item              Qty.  Price    Amount\n`;
            receipt += `--------------------------------\n`;

            cartItems.forEach(item => {
                const unitPrice = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
                const itemAmount = unitPrice * item.qty;
                const nameStr = item.name.padEnd(16, ' ').slice(0, 16);
                const qtyStr = String(item.qty).padStart(4, ' ');
                const priceStr = unitPrice.toFixed(2).padStart(7, ' ');
                const amtStr = itemAmount.toFixed(2).padStart(9, ' ');
                receipt += `${nameStr}${qtyStr}${priceStr}${amtStr}\n`;
                if (item.selectedVariant) receipt += `  Opt: ${item.selectedVariant.name}\n`;
                if (item.notes) receipt += `  * ${item.notes}\n`;
            });

            receipt += `--------------------------------\n`;
            receipt += `Total Qty: ${totalQty}   Sub Total   ${subtotal.toFixed(2).padStart(8, ' ')}\n`;
            receipt += `             CGST ${halfTaxRate}%   ${cgstAmt.toFixed(2).padStart(8, ' ')}\n`;
            receipt += `             SGST ${halfTaxRate}%   ${sgstAmt.toFixed(2).padStart(8, ' ')}\n`;
            if (posSettings.serviceCharge > 0) {
                receipt += `      Service Charge ${posSettings.serviceCharge}%   ${serviceCharge.toFixed(2).padStart(8, ' ')}\n`;
            }
            receipt += `${ESC}E\x01Grand Total (INR)         ${grandTotal.toFixed(2).padStart(8, ' ')}\n${ESC}E\x00`;
            receipt += `--------------------------------\n${ESC}a\x01Thank you & Visit Again\n--------------------------------\n\n\n\n${GS}V\x41\x03`;

            await writer.write(encoder.encode(receipt));
            writer.releaseLock();
            await port.close();
            showToast('Print sent!', 'success', 'Print Success');
        } catch (error) {
            showToast('Print failed: ' + error.message, 'error', 'Print Failed');
        }
    };

    const filteredItems = (searchQuery, selectedCategory) => menuItems.filter(item => {
        const cat = categories.find(c => c.category_id === item.category_id)?.category_name || '';
        return (selectedCategory === 'All' || cat === selectedCategory) && item.item_name.toLowerCase().includes((searchQuery || '').toLowerCase());
    });

    const value = {
        // User
        user, onLogout,
        // Data
        menuData, setMenuData, loading, categories, menuItems, filteredItems,
        tablesData, setTablesData, tablesList,
        orderHistory, setOrderHistory, paidOrderIds, setPaidOrderIds,
        posSettings, setPosSettings, staffList, setStaffList,
        // Cart
        cart, setCart, cartModified, setCartModified,
        tableId, setTableId, tableCarts, setTableCarts,
        tableModified, setTableModified,
        orderType, setOrderType,
        cartItems, subtotal, tax, serviceCharge, grandTotal,
        activeTableInfo,
        // Variant modal
        selectedItemForModal, setSelectedItemForModal,
        chosenVariant, setChosenVariant,
        // Reservation
        showReservationModal, setShowReservationModal,
        resCustomerName, setResCustomerName,
        resCustomerPhone, setResCustomerPhone,
        resSelectedTableNum, setResSelectedTableNum,
        resGuestCount, setResGuestCount,
        resTime, setResTime,
        // Toast & Confirm Modal
        showToast, confirmModal, closeConfirm, showConfirm,
        // Detail view
        selectedDetailOrder, setSelectedDetailOrder,
        // Actions
        fetchTables, fetchOrders, fetchSettings,
        addToCart, handleItemClick, updateQty, removeItem,
        sendOrderToKitchen, checkoutAndPay, payNow,
        markTableAsAvailable, checkInTable, cancelActiveOrder,
        handleAddItems, handlePrintBillFromTable,
        handleAddTable, handleCreateReservation,
        handleUpdateOrder, handlePrintKOT, printDirectToPrinter,
        getMinutesElapsed,
    };

    return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};
