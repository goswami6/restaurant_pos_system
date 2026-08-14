import React from 'react';

const CategorySidebar = ({ 
    categoriesList = [], 
    selectedCategory = 'All', 
    onSelectCategory, 
    disabled = false 
}) => {
    return (
        <div 
            className="col-12 col-lg-2 bg-white py-2 py-lg-3 px-2 px-sm-3 border-r-0 border-b lg:border-b-0 lg:border-r border-slate-200 no-scrollbar overflow-x-auto order-category-container" 
            style={{ flexShrink: 0 }}
        >
            <p className="text-muted small fw-bold text-uppercase mb-2 px-2 d-none d-lg-block" style={{ fontSize: '0.75rem' }}>
                Categories
            </p>
            <div className="d-flex flex-row flex-lg-column gap-1.5 gap-sm-2 overflow-x-auto no-scrollbar py-0.5 flex-nowrap" style={{ flexWrap: 'nowrap' }}>
                {categoriesList.map((cat, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`btn category-btn ${selectedCategory === cat ? 'btn-dark' : 'btn-outline-dark'} py-1.5 py-lg-2 px-3 mb-0 lg:mb-2 flex-shrink-0 whitespace-nowrap`}
                        style={{ 
                            flexShrink: 0, 
                            whiteSpace: 'nowrap', 
                            minWidth: 'max-content',
                            fontSize: '0.8rem',
                            ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                        }}
                        onClick={() => !disabled && onSelectCategory && onSelectCategory(cat)}
                        disabled={disabled}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategorySidebar;
