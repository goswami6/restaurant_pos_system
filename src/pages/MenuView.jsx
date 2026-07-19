import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { API_BASE_URL } from '../config';

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

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        const restaurantId = user?.restaurant_id || user?.restaurent_id || 9;

        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    restaurant_id: parseInt(restaurantId),
                    category_name: newCatName.trim(),
                    status: 1
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const resData = await response.json();
            if (resData.status) {
                const createdCat = resData.data || resData;
                const categoryId = String(createdCat.category_id);
                setMenuData(prev => ({
                    ...prev,
                    categories: [...(prev.categories || []), { category_id: categoryId, category_name: createdCat.category_name, items: [] }]
                }));
                setNewCatName('');
                alert("Category created successfully!");
            } else {
                throw new Error(resData.message || "Failed to create category.");
            }
        } catch (error) {
            console.error("Failed to create category:", error);
            alert("Failed to create category: " + error.message);
        }
    };

    const handleAddNewItem = async (e) => {
        e.preventDefault();
        if (!newItemData.item_name || !newItemData.price || !newItemData.category_id) {
            alert("Please fill all required fields!");
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
                alert("Menu item created successfully!");
            } else {
                throw new Error(resData.message || "Failed to create menu item.");
            }
        } catch (error) {
            console.error("Failed to create menu item:", error);
            alert("Failed to create menu item: " + error.message);
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
    };

    return (
        <div className="container-fluid py-4 bg-slate-50" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="row g-4">
                <div className="col-12 col-md-3">
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
                                        <div className="col-6 col-sm-4 col-md-4 col-lg-3" key={item.item_id}>
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

export default MenuView;
