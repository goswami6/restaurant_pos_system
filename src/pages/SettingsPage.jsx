import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import { usePOS } from '../context/POSContext';

const SettingsPage = () => {
    const { posSettings, setPosSettings, user, fetchSettings } = usePOS();
    const [saving, setSaving] = useState(false);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        const restaurantId = user?.restaurant_id || user?.restaurent_id || 9;

        const sanitizeAddress = (addr, c = '', s = '', p = '') => {
            if (!addr) return '';
            let cleaned = String(addr).trim();
            const tokens = [c, s, p, 'pune', 'MH', 'Maharashtra', '411057', '411056'].filter(Boolean);
            let prev = '';
            while (cleaned !== prev) {
                prev = cleaned;
                tokens.forEach(token => {
                    if (!token || token.length < 2) return;
                    const escaped = token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                    const regex = new RegExp(`,\\s*${escaped}\\s*$`, 'i');
                    cleaned = cleaned.replace(regex, '');
                });
            }
            return cleaned.trim();
        };

        const cleanedAddress = sanitizeAddress(posSettings.address, posSettings.city, posSettings.state, posSettings.pincode);

        try {
            const response = await fetch(`${API_BASE_URL}/settings/pos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    restaurant_name: posSettings.restaurantName,
                    restaurant_address: cleanedAddress,
                    city: posSettings.city || '',
                    state: posSettings.state || '',
                    pincode: posSettings.pincode || '',
                    gstin: posSettings.gstin || '',
                    fssai_no: posSettings.fssaiNo || '',
                    tax_rate: posSettings.taxRate,
                    cgst: posSettings.cgst ?? (posSettings.taxRate / 2),
                    sgst: posSettings.sgst ?? (posSettings.taxRate / 2),
                    service_charge: posSettings.serviceCharge,
                    enable_thermal_printing: posSettings.enableThermalPrinting ? 1 : 0,
                    auto_clean_tables: posSettings.autoCleanTables ? 1 : 0,
                    is_restaurant_serves_liquor: posSettings.isRestaurantServesLiquor ? 1 : 0,
                    state_vat_tax_rate: posSettings.isRestaurantServesLiquor ? (posSettings.stateVatTaxRate ?? 0) : 0,
                    is_enable_tables: posSettings.isEnableTables ? 1 : 0
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            await fetchSettings();
            toast.success(data.message || "POS settings updated successfully.");
        } catch (error) {
            console.error("Failed to update POS settings:", error);
            toast.error("Failed to update settings. " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container-fluid py-4 px-3 px-sm-4 bg-light" style={{ flex: 1, overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
            <div className="mx-auto" style={{ maxWidth: '1000px' }}>
                
                {/* Header Banner */}
                <div className="d-flex align-items-center justify-content-between p-3 p-sm-4 rounded-3 text-white mb-4 shadow-sm" style={{ background: '#0f172a' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center bg-white bg-opacity-10 rounded-3 p-2.5" style={{ width: '44px', height: '44px' }}>
                            <i className="bi bi-sliders text-warning fs-4"></i>
                        </div>
                        <div>
                            <h5 className="fw-bold text-white mb-0" style={{ fontSize: '1.15rem' }}>POS System Settings</h5>
                            <p className="text-light text-opacity-75 mb-0" style={{ fontSize: '0.82rem' }}>Configure store branding, taxation, and print protocols</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSaveSettings}>
                    <div className="row g-3 g-sm-4">
                        
                        {/* Left Column: Restaurant Identity */}
                        <div className="col-12 col-lg-7">
                            <div className="card border-0 shadow-sm rounded-3 p-3 p-sm-4 bg-white h-100 border">
                                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                    <i className="bi bi-building text-primary fs-5"></i>
                                    <h6 className="fw-bold text-dark mb-0">Restaurant Identity</h6>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary uppercase mb-1" style={{ fontSize: '0.75rem' }}>Restaurant Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control border text-dark font-medium rounded-2" 
                                        style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                                        required 
                                        value={posSettings.restaurantName || ''}
                                        onChange={(e) => setPosSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary uppercase mb-1" style={{ fontSize: '0.75rem' }}>Restaurant Address</label>
                                    <textarea 
                                        className="form-control border text-dark rounded-2" 
                                        rows="3" 
                                        style={{ fontSize: '0.88rem', minHeight: '75px', padding: '8px 12px' }}
                                        required 
                                        value={posSettings.address || ''}
                                        onChange={(e) => setPosSettings(prev => ({ ...prev, address: e.target.value }))}
                                    ></textarea>
                                </div>

                                <div className="row g-2 mb-3">
                                    <div className="col-12 col-sm-4">
                                        <label className="form-label small fw-bold text-secondary uppercase mb-1" style={{ fontSize: '0.75rem' }}>City</label>
                                        <input 
                                            type="text" 
                                            className="form-control border text-dark rounded-2" 
                                            style={{ fontSize: '0.88rem', padding: '6px 10px' }}
                                            placeholder="Pune"
                                            value={posSettings.city || ''}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, city: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-6 col-sm-4">
                                        <label className="form-label small fw-bold text-secondary uppercase mb-1" style={{ fontSize: '0.75rem' }}>State</label>
                                        <input 
                                            type="text" 
                                            className="form-control border text-dark rounded-2" 
                                            style={{ fontSize: '0.88rem', padding: '6px 10px' }}
                                            placeholder="Maharashtra"
                                            value={posSettings.state || ''}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, state: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-6 col-sm-4">
                                        <label className="form-label small fw-bold text-secondary uppercase mb-1" style={{ fontSize: '0.75rem' }}>Pincode</label>
                                        <input 
                                            type="text" 
                                            className="form-control border text-dark rounded-2" 
                                            style={{ fontSize: '0.88rem', padding: '6px 10px' }}
                                            placeholder="411056"
                                            value={posSettings.pincode || ''}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, pincode: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* GSTIN & FSSAI Info */}
                                <div className="row g-2">
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label small fw-bold text-secondary uppercase mb-1" style={{ fontSize: '0.75rem' }}>GSTIN Number</label>
                                        <input 
                                            type="text" 
                                            className="form-control border text-dark rounded-2 text-uppercase" 
                                            style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                                            placeholder="27CCCCCC0000A1Z5"
                                            value={posSettings.gstin || ''}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, gstin: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label small fw-bold text-secondary uppercase mb-1" style={{ fontSize: '0.75rem' }}>FSSAI License No.</label>
                                        <input 
                                            type="text" 
                                            className="form-control border text-dark rounded-2" 
                                            style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                                            placeholder="10019022009777"
                                            value={posSettings.fssaiNo || ''}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, fssaiNo: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Financials & Preferences */}
                        <div className="col-12 col-lg-5 d-flex flex-column gap-3">
                            
                            {/* Card 2: Financials & Taxes */}
                            <div className="card border-0 shadow-sm rounded-3 p-3 p-sm-4 bg-white border">
                                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                    <i className="bi bi-cash-stack text-success fs-5"></i>
                                    <h6 className="fw-bold text-dark mb-0">Taxes & Financials</h6>
                                </div>

                                <div className="row g-2 mb-2">
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-secondary uppercase mb-1" style={{ fontSize: '0.75rem' }}>Tax Rate (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="form-control border text-dark fw-bold rounded-2" 
                                            style={{ fontSize: '0.88rem', padding: '6px 10px' }}
                                            required 
                                            value={posSettings.taxRate}
                                            onChange={(e) => {
                                                const rate = parseFloat(e.target.value) || 0;
                                                setPosSettings(prev => ({ 
                                                    ...prev, 
                                                    taxRate: rate,
                                                    cgst: rate / 2,
                                                    sgst: rate / 2 
                                                }));
                                            }}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-secondary uppercase mb-1" style={{ fontSize: '0.75rem' }}>Service Charge (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="form-control border text-dark fw-bold rounded-2" 
                                            style={{ fontSize: '0.88rem', padding: '6px 10px' }}
                                            required 
                                            value={posSettings.serviceCharge}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, serviceCharge: parseFloat(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>

                                {/* CGST & SGST Badge Breakdown */}
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                        CGST: {(posSettings.cgst ?? (posSettings.taxRate / 2)).toFixed(2)}%
                                    </span>
                                    <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                        SGST: {(posSettings.sgst ?? (posSettings.taxRate / 2)).toFixed(2)}%
                                    </span>
                                </div>

                                {/* Serves Liquor Block */}
                                <div className="p-2.5 bg-light rounded-2 border">
                                    <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 m-0">
                                        <label className="form-check-label text-dark fw-bold small d-flex align-items-center gap-1.5" htmlFor="servesLiquorCheck" style={{ cursor: 'pointer', fontSize: '0.82rem' }}>
                                            <i className="bi bi-cup-straw text-warning fs-6"></i>
                                            <span>Serves Liquor (State VAT)</span>
                                        </label>
                                        <input 
                                            className="form-check-input ms-0 flex-shrink-0" 
                                            type="checkbox" 
                                            id="servesLiquorCheck" 
                                            style={{ width: '2rem', height: '1rem', cursor: 'pointer' }}
                                            checked={posSettings.isRestaurantServesLiquor ?? false}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setPosSettings(prev => ({ 
                                                    ...prev, 
                                                    isRestaurantServesLiquor: checked,
                                                    stateVatTaxRate: checked ? prev.stateVatTaxRate : 0 
                                                }));
                                            }}
                                        />
                                    </div>
                                    
                                    {posSettings.isRestaurantServesLiquor && (
                                        <div className="pt-2 border-top mt-2">
                                            <label className="form-label small fw-bold text-secondary uppercase mb-1" style={{ fontSize: '0.72rem' }}>State VAT Tax Rate (%)</label>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                className="form-control border text-dark fw-bold rounded-2" 
                                                style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                                                required 
                                                value={posSettings.stateVatTaxRate ?? 0}
                                                onChange={(e) => setPosSettings(prev => ({ ...prev, stateVatTaxRate: parseFloat(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: System Preferences */}
                            <div className="card border-0 shadow-sm rounded-3 p-3 p-sm-4 bg-white border">
                                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                    <i className="bi bi-toggles text-primary fs-5"></i>
                                    <h6 className="fw-bold text-dark mb-0">System Modules</h6>
                                </div>
                                
                                <div className="d-flex flex-column gap-2.5">
                                    {/* Thermal Printing Switch */}
                                    <div className="d-flex align-items-center justify-content-between p-2 rounded-2 border bg-light">
                                        <div>
                                            <label className="form-check-label text-dark fw-bold small mb-0 d-flex align-items-center gap-1.5" htmlFor="serialPrinterCheck" style={{ cursor: 'pointer', fontSize: '0.82rem' }}>
                                                <i className="bi bi-printer text-dark"></i>
                                                <span>Thermal Printing</span>
                                            </label>
                                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>Direct thermal receipt print</div>
                                        </div>
                                        <input 
                                            className="form-check-input ms-0 flex-shrink-0" 
                                            type="checkbox" 
                                            id="serialPrinterCheck" 
                                            style={{ width: '2rem', height: '1rem', cursor: 'pointer' }}
                                            checked={posSettings.enableThermalPrinting ?? true}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, enableThermalPrinting: e.target.checked }))}
                                        />
                                    </div>

                                    {/* Auto-Clean Tables Switch */}
                                    <div className="d-flex align-items-center justify-content-between p-2 rounded-2 border bg-light">
                                        <div>
                                            <label className="form-check-label text-dark fw-bold small mb-0 d-flex align-items-center gap-1.5" htmlFor="autoCleanCheck" style={{ cursor: 'pointer', fontSize: '0.82rem' }}>
                                                <i className="bi bi-stars text-warning"></i>
                                                <span>Auto-Clean Tables</span>
                                            </label>
                                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>Clean tables when dirty</div>
                                        </div>
                                        <input 
                                            className="form-check-input ms-0 flex-shrink-0" 
                                            type="checkbox" 
                                            id="autoCleanCheck" 
                                            style={{ width: '2rem', height: '1rem', cursor: 'pointer' }}
                                            checked={posSettings.autoCleanTables ?? false}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, autoCleanTables: e.target.checked }))}
                                        />
                                    </div>

                                    {/* Enable Tables Switch */}
                                    <div className="d-flex align-items-center justify-content-between p-2 rounded-2 border bg-light">
                                        <div>
                                            <label className="form-check-label text-dark fw-bold small mb-0 d-flex align-items-center gap-1.5" htmlFor="enableTablesCheck" style={{ cursor: 'pointer', fontSize: '0.82rem' }}>
                                                <i className="bi bi-grid-3x3-gap-fill text-info"></i>
                                                <span>Seating & Tables</span>
                                            </label>
                                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>Enable table management</div>
                                        </div>
                                        <input 
                                            className="form-check-input ms-0 flex-shrink-0" 
                                            type="checkbox" 
                                            id="enableTablesCheck" 
                                            style={{ width: '2rem', height: '1rem', cursor: 'pointer' }}
                                            checked={posSettings.isEnableTables ?? false}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, isEnableTables: e.target.checked }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right-Aligned High-Contrast Save Button */}
                    <div className="mt-4 pt-2 d-flex justify-content-end align-items-center">
                        <button 
                            type="submit" 
                            className="btn btn-dark text-white fw-bold rounded-2 shadow-sm d-inline-flex align-items-center justify-content-center gap-2 cursor-pointer" 
                            style={{ 
                                backgroundColor: '#0f172a', 
                                color: '#ffffff', 
                                padding: '8px 24px', 
                                fontSize: '0.88rem', 
                                border: 'none' 
                            }}
                            disabled={saving}
                        >
                            {saving ? (
                                <span className="spinner-border spinner-border-sm text-white" role="status" aria-hidden="true"></span>
                            ) : (
                                <i className="bi bi-check2-circle text-white fs-6"></i>
                            )} 
                            <span className="text-white" style={{ color: '#ffffff !important' }}>
                                {saving ? "Saving..." : "Save Changes"}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;
