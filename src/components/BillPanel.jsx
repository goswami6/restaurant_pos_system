import React from 'react';
import { usePOS } from '../context/POSContext';

const BillPanel = () => {
    const {
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

    return (
        <div className="col-12 col-md-5 col-lg-3 bill-panel h-100 border-t lg:border-t-0 border-slate-200" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '450px' }}>
            {/* HEADER */}
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-bold text-slate-800" style={{ fontSize: '1.05rem' }}>
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
                            } text-white`}>
                                {activeTableInfo.status}
                            </span>
                        )}
                    </div>
                    {posSettings.isEnableTables && activeTableInfo?.status === 'Occupied' && activeTableInfo?.current_session?.active_order_id ? (
                        <span className="text-muted small" style={{ fontSize: '0.78rem' }}>Order #{activeTableInfo.current_session.active_order_id}</span>
                    ) : posSettings.isEnableTables ? (
                        <span className="text-muted small" style={{ fontSize: '0.78rem' }}>New Session</span>
                    ) : null}
                </div>

                {/* Table Selector Dropdown */}
                {posSettings.isEnableTables && (
                    <select
                        className="form-select form-select-sm"
                        style={{ width: 'auto', maxWidth: '170px', fontSize: '0.8rem', borderRadius: '6px' }}
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
            </div>

            {/* CART ITEMS LIST */}
            <div className="cart-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '15px' }}>
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
                    <div className="text-center py-5">
                        <div className="fs-1 opacity-20">🛒</div>
                        <p className="text-muted mt-2">Your cart is empty</p>
                    </div>
                ) : (
                    cartItems.map(item => {
                        const itemCost = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
                        const totalItemPrice = itemCost * item.qty;
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

                                {item.notes && !item.notes.startsWith("Session Order:") && (
                                    <div className="text-[11px] text-slate-500 italic mb-2">
                                        Note: "{item.notes}"
                                    </div>
                                )}

                                <div className="d-flex justify-content-between align-items-center">
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
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Active order info display */}
                {posSettings.isEnableTables && activeTableInfo?.status === 'Occupied' && activeTableInfo?.current_session?.active_order_id && (
                    <div className="alert alert-info py-2 px-3 mb-0 mt-3 d-flex justify-content-between align-items-center small" style={{ borderRadius: '8px' }}>
                        <span>
                            Active Order: <strong>#{activeTableInfo.current_session.active_order_id}</strong>
                        </span>
                        <strong className="text-primary">
                            ₹{activeTableInfo.current_session.current_total?.toFixed(2) || '0.00'}
                        </strong>
                    </div>
                )}
            </div>

            {/* BILL SUMMARY & FOOTER */}
            <div className="p-3 bg-light border-top mt-auto">
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                    <span className="text-muted">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                    <span className="text-muted">Tax ({posSettings.taxRate}%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '0.85rem' }}>
                    <span className="text-muted">Service Charge ({posSettings.serviceCharge}%)</span>
                    <span>₹{serviceCharge.toFixed(2)}</span>
                </div>

                {/* Grand Total Badge Row */}
                <div className="d-flex justify-content-between align-items-center px-3 py-2 mb-3 rounded-3"
                    style={{ background: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#1e293b' }}>Grand Total</strong>
                    <span style={{
                        background: '#1e293b',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '1rem',
                        padding: '4px 14px',
                        borderRadius: '8px',
                        letterSpacing: '0.02em'
                    }}>
                        ₹{grandTotal.toFixed(2)}
                    </span>
                </div>

                {/* Action Buttons — 2×2 grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                        className="btn btn-outline-secondary py-2 text-xs font-semibold"
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
                        Cancel
                    </button>
                    <button className="btn btn-dark py-2 text-xs font-semibold" onClick={handlePrintKOT}>
                        Browser Print
                    </button>
                    <button
                        className="btn py-2 text-xs font-semibold border-0 text-white"
                        style={{ background: '#2563eb' }}
                        onClick={printDirectToPrinter}
                    >
                        Direct Print
                    </button>
                    {cartItems.length > 0 ? (
                        <button
                            className="btn py-2 text-xs font-bold text-white border-0"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                            onClick={sendOrderToKitchen}
                        >
                            {activeTableInfo?.status === 'Occupied' && activeTableInfo?.current_session?.active_order_id ? 'Update Order' : 'Place Order'}
                        </button>
                    ) : (
                        <button className="btn btn-outline-secondary py-2 text-xs font-semibold" disabled>
                            Place Order
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillPanel;
