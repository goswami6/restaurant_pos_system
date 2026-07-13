import React from 'react';

const VariantModal = ({ selectedItemForModal, setSelectedItemForModal, chosenVariant, setChosenVariant, addToCart }) => {
    if (!selectedItemForModal) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-800/80 flex justify-between items-center">
                    <div>
                        <h5 className="font-bold text-white text-base mb-1">{selectedItemForModal.item_name}</h5>
                        <span className="text-amber-500 font-bold text-sm">₹{parseFloat(selectedItemForModal.price).toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={() => setSelectedItemForModal(null)}
                        className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-850 p-2 rounded-full cursor-pointer border border-transparent hover:border-slate-700/50 text-xs"
                    >
                        ✕
                    </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-5 space-y-5">
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                            Select Variant Option
                        </label>
                        <div className="space-y-2">
                            {selectedItemForModal.variants.map((v) => (
                                <label 
                                    key={v.id}
                                    className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                                        chosenVariant?.id === v.id 
                                        ? 'border-amber-500 bg-amber-500/10 text-white' 
                                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="radio" 
                                            name="variant" 
                                            checked={chosenVariant?.id === v.id}
                                            onChange={() => setChosenVariant(v)}
                                            className="accent-amber-500 h-4 w-4"
                                        />
                                        <span className="font-semibold text-sm">{v.name}</span>
                                    </div>
                                    {v.price > 0 && (
                                        <span className="text-xs font-semibold text-amber-500">+₹{v.price.toFixed(2)}</span>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Special Cooking Notes
                        </label>
                        <textarea 
                            id="modifier-notes"
                            placeholder="E.g., No onions, extra spicy, well cooked..." 
                            className="w-full p-3 bg-slate-950/80 border border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 rounded-xl text-white text-xs outline-none transition-all resize-none h-20 placeholder-slate-600"
                        ></textarea>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex justify-end gap-3">
                    <button 
                        onClick={() => setSelectedItemForModal(null)}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            const notesInput = document.getElementById('modifier-notes');
                            addToCart(selectedItemForModal, chosenVariant, notesInput?.value || '');
                            setSelectedItemForModal(null);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.97] transition-all duration-200 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-amber-500/10"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VariantModal;
