import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ReceiptModal from '../components/ReceiptModal';
import { usePOS } from '../context/POSContext';
import { API_BASE_URL } from '../config';

const HistoryPage = () => {
    const { orderHistory, setOrderHistory, posSettings, setSelectedDetailOrder, fetchOrders } = usePOS();
    const navigate = useNavigate();
    const onViewDetailOrder = (order) => { setSelectedDetailOrder(order); navigate(`/history/${order.order_id}`); };
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
    const [activeOrderSummary, setActiveOrderSummary] = useState(null);
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [historyTypeFilter, setHistoryTypeFilter] = useState('All');
    const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

    const filteredHistory = orderHistory.filter(order => {
        const matchesSearch = String(order.order_id || '').toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                             String(order.table_number).toLowerCase().includes(historySearchQuery.toLowerCase());
        const matchesType = historyTypeFilter === 'All' || 
                            order.type.toUpperCase() === historyTypeFilter.toUpperCase();
        const matchesStatus = historyStatusFilter === 'All' || 
                              order.status.toUpperCase() === historyStatusFilter.toUpperCase();
        return matchesSearch && matchesType && matchesStatus;
    });

    return (
        <div className="container-fluid py-3 py-sm-4 px-2 px-sm-4 bg-slate-50" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="row g-3 g-sm-4">
                <div className={activeOrderSummary ? "col-lg-8 col-md-7" : "col-12"}>
                    <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white">
                        <div className="card-body p-3 p-sm-4">
                            <h5 className="fw-bold text-slate-900 mb-1 d-flex align-items-center">
                                <i className="bi bi-clock-history text-primary fs-5 me-2"></i>
                                <span>Order History</span>
                            </h5>
                            <p className="text-muted small mb-3 mb-sm-4 d-none d-sm-block">Search and view details of placed and paid orders</p>
        
                            <div className="row g-2 g-sm-3 mb-3 mb-sm-4">
                                <div className="col-12 col-md-5">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Search by Order ID or Table..." 
                                        value={historySearchQuery}
                                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                                        style={{ height: '38px', fontSize: '0.85rem' }}
                                    />
                                </div>
                                <div className="col-6 col-md-3.5 col-lg-3">
                                    <select 
                                        className="form-select"
                                        value={historyTypeFilter}
                                        onChange={(e) => setHistoryTypeFilter(e.target.value)}
                                        style={{ height: '38px', fontSize: '0.85rem' }}
                                    >
                                        <option value="All">All Types</option>
                                        <option value="Dine-In">Dine-In</option>
                                        <option value="Takeaway">Takeaway</option>
                                        <option value="Delivery">Delivery</option>
                                    </select>
                                </div>
                                <div className="col-6 col-md-3.5 col-lg-3">
                                    <select 
                                        className="form-select"
                                        value={historyStatusFilter}
                                        onChange={(e) => setHistoryStatusFilter(e.target.value)}
                                        style={{ height: '38px', fontSize: '0.85rem' }}
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="PAID">PAID</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </div>
                            </div>
        
                            <div className="table-responsive w-100 history-table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <table className="table table-hover align-middle mb-0" style={{ minWidth: '550px' }}>
                                    <thead className="table-light text-secondary" style={{ whiteSpace: 'nowrap' }}>
                                        <tr>
                                            <th>Order ID</th>
                                            {posSettings.isEnableTables && <th>Table / Ref</th>}
                                            <th>Type</th>
                                            <th>Date/Time</th>
                                            <th>Grand Total</th>
                                            <th>Status</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map((order) => {
                                            const isPaid = order.status === 'PAID';
                                            const isActive = activeOrderSummary?.order_id === order.order_id;
                                            return (
                                                <tr key={order.order_id} style={isActive ? { backgroundColor: '#f8fafc' } : {}}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span 
                                                            className="fw-bold text-primary cursor-pointer hover:underline"
                                                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                            onClick={() => setActiveOrderSummary(order)}
                                                        >
                                                            {order.order_id}
                                                        </span>
                                                    </td>
                                                    {posSettings.isEnableTables && <td style={{ whiteSpace: 'nowrap' }}>{order.table_number}</td>}
                                                    <td style={{ whiteSpace: 'nowrap' }}>{order.type}</td>
                                                    <td className="small text-muted" style={{ whiteSpace: 'nowrap' }}>{new Date(order.time).toLocaleString()}</td>
                                                    <td className="fw-bold text-slate-800" style={{ whiteSpace: 'nowrap' }}>₹{parseFloat(order.total).toFixed(2)}</td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span className={`badge ${
                                                            order.status === 'PAID' || order.status === 'COMPLETED' ? 'bg-success' : 
                                                            order.status === 'CANCELLED' ? 'bg-danger text-white' : 
                                                            order.status === 'PENDING' ? 'bg-warning text-dark' : 
                                                            order.status ? 'bg-info text-dark' : 'bg-secondary text-white'
                                                        }`}>
                                                            {order.status || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                                                        <div className="d-flex justify-content-end gap-1 flex-nowrap">
                                                            <button 
                                                                className="btn btn-sm btn-outline-dark"
                                                                onClick={() => setActiveOrderSummary(order)}
                                                            >
                                                                Details
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => setSelectedHistoryOrder(order)}
                                                            >
                                                                Print
                                                            </button>
                                                            {(order.status === 'PENDING' || order.status === 'SERVED') && (
                                                                <button 
                                                                    className="btn btn-sm btn-success text-white"
                                                                    onClick={async () => {
                                                                        const nextPaidIds = JSON.parse(localStorage.getItem('pos_paid_order_ids') || '[]');
                                                                        if (!nextPaidIds.includes(String(order.order_id))) {
                                                                            nextPaidIds.push(String(order.order_id));
                                                                            localStorage.setItem('pos_paid_order_ids', JSON.stringify(nextPaidIds));
                                                                        }
                                                                        
                                                                        // PUT API call to update status in backend database to COMPLETED
                                                                        try {
                                                                            const tableIdNum = order.table_number_id ? parseInt(order.table_number_id) : null;
                                                                            await fetch(`${API_BASE_URL}/order/update-status/${order.order_id}`, {
                                                                                method: 'PUT',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({
                                                                                    order_status: 'COMPLETED',
                                                                                    table_number_id: tableIdNum
                                                                                })
                                                                            });
                                                                        } catch (err) {
                                                                            console.warn('Failed to update status on server:', err.message);
                                                                        }
                                                                        
                                                                        await fetchOrders();
                                                                        setActiveOrderSummary(prev => {
                                                                            if (prev?.order_id === order.order_id) {
                                                                                return { ...prev, status: 'COMPLETED' };
                                                                            }
                                                                            return prev;
                                                                        });
                                                                        toast.success(`Order ${order.order_id} marked as COMPLETED.`);
                                                                    }}
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredHistory.length === 0 && (
                                            <tr>
                                                <td colSpan={posSettings.isEnableTables ? 7 : 6} className="text-center py-4 text-muted">No orders found matching the filter.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
        
                {activeOrderSummary && (
                    <>
                        <div className="d-block d-md-none history-backdrop-mobile" onClick={() => setActiveOrderSummary(null)}></div>
                        <div className="col-lg-4 col-md-5 history-summary-drawer">
                            <div className="card shadow-sm border-0 rounded-3 bg-white h-100">
                                <div className="card-body p-0 d-flex flex-column" style={{ maxHeight: 'calc(100vh - 175px)', minHeight: '380px' }}>
                                    <div className="p-3 border-bottom bg-light rounded-top-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="fw-bold mb-0 text-slate-900">Order Bill summary</h6>
                                            <button 
                                                className="btn-close" 
                                                onClick={() => setActiveOrderSummary(null)}
                                                style={{ fontSize: '0.8rem' }}
                                            ></button>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2 align-items-center text-xs text-muted">
                                            <span><strong>Order ID:</strong> #{activeOrderSummary.order_id}</span>
                                            <span className="text-secondary">|</span>
                                            <span><strong>Table:</strong> {activeOrderSummary.table_number || 'N/A'}</span>
                                            <span className="text-secondary">|</span>
                                            <span><strong>Type:</strong> {activeOrderSummary.type}</span>
                                            <span className="text-secondary">|</span>
                                            <span className={`badge ${
                                                activeOrderSummary.status === 'COMPLETED' || activeOrderSummary.status === 'PAID' ? 'bg-success' : 
                                                activeOrderSummary.status === 'SERVED' ? 'bg-info text-dark' : 'bg-warning text-dark'
                                            }`} style={{ fontSize: '0.65rem' }}>
                                                {activeOrderSummary.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Items scroll */}
                                    <div className="p-3" style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
                                        {activeOrderSummary.items && activeOrderSummary.items.length === 0 ? (
                                            <div className="text-center py-5 text-muted">No items in this order.</div>
                                        ) : (
                                            (activeOrderSummary.items || []).map((item, idx) => {
                                                const totalItemPrice = (parseFloat(item.price) + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0)) * parseInt(item.qty || 1);
                                                return (
                                                    <div key={idx} className="pb-2 mb-2 border-bottom">
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span className="fw-bold text-slate-800 text-sm">{item.name}</span>
                                                            <span className="fw-bold text-slate-900">₹{totalItemPrice.toFixed(2)}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between text-muted text-xs">
                                                            <span>Qty: {item.qty} × ₹{parseFloat(item.price).toFixed(2)}</span>
                                                            {item.selectedVariant && (
                                                                <span className="text-amber-600">Option: {item.selectedVariant.name}</span>
                                                            )}
                                                        </div>
                                                        {item.notes && (
                                                            <div className="text-xs italic text-slate-500 mt-1">"{item.notes}"</div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    
                                    {/* Calculation summary */}
                                    <div className="p-3 bg-light border-top rounded-bottom-3 mt-auto">
                                        <div className="d-flex justify-content-between mb-1 text-slate-600 text-xs">
                                            <span>Subtotal</span>
                                            <span>₹{parseFloat(activeOrderSummary.subtotal || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1 text-slate-600 text-xs">
                                            <span>Tax ({posSettings.taxRate}%)</span>
                                            <span>₹{parseFloat(activeOrderSummary.tax || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2 text-slate-600 text-xs">
                                            <span>Service Charge ({posSettings.serviceCharge}%)</span>
                                            <span>₹{parseFloat(activeOrderSummary.serviceCharge || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <strong className="text-slate-900">Grand Total</strong>
                                            <strong className="text-primary fs-5">₹{parseFloat(activeOrderSummary.total || 0).toFixed(2)}</strong>
                                        </div>
                                        
                                        {activeOrderSummary.status !== 'PAID' && activeOrderSummary.status !== 'COMPLETED' && activeOrderSummary.status !== 'CANCELLED' ? (
                                            <button 
                                                className="btn btn-dark w-100 fw-bold py-2 mt-2" 
                                                onClick={() => onViewDetailOrder(activeOrderSummary)}
                                            >
                                                Modify Order / Add Items
                                            </button>
                                        ) : (
                                            <button 
                                                className="btn btn-outline-dark w-100 fw-bold py-2 mt-2"
                                                onClick={() => setSelectedHistoryOrder(activeOrderSummary)}
                                            >
                                                Print Receipt
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        
            <ReceiptModal 
                selectedHistoryOrder={selectedHistoryOrder}
                setSelectedHistoryOrder={setSelectedHistoryOrder}
                posSettings={posSettings}
            />
        </div>
    );
};

export default HistoryPage;
