import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Receipt, Plus, CreditCard, Check, Clock } from 'lucide-react';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';

interface TableSession {
  active_order_id?: string;
  staff_id?: number;
  staff_name?: string;
  guest_count?: number;
  updated_at?: string;
  total_items?: number;
  current_total?: number;
  reservation_id?: number;
  customer_name?: string;
}

interface Table {
  table_id: number | string;
  table_number: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Busy' | 'Dirty' | 'Reserved';
  current_session: TableSession | null;
  updated_at?: string;
}

const TablesPage: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = React.useRef(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const savedUser = localStorage.getItem('emenu_user');
      const userObj = savedUser ? JSON.parse(savedUser) : null;
      const restaurantId = userObj?.restaurant_id || userObj?.restaurent_id || 9;

      // Fetch both tables and orders in parallel to merge active sessions
      const [tablesRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tables/${restaurantId}`),
        fetch(`${API_BASE_URL}/orders/${restaurantId}`).catch(() => null)
      ]);

      if (!tablesRes.ok) {
        throw new Error(`HTTP error! Status: ${tablesRes.status}`);
      }
      
      const data = await tablesRes.json();
      
      let activeOrders: any[] = [];
      if (ordersRes && ordersRes.ok) {
        try {
          const ordersData = await ordersRes.json();
          const rawOrders = Array.isArray(ordersData) 
            ? ordersData 
            : (ordersData && Array.isArray(ordersData.data) ? ordersData.data : []);
          
          // Match unpaid/pending orders using backend schema fields
          activeOrders = rawOrders.filter((o: any) => {
            const isUnpaid = o.bill?.payment_status?.toUpperCase() !== 'PAID';
            const isPending = o.order_status?.toUpperCase() === 'PENDING';
            return isUnpaid && isPending;
          });
        } catch (e) {
          console.warn("Failed to parse orders response:", e);
        }
      }

      let list: any[] = [];
      if (data && data.status === true && Array.isArray(data.data)) {
        const hasSections = data.data.length > 0 && data.data[0].tables;
        if (hasSections) {
          data.data.forEach((sec: any) => {
            if (sec && sec.tables) list.push(...sec.tables);
          });
        } else {
          list = data.data;
        }
      } else if (data) {
        if (data.tables && data.tables.length > 0) {
          list = data.tables;
        } else if (data.sections && data.sections.length > 0) {
          data.sections.forEach((sec: any) => {
            if (sec && sec.tables) list.push(...sec.tables);
          });
        }
      }

      // Map API statuses cleanly and merge live active orders for Occupied tables
      const mappedList: Table[] = list.map((item: any) => {
        let normalizedStatus: 'Available' | 'Occupied' | 'Busy' | 'Dirty' | 'Reserved' = 'Available';
        const statusUpper = (item.status || '').toUpperCase();
        if (statusUpper === 'OCCUPIED') normalizedStatus = 'Occupied';
        else if (statusUpper === 'BUSY' || statusUpper === 'SELECTING') normalizedStatus = 'Busy';
        else if (statusUpper === 'DIRTY') normalizedStatus = 'Dirty';
        else if (statusUpper === 'RESERVED') normalizedStatus = 'Reserved';
        else normalizedStatus = 'Available';

        const tableNumStr = item.table_name || item.table_number || `#${item.table_id}`;
        
        // Find active order matching this table ID or table name
        const activeOrder = activeOrders.find((o: any) => {
          return String(o.table_number_id) === String(item.table_id) || 
                 String(o.table_name).trim().toLowerCase() === String(tableNumStr).trim().toLowerCase();
        });

        let currentSession: TableSession | null = null;
        if (activeOrder) {
          currentSession = {
            active_order_id: activeOrder.order_id,
            staff_name: activeOrder.staff_name || 'Waiter',
            current_total: Number(activeOrder.bill?.grand_total || activeOrder.bill?.total || 0),
            updated_at: activeOrder.created_at || new Date().toISOString()
          };
        } else if (normalizedStatus === 'Occupied') {
          currentSession = {
            staff_name: 'Staff',
            current_total: 0,
            updated_at: new Date().toISOString()
          };
        }

        return {
          table_id: item.table_id || item.table_number,
          table_number: tableNumStr,
          capacity: Number(item.capacity) || 4,
          status: normalizedStatus,
          current_session: currentSession,
          updated_at: item.updated_at
        };
      });

      setTables(mappedList);
    } catch (err: any) {
      console.error('Failed to fetch live tables data:', err);
      setError(err.message || 'Failed to load tables.');
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchTables();
  }, []);

  const handleTableSelect = (tableNumber: string) => {
    const cleanNum = String(tableNumber).replace(/[^0-9]/g, '');
    sessionStorage.setItem('emenu_table', cleanNum || tableNumber);
    localStorage.removeItem('emenu_cart');
    navigate(`/?table=${cleanNum || encodeURIComponent(tableNumber)}`);
  };

  const handleSeatGuests = async (tableNumber: string) => {
    const session = {
      staff_name: 'Staff',
      current_total: 0,
      updated_at: new Date().toISOString()
    };
    try {
      await fetch(`${API_BASE_URL}/tables/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: tableNumber,
          status: 'Occupied',
          current_session: session
        })
      });
      fetchTables();
    } catch (e) {
      console.warn("Failed to update table status on backend:", e);
    }
  };

  const handleOpenTab = async (tableNumber: string) => {
    const session = {
      staff_name: 'Staff',
      current_total: 0,
      updated_at: new Date().toISOString()
    };
    try {
      await fetch(`${API_BASE_URL}/tables/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: tableNumber,
          status: 'Occupied',
          current_session: session
        })
      });
      fetchTables();
    } catch (e) {
      console.warn("Failed to update table status on backend:", e);
    }
  };

  const handleAddItems = (tableNumber: string) => {
    const cleanNum = String(tableNumber).replace(/[^0-9]/g, '');
    sessionStorage.setItem('emenu_table', cleanNum || tableNumber);
    localStorage.removeItem('emenu_cart');
    navigate(`/?table=${cleanNum || encodeURIComponent(tableNumber)}`);
  };

  const handlePayNow = async (tableNumber: string) => {
    const tableObj = tables.find(t => t.table_number === tableNumber);
    const lastOrderId = tableObj?.current_session?.active_order_id || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const session = {
      last_order_id: lastOrderId,
      updated_at: new Date().toISOString()
    };
    try {
      await fetch(`${API_BASE_URL}/tables/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: tableNumber,
          status: 'Dirty',
          current_session: session
        })
      });
      fetchTables();
    } catch (e) {
      console.warn("Failed to update table status on backend:", e);
    }
  };

  const handleMarkCleaned = async (tableNumber: string) => {
    try {
      await fetch(`${API_BASE_URL}/tables/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: tableNumber,
          status: 'Available',
          current_session: null
        })
      });
      fetchTables();
    } catch (e) {
      console.warn("Failed to update table status on backend:", e);
    }
  };

  const handleMarkArrived = async (tableNumber: string) => {
    const session = {
      staff_name: 'Staff',
      current_total: 0,
      updated_at: new Date().toISOString()
    };
    try {
      await fetch(`${API_BASE_URL}/tables/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: tableNumber,
          status: 'Occupied',
          current_session: session
        })
      });
      fetchTables();
    } catch (e) {
      console.warn("Failed to update table status on backend:", e);
    }
  };

  const getMinutesElapsed = (dateString?: string) => {
    if (!dateString) return '0m';
    // Replace space with T for browser compatibility with SQL datetimes
    const formattedString = dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString;
    const date = new Date(formattedString);
    if (isNaN(date.getTime())) return '0m';
    const diffMs = Date.now() - date.getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-[3vh]">
      <Header />

      <div className="mt-5 px-[3%] py-5 max-w-[1400px] mx-auto box-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 m-0">Table Status</h2>
          <button 
            onClick={fetchTables} 
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-[8px] shadow-sm hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="text-center py-10 font-bold text-red-500">{error}</div>
        ) : loading ? (
          <div className="text-center py-10 font-bold text-[#0077b6]">Loading tables...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 py-3 sm:py-5">
            {tables.map((table) => {
              // Map badge color based on exact requested status colors:
              // Available: Green | Busy: Amber Yellow | Occupied: Red | Dirty: Slate | Reserved: Purple
              let badgeColor = 'bg-emerald-600';
              if (table.status === 'Occupied') badgeColor = 'bg-rose-600';
              else if (table.status === 'Busy') badgeColor = 'bg-amber-500 text-slate-900';
              else if (table.status === 'Dirty') badgeColor = 'bg-slate-500';
              else if (table.status === 'Reserved') badgeColor = 'bg-purple-600';

              return (
                <div 
                  key={table.table_id} 
                  className="relative bg-white rounded-2xl p-2.5 sm:p-5 shadow-xs hover:shadow-md border border-gray-200/90 flex flex-col gap-2 transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => handleTableSelect(table.table_number)}
                >
                  {/* Top-Right Modern Corner Tag (Mobile: top-right corner tag, Desktop: pill badge) */}
                  <div className={`absolute top-0 right-0 px-2 py-0.5 sm:px-3 sm:py-1 rounded-bl-xl sm:rounded-bl-none sm:rounded-full sm:top-3 sm:right-3 text-[9px] sm:text-[10px] font-extrabold text-white uppercase tracking-wider ${badgeColor}`}>
                    {table.status}
                  </div>

                  {/* Table Header */}
                  <div className="text-left pt-1 sm:pt-0 border-b border-gray-100/80 pb-1.5">
                    <h3 className="text-xs xs:text-sm sm:text-xl font-black text-gray-900 leading-tight truncate pr-14 sm:pr-20">
                      {table.table_number}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-bold mt-0.5">
                      {table.capacity} Seats
                    </p>
                  </div>

                  {/* Occupied Session Box */}
                  {table.status === 'Occupied' && table.current_session && (
                    <div className="bg-slate-50/80 rounded-xl p-1.5 sm:p-2.5 flex flex-col gap-0.5 sm:gap-1 text-[10px] sm:text-xs border border-slate-100/80">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Server</span>
                        <span className="font-bold text-gray-800 truncate max-w-[65px] sm:max-w-none">{table.current_session.staff_name || 'Staff'}</span>
                      </div>
                      <div className="flex justify-between items-center text-amber-600 font-bold">
                        <span className="flex items-center gap-1"><Clock size={10} className="shrink-0" /> Elapsed</span>
                        <span>{getMinutesElapsed(table.current_session.updated_at)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 mt-0.5">
                        <span className="text-gray-500 font-medium">Total</span>
                        <span className="font-black text-emerald-600 text-xs sm:text-base">
                          ₹{(table.current_session.current_total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {table.status === 'Dirty' && (
                    <div className="bg-rose-50/60 rounded-xl p-1.5 text-center text-[10px] sm:text-xs text-rose-600 font-extrabold border border-rose-100">
                      Needs Cleaning
                    </div>
                  )}

                  {table.status === 'Reserved' && table.current_session && (
                    <div className="bg-purple-50/60 rounded-xl p-1.5 flex flex-col gap-0.5 text-[10px] sm:text-xs border border-purple-100">
                      <div className="flex items-center gap-1 text-purple-700 font-semibold">
                        <Clock size={10} className="shrink-0" /> 7:30 PM
                      </div>
                      <div className="font-bold text-purple-900 truncate">
                        {table.current_session.customer_name || 'Reserved'}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons with Compact Height & Modern Radius for Mobile */}
                  <div className="flex gap-1.5 sm:gap-2 mt-auto pt-1 w-full" onClick={(e) => e.stopPropagation()}>
                    {table.status === 'Available' && (
                      <button className="w-full px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black cursor-pointer flex items-center justify-center gap-1 transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95" onClick={() => handleAddItems(table.table_number)}>
                        <Receipt size={12} /> OPEN TAB
                      </button>
                    )}

                    {table.status === 'Occupied' && (
                      <div className="grid grid-cols-2 gap-1.5 w-full">
                        <button className="px-1.5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black cursor-pointer flex items-center justify-center gap-1 transition-all duration-200 bg-[#0077b6] hover:bg-[#005f92] text-white shadow-2xs active:scale-95" onClick={() => handleAddItems(table.table_number)}>
                          <Plus size={11} /> <span className="truncate">ADD</span>
                        </button>
                        <button className="px-1.5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black cursor-pointer flex items-center justify-center gap-1 transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95" onClick={() => handlePayNow(table.table_number)}>
                          <CreditCard size={11} /> <span className="truncate">PAY</span>
                        </button>
                      </div>
                    )}

                    {table.status === 'Dirty' && (
                      <button className="w-full px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black cursor-pointer flex items-center justify-center gap-1 transition-all duration-200 bg-slate-600 hover:bg-slate-700 text-white shadow-2xs active:scale-95" onClick={() => handleMarkCleaned(table.table_number)}>
                        <Check size={12} /> CLEANED
                      </button>
                    )}

                    {table.status === 'Reserved' && (
                      <button className="w-full px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black cursor-pointer flex items-center justify-center gap-1 transition-all duration-200 bg-[#0077b6] hover:bg-[#005f92] text-white shadow-2xs active:scale-95" onClick={() => handleMarkArrived(table.table_number)}>
                        <Check size={12} /> ARRIVED
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TablesPage;
