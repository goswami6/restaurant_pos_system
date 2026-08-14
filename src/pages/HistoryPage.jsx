import React, { useState, useEffect } from 'react';
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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    // Single Unified Calendar State
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);

    const openCalendarModal = () => {
        setTempStartDate(startDate);
        setTempEndDate(endDate);
        if (startDate) {
            setCalendarViewDate(new Date(startDate));
        } else {
            setCalendarViewDate(new Date());
        }
        setShowCalendarModal(true);
    };

    const handleDateClick = (dateStr) => {
        if (!tempStartDate || (tempStartDate && tempEndDate)) {
            setTempStartDate(dateStr);
            setTempEndDate('');
        } else if (tempStartDate && !tempEndDate) {
            if (dateStr >= tempStartDate) {
                setTempEndDate(dateStr);
            } else {
                setTempStartDate(dateStr);
                setTempEndDate('');
            }
        }
    };

    const applyCalendarRange = () => {
        setStartDate(tempStartDate);
        setEndDate(tempEndDate || tempStartDate);
        setShowCalendarModal(false);
    };

    const clearDateRange = () => {
        setStartDate('');
        setEndDate('');
        setTempStartDate('');
        setTempEndDate('');
    };

    const getCalendarDays = () => {
        const year = calendarViewDate.getFullYear();
        const month = calendarViewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            days.push({ dayNum: d, dateStr: `${yyyy}-${mm}-${dd}` });
        }
        return days;
    };

    // Reset pagination to page 1 on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [historySearchQuery, historyTypeFilter, historyStatusFilter, startDate, endDate]);

    const filteredHistory = orderHistory.filter(order => {
        const matchesSearch = String(order.order_id || '').toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                             String(order.table_number || '').toLowerCase().includes(historySearchQuery.toLowerCase());
        const matchesType = historyTypeFilter === 'All' || 
                            order.type.toUpperCase() === historyTypeFilter.toUpperCase();
        const matchesStatus = historyStatusFilter === 'All' || 
                              (historyStatusFilter === 'COMPLETED' 
                                ? (order.status.toUpperCase() === 'COMPLETED' || order.status.toUpperCase() === 'PAID') 
                                : order.status.toUpperCase() === historyStatusFilter.toUpperCase());

        let matchesDate = true;
        if (order.time) {
            const dateStr = String(order.time);
            const orderDate = new Date(dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr);
            if (!isNaN(orderDate.getTime())) {
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (orderDate < start) matchesDate = false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (orderDate > end) matchesDate = false;
                }
            }
        }

        return matchesSearch && matchesType && matchesStatus && matchesDate;
    });

    const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + pageSize);

    const applyQuickPreset = (type) => {
        const today = new Date();
        const formatYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const todayStr = formatYMD(today);

        if (type === 'TODAY') {
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (type === 'YESTERDAY') {
            const yest = new Date(today);
            yest.setDate(yest.getDate() - 1);
            setStartDate(formatYMD(yest));
            setEndDate(formatYMD(yest));
        } else if (type === 'THIS_WEEK') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            setStartDate(formatYMD(startOfWeek));
            setEndDate(todayStr);
        } else if (type === 'THIS_MONTH') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(formatYMD(startOfMonth));
            setEndDate(todayStr);
        } else if (type === 'ALL') {
            setStartDate('');
            setEndDate('');
            setHistorySearchQuery('');
            setHistoryTypeFilter('All');
            setHistoryStatusFilter('All');
        }
    };

    const hasActiveFilters = historySearchQuery || historyTypeFilter !== 'All' || historyStatusFilter !== 'All' || startDate || endDate;

    return (
        <div className="container-fluid py-3 py-sm-4 px-2 px-sm-4 bg-slate-50" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="row g-3 g-sm-4 align-items-start">
                <div className={activeOrderSummary ? "col-lg-8 col-md-7" : "col-12"}>
                    <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white">
                        <div className="card-body p-3 p-sm-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div>
                                    <h5 className="fw-bold text-slate-900 mb-1 d-flex align-items-center">
                                        <i className="bi bi-clock-history text-primary fs-5 me-2"></i>
                                        <span>Order History</span>
                                    </h5>
                                    <p className="text-muted small mb-0 d-none d-sm-block">Search and view details of placed and paid orders</p>
                                </div>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={() => applyQuickPreset('ALL')}
                                        className="btn btn-sm btn-outline-secondary font-bold text-xs d-flex align-items-center gap-1 rounded-2"
                                    >
                                        <span>↺</span> Reset All
                                    </button>
                                )}
                            </div>
        
                            {/* Search and Filters Header Toolbar (Responsive Mobile & Tablet Optimized) */}
                            <div className="d-flex flex-column gap-2 mb-3">
                                {/* Top Line: Search + Order Type + Inline Date Range Capsule */}
                                <div className="row g-2 align-items-center">
                                    <div className="col-12 col-sm-6 col-md-5 col-lg-4">
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Search by Order ID or Table..." 
                                            value={historySearchQuery}
                                            onChange={(e) => setHistorySearchQuery(e.target.value)}
                                            style={{ height: '38px', fontSize: '0.82rem' }}
                                        />
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                                        <select 
                                            className="form-select"
                                            value={historyTypeFilter}
                                            onChange={(e) => setHistoryTypeFilter(e.target.value)}
                                            style={{ height: '38px', fontSize: '0.82rem' }}
                                        >
                                            <option value="All">All Types</option>
                                            <option value="Dine-In">Dine-In</option>
                                            <option value="Takeaway">Takeaway</option>
                                            <option value="Delivery">Delivery</option>
                                        </select>
                                    </div>
                                    <div className="col-12 col-sm-auto">
                                        <button
                                            type="button"
                                            onClick={openCalendarModal}
                                            className="btn btn-outline-secondary d-flex align-items-center justify-content-between px-3 text-slate-700 bg-white font-medium rounded-3 border-slate-200"
                                            style={{ height: '38px', fontSize: '0.82rem', minWidth: '190px', maxWidth: '250px' }}
                                        >
                                            <span className="d-flex align-items-center gap-2 overflow-hidden text-truncate">
                                                <i className="bi bi-calendar3 text-primary"></i>
                                                {startDate ? (
                                                    <span className="fw-bold text-slate-900">
                                                        {startDate} {endDate && endDate !== startDate ? `→ ${endDate}` : ''}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500">Select Date...</span>
                                                )}
                                            </span>
                                            {(startDate || endDate) ? (
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); clearDateRange(); }}
                                                    className="badge bg-slate-200 text-slate-700 hover:bg-danger hover:text-white ms-2"
                                                    title="Clear Date Filter"
                                                >
                                                    ✕
                                                </span>
                                            ) : (
                                                <i className="bi bi-chevron-down text-slate-400 text-xs ms-1"></i>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Line: Quick Presets & Status Pills (Touch-scrollable on Mobile & Tablet) */}
                                <div 
                                    className="d-flex align-items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-nowrap"
                                    style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => applyQuickPreset('ALL')}
                                        className={`btn btn-sm text-xs font-bold rounded-pill border px-3 py-1 flex-shrink-0 ${
                                            !startDate && !endDate && historyStatusFilter === 'All'
                                                ? 'btn-primary text-white'
                                                : 'btn-light text-secondary border-slate-200'
                                        }`}
                                    >
                                        📋 All Logs
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => applyQuickPreset('TODAY')}
                                        className={`btn btn-sm text-xs font-bold rounded-pill border px-3 py-1 flex-shrink-0 ${
                                            startDate && startDate === endDate
                                                ? 'btn-primary text-white'
                                                : 'btn-light text-secondary border-slate-200'
                                        }`}
                                    >
                                        📅 Today
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => applyQuickPreset('YESTERDAY')}
                                        className="btn btn-sm text-xs font-bold rounded-pill border px-3 py-1 btn-light text-secondary border-slate-200 flex-shrink-0"
                                    >
                                        📆 Yesterday
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => applyQuickPreset('THIS_WEEK')}
                                        className="btn btn-sm text-xs font-bold rounded-pill border px-3 py-1 btn-light text-secondary border-slate-200 flex-shrink-0"
                                    >
                                        📊 This Week
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => applyQuickPreset('THIS_MONTH')}
                                        className="btn btn-sm text-xs font-bold rounded-pill border px-3 py-1 btn-light text-secondary border-slate-200 flex-shrink-0"
                                    >
                                        🗓️ This Month
                                    </button>

                                    <span className="text-slate-300 mx-1 flex-shrink-0">|</span>

                                    <button
                                        type="button"
                                        onClick={() => setHistoryStatusFilter(historyStatusFilter === 'COMPLETED' ? 'All' : 'COMPLETED')}
                                        className={`btn btn-sm text-xs font-bold rounded-pill border px-3 py-1 flex-shrink-0 ${
                                            historyStatusFilter === 'COMPLETED'
                                                ? 'btn-success text-white'
                                                : 'btn-light text-success border-success-subtle'
                                        }`}
                                    >
                                        🟢 Completed
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setHistoryStatusFilter(historyStatusFilter === 'PENDING' ? 'All' : 'PENDING')}
                                        className={`btn btn-sm text-xs font-bold rounded-pill border px-3 py-1 flex-shrink-0 ${
                                            historyStatusFilter === 'PENDING'
                                                ? 'btn-warning text-dark'
                                                : 'btn-light text-warning border-warning-subtle'
                                        }`}
                                    >
                                        🟠 Pending
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setHistoryStatusFilter(historyStatusFilter === 'CANCELLED' ? 'All' : 'CANCELLED')}
                                        className={`btn btn-sm text-xs font-bold rounded-pill border px-3 py-1 flex-shrink-0 ${
                                            historyStatusFilter === 'CANCELLED'
                                                ? 'btn-danger text-white'
                                                : 'btn-light text-danger border-danger-subtle'
                                        }`}
                                    >
                                        🔴 Cancelled
                                    </button>
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
                                        {paginatedHistory.map((order) => {
                                            const isPaid = order.status === 'PAID' || order.status === 'COMPLETED';
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
                                                    {posSettings.isEnableTables && <td style={{ whiteSpace: 'nowrap' }}>{(!order.table_number || String(order.table_number).toUpperCase() === 'N/A') ? 'Empty' : order.table_number}</td>}
                                                    <td style={{ whiteSpace: 'nowrap' }}>{(!order.type || String(order.type).toUpperCase() === 'N/A') ? 'Empty' : order.type}</td>
                                                    <td className="small text-muted" style={{ whiteSpace: 'nowrap' }}>{order.time ? new Date(order.time).toLocaleString() : 'Empty'}</td>
                                                    <td className="fw-bold text-slate-800" style={{ whiteSpace: 'nowrap' }}>₹{parseFloat(order.total || 0).toFixed(2)}</td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <span className={`badge ${
                                                            order.status === 'PAID' || order.status === 'COMPLETED' ? 'bg-success' : 
                                                            order.status === 'CANCELLED' ? 'bg-danger text-white' : 
                                                            order.status === 'PENDING' ? 'bg-warning text-dark' : 
                                                            order.status ? 'bg-info text-dark' : 'bg-secondary text-white'
                                                        }`}>
                                                            {order.status === 'PAID' ? 'COMPLETED' : (!order.status || String(order.status).toUpperCase() === 'N/A') ? 'Empty' : order.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                                                        <div className="d-flex justify-content-end gap-1 flex-nowrap">
                                                            <button 
                                                                className="btn btn-sm btn-outline-dark rounded-2 px-2.5 py-1"
                                                                onClick={() => setActiveOrderSummary(order)}
                                                                title="View Details"
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                            {order.status !== 'CANCELLED' && (
                                                                <button 
                                                                    className="btn btn-sm btn-outline-secondary rounded-2 px-2.5 py-1"
                                                                    onClick={() => setSelectedHistoryOrder(order)}
                                                                    title="Print Receipt"
                                                                >
                                                                    <i className="bi bi-printer"></i>
                                                                </button>
                                                            )}
                                                            {!isPaid && order.status !== 'CANCELLED' && (
                                                                <button 
                                                                    className="btn btn-sm btn-success text-white rounded-2 px-2.5 py-1"
                                                                    title="Mark Paid / Complete"
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
                                                                    <i className="bi bi-check-circle"></i>
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
                                {/* ── Sleek Modern Pagination Bar (Matches Design 1-to-1) ───────────────── */}
                             {filteredHistory.length > 0 && (
                                 <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 pt-3 mt-3 border-top" style={{ borderTop: '1px solid #f1f5f9' }}>
                                     {/* Left: Previous + Numbers + Next */}
                                     <div className="d-flex align-items-center gap-2 flex-wrap">
                                         <button
                                             type="button"
                                             disabled={currentPage === 1}
                                             onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                             className="btn btn-link text-decoration-none d-flex align-items-center gap-1 p-1 text-slate-600 font-medium text-xs border-0"
                                             style={{ opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                         >
                                             <i className="bi bi-chevron-left"></i>
                                             <span>Previous</span>
                                         </button>

                                         <div className="d-flex align-items-center gap-1">
                                             {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                 .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                                                 .map((page, index, array) => {
                                                     const showEllipsis = index > 0 && page - array[index - 1] > 1;
                                                     const isActive = currentPage === page;
                                                     return (
                                                         <React.Fragment key={page}>
                                                             {showEllipsis && <span className="text-slate-400 text-xs px-1">...</span>}
                                                             <button
                                                                 type="button"
                                                                 onClick={() => setCurrentPage(page)}
                                                                 className="btn p-0 d-flex align-items-center justify-content-center font-bold text-xs rounded-circle transition-all cursor-pointer"
                                                                 style={{
                                                                     width: '32px',
                                                                     height: '32px',
                                                                     backgroundColor: isActive ? '#6366f1' : 'transparent',
                                                                     color: isActive ? '#ffffff' : '#475569',
                                                                     boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none',
                                                                     border: 'none'
                                                                 }}
                                                             >
                                                                 {page}
                                                             </button>
                                                         </React.Fragment>
                                                     );
                                                 })}
                                         </div>

                                         <button
                                             type="button"
                                             disabled={currentPage === totalPages}
                                             onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                             className="btn btn-link text-decoration-none d-flex align-items-center gap-1 p-1 text-slate-600 font-medium text-xs border-0"
                                             style={{ opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                                         >
                                             <span>Next</span>
                                             <i className="bi bi-chevron-right"></i>
                                         </button>
                                     </div>

                                     <div className="text-slate-500 text-xs font-medium">
                                         Showing <span className="fw-bold text-slate-700">{Math.min(startIndex + pageSize, filteredHistory.length)}</span> of <span className="fw-bold text-slate-700">{filteredHistory.length.toLocaleString()}</span> results
                                     </div>
                                 </div>
                             )}
                            </div>
                        </div>
                    </div>
                </div>
        
                {activeOrderSummary && (
                    <>
                        <div className="d-block d-md-none history-backdrop-mobile" onClick={() => setActiveOrderSummary(null)}></div>
                        <div className="col-lg-4 col-md-5 history-summary-drawer" style={{ position: 'sticky', top: '0', alignSelf: 'flex-start', zIndex: 10, maxHeight: 'calc(100vh - 140px)' }}>
                            <div className="card shadow-sm border-0 rounded-3 bg-white d-flex flex-column" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                                <div className="card-body p-0 d-flex flex-column overflow-hidden" style={{ maxHeight: 'calc(100vh - 140px)' }}>
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
                                            {posSettings?.isEnableTables && (
                                                <>
                                                    <span className="text-secondary">|</span>
                                                    <span><strong>Table:</strong> {(!activeOrderSummary.table_number || String(activeOrderSummary.table_number).toUpperCase() === 'N/A') ? 'Empty' : activeOrderSummary.table_number}</span>
                                                </>
                                            )}
                                            <span className="text-secondary">|</span>
                                            <span><strong>Type:</strong> {(!activeOrderSummary.type || String(activeOrderSummary.type).toUpperCase() === 'N/A') ? 'Empty' : activeOrderSummary.type}</span>
                                            <span className="text-secondary">|</span>
                                            <span className={`badge ${
                                                activeOrderSummary.status === 'COMPLETED' || activeOrderSummary.status === 'PAID' ? 'bg-success' : 
                                                activeOrderSummary.status === 'SERVED' ? 'bg-info text-dark' : 'bg-warning text-dark'
                                            }`} style={{ fontSize: '0.65rem' }}>
                                                {activeOrderSummary.status === 'PAID' ? 'COMPLETED' : (!activeOrderSummary.status || String(activeOrderSummary.status).toUpperCase() === 'N/A') ? 'Empty' : activeOrderSummary.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Items scroll */}
                                    <div className="p-3 flex-grow-1" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
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
                                    
                                    {/* Calculation summary (Matches reactemenu 1-to-1) */}
                                    <div className="p-3 bg-slate-50 border-top border-dashed rounded-bottom-3 mt-auto">
                                        <h6 className="text-slate-400 uppercase tracking-widest border-bottom border-dashed pb-2 mb-2 text-center fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                                            Billing breakdown
                                        </h6>
                                        <div className="d-flex justify-content-between mb-1 text-slate-600 text-xs">
                                            <span>Subtotal</span>
                                            <span className="fw-semibold text-slate-800">₹{parseFloat(activeOrderSummary.subtotal || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1 text-slate-500 text-xs ps-2">
                                            <span>CGST ({(parseFloat(posSettings.taxRate || 5) / 2).toFixed(1)}%)</span>
                                            <span>+₹{(parseFloat(activeOrderSummary.tax || 0) / 2).toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1 text-slate-500 text-xs ps-2">
                                            <span>SGST ({(parseFloat(posSettings.taxRate || 5) / 2).toFixed(1)}%)</span>
                                            <span>+₹{(parseFloat(activeOrderSummary.tax || 0) / 2).toFixed(2)}</span>
                                        </div>
                                        {parseFloat(activeOrderSummary.serviceCharge || 0) > 0 && (
                                            <div className="d-flex justify-content-between mb-1 text-slate-500 text-xs">
                                                <span>Service Charge ({posSettings.serviceCharge}%)</span>
                                                <span>+₹{parseFloat(activeOrderSummary.serviceCharge || 0).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {parseFloat(activeOrderSummary.discount || 0) > 0 && (
                                            <div className="d-flex justify-content-between mb-1 text-danger text-xs">
                                                <span>Discount</span>
                                                <span>-₹{parseFloat(activeOrderSummary.discount || 0).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="border-top border-dashed pt-2 mt-2 d-flex justify-content-between align-items-center mb-2">
                                            <strong className="text-slate-900 fs-6">Grand Total</strong>
                                            <strong className="text-primary fs-5">₹{parseFloat(activeOrderSummary.total || 0).toFixed(2)}</strong>
                                        </div>
                                        <div className="text-center text-muted fw-bold uppercase pb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                                            Payment state: {activeOrderSummary.status === 'PAID' ? 'COMPLETED' : activeOrderSummary.status} | Bill: {activeOrderSummary.status === 'PAID' ? 'COMPLETED' : activeOrderSummary.status}
                                        </div>
                                        
                                        {activeOrderSummary.status !== 'PAID' && activeOrderSummary.status !== 'COMPLETED' && activeOrderSummary.status !== 'CANCELLED' ? (
                                            <button 
                                                className="btn btn-dark w-100 fw-bold py-2 mt-1" 
                                                onClick={() => onViewDetailOrder(activeOrderSummary)}
                                            >
                                                Modify Order / Add Items
                                            </button>
                                        ) : activeOrderSummary.status !== 'CANCELLED' ? (
                                            <button 
                                                className="btn btn-outline-dark w-100 fw-bold py-2 mt-1"
                                                onClick={() => setSelectedHistoryOrder(activeOrderSummary)}
                                            >
                                                Print Receipt
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        
            {/* ── Single Unified Range Calendar Modal ───────────────────────── */}
            {showCalendarModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '360px' }}>
                        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden" style={{ backgroundColor: '#f5f3ff' }}>
                            <div className="p-3 d-flex align-items-center justify-content-between border-bottom" style={{ borderColor: '#e9d5ff' }}>
                                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#581c87' }}>
                                    <i className="bi bi-calendar-event"></i>
                                    <span>Select Date Range</span>
                                </h6>
                                <button type="button" className="btn-close" onClick={() => setShowCalendarModal(false)}></button>
                            </div>

                            <div className="p-3">
                                {/* Month Header Navigation */}
                                <div className="d-flex align-items-center justify-content-between mb-3 px-1">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-light rounded-circle border-0 font-bold"
                                        style={{ color: '#6b21a8' }}
                                        onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))}
                                    >
                                        ‹
                                    </button>
                                    <span className="fw-bold" style={{ color: '#3b0764', fontSize: '0.95rem' }}>
                                        {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-light rounded-circle border-0 font-bold"
                                        style={{ color: '#6b21a8' }}
                                        onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))}
                                    >
                                        ›
                                    </button>
                                </div>

                                {/* Weekday Labels */}
                                <div className="d-grid gap-1 text-center mb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                                        <span key={i} className="text-xs font-bold" style={{ color: '#a855f7' }}>{d}</span>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="d-grid gap-1 text-center mb-3" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {getCalendarDays().map((item, idx) => {
                                        if (!item) return <div key={idx}></div>;
                                        const isStart = tempStartDate === item.dateStr;
                                        const isEnd = tempEndDate === item.dateStr;
                                        const inRange = tempStartDate && tempEndDate && item.dateStr > tempStartDate && item.dateStr < tempEndDate;
                                        const isSelected = isStart || isEnd;

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleDateClick(item.dateStr)}
                                                className="d-flex align-items-center justify-content-center transition-all"
                                                style={{
                                                    height: '36px',
                                                    backgroundColor: inRange ? '#ede9fe' : 'transparent',
                                                    borderRadius: isStart ? '50% 0 0 50%' : isEnd ? '0 50% 50% 0' : inRange ? '0' : '50%',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div
                                                    className="d-flex align-items-center justify-content-center font-semibold text-xs rounded-circle"
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        backgroundColor: isSelected ? '#7c3aed' : 'transparent',
                                                        color: isSelected ? '#ffffff' : inRange ? '#5b21b6' : '#334155',
                                                        boxShadow: isSelected ? '0 4px 10px rgba(124, 58, 237, 0.35)' : 'none'
                                                    }}
                                                >
                                                    {item.dayNum}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Selected Info Summary */}
                                <div className="p-2 rounded-3 text-center mb-3 border" style={{ backgroundColor: '#ffffff', borderColor: '#ddd6fe' }}>
                                    <span className="text-xs font-medium" style={{ color: '#4c1d95' }}>
                                        {tempStartDate ? (
                                            <>
                                                Selected: <strong>{tempStartDate}</strong> {tempEndDate ? `to ${tempEndDate}` : '(Select End Date)'}
                                            </>
                                        ) : (
                                            'Click a date to select Start Date'
                                        )}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-light border-0 text-slate-600 font-bold flex-fill py-2"
                                        onClick={() => {
                                            setTempStartDate('');
                                            setTempEndDate('');
                                        }}
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm font-bold text-white flex-fill py-2"
                                        style={{ backgroundColor: '#7c3aed' }}
                                        onClick={applyCalendarRange}
                                    >
                                        Apply Range
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ReceiptModal 
                selectedHistoryOrder={selectedHistoryOrder}
                setSelectedHistoryOrder={setSelectedHistoryOrder}
                posSettings={posSettings}
            />
        </div>
    );
};

export default HistoryPage;
