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

    const categoriesList = ['All', ...categories.map(cat => cat.category_name)];

    const filteredItems = menuItems.filter((item) => {
        const matchesCategory = selectedCategory === 'All' ||
            categories.find(c => c.category_name === selectedCategory)?.category_id === item.category_id;
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
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
                                            <div className="w-full d-flex justify-content-between align-items-start mb-2" style={{ width: '100%' }}>
                                                <h6 className="m-0 text-slate-800 text-sm font-bold text-truncate" style={{ maxWidth: '75%' }}>{item.item_name}</h6>
                                                <span className={`badge ${item.dietary_info === 'Veg' ? 'bg-success-subtle text-success border border-success/20' : 'bg-danger-subtle text-danger border border-danger/20'} font-normal text-[10px] py-1`}>
                                                    {item.dietary_info}
                                                </span>
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
                <BillPanel />
            </div>
        </main>
    );
};

export default OrderPage;
