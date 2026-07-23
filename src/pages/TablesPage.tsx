import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RotateCw, Users, Receipt, Plus, CreditCard, Check, Clock } from 'lucide-react';
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
  status: 'Available' | 'Occupied' | 'Dirty' | 'Reserved';
  current_session: TableSession | null;
  updated_at?: string;
}

const TablesPage: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        let normalizedStatus: 'Available' | 'Occupied' | 'Dirty' | 'Reserved' = 'Available';
        const statusUpper = (item.status || '').toUpperCase();
        if (statusUpper === 'OCCUPIED') normalizedStatus = 'Occupied';
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
          <div className="grid gap-5 py-5 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {tables.map((table) => {
              // Map badge color based on status
              let badgeColor = 'bg-green-600';
              if (table.status === 'Occupied') badgeColor = 'bg-amber-500';
              else if (table.status === 'Dirty') badgeColor = 'bg-gray-500';
              else if (table.status === 'Reserved') badgeColor = 'bg-blue-500';

              return (
                <div 
                  key={table.table_id} 
                  className="relative bg-white rounded-xl p-5 shadow-sm hover:shadow-md border border-gray-200 flex flex-col gap-3 transition-all duration-200 cursor-pointer"
                  onClick={() => handleTableSelect(table.table_number)}
                >
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase ${badgeColor}`}>
                    {table.status}
                  </div>
                  <div className="text-3xl font-bold text-black mt-2.5 text-left">{table.table_number}</div>
                  <div className="text-sm text-gray-500 mb-2 text-left">{table.capacity} Seats</div>

                  {table.status === 'Occupied' && table.current_session && (
                    <div className="flex flex-col gap-2 py-2.5 border-t border-b border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Server:</span>
                        <span className="font-medium text-black">{table.current_session.staff_name || 'Staff'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-orange-500 font-medium">
                        <span className="flex items-center"><Clock size={14} className="inline mr-1" /> Elapsed:</span>
                        <span>{getMinutesElapsed(table.current_session.updated_at)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Current total:</span>
                        <span className="font-bold text-green-600 text-base">
                          ₹{(table.current_session.current_total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {table.status === 'Dirty' && (
                    <div className="text-sm text-red-500 font-medium my-2 text-left">Needs Cleaning</div>
                  )}

                  {table.status === 'Reserved' && table.current_session && (
                    <div className="flex flex-col gap-2 py-2.5 border-t border-b border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock size={14} className="inline mr-1" />
                        <span>7:30 PM</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-750 font-medium">
                        <span>{table.current_session.customer_name || 'Sarah Jenkins'}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2.5 flex-wrap mt-auto" onClick={(e) => e.stopPropagation()}>
                    {table.status === 'Available' && (
                      <button className="flex-1 min-w-[120px] px-3 py-2.5 rounded-md text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 bg-green-600 text-white hover:bg-green-700 w-full" onClick={() => handleAddItems(table.table_number)}>
                        <Receipt size={14} /> OPEN TAB
                      </button>
                    )}

                    {table.status === 'Occupied' && (
                      <>
                        <button className="flex-1 min-w-[120px] px-3 py-2.5 rounded-md text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 bg-[#0077b6] text-white hover:bg-[#005f92]" onClick={() => handleAddItems(table.table_number)}>
                          <Plus size={14} /> ADD ITEMS
                        </button>
                        <button className="flex-1 min-w-[120px] px-3 py-2.5 rounded-md text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 bg-[#0077b6] text-white hover:bg-[#005f92]" onClick={() => handlePayNow(table.table_number)}>
                          <CreditCard size={14} /> PAY NOW
                        </button>
                      </>
                    )}

                    {table.status === 'Dirty' && (
                      <button className="flex-1 min-w-[120px] px-3 py-2.5 rounded-md text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 bg-gray-500 text-white hover:bg-gray-600 w-full" onClick={() => handleMarkCleaned(table.table_number)}>
                        <Check size={14} /> TABLE CLEANED
                      </button>
                    )}

                    {table.status === 'Reserved' && (
                      <button className="flex-1 min-w-[120px] px-3 py-2.5 rounded-md text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 bg-[#0077b6] text-white hover:bg-[#005f92] w-full" onClick={() => handleMarkArrived(table.table_number)}>
                        <Check size={14} /> ARRIVED
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
