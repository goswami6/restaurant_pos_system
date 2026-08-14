import React from 'react';
import { getDietaryInfo } from '../utils/dietaryUtils';

const FoodItemCard = ({ item, cartQty = 0, onClick }) => {
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
        <div className="col-6 col-sm-4 col-md-4 col-lg-3 mb-2">
            <div
                className={`menu-card position-relative d-flex flex-column align-items-start justify-content-between p-2.5 p-sm-3 h-100 ${cartQty > 0 ? 'border-amber-500 bg-amber-500/5 shadow-sm' : ''}`}
                onClick={() => onClick && onClick(item)}
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
                    <strong className="text-amber-500 font-bold text-sm sm:text-lg" style={{ fontSize: '1.05rem' }}>₹{parseFloat(item.price || 0).toFixed(2)}</strong>
                    {item.variants && item.variants.length > 0 && (
                        <span className="text-[9px] sm:text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                            ✨ Custom
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FoodItemCard;
