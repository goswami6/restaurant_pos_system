import React, { useState } from 'react';
import BillPanel from '../components/BillPanel';
import { usePOS } from '../context/POSContext';

const OrderPage = () => {
    const {
        categories, menuItems, loading,
        handleItemClick,
    } = usePOS();

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

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
        const matchesCategory = selectedCategory === 'All' ||
            categories.find(c => c.category_name === selectedCategory)?.category_id === item.category_id;
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <main className="container-fluid p-0 h-100" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="row g-0 h-100 flex-column flex-lg-row overflow-auto lg:overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
                {/* LEFT: CATEGORIES */}
                <div className="col-12 col-lg-2 bg-white pt-3 px-3 pb-4 border-r-0 border-b lg:border-b-0 lg:border-r border-slate-200" style={{ overflowX: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <p className="text-muted small fw-bold text-uppercase mb-2 px-2 d-none d-lg-block" style={{ fontSize: '0.75rem' }}>Categories</p>
                    <div className="d-flex flex-row flex-lg-column gap-2 overflow-auto py-1">
                        {categoriesList.map((cat, index) => (
                            <button
                                key={index}
                                className={`btn category-btn ${selectedCategory === cat ? 'btn-dark' : 'btn-outline-dark'} py-2 px-3 mb-0 lg:mb-2`}
                                style={{ minWidth: '100px' }}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CENTER: MENU ITEMS */}
                <div className="col-12 col-md-7 col-lg-7 pt-4 px-4 pb-5 bg-slate-50 h-100" style={{ overflowY: 'auto', minHeight: '400px', paddingBottom: '3rem' }}>
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
                                    <p className="text-muted">Oops! No items found matching your search.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: BILL PANEL */}
                <BillPanel />
            </div>
        </main>
    );
};

export default OrderPage;
