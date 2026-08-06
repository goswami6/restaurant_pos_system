import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { usePOS } from '../context/POSContext';
import ReceiptModal from './ReceiptModal';

const BillPanel = ({ isMobileDrawer = false, onClose }) => {
    const {
        user,
        orderType,
        activeTableInfo,
        tableId,
        cartItems,
        subtotal, tax, serviceCharge, grandTotal,
        posSettings,
        setCart, setCartModified, setTableModified,
        updateQty, removeItem,
        sendOrderToKitchen,
        handlePrintKOT, printDirectToPrinter,
        markTableAsAvailable, checkInTable, cancelActiveOrder,
        tablesList, setTableId,
    } = usePOS();

    const [showBillSummary, setShowBillSummary] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    return (
        <div 
            className={isMobileDrawer ? "w-100 h-100 bill-panel" : "col-12 col-lg-3 bill-panel border-t lg:border-t-0 border-slate-200"} 
            style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}
        >
            {/* HEADER */}
            <div className="py-1.5 px-3 border-bottom d-flex justify-content-between align-items-center flex-nowrap gap-2">
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="d-flex align-items-center gap-1.5">
                        <span className="fw-bold text-slate-800 text-base" style={{ whiteSpace: 'nowrap' }}>
                            {posSettings.isEnableTables ? (
                                <>{activeTableInfo?.section_name ? `${activeTableInfo.section_name} - ` : ''}{tableId}</>
                            ) : (
                                "Direct Order"
                            )}
                        </span>
                        {posSettings.isEnableTables && activeTableInfo && (
                            <span className={`badge ${
                                activeTableInfo.status === 'Occupied' ? 'bg-danger' : 
                                activeTableInfo.status === 'Dirty' ? 'bg-warning text-dark' : 'bg-success'
                            } text-white`} style={{ whiteSpace: 'nowrap', fontSize: '0.62rem', padding: '2px 5px' }}>
                                {activeTableInfo.status}
                            </span>
                        )}
                    </div>
                    {posSettings.isEnableTables && activeTableInfo?.status === 'Occupied' && activeTableInfo?.current_session?.active_order_id ? (
                        <span className="text-muted d-block" style={{ fontSize: '0.68rem', lineHeight: 1 }}>Order #{activeTableInfo.current_session.active_order_id}</span>
                    ) : posSettings.isEnableTables ? (
                        <span className="text-muted d-block" style={{ fontSize: '0.68rem', lineHeight: 1 }}>New Session</span>
                    ) : null}
                </div>

                {/* Table Selector Dropdown */}
                {posSettings.isEnableTables && (
                    <select
                        className="form-select form-select-sm ms-auto py-1"
                        style={{ width: 'auto', maxWidth: '140px', fontSize: '0.72rem', borderRadius: '5px', flexShrink: 0, paddingRight: '20px' }}
                        value={tableId}
                        onChange={(e) => setTableId(e.target.value)}
                    >
                        {tablesList.map(t => (
                            <option key={t.table_id} value={t.table_number}>
                                {t.table_name}{t.capacity ? ` | ${t.capacity} Seats` : ''}
                            </option>
                        ))}
                    </select>
                )}

                {/* Close Mobile Drawer Button */}
                {isMobileDrawer && onClose && (
                    <button 
                        type="button" 
                        className="btn btn-sm btn-light border rounded-circle p-1.5 ms-2 flex-shrink-0 d-flex align-items-center justify-content-center"
                        style={{ width: '28px', height: '28px', lineHeight: 1 }}
                        onClick={onClose}
                        aria-label="Close Drawer"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* CART ITEMS LIST */}
            <div className="p-3 bill-items" style={{ flex: 1, overflowY: 'auto' }}>
                {posSettings.isEnableTables && activeTableInfo?.status === 'Dirty' ? (
                    <div className="text-center py-5 px-3">
                        <div className="fs-1 mb-2">🧹</div>
                        <h6 className="fw-bold text-danger">Table Needs Cleaning</h6>
                        <p className="text-muted small mt-2">
                            Last Order: <strong>{activeTableInfo.current_session?.last_order_id || 'N/A'}</strong><br />
                            Cleared at: {activeTableInfo.current_session?.updated_at ? new Date(activeTableInfo.current_session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </p>
                        <button className="btn btn-sm btn-warning mt-2 w-100 py-2" onClick={() => markTableAsAvailable(activeTableInfo.table_number)}>
                            ✅ Mark as Clean
                        </button>
                    </div>
                ) : posSettings.isEnableTables && activeTableInfo?.status === 'Available' && cartItems.length === 0 ? (
                    <div className="text-center py-5 px-3">
                        <div className="fs-1 mb-2">🪑</div>
                        <h6 className="fw-bold text-success">Table is Available</h6>
                        <p className="text-muted small mt-2">No active dining session is currently in progress.</p>
                        <button className="btn btn-sm btn-success mt-2 w-100 py-2" onClick={() => checkInTable(activeTableInfo.table_number)}>
                            Seat Guests
                        </button>
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="empty-cart text-center py-5">
                        <div style={{ fontSize: '2.5rem' }}>🛒</div>
                        <p className="text-muted small mt-2">No items added to bill yet.</p>
                    </div>
                ) : (
                    cartItems.map((item) => {
                        const itemUnitPrice = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
                        const itemTotalPrice = itemUnitPrice * item.qty;

                        return (
                            <div key={item.id} className="bill-item pb-2.5 mb-2.5 border-bottom">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                    <div>
                                        <div className="fw-bold text-slate-800" style={{ fontSize: '0.9rem' }}>{item.name}</div>
                                        {item.selectedVariant && (
                                            <span className="badge bg-slate-100 text-slate-700 border border-slate-200 mt-1" style={{ fontSize: '0.68rem' }}>
                                                {item.selectedVariant.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="fw-bold text-slate-900" style={{ fontSize: '0.9rem' }}>
                                        ₹{itemTotalPrice.toFixed(2)}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <div className="quantity-controls d-flex align-items-center gap-2">
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
                                        className="btn btn-sm btn-outline-danger border-0 p-1 rounded-2 transition-all hover:bg-rose-50"
                                        onClick={() => removeItem(item.id)}
                                        title="Remove item"
                                        aria-label="Remove item"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* BILL SUMMARY & FOOTER */}
            <div className="py-2 px-3 bg-light border-top mt-auto">
                {/* Toggle Bar — Rendered ONLY when summary is collapsed */}
                {!showBillSummary && (
                    <div 
                        className="d-flex align-items-center justify-content-between py-1.5 px-3 mb-2 rounded-3 border transition-all duration-300"
                        style={{ 
                            cursor: 'pointer', 
                            userSelect: 'none',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
                            borderColor: '#e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                        onClick={() => setShowBillSummary(true)}
                    >
                        <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                            <span style={{ fontSize: '0.85rem' }}>🧾</span>
                            <span>Bill Summary</span>
                            <span className="badge bg-slate-900 text-amber-400 font-bold" style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px' }}>
                                ₹{grandTotal.toFixed(2)}
                            </span>
                        </div>
                        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                            <span>Details</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
                            </svg>
                        </div>
                    </div>
                )}

                {/* Animated Collapsible Bill Breakdown */}
                <div 
                    style={{
                        maxHeight: showBillSummary ? '250px' : '0px',
                        overflow: 'hidden',
                        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        opacity: showBillSummary ? 1 : 0,
                        transform: showBillSummary ? 'translateY(0px)' : 'translateY(-6px)',
                        marginBottom: showBillSummary ? '8px' : '0px'
                    }}
                >
                    <div className="p-2.5 rounded-3 mb-1 bg-white border border-slate-200 shadow-2xs">
                        <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-dashed" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                            <span className="d-flex align-items-center gap-1.5 text-slate-500 uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                <span style={{ fontSize: '0.85rem' }}>🧾</span>
                                <span>Billing Breakdown</span>
                            </span>
                            <button 
                                type="button" 
                                className="btn-close" 
                                style={{ width: '0.45rem', height: '0.45rem', opacity: 0.6 }} 
                                onClick={() => setShowBillSummary(false)}
                                aria-label="Hide Summary"
                            ></button>
                        </div>
                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.78rem' }}>
                            <span className="text-slate-600">Subtotal</span>
                            <span className="fw-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1 text-slate-500 ps-2" style={{ fontSize: '0.73rem' }}>
                            <span>CGST ({(parseFloat(posSettings?.taxRate || 5) / 2).toFixed(1)}%)</span>
                            <span>+₹{(tax / 2).toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1 text-slate-500 ps-2" style={{ fontSize: '0.73rem' }}>
                            <span>SGST ({(parseFloat(posSettings?.taxRate || 5) / 2).toFixed(1)}%)</span>
                            <span>+₹{(tax / 2).toFixed(2)}</span>
                        </div>
                        {(posSettings.serviceCharge > 0 && serviceCharge > 0) && (
                            <div className="d-flex justify-content-between mb-1 text-slate-500" style={{ fontSize: '0.75rem' }}>
                                <span>Service Charge ({posSettings.serviceCharge}%)</span>
                                <span>+₹{serviceCharge.toFixed(2)}</span>
                            </div>
                        )}

                        {/* Grand Total Badge Row */}
                        <div className="d-flex justify-content-between align-items-center px-2.5 py-1.5 rounded-2 mt-2"
                            style={{ background: '#1e293b', color: '#fff' }}>
                            <strong style={{ fontSize: '0.88rem', letterSpacing: '0.01em' }}>Grand Total</strong>
                            <span style={{
                                color: '#fbbf24',
                                fontWeight: '800',
                                fontSize: '0.95rem',
                                letterSpacing: '0.02em'
                            }}>
                                ₹{grandTotal.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons — 1 single horizontal row with equal flex 1fr grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                    {/* 1. Place Order / Update Order */}
                    {cartItems.length > 0 ? (
                        <button
                            className="btn d-flex align-items-center justify-content-center gap-1 text-white border-0 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
                            style={{ 
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                whiteSpace: 'nowrap', 
                                borderRadius: '8px',
                                height: '36px',
                                padding: '4px 2px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                boxShadow: '0 2px 5px rgba(16, 185, 129, 0.25)'
                            }}
                            onClick={sendOrderToKitchen}
                        >
                            <span style={{ fontSize: '0.75rem' }}>⚡</span>
                            <span>{activeTableInfo?.status === 'Occupied' && activeTableInfo?.current_session?.active_order_id ? 'Update' : 'Order'}</span>
                        </button>
                    ) : (
                        <button 
                            className="btn d-flex align-items-center justify-content-center gap-1 text-slate-400 border border-slate-200 bg-slate-100" 
                            style={{ whiteSpace: 'nowrap', borderRadius: '8px', height: '36px', padding: '4px 2px', fontSize: '0.72rem', fontWeight: 600 }} 
                            disabled
                        >
                            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>⚡</span>
                            <span>Order</span>
                        </button>
                    )}

                    {/* 2. Print (Direct Browser Print) */}
                    <button
                        className="btn d-flex align-items-center justify-content-center gap-1 text-white border-0 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
                        style={{ 
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                            whiteSpace: 'nowrap', 
                            borderRadius: '8px',
                            height: '36px',
                            padding: '4px 2px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            boxShadow: '0 2px 5px rgba(59, 130, 246, 0.25)'
                        }}
                        onClick={handlePrintKOT}
                    >
                        <span style={{ fontSize: '0.75rem' }}>🖨️</span>
                        <span>Print</span>
                    </button>

                    {/* 3. Review (Opens Receipt Preview Modal) */}
                    <button 
                        className="btn d-flex align-items-center justify-content-center gap-1 text-white border-0 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200" 
                        style={{ 
                            background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)', 
                            whiteSpace: 'nowrap', 
                            borderRadius: '8px',
                            height: '36px',
                            padding: '4px 2px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            boxShadow: '0 2px 5px rgba(30, 41, 59, 0.25)'
                        }} 
                        onClick={() => {
                            if (cartItems.length === 0) {
                                toast.error("Cart is empty!");
                                return;
                            }
                            setShowPreviewModal(true);
                        }}
                    >
                        <span style={{ fontSize: '0.75rem' }}>📖</span>
                        <span>Review</span>
                    </button>

                    {/* 4. Cancel Order / Clear Cart */}
                    <button 
                        className="btn d-flex align-items-center justify-content-center gap-1 text-white border-0 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200" 
                        style={{ 
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                            whiteSpace: 'nowrap', 
                            borderRadius: '8px',
                            height: '36px',
                            padding: '4px 2px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            boxShadow: '0 2px 5px rgba(239, 68, 68, 0.25)'
                        }} 
                        onClick={async () => {
                            if (activeTableInfo?.status === 'Occupied' && activeTableInfo?.current_session?.active_order_id) {
                                await cancelActiveOrder(activeTableInfo.current_session.active_order_id, activeTableInfo.table_number);
                            } else {
                                setCart({});
                                setCartModified(false);
                                setTableModified(prev => ({ ...prev, [tableId]: false }));
                            }
                        }}
                    >
                        <span style={{ fontSize: '11px' }}>✕</span>
                        <span>Cancel</span>
                    </button>
                </div>
            </div>

            {/* Receipt Modal Preview for Review button */}
            {showPreviewModal && (
                <ReceiptModal 
                    selectedHistoryOrder={{
                        order_id: tableId ? `TBL-${tableId}` : '1001',
                        table_number: tableId,
                        type: orderType,
                        status: 'ACTIVE',
                        time: new Date().toISOString(),
                        server: user?.username || user?.name || 'Ravi',
                        items: cartItems,
                        subtotal: subtotal,
                        tax: tax,
                        serviceCharge: serviceCharge,
                        total: grandTotal
                    }}
                    setSelectedHistoryOrder={() => setShowPreviewModal(false)}
                    posSettings={posSettings}
                />
            )}
        </div>
    );
};

export default BillPanel;
