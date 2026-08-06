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

        try {
            const response = await fetch(`${API_BASE_URL}/settings/pos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    restaurant_name: posSettings.restaurantName,
                    restaurant_address: posSettings.address,
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
        <div className="container-fluid py-3 py-sm-4 px-3 px-sm-5 bg-slate-50/50" style={{ flex: 1, overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
            <div className="mx-auto" style={{ maxWidth: '1050px' }}>
                {/* Header Banner */}
                <div className="d-flex align-items-center gap-2.5 sm:gap-3 mb-3 mb-sm-4 ps-1">
                    <div className="d-flex align-items-center justify-content-center bg-dark text-white rounded-3 flex-shrink-0" style={{ width: '48px', height: '48px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                        <i className="bi bi-sliders text-white" style={{ fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <h4 className="fw-bold text-slate-900 mb-0 d-none d-sm-block">POS System Control Settings</h4>
                        <h6 className="fw-bold text-slate-900 mb-0 d-block d-sm-none" style={{ fontSize: '0.95rem' }}>POS System Control Settings</h6>
                        <p className="text-muted text-xs sm:text-sm mb-0">Configure branding, print protocols, and taxations</p>
                    </div>
                </div>

                <form onSubmit={handleSaveSettings}>
                    <div className="row g-3 g-lg-4">
                        {/* Left Column: Restaurant Identity */}
                        <div className="col-12 col-lg-7">
                            <div className="card border-0 shadow-sm rounded-4 p-3 p-sm-4 bg-white h-100">
                                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                    <i className="bi bi-building text-primary fs-5"></i>
                                    <h6 className="fw-bold text-slate-800 mb-0">Restaurant Identity</h6>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-slate-600">Restaurant Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm border-slate-200 focus:border-dark rounded-3 text-slate-900" 
                                        style={{ fontSize: '0.95rem' }}
                                        required 
                                        value={posSettings.restaurantName || ''}
                                        onChange={(e) => setPosSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-slate-600">Restaurant Address</label>
                                    <textarea 
                                        className="form-control border-slate-200 focus:border-dark rounded-3 text-slate-900" 
                                        rows="3" 
                                        style={{ fontSize: '0.95rem', minHeight: '75px' }}
                                        required 
                                        value={posSettings.address || ''}
                                        onChange={(e) => setPosSettings(prev => ({ ...prev, address: e.target.value }))}
                                    ></textarea>
                                </div>
                                <div className="row g-2 mb-3">
                                    <div className="col-12 col-sm-4">
                                        <label className="form-label small fw-semibold text-slate-600">City</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm border-slate-200 focus:border-dark rounded-3 text-slate-900" 
                                            style={{ fontSize: '0.88rem' }}
                                            placeholder="Mumbai"
                                            value={posSettings.city || ''}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, city: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-6 col-sm-4">
                                        <label className="form-label small fw-semibold text-slate-600">State</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm border-slate-200 focus:border-dark rounded-3 text-slate-900" 
                                            style={{ fontSize: '0.88rem' }}
                                            placeholder="Maharashtra"
                                            value={posSettings.state || ''}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, state: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-6 col-sm-4">
                                        <label className="form-label small fw-semibold text-slate-600">Pincode</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm border-slate-200 focus:border-dark rounded-3 text-slate-900" 
                                            style={{ fontSize: '0.88rem' }}
                                            placeholder="400013"
                                            value={posSettings.pincode || ''}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, pincode: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* GSTIN and FSSAI Row */}
                                <div className="row g-2">
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label small fw-semibold text-slate-600">GSTIN No.</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm border-slate-200 focus:border-dark rounded-3 text-slate-900 uppercase" 
                                            style={{ fontSize: '0.88rem' }}
                                            placeholder="27AAAAA0000A1Z5"
                                            value={posSettings.gstin || ''}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, gstin: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label small fw-semibold text-slate-600">FSSAI License No.</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm border-slate-200 focus:border-dark rounded-3 text-slate-900" 
                                            style={{ fontSize: '0.88rem' }}
                                            placeholder="10019022009876"
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
                            <div className="card border-0 shadow-sm rounded-4 p-3 p-sm-4 bg-white">
                                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                    <i className="bi bi-cash-stack text-success fs-5"></i>
                                    <h6 className="fw-bold text-slate-800 mb-0">Taxes & Financial Settings</h6>
                                </div>
                                <div className="row g-2 mb-2">
                                    <div className="col-6">
                                        <label className="form-label small fw-semibold text-slate-600">Tax Rate (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="form-control form-control-sm border-slate-200 focus:border-dark rounded-3 text-slate-900" 
                                            style={{ fontSize: '0.9rem' }}
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
                                        <label className="form-label small fw-semibold text-slate-600">Service Charge (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="form-control form-control-sm border-slate-200 focus:border-dark rounded-3 text-slate-900" 
                                            style={{ fontSize: '0.9rem' }}
                                            required 
                                            value={posSettings.serviceCharge}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, serviceCharge: parseFloat(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>

                                <div className="d-flex flex-wrap gap-1.5 mb-3 px-1">
                                    <span className="bg-slate-100 text-slate-700 border border-slate-200/80 rounded px-2 py-0.5 text-[11px] font-semibold">CGST: {(posSettings.cgst ?? (posSettings.taxRate / 2)).toFixed(2)}%</span>
                                    <span className="bg-slate-100 text-slate-700 border border-slate-200/80 rounded px-2 py-0.5 text-[11px] font-semibold">SGST: {(posSettings.sgst ?? (posSettings.taxRate / 2)).toFixed(2)}%</span>
                                </div>

                                <div className="p-2.5 bg-slate-50 rounded-3 border border-slate-100">
                                    <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 mb-2">
                                        <label className="form-check-label text-slate-700 fw-semibold mb-0 text-xs d-flex align-items-center gap-1.5" htmlFor="servesLiquorCheck" style={{ cursor: 'pointer' }}>
                                            <i className="bi bi-cup-straw text-warning fs-6"></i>
                                            <span>Serves Liquor (VAT Tax)</span>
                                        </label>
                                        <input 
                                            className="form-check-input ms-0 flex-shrink-0" 
                                            type="checkbox" 
                                            id="servesLiquorCheck" 
                                            style={{ width: '2.2rem', height: '1.1rem', cursor: 'pointer' }}
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
                                        <div className="pt-1">
                                            <label className="form-label text-[11px] fw-semibold text-slate-600 mb-1">State VAT Tax Rate (%)</label>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                className="form-control form-control-sm border-slate-200 focus:border-dark rounded-3 text-slate-900" 
                                                style={{ fontSize: '0.85rem' }}
                                                required 
                                                value={posSettings.stateVatTaxRate ?? 0}
                                                onChange={(e) => setPosSettings(prev => ({ ...prev, stateVatTaxRate: parseFloat(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: System Preferences */}
                            <div className="card border-0 shadow-sm rounded-4 p-3 p-sm-4 bg-white">
                                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                    <i className="bi bi-toggles text-primary fs-5"></i>
                                    <h6 className="fw-bold text-slate-800 mb-0">System Preferences</h6>
                                </div>
                                
                                <div className="space-y-2.5">
                                    <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 border-bottom border-slate-100 pb-2.5 gap-2">
                                        <div>
                                            <label className="form-check-label text-slate-700 fw-semibold mb-0 text-xs sm:text-sm d-flex align-items-center gap-1.5" htmlFor="serialPrinterCheck" style={{ cursor: 'pointer' }}>
                                                <i className="bi bi-printer text-dark"></i>
                                                <span>Thermal Printing</span>
                                            </label>
                                            <div className="text-muted text-[11px]">Direct thermal printing</div>
                                        </div>
                                        <input 
                                            className="form-check-input ms-0 flex-shrink-0" 
                                            type="checkbox" 
                                            id="serialPrinterCheck" 
                                            style={{ width: '2.2rem', height: '1.1rem', cursor: 'pointer' }}
                                            checked={posSettings.enableThermalPrinting ?? true}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, enableThermalPrinting: e.target.checked }))}
                                        />
                                    </div>

                                    <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 border-bottom border-slate-100 pb-2.5 gap-2">
                                        <div>
                                            <label className="form-check-label text-slate-700 fw-semibold mb-0 text-xs sm:text-sm d-flex align-items-center gap-1.5" htmlFor="autoCleanCheck" style={{ cursor: 'pointer' }}>
                                                <i className="bi bi-stars text-amber-500"></i>
                                                <span>Auto-Clean Tables</span>
                                            </label>
                                            <div className="text-muted text-[11px]">Clean tables when Dirty</div>
                                        </div>
                                        <input 
                                            className="form-check-input ms-0 flex-shrink-0" 
                                            type="checkbox" 
                                            id="autoCleanCheck" 
                                            style={{ width: '2.2rem', height: '1.1rem', cursor: 'pointer' }}
                                            checked={posSettings.autoCleanTables ?? false}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, autoCleanTables: e.target.checked }))}
                                        />
                                    </div>

                                    <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 gap-2">
                                        <div>
                                            <label className="form-check-label text-slate-700 fw-semibold mb-0 text-xs sm:text-sm d-flex align-items-center gap-1.5" htmlFor="enableTablesCheck" style={{ cursor: 'pointer' }}>
                                                <i className="bi bi-grid-3x3-gap-fill text-info"></i>
                                                <span>Seating & Tables</span>
                                            </label>
                                            <div className="text-muted text-[11px]">Enable Table management</div>
                                        </div>
                                        <input 
                                            className="form-check-input ms-0 flex-shrink-0" 
                                            type="checkbox" 
                                            id="enableTablesCheck" 
                                            style={{ width: '2.2rem', height: '1.1rem', cursor: 'pointer' }}
                                            checked={posSettings.isEnableTables ?? false}
                                            onChange={(e) => setPosSettings(prev => ({ ...prev, isEnableTables: e.target.checked }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button Bar */}
                    <div className="mt-4 pt-2">
                        <button 
                            type="submit" 
                            className="btn btn-dark w-100 py-3 fw-bold rounded-3 shadow-sm hover:scale-[1.005] active:scale-[0.99] transition-all d-flex align-items-center justify-center gap-2" 
                            style={{ fontSize: '0.98rem', letterSpacing: '0.5px' }}
                            disabled={saving}
                        >
                            {saving ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            ) : (
                                <i className="bi bi-check2-circle fs-5"></i>
                            )} 
                            <span>{saving ? "Saving Changes..." : "Save Configured Preferences"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;
