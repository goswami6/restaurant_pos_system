import React from 'react';

const ReceiptModal = ({ selectedHistoryOrder, setSelectedHistoryOrder, posSettings }) => {
    if (!selectedHistoryOrder) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-4" style={{ color: '#000' }}>
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <h6 className="fw-bold mb-0">Receipt: {selectedHistoryOrder.order_id}</h6>
                    <button className="btn-close" onClick={() => setSelectedHistoryOrder(null)}></button>
                </div>
                
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h5 style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{posSettings.restaurantName}</h5>
                    <p style={{ margin: '0', fontSize: '11px', color: '#555' }}>{posSettings.address}</p>
                    <h6 style={{ margin: '10px 0 5px 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', fontWeight: 'bold' }}>
                        PAST ORDER RECEIPT
                    </h6>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
                    <span><strong>Table:</strong> {selectedHistoryOrder.table_number || 'N/A'}</span>
                    <span><strong>Type:</strong> {selectedHistoryOrder.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '15px' }}>
                    <span><strong>Status:</strong> {selectedHistoryOrder.status}</span>
                    <span><strong>Date:</strong> {new Date(selectedHistoryOrder.time).toLocaleString()}</span>
                </div>

                {/* Detailed Items list */}
                {selectedHistoryOrder.items && selectedHistoryOrder.items.length > 0 ? (
                    <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '8px 0', margin: '10px 0' }}>
                        <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px dashed #000' }}>
                                    <th style={{ textAlign: 'left', paddingBottom: '5px' }}>Item</th>
                                    <th style={{ textAlign: 'center', paddingBottom: '5px', width: '40px' }}>Qty</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '5px', width: '70px' }}>Price</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '5px', width: '70px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedHistoryOrder.items.map((item, idx) => {
                                    const unitPrice = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
                                    const itemTotal = unitPrice * item.qty;
                                    return (
                                        <tr key={idx}>
                                            <td style={{ padding: '4px 0', textAlign: 'left', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: '500' }}>{item.name}</div>
                                                {item.selectedVariant && (
                                                    <div style={{ fontSize: '9px', color: '#888' }}>Option: {item.selectedVariant.name}</div>
                                                )}
                                                {item.notes && (
                                                    <div style={{ fontSize: '9px', color: '#666', fontStyle: 'italic' }}>Note: "{item.notes}"</div>
                                                )}
                                            </td>
                                            <td style={{ padding: '4px 0', textAlign: 'center', verticalAlign: 'top' }}>{item.qty}</td>
                                            <td style={{ padding: '4px 0', textAlign: 'right', verticalAlign: 'top' }}>₹{unitPrice.toFixed(2)}</td>
                                            <td style={{ padding: '4px 0', textAlign: 'right', verticalAlign: 'top' }}>₹{itemTotal.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="border-top border-bottom py-3 my-2 shadow-inner bg-light p-2 rounded" style={{ borderStyle: 'dashed' }}>
                        <div className="d-flex justify-content-between fw-bold mb-2" style={{ fontSize: '11px' }}>
                            <span>SUMMARY OF ORDER</span>
                            <span>₹{selectedHistoryOrder.total.toFixed(2)}</span>
                        </div>
                        <p className="text-muted small mb-0" style={{ fontSize: '10px' }}>
                            This order has been archived. Subtotal, tax, and service charges were included in the total.
                        </p>
                    </div>
                )}

                {/* Detailed Bill Calculations */}
                <div style={{ padding: '4px 0', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#555' }}>Subtotal</span>
                        <span>₹{(selectedHistoryOrder.subtotal ?? (selectedHistoryOrder.total / 1.15)).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#555' }}>Tax ({posSettings?.taxRate || 5}%)</span>
                        <span>₹{(selectedHistoryOrder.tax ?? ((selectedHistoryOrder.total / 1.15) * 0.05)).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#555' }}>Service Charge ({posSettings?.serviceCharge || 10}%)</span>
                        <span>₹{(selectedHistoryOrder.serviceCharge ?? ((selectedHistoryOrder.total / 1.15) * 0.10)).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '8px', borderTop: '1px dashed #000', paddingTop: '8px' }}>
                        <span>Grand Total</span>
                        <span>₹{selectedHistoryOrder.total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-4">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedHistoryOrder(null)}>Close</button>
                    <button 
                        className="btn btn-sm btn-dark text-white" 
                        onClick={() => {
                            window.print();
                        }}
                    >
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
