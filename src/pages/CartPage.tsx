import React, { useState } from 'react';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');

  const [cart, setCart] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('emenu_cart');
    return saved ? JSON.parse(saved) : {};
  });

  const saveCart = (newCart: Record<string, any>) => {
    setCart(newCart);
    localStorage.setItem('emenu_cart', JSON.stringify(newCart));
  };

  const updateQty = (id: string, delta: number) => {
    const newCart = { ...cart };
    if (!newCart[id]) return;
    newCart[id].quantity += delta;
    if (newCart[id].quantity <= 0) {
      delete newCart[id];
    }
    saveCart(newCart);
  };

  const removeItem = (id: string) => {
    const newCart = { ...cart };
    delete newCart[id];
    saveCart(newCart);
  };

  const setItemNotes = (id: string, notes: string) => {
    const newCart = { ...cart };
    if (newCart[id]) {
      newCart[id].notes = notes;
    }
    saveCart(newCart);
  };

  const openModal = (id: string) => {
    setSelectedItemId(id);
    setIsModalOpen(true);
  };

  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% GST
  const grandTotal = subtotal + tax;

  return (
    <div className="cart-body min-h-screen bg-[#f8f8f8] pb-24 md:pb-8">
      <div className="header-cart sticky top-0 z-50 flex h-14 md:h-[10vh] w-full items-center justify-between bg-white px-4 md:px-[3%] py-2 md:py-[1.5%] shadow-sm border-b border-gray-100">
        <div className="backpluscart flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="back-arrow text-gray-700 hover:text-black cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-all">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-lg md:text-[20px] font-bold text-gray-900">Cart</h2>
            <p className="text-xs text-gray-500 md:hidden">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
          </div>
        </div>
        <button className="cart-icon text-gray-700 p-1">
          <ShoppingBag size={22} />
        </button>
      </div>

      <div className="cart-container mx-3 my-4 md:m-[3%_2.5%] md:w-[95%] rounded-xl md:rounded-[10px] bg-white p-3.5 md:p-[15px] shadow-sm border border-gray-150">
        {cartItems.length === 0 ? (
          <div className="text-center py-16 md:py-20 text-gray-500">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-base font-semibold text-gray-700">Your cart is empty</p>
            <p className="text-xs text-gray-400 mt-1">Add items from the menu to see them here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-150">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item py-3.5 md:py-[15px] first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="item-info flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="iconplusitem flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        <img 
                          src={item.isVeg ? "/images/veg.png" : "/images/nonVeg.png"} 
                          alt={item.isVeg ? "Veg" : "Non-Veg"} 
                          className="h-4 w-4 md:h-[20px] md:w-[20px] object-contain"
                        />
                      </div>
                      <div className="nameplusprice flex-1 min-w-0">
                        <div className="nameCart text-sm md:text-[16px] font-semibold md:font-bold text-gray-900 leading-snug break-words md:max-w-[40vw]">
                          {item.name}
                        </div>
                        <div className="price text-xs md:text-[15px] font-semibold text-gray-600 md:text-[#555] mt-0.5">
                          {item.price.toFixed(2)} Rs
                        </div>
                      </div>
                    </div>

                    {/* Mobile Stepper */}
                    <div className="quantity flex md:hidden items-center rounded-lg border border-[#0077b6] bg-blue-50/40 px-2 py-1 shadow-2xs">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="delete p-1 text-red-500 hover:text-red-700 cursor-pointer active:scale-95 transition-transform"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => updateQty(item.id, -1)}
                        className="px-1 text-sm font-bold text-gray-600 hover:text-black cursor-pointer active:scale-95"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold px-1.5 min-w-[16px] text-center text-gray-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQty(item.id, 1)}
                        className="add px-1 text-sm font-bold text-[#0077b6] hover:text-[#005f92] cursor-pointer active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {item.notes && (
                    <div className="text-xs text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded-md px-2.5 py-1 mt-2 flex items-start gap-1">
                      <span className="font-semibold flex-shrink-0">Instruction:</span>
                      <span className="italic break-words">"{item.notes}"</span>
                    </div>
                  )}

                  <button 
                    onClick={() => openModal(item.id)}
                    className="write-instruction mt-2 md:mt-[2vh] cursor-pointer text-xs md:text-[14px] text-[#0077b6] md:text-[#777] hover:underline flex items-center gap-1 font-medium"
                  >
                    ✏️ {item.notes ? 'Edit' : 'Write'} instruction on item.
                  </button>
                </div>

                {/* Desktop Stepper */}
                <div className="quantity hidden md:flex items-center rounded-[10px] border border-[#0077b6] p-[10px_5px]">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="delete mx-[10px] text-[15px] text-red-600 cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button 
                    onClick={() => updateQty(item.id, -1)}
                    className="mx-[5px] text-[16px] text-gray-500 font-bold cursor-pointer"
                  >
                    −
                  </button>
                  <span className="text-[16px] font-bold px-[5px]">{item.quantity}</span>
                  <button 
                    onClick={() => updateQty(item.id, 1)}
                    className="add mx-[10px] text-[20px] font-bold text-[#0077b6] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems.length > 0 && (
        <>
          {/* Mobile Bottom Footer */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] flex md:hidden items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Total</div>
              <div className="text-base font-extrabold text-[#0077b6]">
                {grandTotal.toFixed(2)} Rs
              </div>
            </div>
            <Link 
              to="/order-info" 
              className="bg-[#0077b6] hover:bg-[#005f92] active:scale-98 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm transition-all no-underline"
            >
              <span>Confirm Order</span>
              <span>→</span>
            </Link>
          </div>

          {/* Desktop Bottom Footer */}
          <Link 
            to="/order-info" 
            className="cart-footer hidden md:flex fixed bottom-[2.5vh] ml-[2.5vw] h-[6vh] w-[95vw] items-center justify-center rounded-[10px] bg-[#0077b6] p-[15px] no-underline shadow-md"
          >
            <div className="cart-button text-center text-[16px] text-white">
              Confirm Order - {grandTotal.toFixed(2)} Rs - Plus Taxes
            </div>
          </Link>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modalcart fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="modal-content-cart w-full max-w-[400px] rounded-[8px] bg-white p-[20px] text-center shadow-lg">
            <span 
              className="close float-right cursor-pointer text-[24px]" 
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </span>
            <h3 className="text-[16px] font-bold">{cart[selectedItemId]?.name}</h3>
            <textarea 
              id="notes-textarea"
              defaultValue={cart[selectedItemId]?.notes || ''}
              className="modalinput mt-[2vh] h-[20vh] w-full rounded-[5px] border border-[#ccc] p-[8px] outline-none focus:border-[#0077b6]" 
              placeholder="Enter your instruction"
            ></textarea>
            <button 
              className="submit-btn mt-[2vh] w-full rounded-[5px] bg-[#0077b6] p-[8px_12px] text-white hover:opacity-90"
              onClick={() => {
                const el = document.getElementById('notes-textarea') as HTMLTextAreaElement;
                setItemNotes(selectedItemId, el?.value || '');
                setIsModalOpen(false);
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
