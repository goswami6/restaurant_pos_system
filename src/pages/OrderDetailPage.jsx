import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '../context/POSContext';
import ReceiptModal from '../components/ReceiptModal';

const OrderDetailPage = () => {
    const { selectedDetailOrder: order, categories, menuItems, loading, posSettings, handleUpdateOrder, cancelActiveOrder } = usePOS();
    const navigate = useNavigate();
    const [showReceiptPrint, setShowReceiptPrint] = useState(false);
    const onBack = () => navigate('/history');
    const onUpdateOrder = handleUpdateOrder;
    const handleCancelClick = async () => {
        if (order?.order_id) {
            await cancelActiveOrder(order.order_id, order.table_number);
            navigate('/history');
        }
    };
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [tempCart, setTempCart] = useState(() => {
        const initialCart = {};
        if (order && order.items) {
            order.items.forEach(item => {
                initialCart[item.id] = { ...item };
            });
        }
        return initialCart;
    });

    // Customization Modal states
    const [selectedItemForModal, setSelectedItemForModal] = useState(null);
    const [chosenVariant, setChosenVariant] = useState(null);

    const isPaid = order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'CANCELLED';
    const categoriesList = ['All', ...categories.map(cat => cat.category_name)];

    const getDietaryInfo = (item) => {
        const nameLower = item.item_name.toLowerCase();
        if (nameLower.includes('non veg') || nameLower.includes('chicken') || nameLower.includes('mutton') || nameLower.includes('fish') || nameLower.includes('prawn') || nameLower.includes('pork') || nameLower.includes('beef') || nameLower.includes('sandwich') || nameLower.includes('tikka masala') || nameLower.includes('tandoori') && !nameLower.includes('paneer')) {
            return 'Non-Veg';
        }
        if (nameLower.includes('egg')) {
            return 'Egg';
        }
        return item.dietary_info || 'Veg';
    };

    // Filter menu items
    const filteredItems = menuItems.filter((item) => {
        const matchesCategory = selectedCategory === 'All' || 
            categories.find(c => c.category_name === selectedCategory)?.category_id === item.category_id;
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

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
            alert("This order is already PAID and cannot be modified.");
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
        const menuItem = menuItems.find(mi => mi.item_id === item.item_id);
        const taxPercentage = menuItem ? parseFloat(menuItem.tax_percentage || posSettings.taxRate) : posSettings.taxRate;
        const itemCost = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
        return sum + ((itemCost * item.qty) * taxPercentage / 100);
    }, 0);

    const serviceCharge = subtotal * (posSettings.serviceCharge / 100);
    const grandTotal = subtotal + tax + serviceCharge;

    const handleSave = () => {
        if (tempCartItems.length === 0) {
            alert("Order cannot be empty! Please add at least one item or cancel.");
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
            <div className="bg-white border-bottom px-3 py-2 d-flex justify-content-between align-items-center" style={{ flexShrink: 0 }}>
                <div className="d-flex align-items-center gap-3">
                    <button className="btn btn-sm btn-outline-dark fw-bold py-1 px-2.5 text-xs" style={{ borderRadius: '6px' }} onClick={onBack}>
                        ← Back
                    </button>
                    <div>
                        <h6 className="fw-bold mb-0 text-slate-900" style={{ fontSize: '0.92rem', lineHeight: '1.2' }}>
                            Order Details: <span className="text-primary">#{order.order_id}</span>
                        </h6>
                        <span className="text-muted d-block" style={{ fontSize: '0.72rem', marginTop: '1px' }}>
                            {order.table_number} • {order.type} • {new Date(order.time).toLocaleString()}
                        </span>
                    </div>
                </div>
                <div>
                    <span className={`badge ${
                        (String(order.status || '').toUpperCase() === 'PAID' || String(order.status || '').toUpperCase() === 'COMPLETED' || String(order.status || '').toUpperCase() === 'SERVED') ? 'bg-success text-white' :
                        String(order.status || '').toUpperCase() === 'CANCELLED' ? 'bg-danger text-white' : 'bg-warning text-dark'
                    } py-1 px-2.5 text-xs`} style={{ borderRadius: '6px' }}>
                        {order.status}
                    </span>
                </div>
            </div>

            <main className="container-fluid p-0" style={{ flex: 1, minHeight: 0 }}>
                <div className="row g-0 h-100 flex-column flex-lg-row overflow-auto lg:overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
                    {/* LEFT: CATEGORIES */}
                    <div className="col-12 col-lg-2 bg-white pt-3 px-3 border-r-0 border-b lg:border-b-0 lg:border-r border-slate-200" style={{ overflowX: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <p className="text-muted small fw-bold text-uppercase mb-2 px-2 d-none d-lg-block" style={{ fontSize: '0.75rem' }}>Categories</p>
                        <div className="d-flex flex-row flex-lg-column gap-2 overflow-auto py-1">
                            {categoriesList.map((cat, index) => (
                                <button 
                                    key={index} 
                                    className={`btn category-btn ${selectedCategory === cat ? 'btn-dark' : 'btn-outline-dark'} py-2 px-3 mb-0 lg:mb-2`}
                                    onClick={() => setSelectedCategory(cat)}
                                    disabled={isPaid}
                                    style={isPaid ? { opacity: 0.6, cursor: 'not-allowed', minWidth: '100px' } : { minWidth: '100px' }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CENTER: MENU ITEMS */}
                    <div className="col-12 col-md-7 col-lg-7 pt-3 px-4 bg-slate-50 h-100" style={{ overflowY: 'auto', minHeight: '400px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold mb-0">{selectedCategory} Items</h5>
                            <div className="position-relative" style={{ width: '300px' }}>
                                <input 
                                    type="text" 
                                    className="form-control border-0 shadow-sm" 
                                    style={{ borderRadius: '10px', paddingLeft: '35px' }}
                                    placeholder={isPaid ? "Order is locked..." : "Search food..."} 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={isPaid}
                                />
                                <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">🔍</span>
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
                            <div className="row g-4" style={isPaid ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => {
                                        const dietary = getDietaryInfo(item);
                                        let badgeBorderColor = '#198754'; // Veg: green
                                        let badgeDotColor = '#198754';
                                        if (dietary === 'Non-Veg') {
                                            badgeBorderColor = '#dc3545'; // Non-Veg: red
                                            badgeDotColor = '#dc3545';
                                        } else if (dietary === 'Egg') {
                                            badgeBorderColor = '#d97706'; // Egg: amber/orange
                                            badgeDotColor = '#d97706';
                                        }

                                        return (
                                            <div className="col-6 col-sm-4 col-md-4 col-lg-3" key={item.item_id}>
                                                <div 
                                                    className="menu-card d-flex flex-column align-items-start justify-content-between p-3"
                                                    onClick={() => handleItemClick(item)}
                                                >
                                                    <div className="w-full mb-2" style={{ width: '100%' }}>
                                                        <div className="d-flex align-items-start">
                                                            <span className="d-inline-flex align-items-center justify-content-center me-2 mt-0.5" style={{ width: '13px', height: '13px', flexShrink: 0, border: `1px solid ${badgeBorderColor}`, padding: '1.5px' }}>
                                                                <span className="rounded-full" style={{ width: '6px', height: '6px', backgroundColor: badgeDotColor }}></span>
                                                            </span>
                                                            <h6 className="m-0 text-slate-800 text-sm font-bold leading-tight" style={{ wordBreak: 'break-word' }}>
                                                                {item.item_name}
                                                            </h6>
                                                        </div>
                                                    </div>
                                                    <div className="w-full d-flex justify-content-between align-items-center mt-2" style={{ width: '100%' }}>
                                                        <strong className="text-amber-500 font-bold">₹{parseFloat(item.price).toFixed(2)}</strong>
                                                        {item.variants && item.variants.length > 0 && (
                                                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                ✨ Customize
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-12 text-center py-5">
                                        <div className="fs-1 mb-2">🤷‍♂️</div>
                                        <p className="text-muted">No items found.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: BILL SIDE PANEL */}
                    <div className="col-12 col-md-5 col-lg-3 bill-panel h-100 border-t lg:border-t-0 border-slate-200" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '450px' }}>
                        <div className="py-2 px-3 border-bottom d-flex justify-content-between align-items-center" style={{ flexShrink: 0 }}>
                            <div>
                                <h6 className="fw-bold mb-0 text-slate-800" style={{ fontSize: '0.9rem' }}>Order Bill summary</h6>
                                <span className="text-muted" style={{ fontSize: '0.72rem' }}>Status: {order.status}</span>
                            </div>
                            {isPaid ? (
                                <span className="badge bg-success text-white py-1 px-2 text-[10px]" style={{ borderRadius: '4px' }}>Closed</span>
                            ) : (
                                <span className="badge bg-warning text-dark py-1 px-2 text-[10px]" style={{ borderRadius: '4px' }}>Editable</span>
                            )}
                        </div>

                        {/* ITEMS LIST */}
                        <div className="cart-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '15px' }}>
                            {tempCartItems.length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="fs-1 opacity-20">🛒</div>
                                    <p className="text-muted mt-2">Order is empty</p>
                                </div>
                            ) : (
                                tempCartItems.map(item => {
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
                                                {!isPaid ? (
                                                    <>
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
                                                    </>
                                                ) : (
                                                    <span className="text-muted small">Qty: <strong>{item.qty}</strong></span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* BILL BREAKDOWN & ACTIONS */}
                        <div className="p-3 bg-light border-top mt-auto">
                            <div className="d-flex justify-content-between mb-1" style={{ fontSize: '12px' }}>
                                <span className="text-muted">Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-1" style={{ fontSize: '12px' }}>
                                <span className="text-muted">Tax ({posSettings?.taxRate || 5}%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2" style={{ fontSize: '12px' }}>
                                <span className="text-muted">Service Charge ({posSettings?.serviceCharge || 10}%)</span>
                                <span>₹{serviceCharge.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <strong className="fs-6">Grand Total</strong>
                                <strong className="fs-6 text-primary">₹{grandTotal.toFixed(2)}</strong>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {isPaid && (
                                    <div className="text-center text-danger small fw-bold mb-1">
                                        🔒 Order Closed ({order.status}) - Cannot Edit
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button 
                                        className="btn btn-outline-secondary py-2.5 text-xs font-bold" 
                                        onClick={resetChanges}
                                        disabled={isPaid}
                                    >
                                        Discard Changes
                                    </button>
                                    <button 
                                        className="btn btn-dark py-2.5 text-xs font-bold text-white" 
                                        onClick={handleSave}
                                        disabled={isPaid}
                                    >
                                        Update Order
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button 
                                        type="button" 
                                        className="btn btn-blue w-100 py-2.5 text-xs font-bold" 
                                        onClick={() => setShowReceiptPrint(true)}
                                    >
                                        🖨️ {isPaid ? 'Print Receipt' : 'Print Bill / KOT'}
                                    </button>
                                    {order.status !== 'CANCELLED' && (
                                        <button 
                                            type="button" 
                                            className="btn btn-danger w-100 py-2.5 text-xs font-bold text-white" 
                                            onClick={handleCancelClick}
                                            disabled={isPaid}
                                        >
                                            🚫 Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
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
