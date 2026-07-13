import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePOS } from '../context/POSContext';
import VariantModal from './VariantModal';
import '../POS.css';

const AppLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        user, onLogout,
        toast, setToast,
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

    const currentPath = location.pathname.replace('/', '') || 'tables';

    const navTo = (path) => navigate('/' + path);

    return (
        <div className="min-h-screen flex flex-col">
            {/* ── Navbar ─────────────────────────────────────── */}
            <nav className="top-nav">
                <ul className="nav-links">
                    <li className={currentPath === 'menu' ? 'active' : ''} onClick={() => navTo('menu')}>☰ Menu</li>
                    <li className={currentPath === 'order' ? 'active' : ''} onClick={() => navTo('order')}>🛒 Order</li>
                    <li className={currentPath === 'tables' ? 'active' : ''} onClick={() => navTo('tables')}>🪟 Tables</li>
                    <li className={currentPath === 'staff' ? 'active' : ''} onClick={() => navTo('staff')}>👤 Staff</li>
                    <li className={currentPath === 'settings' ? 'active' : ''} onClick={() => navTo('settings')}>⚙️ Settings</li>
                    <li className={currentPath === 'history' || currentPath.startsWith('history/') ? 'active' : ''} onClick={() => navTo('history')}>⏳ History</li>
                </ul>
                <button className="btn-reservation" onClick={() => setShowReservationModal(true)}>
                    + New Reservation
                </button>
            </nav>

            {/* ── Page Content ───────────────────────────────── */}
            <Outlet />

            {/* ── Footer ─────────────────────────────────────── */}
            <footer className="bottom-bar">
                <div className="bottom-bar-left">
                    <button className="btn-bottom" onClick={() => navTo('menu')}>📋 Quick Menu</button>
                    <button className="btn-bottom" onClick={() => { setOrderType('TAKEAWAY'); navTo('order'); }}>🛍️ New Takeaway</button>
                    <button className="btn-bottom" onClick={() => { setOrderType('DELIVERY'); navTo('order'); }}>🚚 New Delivery</button>
                    <button className="btn-bottom" onClick={() => alert('Report view is coming soon!')}>📊 Reports</button>
                </div>
                <button className="btn-logout" onClick={onLogout}>Logout ({user?.username || 'Ravi'})</button>
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
            <div id="print-receipt-kot">
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h5 style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{posSettings.restaurantName}</h5>
                    <p style={{ margin: '0', fontSize: '11px', color: '#555' }}>{posSettings.address}</p>
                    <h6 style={{ margin: '10px 0 5px 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', fontWeight: 'bold' }}>KOT / BILL RECEIPT</h6>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
                    <span><strong>Table:</strong> {tableId || 'N/A'}</span>
                    <span><strong>Type:</strong> {orderType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
                    <span><strong>Date:</strong> {new Date().toLocaleString()}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '10px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #000' }}>
                            <th style={{ textAlign: 'left', paddingBottom: '5px' }}>ITEM</th>
                            <th style={{ textAlign: 'center', paddingBottom: '5px', width: '40px' }}>QTY</th>
                            <th style={{ textAlign: 'right', paddingBottom: '5px', width: '70px' }}>AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cartItems.map(item => {
                            const totalItemPrice = (item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0)) * item.qty;
                            return (
                                <React.Fragment key={item.id}>
                                    <tr style={{ verticalAlign: 'top' }}>
                                        <td style={{ paddingTop: '5px' }}>
                                            {item.name}
                                            {item.selectedVariant && <div style={{ fontSize: '10px', color: '#666' }}>Option: {item.selectedVariant.name}</div>}
                                            {item.notes && <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>* {item.notes}</div>}
                                        </td>
                                        <td style={{ textAlign: 'center', paddingTop: '5px' }}>{item.qty}</td>
                                        <td style={{ textAlign: 'right', paddingTop: '5px' }}>₹{totalItemPrice.toFixed(2)}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
                <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Tax ({posSettings.taxRate}%)</span><span>₹{tax.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Service ({posSettings.serviceCharge}%)</span><span>₹{serviceCharge.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: '5px', fontWeight: 'bold', fontSize: '13px', marginTop: '5px' }}><span>GRAND TOTAL</span><span>₹{grandTotal.toFixed(2)}</span></div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px dashed #000', paddingTop: '10px', fontSize: '11px' }}>
                    <p style={{ margin: '0' }}>Thank You! Visit Again</p>
                </div>
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

            {/* ── Toast Notification ──────────────────────────── */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-slide-in max-w-sm w-full backdrop-blur-md shadow-2xl rounded-2xl p-4 transition-all duration-300 transform scale-100" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: toast.type === 'success' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#1e3a8a', color: toast.type === 'success' ? '#34d399' : toast.type === 'error' ? '#f87171' : '#60a5fa' }}>
                            {toast.type === 'success' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            {toast.type === 'error' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                            {toast.type === 'info' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        </div>
                        <div className="flex-1 pt-0.5 text-start">
                            {toast.title && <h4 className="text-sm font-bold mb-1" style={{ color: '#ffffff', margin: 0 }}>{toast.title}</h4>}
                            <p className="text-xs whitespace-pre-line leading-relaxed" style={{ color: '#cbd5e1', margin: 0 }}>{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="btn-close btn-close-white ms-auto" aria-label="Close" style={{ filter: 'none', opacity: 0.8 }}></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppLayout;
