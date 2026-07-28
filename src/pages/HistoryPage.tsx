import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Receipt, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';

interface OrderHistoryItem {
  order_id: string;
  table_name: string;
  table_number_id: string;
  order_status: string;
  created_at: string;
  guest_name?: string;
  phone?: string;
  resolved_status?: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  bill?: {
    subtotal: number;
    tax_amount: number;
    service_charge: number;
    discount_amount: number;
    grand_total: number;
    payment_status: string;
    bill_status: string;
  };
}

const HistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const savedUser = localStorage.getItem('emenu_user');
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || 9;

      // Fetch orders from server
      const ordersRes = await fetch(`${API_BASE_URL}/orders/${restaurantId}`);

      if (!ordersRes.ok) {
        throw new Error('Failed to load history data from server');
      }

      const ordersData = await ordersRes.json();
      const rawOrders = ordersData && ordersData.status === true && Array.isArray(ordersData.data) ? ordersData.data : [];

      // Use raw status from backend directly as requested by the user
      const resolvedOrders = rawOrders.map((order: any) => {
        return {
          ...order,
          resolved_status: (order.order_status || '').toUpperCase()
        };
      });

      // Sort orders latest first
      resolvedOrders.sort((a: any, b: any) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setOrders(resolvedOrders);
    } catch (err: any) {
      console.error('Failed to fetch orders history:', err);
      setError(err.message || 'Failed to load order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED') return 'bg-emerald-50 text-emerald-600 border border-emerald-200/50';
    if (s === 'CANCELLED') return 'bg-rose-50 text-rose-600 border border-rose-200/50';
    if (s === 'PENDING') return 'bg-amber-50 text-amber-600 border border-amber-200/50';
    if (s === 'PREPARING' || s === 'SERVED') return 'bg-sky-50 text-sky-600 border border-sky-200/50';
    return 'bg-gray-50 text-gray-500 border border-gray-200';
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans pb-10">
      <Header />
      
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-4 sm:mb-8 px-1">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="p-2 sm:p-2.5 bg-white rounded-xl shadow-xs hover:shadow-md hover:bg-gray-50 text-gray-700 transition-all border border-gray-200">
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">Order Registry</h1>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium hidden sm:block">Tabular history & detailed billing logs</p>
            </div>
          </div>
          <button 
            onClick={fetchOrderHistory} 
            className="p-2 sm:p-3 bg-white rounded-xl shadow-xs hover:shadow-md hover:bg-gray-50 text-gray-700 transition-all active:scale-95 border border-gray-200 cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw size={16} className={`sm:w-4 sm:h-4 ${loading ? 'animate-spin text-[#0077b6]' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-gray-150 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0077b6]"></div>
            <p className="text-gray-500 mt-5 font-bold text-sm">Fetching restaurant order records...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-rose-700 flex flex-col items-center shadow-sm">
            <AlertCircle size={36} className="mb-3 text-rose-500" />
            <p className="font-bold text-lg">{error}</p>
            <button 
              onClick={fetchOrderHistory} 
              className="mt-4 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              Reload History
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-2xl p-16 text-center text-gray-500 shadow-sm">
            <Receipt size={56} className="mx-auto mb-4 opacity-25 text-gray-400" />
            <p className="font-extrabold text-xl text-gray-800">No Orders Registered</p>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">There are currently no bills registered for this restaurant database.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[550px] sm:min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200/80">
                  <tr>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Table</th>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const isExpanded = !!expandedOrders[order.order_id];
                    const itemsSummary = (order.items || []).map(i => `${i.name} x${i.quantity}`).join(', ');
                    
                    const cleanDate = order.created_at 
                      ? new Date(order.created_at.includes(' ') ? order.created_at.replace(' ', 'T') : order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Date N/A';

                    return (
                      <React.Fragment key={order.order_id}>
                        {/* Table Main Row */}
                        <tr 
                          className={`hover:bg-gray-50/70 transition-colors cursor-pointer select-none ${
                            isExpanded ? 'bg-gray-50/50' : ''
                          }`}
                          onClick={() => toggleExpand(order.order_id)}
                        >
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-extrabold text-gray-900">
                            #{order.order_id}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-bold text-[#0077b6] whitespace-nowrap">
                            <span className="bg-[#0077b6]/5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs">
                              {order.table_name || 'Walk-In'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-[11px] sm:text-xs text-gray-500 font-medium whitespace-nowrap">
                            {cleanDate}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs text-gray-600 font-medium max-w-[130px] sm:max-w-xs truncate" title={itemsSummary}>
                            {itemsSummary}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-black text-gray-900 whitespace-nowrap">
                            ₹{Number(order.bill?.grand_total || 0).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider border whitespace-nowrap ${getStatusBadgeClass(order.resolved_status)}`}>
                              {order.resolved_status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-right">
                            <button 
                              className="p-1 hover:bg-gray-200/50 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                              onClick={(e) => { e.stopPropagation(); toggleExpand(order.order_id); }}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Sub-Row (Receipt details) */}
                        {isExpanded && (
                          <tr className="bg-gray-50/30">
                            <td colSpan={7} className="px-3 sm:px-6 py-4 border-t border-b border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Left Side: Items Detail */}
                                <div>
                                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <Receipt size={13} /> Ordered Items List
                                  </h4>
                                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-inner">
                                    {(order.items || []).map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex flex-col">
                                          <span className="font-semibold text-gray-800">{item.name}</span>
                                          <span className="text-xs text-gray-400">Price: ₹{Number(item.unit_price).toFixed(2)}</span>
                                        </div>
                                        <span className="font-bold text-gray-700">
                                          x{item.quantity} &nbsp;&nbsp;&nbsp;&nbsp; ₹{(Number(item.total_price || item.unit_price * item.quantity)).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Right Side: Billing Breakdown */}
                                {order.bill && (
                                  <div className="bg-white border border-dashed border-gray-300 rounded-xl p-5 shadow-sm max-w-sm ml-auto w-full">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3 text-center">
                                      Billing breakdown
                                    </h4>
                                    <div className="space-y-2 text-sm text-gray-600">
                                      <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-gray-800">₹{Number(order.bill.subtotal).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>Tax (5%)</span>
                                        <span>₹{Number(order.bill.tax_amount).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>Service Charge (7%)</span>
                                        <span>₹{Number(order.bill.service_charge).toFixed(2)}</span>
                                      </div>
                                      {order.bill.discount_amount > 0 && (
                                        <div className="flex justify-between text-xs text-red-500">
                                          <span>Discount</span>
                                          <span>-₹{Number(order.bill.discount_amount).toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div className="border-t border-dashed pt-3 mt-3 flex justify-between font-extrabold text-base text-gray-900">
                                        <span>Grand Total</span>
                                        <span className="text-[#0077b6]">₹{Number(order.bill.grand_total).toFixed(2)}</span>
                                      </div>
                                      <div className="text-[9px] text-center text-gray-400 font-bold tracking-wide uppercase pt-2.5">
                                        Payment state: {order.bill.payment_status} | Bill: {order.bill.bill_status}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
