import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';

const TablesPage = () => {
    const {
        tablesList,
        checkInTable,
        getMinutesElapsed,
        handleAddItems,
        handlePrintBillFromTable,
        payNow,
        markTableAsAvailable,
        tableCarts,
        handleAddTable,
    } = usePOS();

    const [showModal, setShowModal] = useState(false);
    const [showSidebarDrawer, setShowSidebarDrawer] = useState(false);
    const [newTableNum, setNewTableNum] = useState('');
    const [newTableCap, setNewTableCap] = useState('4');
    const [newTableFloor, setNewTableFloor] = useState('');

    return (
        <div className="dashboard-container">
            {/* Tables Grid Floor Plan Layout */}
            <main className="floor-view">
                {/* Mobile Top Stats & Add Table Trigger */}
                <div className="d-flex justify-content-between align-items-center bg-white py-2 px-3 border-bottom d-lg-none mb-3 rounded-2 border shadow-sm w-100 flex-nowrap gap-2" style={{ gridColumn: '1 / -1' }}>
                    <div className="d-flex align-items-center gap-1.5" style={{ minWidth: 0 }}>
                        <span className="fw-bold text-slate-800" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>📊 Metrics</span>
                        <span className="badge bg-emerald-600 text-white font-bold" style={{ fontSize: '0.68rem', padding: '3px 7px', whiteSpace: 'nowrap' }}>
                            {tablesList.filter(t => t.status === 'Occupied').length}/{tablesList.length} Active
                        </span>
                    </div>
                    <button
                        className="btn btn-primary btn-sm fw-bold px-2.5 py-1.5 shadow-sm ms-auto"
                        style={{ borderRadius: '6px', fontSize: '0.75rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={() => setShowSidebarDrawer(true)}
                    >
                        + Add / Stats ❯
                    </button>
                </div>

                {tablesList.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', gridColumn: '1 / -1', color: '#64748b' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>🪑</div>
                        <h4 style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>No Tables Configured Yet</h4>
                        <p style={{ fontSize: '0.95rem', margin: '0' }}>Use the "+ Add Table" button to create restaurant tables.</p>
                    </div>
                ) : (
                    tablesList.map((table) => {
                        const statusKey = table.status.toLowerCase();
                        const session = table.current_session;
                        const timeStr = getMinutesElapsed(session?.updated_at || session?.created_at || session?.time || table.updated_at);
                        const cartTotal = tableCarts[table.table_number]
                            ? Object.values(tableCarts[table.table_number]).reduce((sum, item) => {
                                const cost = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
                                return sum + cost * item.qty;
                            }, 0)
                            : 0;
                        const displayTotal = session?.current_total || cartTotal || 0;

                        return (
                            <div key={table.table_id} className={`table-card-pos ${statusKey}`}>
                                {/* Colored status header */}
                                <div className="card-header-pos">
                                    {table.status}
                                </div>

                                {/* Card Body */}
                                <div className="card-body-pos">
                                    <div className="table-title-pos">
                                        {table.table_name || table.table_number} | {table.capacity} Seats
                                    </div>

                                    {/* Occupied Session Info */}
                                    {table.status === 'Occupied' && session && (
                                        <div className="session-info">
                                            <div>
                                                <div className="label">Status</div>
                                                <span className={`badge mt-1 ${
                                                    session.order_status === 'COMPLETED' || session.order_status === 'PAID' ? 'bg-success' :
                                                    session.order_status === 'READY' ? 'bg-emerald-600 text-white' :
                                                    session.order_status === 'PREPARING' ? 'bg-primary text-white' :
                                                    session.order_status === 'CANCELLED' ? 'bg-danger' :
                                                    'bg-warning text-dark'
                                                }`} style={{ fontSize: '0.72rem' }}>
                                                    {session.order_status || 'PENDING'}
                                                </span>
                                                <div className="time-spent" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>{timeStr}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div className="label">Current total</div>
                                                <div className="value">₹{displayTotal.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reserved Info */}
                                    {table.status === 'Reserved' && session && (
                                        <div style={{ marginBottom: '12px', fontSize: '0.88rem', color: '#475569', textAlign: 'left' }}>
                                            <strong>{session.customer_name || 'Reserved'}</strong>
                                            {session.customer_phone && <div style={{ color: '#94a3b8' }}>{session.customer_phone}</div>}
                                            {session.reservation_time && <div style={{ color: '#94a3b8' }}>📅 {new Date(session.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                                        </div>
                                    )}

                                    {/* Dirty notice */}
                                    {table.status === 'Dirty' && (
                                        <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: '#b45309', fontWeight: '500' }}>⚠️ Needs Cleaning</div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="card-actions-pos" style={{ flexDirection: 'column', gap: '6px' }}>
                                        {table.status === 'Available' && (
                                            <button className="btn-action-pos btn-green" onClick={() => checkInTable(table.table_number)}>
                                                Take Order
                                            </button>
                                        )}

                                        {table.status === 'Occupied' && (
                                            <>
                                                <div className="card-actions-pos" style={{ gap: '6px' }}>
                                                    <button className="btn-action-pos btn-blue" onClick={() => handleAddItems(table.table_number)}>
                                                        Add Items
                                                    </button>
                                                    <button className="btn-action-pos" style={{ background: '#334155', color: 'white' }} onClick={() => handlePrintBillFromTable(table.table_number)}>
                                                        Print Bill
                                                    </button>
                                                </div>
                                                <button className="btn-action-pos btn-green" onClick={() => payNow(table.table_number)}>
                                                    Pay Now
                                                </button>
                                            </>
                                        )}

                                        {table.status === 'Dirty' && (
                                            <button className="btn-action-pos btn-grey" onClick={() => markTableAsAvailable(table.table_number)}>
                                                ✅ Mark Clean
                                            </button>
                                        )}

                                        {table.status === 'Reserved' && (
                                            <button className="btn-action-pos btn-blue" onClick={() => checkInTable(table.table_number)}>
                                                Check In
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </main>

            {/* Desktop Right Sidebar */}
            <aside className="sidebar d-none d-lg-flex">
                <div className="sidebar-section">
                    <button className="btn btn-primary w-100 mb-3" style={{ fontWeight: '600', padding: '10px' }} onClick={() => setShowModal(true)}>
                        + Add Table
                    </button>
                </div>

                <div className="sidebar-section">
                    <div className="sidebar-title">Live Metrics</div>
                    <div className="metric-group">
                        <div className="metric-label">Active Tables</div>
                        <div className="metric-value">
                            {tablesList.filter(t => t.status === 'Occupied').length}/{tablesList.length}
                        </div>
                    </div>
                    <div className="metric-group">
                        <div className="metric-label">Avg. Prep Time</div>
                        <div className="metric-value">11m</div>
                    </div>
                    <div className="metric-group">
                        <div className="metric-label">Open Balance</div>
                        <div className="metric-value" style={{ fontSize: '1.1rem' }}>
                            ₹{tablesList.filter(t => t.status === 'Occupied').reduce((sum, t) => sum + (t.current_session?.current_total || 0), 0).toFixed(2)}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="notifications-header">
                        <span>Notifications</span>
                        <span>▲</span>
                    </div>
                    <ul className="notification-list">
                        {tablesList.filter(t => t.status === 'Dirty').map(t => (
                            <li key={t.table_id} className="notification-item">
                                🧹 {t.table_number} needs cleaning
                                <span className="time">Now</span>
                            </li>
                        ))}
                        {tablesList.filter(t => t.status === 'Reserved').map(t => (
                            <li key={t.table_id} className="notification-item">
                                📅 {t.table_number} reserved for {t.current_session?.customer_name || 'guest'}
                                <span className="time">{t.current_session?.reservation_time ? new Date(t.current_session.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </li>
                        ))}
                        {tablesList.filter(t => t.status === 'Occupied').map(t => (
                            <li key={t.table_id} className="notification-item">
                                New online reservation
                                <span className="time">{getMinutesElapsed(t.current_session?.updated_at)} ago</span>
                            </li>
                        ))}
                        {tablesList.length === 0 && (
                            <li className="notification-item" style={{ color: '#94a3b8' }}>No active notifications</li>
                        )}
                    </ul>
                </div>
            </aside>

            {/* Mobile Side Drawer Overlay */}
            {showSidebarDrawer && (
                <div className="d-lg-none">
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" 
                        onClick={() => setShowSidebarDrawer(false)}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1040 }}
                    />
                    <div 
                        className="fixed top-0 right-0 bottom-0 bg-white z-55 shadow-2xl flex flex-col overflow-y-auto p-4"
                        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: '340px', backgroundColor: '#ffffff', zIndex: 1050 }}
                    >
                        <div className="d-flex justify-content-between align-items-center pb-3 border-bottom mb-3">
                            <h6 className="fw-bold mb-0 text-slate-900">📊 Table Metrics & Stats</h6>
                            <button className="btn-close" onClick={() => setShowSidebarDrawer(false)}></button>
                        </div>

                        <div className="sidebar-section p-0 mb-4 border-0">
                            <button className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm" style={{ borderRadius: '10px' }} onClick={() => { setShowSidebarDrawer(false); setShowModal(true); }}>
                                + Add New Table
                            </button>
                        </div>

                        <div className="sidebar-section p-3 bg-slate-50 rounded-2xl mb-4 border border-slate-200">
                            <div className="sidebar-title text-slate-700">Live Metrics</div>
                            <div className="metric-group">
                                <div className="metric-label">Active Tables</div>
                                <div className="metric-value text-blue-600">
                                    {tablesList.filter(t => t.status === 'Occupied').length}/{tablesList.length}
                                </div>
                            </div>
                            <div className="metric-group">
                                <div className="metric-label">Avg. Prep Time</div>
                                <div className="metric-value text-slate-800">11m</div>
                            </div>
                            <div className="metric-group mb-0">
                                <div className="metric-label">Open Balance</div>
                                <div className="metric-value text-amber-600" style={{ fontSize: '1.2rem' }}>
                                    ₹{tablesList.filter(t => t.status === 'Occupied').reduce((sum, t) => sum + (t.current_session?.current_total || 0), 0).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="notifications-header rounded-t-xl">
                                <span>Notifications</span>
                                <span>▲</span>
                            </div>
                            <ul className="notification-list border border-slate-200 border-t-0 rounded-b-xl">
                                {tablesList.filter(t => t.status === 'Dirty').map(t => (
                                    <li key={t.table_id} className="notification-item">
                                        🧹 {t.table_number} needs cleaning
                                        <span className="time">Now</span>
                                    </li>
                                ))}
                                {tablesList.filter(t => t.status === 'Reserved').map(t => (
                                    <li key={t.table_id} className="notification-item">
                                        📅 {t.table_number} reserved for {t.current_session?.customer_name || 'guest'}
                                        <span className="time">{t.current_session?.reservation_time ? new Date(t.current_session.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                    </li>
                                ))}
                                {tablesList.filter(t => t.status === 'Occupied').map(t => (
                                    <li key={t.table_id} className="notification-item">
                                        New online reservation
                                        <span className="time">{getMinutesElapsed(t.current_session?.updated_at)} ago</span>
                                    </li>
                                ))}
                                {tablesList.length === 0 && (
                                    <li className="notification-item" style={{ color: '#94a3b8' }}>No active notifications</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Table Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Add New Table</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Table Name</label>
                                    <input type="text" className="form-control" placeholder="e.g. Table #4 or VIP-1" value={newTableNum} onChange={e => setNewTableNum(e.target.value)} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Capacity (seats)</label>
                                    <input type="number" className="form-control" min="1" max="50" value={newTableCap} onChange={e => setNewTableCap(e.target.value)} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Floor <span className="text-muted fw-normal">(Optional)</span></label>
                                    <input type="text" className="form-control" placeholder="e.g. Ground, First Floor" value={newTableFloor} onChange={e => setNewTableFloor(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={() => {
                                    if (newTableNum.trim()) {
                                        handleAddTable(newTableNum.trim(), parseInt(newTableCap) || 4, newTableFloor.trim() || null);
                                        setShowModal(false);
                                        setNewTableNum('');
                                        setNewTableCap('4');
                                        setNewTableFloor('');
                                    }
                                }}>Add Table</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablesPage;
