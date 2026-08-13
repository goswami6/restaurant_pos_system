import React from 'react';
import toast from 'react-hot-toast';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePOS } from '../context/POSContext';
import VariantModal from './VariantModal';
import Navbar from './Navbar';
import '../POS.css';

const AppLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        user, onLogout,
        confirmModal, closeConfirm,
        showReservationModal, setShowReservationModal,
        resCustomerName, setResCustomerName,
        resCustomerPhone, setResCustomerPhone,
        resSelectedTableNum, setResSelectedTableNum,
        resGuestCount, setResGuestCount,
        resTime, setResTime,
        tablesList,
        handleCreateReservation,
        selectedItemForModal, setSelectedItemForModal,
        chosenVariant, setChosenVariant,
        addToCart,
        posSettings,
        cartItems, subtotal, tax, serviceCharge, grandTotal,
        tableId, orderType,
        setOrderType,
    } = usePOS();

    React.useEffect(() => {
        if (posSettings && posSettings.isEnableTables === false && (location.pathname === '/tables' || location.pathname === '/')) {
            navigate('/order', { replace: true });
        }
    }, [posSettings?.isEnableTables, location.pathname, navigate]);

    const navTo = (path) => navigate('/' + path);

    return (
        <div className="d-flex flex-column overflow-hidden" style={{ height: '100vh' }}>
            <Navbar setShowReservationModal={setShowReservationModal} />

            {/* ── Page Content ───────────────────────────────── */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Outlet />
            </div>

            {/* ── Footer ─────────────────────────────────────── */}
            <footer className="bottom-bar">
                <div className="bottom-bar-left">
                    <button className="btn-bottom" onClick={() => navTo('menu')}>
                        📋<span className="d-none d-sm-inline ms-1"> Quick Menu</span><span className="d-inline d-sm-none ms-1"> Menu</span>
                    </button>
                    <button className="btn-bottom" onClick={() => { setOrderType('TAKEAWAY'); navTo('order'); }}>
                        🛍️<span className="d-none d-sm-inline ms-1"> New Takeaway</span><span className="d-inline d-sm-none ms-1"> Takeaway</span>
                    </button>
                    <button className="btn-bottom" onClick={() => { setOrderType('DELIVERY'); navTo('order'); }}>
                        🚚<span className="d-none d-sm-inline ms-1"> New Delivery</span><span className="d-inline d-sm-none ms-1"> Delivery</span>
                    </button>
                    <button className="btn-bottom" onClick={() => toast('Report view is coming soon!', { icon: '📊' })}>
                        📊<span className="d-none d-sm-inline ms-1"> Reports</span><span className="d-inline d-sm-none ms-1"> Report</span>
                    </button>
                </div>
                <button className="btn-logout" onClick={onLogout}>
                    <span className="d-none d-sm-inline">Logout ({user?.username || 'Ravi'})</span>
                    <span className="d-inline d-sm-none">Logout</span>
                </button>
            </footer>

            {/* ── Variant / Modifiers Modal ───────────────────── */}
            <VariantModal
                selectedItemForModal={selectedItemForModal}
                setSelectedItemForModal={setSelectedItemForModal}
                chosenVariant={chosenVariant}
                setChosenVariant={setChosenVariant}
                addToCart={addToCart}
            />

            {/* ── Hidden Print Receipt ────────────────────────── */}
            <div id="print-receipt-kot" style={{ fontFamily: 'monospace, monospace', width: '76mm', margin: '0 auto', fontSize: '11px', color: '#000', lineHeight: '1.3' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{posSettings.restaurantName}</div>
                    <div style={{ fontSize: '10px' }}>{posSettings.address}</div>
                    <div style={{ fontSize: '10px' }}>
                        {[posSettings.city, posSettings.state, posSettings.pincode].filter(Boolean).join(', ')}
                    </div>
                    {posSettings.gstin && <div style={{ fontSize: '10px' }}>GSTIN: {posSettings.gstin}</div>}
                    {posSettings.fssaiNo && <div style={{ fontSize: '10px' }}>FSSAI NO: {posSettings.fssaiNo}</div>}
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

                {/* Bill Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span>Bill No: #{tableId ? `TBL-${tableId}` : '1001'}</span>
                    <span>Date: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span>{(posSettings?.isEnableTables && orderType === 'DINE-IN' && tableId) ? `Dine In: ${tableId}` : `Type: ${orderType}`}</span>
                    <span>{posSettings?.isEnableTables ? 'Waiter' : 'Cashier'}: {user?.username || user?.name || 'Ravi'}</span>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

                {/* Items Table Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px' }}>
                    <span style={{ flex: 1, textAlign: 'left' }}>Item</span>
                    <span style={{ width: '32px', textAlign: 'center' }}>Qty.</span>
                    <span style={{ width: '55px', textAlign: 'right' }}>Price</span>
                    <span style={{ width: '60px', textAlign: 'right' }}>Amount</span>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

                {/* Items List */}
                {cartItems.map((item, idx) => {
                    const unitPrice = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
                    const itemAmount = unitPrice * item.qty;
                    return (
                        <div key={idx} style={{ marginBottom: '3px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                <span style={{ flex: 1, textAlign: 'left', wordBreak: 'break-word' }}>{item.name}</span>
                                <span style={{ width: '32px', textAlign: 'center' }}>{item.qty}</span>
                                <span style={{ width: '55px', textAlign: 'right' }}>{unitPrice.toFixed(2)}</span>
                                <span style={{ width: '60px', textAlign: 'right' }}>{itemAmount.toFixed(2)}</span>
                            </div>
                            {item.selectedVariant && <div style={{ fontSize: '9px', color: '#555', paddingLeft: '4px' }}>Opt: {item.selectedVariant.name}</div>}
                            {item.notes && <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', paddingLeft: '4px' }}>* {item.notes}</div>}
                        </div>
                    );
                })}

                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

                {/* Totals Section */}
                {(() => {
                    const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
                    const halfTaxRate = (posSettings.taxRate / 2).toFixed(1);
                    const cgstAmt = (tax / 2);
                    const sgstAmt = (tax / 2);
                    return (
                        <div style={{ fontSize: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span>Total Qty: {totalQty}</span>
                                <span>Sub Total &nbsp;&nbsp;{subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
                                <span>CGST {halfTaxRate}% &nbsp;&nbsp;{cgstAmt.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
                                <span>SGST {halfTaxRate}% &nbsp;&nbsp;{sgstAmt.toFixed(2)}</span>
                            </div>
                            {posSettings.serviceCharge > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
                                    <span>Service Charge {posSettings.serviceCharge}% &nbsp;&nbsp;{serviceCharge.toFixed(2)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px', marginTop: '4px' }}>
                                <span>Grand Total (INR)</span>
                                <span>{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    );
                })()}

                <div style={{ borderTop: '1px dashed #000', margin: '6px 0 4px 0' }}></div>

                {/* Footer Greeting */}
                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '500', padding: '2px 0' }}>
                    Thank you & Visit Again
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>
            </div>

            {/* ── Reservation Modal ───────────────────────────── */}
            {showReservationModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-55 p-4 font-sans" style={{ zIndex: 1050 }}>
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200/50 text-slate-800" style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
                        <div className="p-4 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <h5 className="fw-bold mb-0" style={{ color: '#1e293b', margin: 0 }}>New Reservation</h5>
                            <button className="btn-close" onClick={() => setShowReservationModal(false)}></button>
                        </div>
                        <form onSubmit={handleCreateReservation} className="p-4">
                            <div className="mb-3 text-start">
                                <label className="form-label small fw-bold" style={{ color: '#475569' }}>Customer Name</label>
                                <input type="text" className="form-control" value={resCustomerName} onChange={e => setResCustomerName(e.target.value)} placeholder="e.g. John Doe" style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} required />
                            </div>
                            <div className="mb-3 text-start">
                                <label className="form-label small fw-bold" style={{ color: '#475569' }}>Phone Number</label>
                                <input type="tel" className="form-control" value={resCustomerPhone} onChange={e => setResCustomerPhone(e.target.value)} placeholder="e.g. +91 98765 43210" style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} required />
                            </div>
                            <div className="row text-start">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label small fw-bold" style={{ color: '#475569' }}>Table Number</label>
                                    <select className="form-select" value={resSelectedTableNum} onChange={e => { setResSelectedTableNum(e.target.value); const t = tablesList.find(x => x.table_number === e.target.value); if (t) setResGuestCount(t.capacity || 4); }} style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} required>
                                        <option value="">Select Table...</option>
                                        {tablesList.filter(t => t.status === 'Available').map(t => (
                                            <option key={t.table_id} value={t.table_number}>{t.table_number} ({t.capacity} Seats)</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label small fw-bold" style={{ color: '#475569' }}>Guests</label>
                                    <input type="number" className="form-control" min="1" value={resGuestCount} onChange={e => setResGuestCount(parseInt(e.target.value) || 1)} style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} required />
                                </div>
                            </div>
                            <div className="mb-4 text-start">
                                <label className="form-label small fw-bold" style={{ color: '#475569' }}>Reservation Time</label>
                                <input type="datetime-local" className="form-control" value={resTime} onChange={e => setResTime(e.target.value)} style={{ color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} required />
                            </div>
                            <div className="d-flex gap-2 justify-content-end pt-3 border-top" style={{ borderTop: '1px solid #e2e8f0' }}>
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowReservationModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary text-white">Confirm Reservation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Sleek Modern Confirmation Modal ───────────────────────── */}
            {confirmModal?.isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-confirm-backdrop"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
                >
                    <div
                        className="rounded-3xl shadow-2xl overflow-hidden max-w-md w-full text-center animate-confirm-card"
                        style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                    >
                        {/* Accent Top Bar */}
                        <div style={{ height: '5px', backgroundColor: confirmModal.confirmVariant === 'danger' ? '#ef4444' : '#0f172a' }}></div>

                        <div className="p-6">
                            {/* Icon Badge */}
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"
                                style={{
                                    backgroundColor: confirmModal.confirmVariant === 'danger' ? '#fef2f2' : '#f0f9ff',
                                    color: confirmModal.confirmVariant === 'danger' ? '#dc2626' : '#0284c7',
                                    border: `1px solid ${confirmModal.confirmVariant === 'danger' ? '#fecaca' : '#bae6fd'}`,
                                    fontSize: '1.5rem'
                                }}
                            >
                                <i className={`bi ${confirmModal.confirmVariant === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'}`}></i>
                            </div>

                            <h3 className="text-xl font-bold mb-2 tracking-tight" style={{ color: '#0f172a' }}>
                                {confirmModal.title || 'Are you sure?'}
                            </h3>

                            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#475569', fontWeight: 500 }}>
                                {confirmModal.message || 'Please confirm to proceed with this action.'}
                            </p>

                            <div className="flex items-center justify-center gap-3 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                                <button
                                    type="button"
                                    onClick={closeConfirm}
                                    className="btn font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-sm"
                                    style={{
                                        backgroundColor: '#f1f5f9',
                                        color: '#334155',
                                        border: '1px solid #cbd5e1',
                                        minWidth: '120px',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmModal.onConfirm}
                                    className="btn font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-all"
                                    style={{
                                        backgroundColor: confirmModal.confirmVariant === 'danger' ? '#dc2626' : '#0f172a',
                                        color: '#ffffff',
                                        border: 'none',
                                        minWidth: '140px',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {confirmModal.confirmText || 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppLayout;
