import React from 'react';

const cleanOrderIdHelper = (id) => {
    if (!id) return '1001';
    let s = String(id).trim();
    s = s.replace(/^#?TBL-Table\s*#?/i, '');
    s = s.replace(/^#?TBL-/i, '');
    s = s.replace(/^#?Table\s*#?/i, '');
    s = s.replace(/^#/i, '');
    return s || '1001';
};

const cleanItemNameHelper = (name) => {
    if (!name) return '';
    return String(name).replace(/\s*\([^)]*Active Order[^)]*\)/gi, '').trim();
};

export const generateReceiptHtml = (selectedHistoryOrder, posSettings) => {
    if (!selectedHistoryOrder) return '';

    const items = selectedHistoryOrder.items || [];
    const totalQty = items.reduce((acc, item) => acc + (item.qty || 1), 0);
    const taxRate = posSettings?.taxRate || 5;
    const serviceChargeRate = posSettings?.serviceCharge || 10;
    const subtotal = selectedHistoryOrder.subtotal ?? (selectedHistoryOrder.total / (1 + (taxRate + serviceChargeRate) / 100));
    const halfTaxRate = (taxRate / 2).toFixed(1);
    const taxTotal = selectedHistoryOrder.tax ?? (subtotal * (taxRate / 100));
    const cgstAmt = taxTotal / 2;
    const sgstAmt = taxTotal / 2;
    const serviceAmt = selectedHistoryOrder.serviceCharge ?? (subtotal * (serviceChargeRate / 100));
    const grandTotal = selectedHistoryOrder.total ?? (subtotal + taxTotal + serviceAmt);

    const formattedDate = selectedHistoryOrder.time ? new Date(selectedHistoryOrder.time).toLocaleDateString('en-GB') + ' ' + new Date(selectedHistoryOrder.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString();

    const itemsRowsHtml = items.map((item) => {
        const unitPrice = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
        const itemAmount = unitPrice * (item.qty || 1);
        const cleanName = cleanItemNameHelper(item.name);
        const hasNotes = item.notes && !item.notes.includes('Session Order') && !item.notes.includes('Active Order');

        return `
            <div style="margin-bottom: 3px;">
                <div style="display: flex; justify-content: space-between; font-size: 10px;">
                    <span style="flex: 1; text-align: left; word-break: break-word;">${cleanName}</span>
                    <span style="width: 32px; text-align: center;">${item.qty}</span>
                    <span style="width: 55px; text-align: right;">${unitPrice.toFixed(2)}</span>
                    <span style="width: 60px; text-align: right;">${itemAmount.toFixed(2)}</span>
                </div>
                ${item.selectedVariant ? `<div style="font-size: 9px; color: #555; padding-left: 4px;">Opt: ${item.selectedVariant.name}</div>` : ''}
                ${hasNotes ? `<div style="font-size: 9px; color: #555; font-style: italic; padding-left: 4px;">* ${item.notes}</div>` : ''}
            </div>
        `;
    }).join('');

    const displayOrderId = cleanOrderIdHelper(selectedHistoryOrder.order_id);
    const rawTable = selectedHistoryOrder.table_number;
    const tableText = (posSettings?.isEnableTables && rawTable && rawTable !== 'N/A') ? `Dine In: ${String(rawTable).startsWith('Table') ? rawTable : `Table #${rawTable}`}` : `Type: ${selectedHistoryOrder.type || 'Takeaway'}`;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>POS Receipt ${displayOrderId}</title>
            <style>
                @page { size: 80mm auto; margin: 0; }
                body {
                    font-family: monospace, sans-serif;
                    width: 76mm;
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 8px;
                    color: #000;
                    background: #fff;
                    font-size: 11px;
                    line-height: 1.3;
                }
            </style>
        </head>
        <body>
            <div style="text-align: center; margin-bottom: 6px;">
                <div style="font-size: 14px; font-weight: bold;">${posSettings?.restaurantName || 'Big Ben Restaurant'}</div>
                <div style="font-size: 10px;">${posSettings?.address || ''}</div>
                <div style="font-size: 10px;">
                    ${[posSettings?.city, posSettings?.state, posSettings?.pincode].filter(Boolean).join(', ')}
                </div>
                ${posSettings?.gstin ? `<div style="font-size: 10px;">GSTIN: ${posSettings.gstin}</div>` : ''}
                ${posSettings?.fssaiNo ? `<div style="font-size: 10px;">FSSAI NO: ${posSettings.fssaiNo}</div>` : ''}
            </div>

            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

            ${selectedHistoryOrder.customer_name ? `
                <div style="font-size: 10px;">
                    Customer Name: ${selectedHistoryOrder.customer_name} ${selectedHistoryOrder.customer_phone ? `(${selectedHistoryOrder.customer_phone})` : ''}
                </div>
                <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; font-size: 10px;">
                <span>Bill No: ${displayOrderId}</span>
                <span>Date: ${formattedDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px;">
                <span>${tableText}</span>
                <span>Cashier: ${selectedHistoryOrder.server || 'Ravi'}</span>
            </div>

            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px;">
                <span style="flex: 1; text-align: left;">Item</span>
                <span style="width: 32px; text-align: center;">Qty.</span>
                <span style="width: 55px; text-align: right;">Price</span>
                <span style="width: 60px; text-align: right;">Amount</span>
            </div>

            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

            ${itemsRowsHtml}

            <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

            <div style="font-size: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>Total Qty: ${totalQty}</span>
                    <span>Sub Total &nbsp;&nbsp;${subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
                    <span>CGST ${halfTaxRate}% &nbsp;&nbsp;${cgstAmt.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
                    <span>SGST ${halfTaxRate}% &nbsp;&nbsp;${sgstAmt.toFixed(2)}</span>
                </div>
                ${serviceChargeRate > 0 ? `
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 2px;">
                        <span>Service Charge ${serviceChargeRate}% &nbsp;&nbsp;${serviceAmt.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; margin-top: 6px; padding-top: 2px;">
                    <span>Grand Total (INR)</span>
                    <span>${grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <div style="border-top: 1px dashed #000; margin: 6px 0 4px 0;"></div>

            <div style="text-align: center; font-size: 11px; font-weight: 500; padding: 2px 0;">
                Thank you & Visit Again
            </div>

            <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            </script>
        </body>
        </html>
    `;
};

export const triggerPrintReceipt = (selectedHistoryOrder, posSettings, printDirectFn = null) => {
    if (printDirectFn) {
        printDirectFn(selectedHistoryOrder);
        return;
    }
    const receiptHtml = generateReceiptHtml(selectedHistoryOrder, posSettings);
    const printWindow = window.open('', '_blank', 'width=420,height=600');
    if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
    }
};

const ReceiptModal = ({ selectedHistoryOrder, setSelectedHistoryOrder, posSettings, onPrintDirect = null }) => {
    if (!selectedHistoryOrder) return null;

    const items = selectedHistoryOrder.items || [];
    const totalQty = items.reduce((acc, item) => acc + (item.qty || 1), 0);
    const taxRate = posSettings?.taxRate || 5;
    const serviceChargeRate = posSettings?.serviceCharge || 10;
    const subtotal = selectedHistoryOrder.subtotal ?? (selectedHistoryOrder.total / (1 + (taxRate + serviceChargeRate) / 100));
    const halfTaxRate = (taxRate / 2).toFixed(1);
    const taxTotal = selectedHistoryOrder.tax ?? (subtotal * (taxRate / 100));
    const cgstAmt = taxTotal / 2;
    const sgstAmt = taxTotal / 2;
    const serviceAmt = selectedHistoryOrder.serviceCharge ?? (subtotal * (serviceChargeRate / 100));
    const grandTotal = selectedHistoryOrder.total ?? (subtotal + taxTotal + serviceAmt);

    const formattedDate = selectedHistoryOrder.time ? new Date(selectedHistoryOrder.time).toLocaleDateString('en-GB') + ' ' + new Date(selectedHistoryOrder.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString();

    const displayOrderId = cleanOrderIdHelper(selectedHistoryOrder.order_id);
    const rawTable = selectedHistoryOrder.table_number;
    const tableText = (posSettings?.isEnableTables && rawTable && rawTable !== 'N/A') ? `Dine In: ${String(rawTable).startsWith('Table') ? rawTable : `Table #${rawTable}`}` : `Type: ${selectedHistoryOrder.type || 'Takeaway'}`;

    const handlePrintReceipt = () => {
        if (onPrintDirect) {
            onPrintDirect(selectedHistoryOrder);
        } else {
            triggerPrintReceipt(selectedHistoryOrder, posSettings);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl p-4 text-black" style={{ fontFamily: 'monospace, monospace' }}>
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <h6 className="fw-bold mb-0 font-sans">Receipt Preview</h6>
                    <button className="btn-close" onClick={() => setSelectedHistoryOrder(null)}></button>
                </div>
                
                {/* ── Receipt Content Container (Visible on-screen) ── */}
                <div className="bg-white p-2 text-black" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{posSettings?.restaurantName || 'Big Ben Restaurant'}</div>
                        <div style={{ fontSize: '10px' }}>{posSettings?.address}</div>
                        <div style={{ fontSize: '10px' }}>
                            {[posSettings?.city, posSettings?.state, posSettings?.pincode].filter(Boolean).join(', ')}
                        </div>
                        {posSettings?.gstin && <div style={{ fontSize: '10px' }}>GSTIN: {posSettings.gstin}</div>}
                        {posSettings?.fssaiNo && <div style={{ fontSize: '10px' }}>FSSAI NO: {posSettings.fssaiNo}</div>}
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

                    {/* Customer Info if available */}
                    {selectedHistoryOrder.customer_name && (
                        <>
                            <div>Customer Name: {selectedHistoryOrder.customer_name} {selectedHistoryOrder.customer_phone ? `(${selectedHistoryOrder.customer_phone})` : ''}</div>
                            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>
                        </>
                    )}

                    {/* Bill Meta */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span>Bill No: {displayOrderId}</span>
                        <span>Date: {formattedDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span>{tableText}</span>
                        <span>Cashier: {selectedHistoryOrder.server || 'Ravi'}</span>
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

                    {/* Table Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px' }}>
                        <span style={{ flex: 1, textAlign: 'left' }}>Item</span>
                        <span style={{ width: '32px', textAlign: 'center' }}>Qty.</span>
                        <span style={{ width: '55px', textAlign: 'right' }}>Price</span>
                        <span style={{ width: '60px', textAlign: 'right' }}>Amount</span>
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

                    {/* Items List */}
                    {items.length > 0 ? (
                        items.map((item, idx) => {
                            const unitPrice = item.price + (item.selectedVariant ? parseFloat(item.selectedVariant.price || 0) : 0);
                            const itemAmount = unitPrice * (item.qty || 1);
                            const cleanName = cleanItemNameHelper(item.name);
                            const hasNotes = item.notes && !item.notes.includes('Session Order') && !item.notes.includes('Active Order');

                            return (
                                <div key={idx} style={{ marginBottom: '3px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                        <span style={{ flex: 1, textAlign: 'left', wordBreak: 'break-word' }}>{cleanName}</span>
                                        <span style={{ width: '32px', textAlign: 'center' }}>{item.qty}</span>
                                        <span style={{ width: '55px', textAlign: 'right' }}>{unitPrice.toFixed(2)}</span>
                                        <span style={{ width: '60px', textAlign: 'right' }}>{itemAmount.toFixed(2)}</span>
                                    </div>
                                    {item.selectedVariant && <div style={{ fontSize: '9px', color: '#555', paddingLeft: '4px' }}>Opt: {item.selectedVariant.name}</div>}
                                    {hasNotes && <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', paddingLeft: '4px' }}>* {item.notes}</div>}
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '6px 0', fontSize: '10px', color: '#666' }}>
                            Summary Amount: ₹{selectedHistoryOrder.total ? Number(selectedHistoryOrder.total).toFixed(2) : '0.00'}
                        </div>
                    )}

                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

                    {/* Totals Section */}
                    <div style={{ fontSize: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>Total Qty: {totalQty}</span>
                            <span>Sub Total &nbsp;&nbsp;{subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
                            <span>CGST {halfTaxRate}% &nbsp;&nbsp;{cgstAmt.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
                            <span>SGST {halfTaxRate}% &nbsp;&nbsp;{sgstAmt.toFixed(2)}</span>
                        </div>
                        {serviceChargeRate > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
                                <span>Service Charge {serviceChargeRate}% &nbsp;&nbsp;{serviceAmt.toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '14px', marginTop: '6px', paddingTop: '2px' }}>
                            <span>Grand Total (INR)</span>
                            <span>{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0 4px 0' }}></div>

                    {/* Footer Greeting */}
                    <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '500', padding: '2px 0' }}>
                        Thank you & Visit Again
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-3 font-sans">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedHistoryOrder(null)}>Close</button>
                    <button 
                        className="btn btn-sm btn-dark text-white" 
                        onClick={handlePrintReceipt}
                    >
                        🖨️ Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
