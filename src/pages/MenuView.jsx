import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { usePOS } from '../context/POSContext';
import { API_BASE_URL } from '../config';

import { getDietaryInfo } from '../utils/dietaryUtils';

const MenuView = () => {
    const { categories, menuItems, setMenuData, posSettings, user } = usePOS();
    const [newCatName, setNewCatName] = useState('');
    const [showAddItemForm, setShowAddItemForm] = useState(false);
    const [newItemData, setNewItemData] = useState({
        item_name: '',
        price: '',
        dietary_info: 'Veg',
        category_id: ''
    });

    const [editingCategory, setEditingCategory] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [dietaryFilter, setDietaryFilter] = useState('All');
    const [showStats, setShowStats] = useState(false);

    const filteredMenuItems = menuItems.filter(item => {
        const matchesCategory = selectedCategoryId === 'All' || String(item.category_id) === String(selectedCategoryId);
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        const itemDietary = getDietaryInfo(item);
        const matchesDietary = dietaryFilter === 'All' || itemDietary === dietaryFilter;

        return matchesCategory && matchesSearch && matchesDietary;
    });

    const totalItemsCount = menuItems.length;
    const vegItemsCount = menuItems.filter(item => getDietaryInfo(item) === 'Veg').length;
    const nonVegItemsCount = menuItems.filter(item => getDietaryInfo(item) === 'Non-Veg').length;
    const eggItemsCount = menuItems.filter(item => getDietaryInfo(item) === 'Egg').length;

    const handleSaveCategory = async () => {
        if (!newCatName.trim()) return;
        const restaurantId = user?.restaurant_id || user?.restaurent_id || 9;

        if (editingCategory) {
            const catId = editingCategory.category_id;
            try {
                await fetch(`${API_BASE_URL}/categories/${catId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        restaurant_id: parseInt(restaurantId),
                        category_name: newCatName.trim(),
                        status: 1
                    })
                });
            } catch (error) {
                console.warn("API category update failed, updating local state:", error);
            }

            setMenuData(prev => ({
                ...prev,
                categories: (prev.categories || []).map(cat =>
                    String(cat.category_id) === String(catId)
                        ? { ...cat, category_name: newCatName.trim() }
                        : cat
                )
            }));
            setEditingCategory(null);
            setNewCatName('');
            toast.success("Category updated successfully!");
        } else {
            try {
                const response = await fetch(`${API_BASE_URL}/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        restaurant_id: parseInt(restaurantId),
                        category_name: newCatName.trim(),
                        status: 1
                    })
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const resData = await response.json();
                if (resData.status) {
                    const createdCat = resData.data || resData;
                    const categoryId = String(createdCat.category_id);
                    setMenuData(prev => ({
                        ...prev,
                        categories: [...(prev.categories || []), { category_id: categoryId, category_name: createdCat.category_name, items: [] }]
                    }));
                    setNewCatName('');
                    toast.success("Category created successfully!");
                } else {
                    throw new Error(resData.message || "Failed to create category.");
                }
            } catch (error) {
                console.warn("Category creation fallback to local state:", error.message);
                const mockId = `cat_${Date.now()}`;
                setMenuData(prev => ({
                    ...prev,
                    categories: [...(prev.categories || []), { category_id: mockId, category_name: newCatName.trim(), items: [] }]
                }));
                setNewCatName('');
                toast.success("Category created successfully!");
            }
        }
    };

    const handleDeleteCategory = async (cat) => {
        if (!window.confirm(`Are you sure you want to delete category "${cat.category_name}"?`)) return;

        try {
            await fetch(`${API_BASE_URL}/categories/${cat.category_id}`, { method: 'DELETE' });
        } catch (err) {
            console.warn('API category delete failed, deleting locally:', err.message);
        }

        setMenuData(prev => ({
            ...prev,
            categories: (prev.categories || []).filter(c => String(c.category_id) !== String(cat.category_id))
        }));

        if (editingCategory && String(editingCategory.category_id) === String(cat.category_id)) {
            setEditingCategory(null);
            setNewCatName('');
        }
        toast.success("Category deleted successfully!");
    };

    const handleAddNewItem = async (e) => {
        e.preventDefault();
        if (!newItemData.item_name || !newItemData.price || !newItemData.category_id) {
            toast.error("Please fill all required fields!");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/menus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category_id: parseInt(newItemData.category_id),
                    item_name: newItemData.item_name,
                    price: parseFloat(newItemData.price),
                    dietary_info: newItemData.dietary_info,
                    status: 1
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const resData = await response.json();
            if (resData.status && resData.data) {
                const createdItem = resData.data;
                const newItem = {
                    item_id: String(createdItem.item_id),
                    category_id: String(createdItem.category_id),
                    item_name: createdItem.item_name,
                    price: parseFloat(createdItem.price).toFixed(2),
                    tax_percentage: String(posSettings.taxRate),
                    dietary_info: createdItem.dietary_info,
                    variants: [],
                    addons: []
                };

                setMenuData(prev => {
                    const categoriesCopy = (prev.categories || []).map(cat => {
                        if (String(cat.category_id) === String(newItem.category_id)) {
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
                toast.success("Menu item created successfully!");
            } else {
                throw new Error(resData.message || "Failed to create menu item.");
            }
        } catch (error) {
            console.error("Failed to create menu item:", error);
            toast.error("Failed to create menu item: " + error.message);
        }
    };

    const deleteMenuItem = (itemId, catId) => {
        if (!window.confirm("Are you sure you want to delete this menu item?")) return;
        setMenuData(prev => {
            const categoriesCopy = (prev.categories || []).map(cat => {
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
        toast.success("Menu item deleted successfully!");
    };

    const [editingItem, setEditingItem] = useState(null);

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        if (!editingItem || !editingItem.item_name || !editingItem.price) return;

        try {
            await fetch(`${API_BASE_URL}/menus/${editingItem.item_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: parseInt(editingItem.category_id),
                    item_name: editingItem.item_name,
                    price: parseFloat(editingItem.price),
                    dietary_info: editingItem.dietary_info,
                    status: 1
                })
            });
        } catch (err) {
            console.warn('API update failed, updating local state:', err.message);
        }

        setMenuData(prev => {
            const categoriesCopy = (prev.categories || []).map(cat => {
                const filteredItems = (cat.items || []).filter(i => String(i.item_id) !== String(editingItem.item_id));
                if (String(cat.category_id) === String(editingItem.category_id)) {
                    const existing = (cat.items || []).find(i => String(i.item_id) === String(editingItem.item_id));
                    const updatedObj = {
                        ...(existing || {}),
                        ...editingItem,
                        item_id: String(editingItem.item_id),
                        category_id: String(editingItem.category_id),
                        price: parseFloat(editingItem.price).toFixed(2)
                    };
                    return {
                        ...cat,
                        items: [...filteredItems, updatedObj]
                    };
                }
                return { ...cat, items: filteredItems };
            });
            return { ...prev, categories: categoriesCopy };
        });

        setEditingItem(null);
        toast.success("Menu item updated successfully!");
    };

    return (
        <div className="container-fluid px-2 px-sm-3 py-3 py-sm-4 bg-slate-50" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="row g-2.5 g-sm-4">
                <div className="col-12 col-md-3 sticky-sidebar-mobile">
                    <div className="card shadow-sm border-0 rounded-3 bg-white">
                        <div className="card-body p-4">
                            {showStats ? (
                                /* VIEW A: SUMMARY STATS VIEW (Replaces Category List when showStats is true) */
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold m-0 text-slate-900 d-flex align-items-center gap-1.5" style={{ fontSize: '15px' }}>
                                            <span>📊</span> Summary Stats
                                        </h6>
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline-danger fw-bold px-2 py-1 d-flex align-items-center gap-1"
                                            style={{ fontSize: '12px', borderRadius: '6px' }}
                                            onClick={() => setShowStats(false)}
                                            title="Close Stats and show Categories"
                                        >
                                            ✕ Close
                                        </button>
                                    </div>

                                    <div className="d-flex flex-column gap-2 mb-4">
                                        <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 bg-slate-50 border border-slate-200">
                                            <span className="text-slate-700 font-semibold d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
                                                <span>📦</span> Total Items
                                            </span>
                                            <strong className="text-slate-900 fs-6">{totalItemsCount}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                            <span className="text-emerald-700 font-semibold d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', border: '1.5px solid #16a34a', borderRadius: '3px', flexShrink: 0 }}>
                                                    <span style={{ width: '5px', height: '5px', backgroundColor: '#16a34a', borderRadius: '50%' }}></span>
                                                </span>
                                                Pure Veg
                                            </span>
                                            <strong className="text-emerald-800 fs-6">{vegItemsCount}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecdd3' }}>
                                            <span className="text-rose-700 font-semibold d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', border: '1.5px solid #dc2626', borderRadius: '3px', flexShrink: 0 }}>
                                                    <span style={{ width: '5px', height: '5px', backgroundColor: '#dc2626', borderRadius: '50%' }}></span>
                                                </span>
                                                Non-Veg
                                            </span>
                                            <strong className="text-rose-800 fs-6">{nonVegItemsCount}</strong>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 border" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
                                            <span className="text-amber-700 font-semibold d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', border: '1.5px solid #d97706', borderRadius: '3px', flexShrink: 0 }}>
                                                    <span style={{ width: '5px', height: '5px', backgroundColor: '#d97706', borderRadius: '50%' }}></span>
                                                </span>
                                                Egg Dishes
                                            </span>
                                            <strong className="text-amber-800 fs-6">{eggItemsCount}</strong>
                                        </div>
                                    </div>

                                    {totalItemsCount > 0 && (
                                        <div className="p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                            <div className="d-flex justify-content-between align-items-center mb-1.5 text-slate-600" style={{ fontSize: '11px', fontWeight: 600 }}>
                                                <span>Dietary Ratio</span>
                                                <span>{totalItemsCount > 0 ? ((vegItemsCount / totalItemsCount) * 100).toFixed(0) : 0}% Veg</span>
                                            </div>
                                            <div className="progress overflow-hidden" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}>
                                                <div className="progress-bar bg-success" style={{ width: `${(vegItemsCount / totalItemsCount) * 100}%` }} title="Veg"></div>
                                                <div className="progress-bar bg-danger" style={{ width: `${(nonVegItemsCount / totalItemsCount) * 100}%` }} title="Non-Veg"></div>
                                                <div className="progress-bar bg-warning text-dark" style={{ width: `${(eggItemsCount / totalItemsCount) * 100}%` }} title="Egg"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* VIEW B: CATEGORIES LIST VIEW */
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold m-0 text-slate-900">Menu Categories</h6>
                                        <button 
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary text-slate-700 fw-bold px-2 py-1 d-flex align-items-center gap-1 border"
                                            style={{ fontSize: '11px', borderRadius: '6px' }}
                                            onClick={() => setShowStats(true)}
                                            title="View Summary Stats"
                                        >
                                            <span>📊</span> Stats
                                        </button>
                                    </div>

                                    <div className="list-group list-group-flush mb-4 gap-1">
                                        <div 
                                            className="list-group-item d-flex justify-content-between align-items-center transition-all"
                                            style={{ 
                                                cursor: 'pointer', 
                                                backgroundColor: selectedCategoryId === 'All' ? '#eff6ff' : 'transparent',
                                                color: selectedCategoryId === 'All' ? '#2563eb' : '#334155',
                                                border: selectedCategoryId === 'All' ? '1px solid #bfdbfe' : '1px solid transparent',
                                                borderRadius: '8px',
                                                padding: '8px 12px'
                                            }}
                                            onClick={() => setSelectedCategoryId('All')}
                                        >
                                            <span className="fw-semibold text-truncate" style={{ fontSize: '14px' }}>All Categories</span>
                                            <span className="badge rounded-pill" style={{ backgroundColor: selectedCategoryId === 'All' ? '#dbeafe' : '#f1f5f9', color: selectedCategoryId === 'All' ? '#1e40af' : '#475569', fontSize: '11px', fontWeight: 600 }}>
                                                {menuItems.length} items
                                            </span>
                                        </div>
                                        {categories.map((cat) => {
                                            const isSelected = String(selectedCategoryId) === String(cat.category_id);
                                            return (
                                                <div 
                                                    key={cat.category_id} 
                                                    className="list-group-item d-flex justify-content-between align-items-center transition-all"
                                                    style={{ 
                                                        cursor: 'pointer',
                                                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                                        color: isSelected ? '#2563eb' : '#334155',
                                                        border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                                                        borderRadius: '8px',
                                                        padding: '8px 12px'
                                                    }}
                                                    onClick={() => setSelectedCategoryId(cat.category_id)}
                                                >
                                                    <span className="fw-medium text-truncate me-1" style={{ maxWidth: '55%', fontSize: '14px' }}>{cat.category_name}</span>
                                                    <div className="d-flex align-items-center gap-1.5">
                                                        <span className="badge rounded-pill" style={{ backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9', color: isSelected ? '#1e40af' : '#475569', fontSize: '11px', fontWeight: 600 }}>
                                                            {cat.items?.length || 0} items
                                                        </span>
                                                        <button 
                                                            type="button"
                                                            className="btn btn-sm text-slate-500 p-1 border-0 rounded d-inline-flex align-items-center justify-content-center"
                                                            style={{ width: '24px', height: '24px' }}
                                                            title="Edit Category"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingCategory(cat);
                                                                setNewCatName(cat.category_name);
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            className="btn btn-sm text-danger p-1 border-0 rounded d-inline-flex align-items-center justify-content-center"
                                                            style={{ width: '24px', height: '24px' }}
                                                            title="Delete Category"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteCategory(cat);
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="border-top pt-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                                            <label className="form-label text-slate-500 small fw-bold text-uppercase mb-0" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                                                {editingCategory ? "Edit Category" : "Add Category"}
                                            </label>
                                            {editingCategory && (
                                                <button 
                                                    type="button"
                                                    className="btn btn-sm text-danger p-0 border-0 fw-bold d-flex align-items-center gap-1"
                                                    style={{ fontSize: '11px' }}
                                                    onClick={() => {
                                                        setEditingCategory(null);
                                                        setNewCatName('');
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                                                    </svg>
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                        <div className="input-group">
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                placeholder="Category Name" 
                                                value={newCatName}
                                                onChange={(e) => setNewCatName(e.target.value)}
                                                style={{ borderRadius: '8px 0 0 8px', fontSize: '13px' }}
                                            />
                                            {editingCategory ? (
                                                <button className="btn btn-dark btn-sm fw-bold px-3" style={{ borderRadius: '0 8px 8px 0' }} onClick={handleSaveCategory}>Update</button>
                                            ) : (
                                                <button className="btn btn-dark btn-sm fw-bold px-3" style={{ borderRadius: '0 8px 8px 0' }} onClick={handleSaveCategory}>Add</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-9">
                    {/* TOP DEDICATED SEARCH & DIETARY FILTER BAR DIV */}
                    <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white">
                        <div className="card-body p-3">
                            <div className="row g-3 align-items-center">
                                <div className="col-12 col-md-6">
                                    <div className="position-relative">
                                        <input 
                                            type="text" 
                                            className="form-control ps-5" 
                                            placeholder="Search menu items by name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{ borderRadius: '8px', fontSize: '14px', height: '40px' }}
                                        />
                                        <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-slate-400">
                                            🔍
                                        </span>
                                        {searchQuery && (
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-link text-muted position-absolute top-50 end-0 translate-middle-y me-2 text-decoration-none"
                                                onClick={() => setSearchQuery('')}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="col-12 col-md-6 d-flex justify-content-md-end gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar flex-nowrap py-1">
                                    <button 
                                        type="button"
                                        className={`btn btn-sm ${dietaryFilter === 'All' ? 'btn-dark' : 'btn-outline-secondary'} fw-bold px-2.5 sm:px-3`}
                                        style={{ borderRadius: '6px', height: '36px', minWidth: '40px', whiteSpace: 'nowrap' }}
                                        onClick={() => setDietaryFilter('All')}
                                    >
                                        All
                                    </button>
                                    <button 
                                        type="button"
                                        className={`btn btn-sm ${dietaryFilter === 'Veg' ? 'btn-success text-white' : 'btn-outline-success'} fw-bold px-2.5 sm:px-3 d-flex align-items-center gap-1`}
                                        style={{ borderRadius: '6px', height: '36px', whiteSpace: 'nowrap' }}
                                        onClick={() => setDietaryFilter('Veg')}
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '12px', height: '12px', border: '1.5px solid currentColor', borderRadius: '3px', padding: '1px' }}>
                                            <span style={{ width: '4px', height: '4px', backgroundColor: 'currentColor', borderRadius: '50%' }}></span>
                                        </span>
                                        Veg
                                    </button>
                                    <button 
                                        type="button"
                                        className={`btn btn-sm ${dietaryFilter === 'Non-Veg' ? 'btn-danger text-white' : 'btn-outline-danger'} fw-bold px-2.5 sm:px-3 d-flex align-items-center gap-1`}
                                        style={{ borderRadius: '6px', height: '36px', whiteSpace: 'nowrap' }}
                                        onClick={() => setDietaryFilter('Non-Veg')}
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '12px', height: '12px', border: '1.5px solid currentColor', borderRadius: '3px', padding: '1px' }}>
                                            <span style={{ width: '4px', height: '4px', backgroundColor: 'currentColor', borderRadius: '50%' }}></span>
                                        </span>
                                        Non-Veg
                                    </button>
                                    <button 
                                        type="button"
                                        className={`btn btn-sm ${dietaryFilter === 'Egg' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'} fw-bold px-2.5 sm:px-3 d-flex align-items-center gap-1`}
                                        style={{ borderRadius: '6px', height: '36px', whiteSpace: 'nowrap' }}
                                        onClick={() => setDietaryFilter('Egg')}
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '12px', height: '12px', border: '1.5px solid currentColor', borderRadius: '3px', padding: '1px' }}>
                                            <span style={{ width: '4px', height: '4px', backgroundColor: 'currentColor', borderRadius: '50%' }}></span>
                                        </span>
                                        Egg
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECOND MAIN CARD: MENU DIRECTORY */}
                    <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white">
                        <div className="card-body p-2.5 p-sm-4">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                                <div>
                                    <h5 className="fw-bold text-slate-900 mb-1">Menu Directory</h5>
                                    <p className="text-muted small mb-0">Manage items, pricing, and configurations</p>
                                </div>
                                <div>
                                    <button 
                                        className="btn btn-primary btn-sm text-white fw-bold px-3"
                                        style={{ borderRadius: '8px', fontSize: '13px', height: '36px' }}
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
                                                <option value="Veg">Veg</option>
                                                <option value="Non-Veg">Non-Veg</option>
                                                <option value="Egg">Egg</option>
                                            </select>
                                        </div>
                                        <div className="col-12 d-flex gap-2 justify-content-end mt-4">
                                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddItemForm(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-success btn-sm px-4 text-white">Add to Menu</button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            <div className="row g-3 g-sm-4 gy-3 gy-sm-4">
                                {filteredMenuItems.map((item) => {
                                    const catName = categories.find(c => String(c.category_id) === String(item.category_id))?.category_name || 'Unassigned';
                                    const dietary = getDietaryInfo(item);
                                    return (
                                        <div className="col-6 col-sm-4 col-md-4 col-lg-3 mb-3 mb-sm-4" key={item.item_id}>
                                            <div 
                                                className="menu-card d-flex flex-column align-items-start justify-content-between p-2.5 p-sm-3 position-relative bg-white shadow-sm border" 
                                                style={{ minHeight: '135px', cursor: 'pointer', borderRadius: '12px' }}
                                                onClick={() => setEditingItem({
                                                    item_id: item.item_id,
                                                    category_id: item.category_id,
                                                    item_name: item.item_name,
                                                    price: item.price,
                                                    dietary_info: dietary
                                                })}
                                            >
                                                <div className="w-full d-flex align-items-start mb-1.5 gap-1.5" style={{ width: '100%' }}>
                                                    {dietary === 'Non-Veg' ? (
                                                        <span title="Non-Veg" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '15px', height: '15px', border: '1.5px solid #dc2626', borderRadius: '3px', padding: '1px', flexShrink: 0, marginTop: '2px' }}>
                                                            <span style={{ width: '5px', height: '5px', backgroundColor: '#dc2626', borderRadius: '50%' }}></span>
                                                        </span>
                                                    ) : dietary === 'Egg' ? (
                                                        <span title="Egg" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '15px', height: '15px', border: '1.5px solid #d97706', borderRadius: '3px', padding: '1px', flexShrink: 0, marginTop: '2px' }}>
                                                            <span style={{ width: '5px', height: '5px', backgroundColor: '#d97706', borderRadius: '50%' }}></span>
                                                        </span>
                                                    ) : (
                                                        <span title="Veg" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '15px', height: '15px', border: '1.5px solid #16a34a', borderRadius: '3px', padding: '1px', flexShrink: 0, marginTop: '2px' }}>
                                                            <span style={{ width: '5px', height: '5px', backgroundColor: '#16a34a', borderRadius: '50%' }}></span>
                                                        </span>
                                                    )}
                                                    <h6 className="m-0 text-slate-900 text-xs sm:text-sm font-bold leading-snug" style={{ flex: 1, wordBreak: 'break-word' }}>{item.item_name}</h6>
                                                </div>
                                                <div className="w-full mb-2">
                                                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '10.5px', fontWeight: 500 }}>{catName}</span>
                                                </div>
                                                <div className="w-full d-flex justify-content-between align-items-center mt-auto" style={{ width: '100%' }}>
                                                    <strong className="text-amber-500 font-bold text-sm sm:text-base" style={{ fontSize: '1.05rem' }}>₹{parseFloat(item.price).toFixed(2)}</strong>
                                                    <button 
                                                        className="btn btn-sm text-danger p-0 d-flex align-items-center justify-content-center border-0"
                                                        style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fff1f2', color: '#e11d48' }}
                                                        title="Delete Item"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteMenuItem(item.item_id, item.category_id);
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredMenuItems.length === 0 && (
                                    <div className="col-12 text-center py-5">
                                        <div className="fs-1 opacity-20">🍽️</div>
                                        <p className="text-muted mt-2">No menu items found in this category.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT MENU ITEM MODAL */}
            {editingItem && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0 rounded-4">
                            <div className="modal-header border-bottom p-3">
                                <h6 className="modal-title fw-bold text-slate-900">✏️ Edit Menu Item</h6>
                                <button type="button" className="btn-close" onClick={() => setEditingItem(null)}></button>
                            </div>
                            <form onSubmit={handleUpdateItem}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-slate-700">Item Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            required
                                            value={editingItem.item_name}
                                            onChange={(e) => setEditingItem(prev => ({ ...prev, item_name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-slate-700">Category</label>
                                            <select 
                                                className="form-select"
                                                value={editingItem.category_id}
                                                onChange={(e) => setEditingItem(prev => ({ ...prev, category_id: e.target.value }))}
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-slate-700">Price (₹)</label>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                className="form-control" 
                                                required
                                                value={editingItem.price}
                                                onChange={(e) => setEditingItem(prev => ({ ...prev, price: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label small fw-bold text-slate-700">Dietary Type</label>
                                        <select 
                                            className="form-select"
                                            value={editingItem.dietary_info || 'Veg'}
                                            onChange={(e) => setEditingItem(prev => ({ ...prev, dietary_info: e.target.value }))}
                                        >
                                            <option value="Veg">Veg</option>
                                            <option value="Non-Veg">Non-Veg</option>
                                            <option value="Egg">Egg</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer border-top p-3 d-flex justify-content-end gap-2">
                                    <button type="button" className="btn btn-light btn-sm fw-bold" onClick={() => setEditingItem(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-dark btn-sm fw-bold px-4 text-white">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuView;
