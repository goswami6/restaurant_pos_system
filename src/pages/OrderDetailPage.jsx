import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { usePOS } from '../context/POSContext';
import ReceiptModal from '../components/ReceiptModal';
import BillPanel from '../components/BillPanel';
import CategorySidebar from '../components/CategorySidebar';
import FoodItemCard from '../components/FoodItemCard';
import { getDietaryInfo } from '../utils/dietaryUtils';

const OrderDetailPage = () => {
    const { id } = useParams();
    const { selectedDetailOrder, orderHistory, categories, menuItems, loading, posSettings, handleUpdateOrder, cancelActiveOrder } = usePOS();
    const navigate = useNavigate();
    const [showReceiptPrint, setShowReceiptPrint] = useState(false);
    const [showBillSummary, setShowBillSummary] = useState(false);
    const onBack = () => navigate('/history');
    const onUpdateOrder = handleUpdateOrder;

    const order = selectedDetailOrder || orderHistory.find(o => String(o.order_id) === String(id)) || null;

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [dietaryFilter, setDietaryFilter] = useState('All');
    const [tempCart, setTempCart] = useState({});

    useEffect(() => {
        if (order && order.items) {
            const initialCart = {};
            order.items.forEach(item => {
                initialCart[item.id] = { ...item };
            });
            setTempCart(initialCart);
        }
    }, [order?.order_id]);

    // Customization Modal states
    const [selectedItemForModal, setSelectedItemForModal] = useState(null);
    const [chosenVariant, setChosenVariant] = useState(null);

    const handleCancelClick = async () => {
        if (order?.order_id) {
            await cancelActiveOrder(order.order_id, order.table_number);
            navigate('/history');
        }
    };

    if (!order) {
        return (
            <div className="container py-5 text-center flex-1 d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div style={{ fontSize: '3rem' }}>🔍</div>
                <h5 className="fw-bold text-slate-800 mt-2">Order Not Found</h5>
                <p className="text-muted small mb-3">The requested order details could not be found or session expired.</p>
                <button className="btn btn-dark btn-sm px-4 py-2 font-bold" style={{ borderRadius: '8px' }} onClick={() => navigate('/history')}>
                    ← Back to Order History
                </button>
            </div>
        );
    }

    const isPaid = order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'CANCELLED';
    const categoriesList = ['All', ...categories.map(cat => cat.category_name)];

    // Filter menu items
    const filteredItems = menuItems.filter((item) => {
        const dietary = getDietaryInfo(item);
        const matchesCategory = selectedCategory === 'All' ||
            categories.find(c => c.category_name === selectedCategory)?.category_id === item.category_id;
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDietary = dietaryFilter === 'All' ||
            (dietaryFilter === 'Veg' && (dietary === 'Veg' || dietary === 'Egg')) ||
            (dietaryFilter === 'Non-Veg' && dietary === 'Non-Veg');

        return matchesCategory && matchesSearch && matchesDietary;
    });

    const getItemCartQty = (itemId) => {
        return Object.values(tempCart)
            .filter(cartItem => String(cartItem.item_id) === String(itemId))
            .reduce((sum, cartItem) => sum + (cartItem.qty || 1), 0);
    };

    // Temp Cart modification functions
    const addToCart = (item, variant = null, notes = '') => {
        if (isPaid) return;
        const cartKey = variant ? `${item.item_id}_${variant.id}` : item.item_id;

        setTempCart(prevCart => {
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
                    id: cartKey,
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
        if (isPaid) {
            toast.error("This order is already PAID and cannot be modified.");
            return;
        }
        if (item.variants && item.variants.length > 0) {
            setSelectedItemForModal(item);
            setChosenVariant(item.variants[0]);
        } else {
            addToCart(item);
        }
    };

    const updateQty = (id, delta) => {
        if (isPaid) return;
        setTempCart(prevCart => {
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
        if (isPaid) return;
        if (!window.confirm("Remove this item from the order?")) return;
        setTempCart(prevCart => {
            const { [id]: _, ...rest } = prevCart;
            return rest;
        });
    };

    const resetChanges = () => {
        if (!window.confirm("Discard all changes made to this order?")) return;
        const initialCart = {};
        if (order && order.items) {
            order.items.forEach(item => {
                initialCart[item.id] = { ...item };
            });
        }
        setTempCart(initialCart);
    };

    // Derived Calculations for Temp Cart
    const tempCartItems = Object.values(tempCart);

    const subtotal = tempCartItems.reduce((sum, item) => {
        const itemCost = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
        return sum + (itemCost * item.qty);
    }, 0);

    const tax = tempCartItems.reduce((sum, item) => {
        const menuItem = menuItems.find(mi => String(mi.item_id) === String(item.item_id));
        const parsedItemTax = menuItem ? parseFloat(menuItem.tax_percentage) : NaN;
        const taxPercentage = (!isNaN(parsedItemTax) && parsedItemTax > 0) ? parsedItemTax : posSettings.taxRate;
        const itemCost = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
        return sum + ((itemCost * item.qty) * taxPercentage / 100);
    }, 0);

    const serviceCharge = subtotal * (posSettings.serviceCharge / 100);
    const grandTotal = subtotal + tax + serviceCharge;

    const handleSave = () => {
        if (tempCartItems.length === 0) {
            toast.error("Order cannot be empty! Please add at least one item or cancel.");
            return;
        }
        onUpdateOrder({
            ...order,
            items: tempCartItems,
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            serviceCharge: parseFloat(serviceCharge.toFixed(2)),
            total: parseFloat(grandTotal.toFixed(2))
        });
    };

    return (
        <div className="d-flex flex-column h-100" style={{ flex: 1, minHeight: 0 }}>
            {/* Header */}
            <div className="bg-white border-bottom px-2 px-sm-3 py-2 d-flex justify-content-between align-items-center flex-nowrap gap-2" style={{ flexShrink: 0 }}>
                <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
                    <button
                        className="btn btn-sm btn-outline-dark fw-bold py-1 px-2 text-xs flex-shrink-0 d-flex align-items-center gap-1"
                        style={{ borderRadius: '6px', whiteSpace: 'nowrap', lineHeight: 1 }}
                        onClick={onBack}
                    >
                        <span>←</span>
                        <span>Back</span>
                    </button>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h6 className="fw-bold mb-0 text-slate-900 text-truncate" style={{ fontSize: '0.88rem', lineHeight: '1.2' }}>
                            <span className="d-none d-sm-inline">Order Details: </span>
                            <span className="d-inline d-sm-none">Order </span>
                            <span className="text-primary">{String(order.order_id).replace(/^#/i, '')}</span>
                        </h6>
                        <span className="text-slate-800 fw-bold d-block text-truncate" style={{ fontSize: '0.7rem', marginTop: '1px' }}>
                            {(posSettings?.isEnableTables && order.table_number && order.table_number !== 'N/A') ? `${order.table_number} • ` : ''}{order.type} • {new Date(order.time).toLocaleDateString('en-GB')}
                        </span>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <span className={`badge ${(String(order.status || '').toUpperCase() === 'PAID' || String(order.status || '').toUpperCase() === 'COMPLETED' || String(order.status || '').toUpperCase() === 'SERVED') ? 'bg-success text-white' :
                            String(order.status || '').toUpperCase() === 'CANCELLED' ? 'bg-danger text-white' : 'bg-warning text-dark'
                        } py-1 px-2 text-[10px] sm:text-xs font-bold`} style={{ borderRadius: '6px', whiteSpace: 'nowrap' }}>
                        {order.status}
                    </span>
                </div>
            </div>

            <main className="container-fluid p-0" style={{ flex: 1, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="order-page-layout-row g-0">
                    {/* LEFT: CATEGORIES (Unified CategorySidebar) */}
                    <CategorySidebar 
                        categoriesList={categoriesList}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                        disabled={isPaid}
                    />

                    {/* CENTER: MENU ITEMS */}
                    <div className="col-12 col-lg-7 pt-3 pt-lg-4 px-3 px-md-4 pb-4 pb-lg-5 bg-slate-50 order-items-panel">
                        {/* Menu Search Header: Desktop/Tablet (1 Row: Title Left, Search Center, Chips Right) | Mobile (Row 1: Title Left & Chips Right, Row 2: Search Below) */}
                        <div className="d-flex flex-wrap flex-md-nowrap align-items-center justify-content-between gap-2 mb-3 mb-md-4 mb-lg-4">
                            {/* Title */}
                            <h5 className="fw-bold mb-0 text-slate-800 text-nowrap order-1" style={{ fontSize: '1.05rem' }}>
                                {selectedCategory} Items
                            </h5>

                            {/* Search Bar (Centered on Tablet & Desktop) */}
                            <div className="position-relative flex-grow-1 mx-md-3 order-3 order-md-2 my-1 my-md-0" style={{ minWidth: '180px', maxWidth: '360px', width: '100%' }}>
                                <input
                                    type="text"
                                    className="form-control border-0 shadow-sm"
                                    style={{ borderRadius: '10px', paddingLeft: '35px', paddingRight: searchQuery ? '30px' : '12px', fontSize: '0.85rem', height: '38px' }}
                                    placeholder={isPaid ? "Order locked..." : "Search food..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={isPaid}
                                />
                                <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ fontSize: '0.85rem' }}>🔍</span>
                                {searchQuery && !isPaid && (
                                    <button
                                        type="button"
                                        className="btn btn-sm p-0 position-absolute top-50 end-0 translate-middle-y me-2.5 bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-900 rounded-circle d-flex align-items-center justify-content-center transition-all cursor-pointer"
                                        style={{ width: '22px', height: '22px', border: 0, lineHeight: 1, fontSize: '0.7rem' }}
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Clear Search"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Desktop/Tablet Filter Chips (Visible on md and above) */}
                            <div className="d-none d-md-flex align-items-center gap-1 p-1 rounded-full border border-slate-200 order-md-3 ms-md-0" style={{ backgroundColor: '#e2e8f0' }}>
                                {[
                                    { id: 'All', label: 'All', icon: '🍽️' },
                                    { id: 'Veg', label: 'Veg', icon: '🟢' },
                                    { id: 'Non-Veg', label: 'Non-Veg', icon: '🔴' },
                                    { id: 'Egg', label: 'Egg', icon: '🟡' },
                                ].map((chip) => {
                                    const isActive = dietaryFilter === chip.id;
                                    let activeBg = '#0f172a';
                                    if (chip.id === 'Veg') activeBg = '#16a34a';
                                    if (chip.id === 'Non-Veg') activeBg = '#dc2626';
                                    if (chip.id === 'Egg') activeBg = '#d97706';

                                    return (
                                        <button
                                            key={chip.id}
                                            type="button"
                                            className="btn btn-sm py-1 px-2.5 rounded-full font-bold text-xs border-0 transition-all cursor-pointer d-flex align-items-center gap-1"
                                            style={{
                                                fontSize: '0.72rem',
                                                borderRadius: '16px',
                                                whiteSpace: 'nowrap',
                                                backgroundColor: isActive ? activeBg : '#ffffff',
                                                color: isActive ? '#ffffff' : '#334155',
                                                boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.15)' : 'none'
                                            }}
                                            onClick={() => setDietaryFilter(chip.id)}
                                            disabled={isPaid}
                                        >
                                            <span style={{ fontSize: '0.68rem' }}>{chip.icon}</span>
                                            <span>{chip.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Mobile Filter Dropdown (Visible ONLY on Mobile < 768px) */}
                            <div className="d-block d-md-none order-2 ms-auto">
                                <select
                                    className="form-select form-select-sm border-slate-300 font-bold text-slate-800 shadow-sm rounded-pill px-3 py-1"
                                    style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: '#ffffff',
                                        borderColor: '#cbd5e1',
                                        cursor: 'pointer',
                                        minWidth: '120px'
                                    }}
                                    value={dietaryFilter}
                                    onChange={(e) => setDietaryFilter(e.target.value)}
                                    disabled={isPaid}
                                >
                                    <option value="All">🍽️ All Items</option>
                                    <option value="Veg">🟢 Veg Only</option>
                                    <option value="Non-Veg">🔴 Non-Veg</option>
                                    <option value="Egg">🟡 Egg Only</option>
                                </select>
                            </div>
                        </div>

                        {isPaid && (
                            <div className="alert alert-info py-2 px-3 mb-4 rounded-3 d-flex align-items-center gap-2">
                                <span>🔒</span>
                                <span className="small fw-semibold">This order is PAID. Menu browser is disabled.</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-warning" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted mt-2">Loading menus...</p>
                            </div>
                        ) : (
                            <div className="row g-2 g-sm-2.5 mt-2" style={isPaid ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <FoodItemCard
                                            key={item.item_id}
                                            item={item}
                                            cartQty={getItemCartQty(item.item_id)}
                                            onClick={handleItemClick}
                                        />
                                    ))
                                ) : (
                                    <div className="col-12 text-center py-5">
                                        <div className="fs-1 mb-2">🤷‍♂️</div>
                                        <p className="text-muted">No items found.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: BILL SIDE PANEL (Unified BillPanel) */}
                    <BillPanel
                        customOrder={order}
                        customItems={tempCartItems}
                        isReadOnly={isPaid}
                        onUpdateQty={updateQty}
                        onRemoveItem={removeItem}
                        onUpdateOrder={handleSave}
                        onDiscardChanges={resetChanges}
                        onCancelOrder={handleCancelClick}
                    />
                </div>
            </main>

            {/* Customization modal */}
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
                                            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-200 ${chosenVariant?.id === v.id
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
                                    id="detail-modifier-notes"
                                    placeholder="E.g., No onions, extra spicy..."
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
                                    const notesInput = document.getElementById('detail-modifier-notes');
                                    addToCart(selectedItemForModal, chosenVariant, notesInput?.value || '');
                                    setSelectedItemForModal(null);
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.97] transition-all duration-200 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-amber-500/10"
                            >
                                Add to Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ReceiptModal
                selectedHistoryOrder={showReceiptPrint ? {
                    ...order,
                    items: tempCartItems,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    tax: parseFloat(tax.toFixed(2)),
                    serviceCharge: parseFloat(serviceCharge.toFixed(2)),
                    total: parseFloat(grandTotal.toFixed(2))
                } : null}
                setSelectedHistoryOrder={(val) => setShowReceiptPrint(!!val)}
                posSettings={posSettings}
            />
        </div>
    );
};

export default OrderDetailPage;
