import React, { useState } from 'react';
import BillPanel from '../components/BillPanel';
import { usePOS } from '../context/POSContext';

const OrderPage = () => {
    const {
        categories, menuItems, loading,
        handleItemClick, cartItems, grandTotal,
    } = usePOS();

    const cartCount = cartItems.reduce((acc, item) => acc + (item.qty || 1), 0);

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [dietaryFilter, setDietaryFilter] = useState('All');
    const [showMobileCartDrawer, setShowMobileCartDrawer] = useState(false);

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

    const categoriesList = ['All', ...categories.map(cat => cat.category_name)];

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
        return cartItems
            .filter(cartItem => String(cartItem.item_id) === String(itemId))
            .reduce((sum, cartItem) => sum + (cartItem.qty || 1), 0);
    };

    return (
        <main className="container-fluid p-0 h-100 position-relative" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="order-page-layout-row g-0">
                {/* LEFT: CATEGORIES */}
                <div className="col-12 col-lg-2 bg-white py-2 py-lg-3 px-3 border-r-0 border-b lg:border-b-0 lg:border-r border-slate-200 no-scrollbar overflow-x-auto order-category-container" style={{ flexShrink: 0 }}>
                    <p className="text-muted small fw-bold text-uppercase mb-2 px-2 d-none d-lg-block" style={{ fontSize: '0.75rem' }}>Categories</p>
                    <div className="d-flex flex-row flex-lg-column gap-2 overflow-x-auto no-scrollbar py-1 flex-nowrap" style={{ flexWrap: 'nowrap' }}>
                        {categoriesList.map((cat, index) => (
                            <button
                                key={index}
                                className={`btn category-btn ${selectedCategory === cat ? 'btn-dark' : 'btn-outline-dark'} py-1.5 py-lg-2 px-3 mb-0 lg:mb-2 flex-shrink-0 whitespace-nowrap`}
                                style={{ flexShrink: 0, whiteSpace: 'nowrap', minWidth: 'max-content' }}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

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
                                placeholder="Search food..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ fontSize: '0.85rem' }}>🔍</span>
                            {searchQuery && (
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
                            >
                                <option value="All">🍽️ All Items</option>
                                <option value="Veg">🟢 Veg Only</option>
                                <option value="Non-Veg">🔴 Non-Veg</option>
                                <option value="Egg">🟡 Egg Only</option>
                            </select>
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
                        <div className="row g-2 g-sm-2.5 mt-2">
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

                                    const cartQty = getItemCartQty(item.item_id);

                                    return (
                                        <div className="col-6 col-sm-4 col-md-4 col-lg-3 mb-2" key={item.item_id}>
                                            <div
                                                className={`menu-card position-relative d-flex flex-column align-items-start justify-content-between p-2.5 p-sm-3 h-100 ${cartQty > 0 ? 'border-amber-500 bg-amber-500/5 shadow-sm' : ''}`}
                                                onClick={() => handleItemClick(item)}
                                                style={{ borderRadius: '12px' }}
                                            >
                                                {/* In-Cart Badge */}
                                                {cartQty > 0 && (
                                                    <span 
                                                        className="position-absolute badge bg-emerald-600 text-white font-extrabold shadow-sm px-2 py-1 rounded-full border border-white d-flex align-items-center gap-1"
                                                        style={{ top: '-8px', right: '6px', fontSize: '0.68rem', zIndex: 10, letterSpacing: '0.02em' }}
                                                    >
                                                        <span>🛒</span>
                                                        <span>x{cartQty} in cart</span>
                                                    </span>
                                                )}

                                                <div className="w-full mb-2" style={{ width: '100%' }}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="d-inline-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '14px', height: '14px', border: `1.5px solid ${badgeBorderColor}`, padding: '1.5px', borderRadius: '3px' }}>
                                                            <span className="rounded-full" style={{ width: '5px', height: '5px', backgroundColor: badgeDotColor }}></span>
                                                        </span>
                                                        <h6 className="m-0 text-slate-800 text-xs sm:text-base font-bold leading-snug" style={{ wordBreak: 'break-word' }}>
                                                            {item.item_name}
                                                        </h6>
                                                    </div>
                                                </div>
                                                <div className="w-full d-flex justify-content-between align-items-center mt-auto pt-1" style={{ width: '100%' }}>
                                                    <strong className="text-amber-500 font-bold text-sm sm:text-lg" style={{ fontSize: '1.05rem' }}>₹{parseFloat(item.price).toFixed(2)}</strong>
                                                    {item.variants && item.variants.length > 0 && (
                                                        <span className="text-[9px] sm:text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                                                            ✨ Custom
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
                                    <p className="text-muted">Oops! No items found matching your search.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: BILL PANEL */}
                <BillPanel />
            </div>

            {/* FLOATING MOBILE CART BAR (Visible ONLY on Mobile < 992px) */}
            <div 
                className="d-flex d-lg-none align-items-center justify-content-between px-3 py-2 text-white shadow-2xl animate-slide-in cursor-pointer"
                style={{
                    position: 'fixed',
                    bottom: '48px',
                    left: 0,
                    right: 0,
                    zIndex: 990,
                    background: cartCount > 0 
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' 
                        : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    borderTop: '1px solid #334155',
                    boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.35)'
                }}
                onClick={() => setShowMobileCartDrawer(true)}
            >
                <div className="d-flex align-items-center gap-2">
                    <div 
                        className={`d-flex align-items-center justify-content-center ${cartCount > 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'} font-bold rounded-full text-xs shadow-sm`}
                        style={{ width: '26px', height: '26px' }}
                    >
                        {cartCount}
                    </div>
                    <div>
                        <div className="fw-bold text-white text-xs" style={{ lineHeight: '1.1' }}>
                            {cartCount > 0 ? `${cartCount} ${cartCount === 1 ? 'Item' : 'Items'} Selected` : 'Order Bill'}
                        </div>
                        <div className={`${cartCount > 0 ? 'text-amber-400' : 'text-slate-400'} font-extrabold text-sm`} style={{ lineHeight: '1.1' }}>
                            {cartCount > 0 ? `₹${grandTotal.toFixed(2)}` : 'Tap to View Bill'}
                        </div>
                    </div>
                </div>

                <button 
                    className="btn btn-sm text-white font-bold text-xs py-1.5 px-3 rounded-2 shadow-sm d-flex align-items-center gap-1 active:scale-95 transition-all cursor-pointer"
                    style={{ 
                        background: cartCount > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#475569',
                        border: 0,
                        borderRadius: '8px'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMobileCartDrawer(true);
                    }}
                >
                    <span>View Order</span>
                    <span>→</span>
                </button>
            </div>

            {/* MOBILE SLIDE-UP BOTTOM DRAWER SHEET */}
            {showMobileCartDrawer && (
                <>
                    {/* Backdrop Overlay */}
                    <div 
                        className="d-lg-none transition-opacity"
                        style={{
                            position: 'fixed',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(15, 23, 42, 0.65)',
                            backdropFilter: 'blur(3px)',
                            zIndex: 998
                        }}
                        onClick={() => setShowMobileCartDrawer(false)}
                    />
                    
                    {/* Bottom Drawer Sheet Container */}
                    <div 
                        className="d-lg-none shadow-2xl bg-white rounded-t-3xl"
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '84vh',
                            maxHeight: '84vh',
                            zIndex: 999,
                            borderTopLeftRadius: '20px',
                            borderTopRightRadius: '20px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.4)'
                        }}
                    >
                        {/* Grab Handle */}
                        <div 
                            className="w-100 d-flex justify-content-center py-2 bg-slate-100 border-bottom cursor-pointer flex-shrink-0" 
                            onClick={() => setShowMobileCartDrawer(false)}
                        >
                            <div style={{ width: '40px', height: '4px', backgroundColor: '#94a3b8', borderRadius: '2px' }}></div>
                        </div>

                        {/* BillPanel inside Drawer */}
                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <BillPanel isMobileDrawer={true} onClose={() => setShowMobileCartDrawer(false)} />
                        </div>
                    </div>
                </>
            )}
        </main>
    );
};

export default OrderPage;
