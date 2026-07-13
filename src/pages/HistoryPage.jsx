import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReceiptModal from '../components/ReceiptModal';
import { usePOS } from '../context/POSContext';

const HistoryPage = () => {
    const { orderHistory, setOrderHistory, posSettings, setSelectedDetailOrder } = usePOS();
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
        <div className="container-fluid py-4 bg-slate-50" style={{ flex: 1, minHeight: 'calc(100vh - 112px)', paddingLeft: '24px', paddingRight: '24px' }}>
            <div className="row g-4">
                <div className={activeOrderSummary ? "col-lg-8 col-md-7" : "col-12"}>
                    <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white">
                        <div className="card-body p-4">
                            <h5 className="fw-bold text-slate-900 mb-1">⏳ Order History</h5>
                            <p className="text-muted small mb-4">Search and view details of placed and paid orders</p>
        
                            <div className="row g-3 mb-4">
                                <div className="col-md-5">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Search by Order ID or Table..." 
                                        value={historySearchQuery}
                                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <select 
                                        className="form-select"
                                        value={historyTypeFilter}
                                        onChange={(e) => setHistoryTypeFilter(e.target.value)}
                                    >
                                        <option value="All">All Types</option>
                                        <option value="Dine-In">Dine-In</option>
                                        <option value="Takeaway">Takeaway</option>
                                        <option value="Delivery">Delivery</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select 
                                        className="form-select"
                                        value={historyStatusFilter}
                                        onChange={(e) => setHistoryStatusFilter(e.target.value)}
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="PAID">PAID</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </div>
                            </div>
        
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light text-secondary">
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Table / Ref</th>
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
                                                    <td>
                                                        <span 
                                                            className="fw-bold text-primary cursor-pointer hover:underline"
                                                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                            onClick={() => setActiveOrderSummary(order)}
                                                        >
                                                            {order.order_id}
                                                        </span>
                                                    </td>
                                                    <td>Table {order.table_number}</td>
                                                    <td>{order.type}</td>
                                                    <td className="small text-muted">{new Date(order.time).toLocaleString()}</td>
                                                    <td className="fw-bold text-slate-800">₹{parseFloat(order.total).toFixed(2)}</td>
                                                    <td>
                                                        <span className={`badge ${isPaid ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <button 
                                                            className="btn btn-sm btn-outline-dark me-2"
                                                            onClick={() => setActiveOrderSummary(order)}
                                                        >
                                                            Details
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-outline-secondary me-2"
                                                            onClick={() => setSelectedHistoryOrder(order)}
                                                        >
                                                            Print
                                                        </button>
                                                        {!isPaid && (
                                                            <button 
                                                                className="btn btn-sm btn-success text-white"
                                                                onClick={() => {
                                                                    setOrderHistory(prev => prev.map(o => o.order_id === order.order_id ? { ...o, status: 'PAID' } : o));
                                                                    if (activeOrderSummary?.order_id === order.order_id) {
                                                                        setActiveOrderSummary(prev => prev ? { ...prev, status: 'PAID' } : null);
                                                                    }
                                                                    alert(`Order ${order.order_id} marked as PAID.`);
                                                                }}
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4 text-muted">No orders found matching the filter.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
        
                {activeOrderSummary && (
                    <div className="col-lg-4 col-md-5">
                        <div className="card shadow-sm border-0 rounded-3 bg-white" style={{ position: 'sticky', top: '24px' }}>
                            <div className="card-body p-0 d-flex flex-column" style={{ maxHeight: 'calc(100vh - 175px)', minHeight: '450px' }}>
                                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light rounded-top-3">
                                    <div>
                                        <h6 className="fw-bold mb-0 text-slate-900">Order Bill summary</h6>
                                        <span className="text-muted small">Status: {activeOrderSummary.status}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={`badge ${activeOrderSummary.status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                            {activeOrderSummary.status === 'PAID' ? 'Closed' : 'Pending'}
                                        </span>
                                        <button 
                                            className="btn-close" 
                                            onClick={() => setActiveOrderSummary(null)}
                                            style={{ fontSize: '0.8rem' }}
                                        ></button>
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
                                    
                                    {activeOrderSummary.status !== 'PAID' ? (
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
