import React, { useState } from 'react';
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
            alert(data.message || "POS settings updated successfully.");
        } catch (error) {
            console.error("Failed to update POS settings:", error);
            alert("Failed to update settings. " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container py-5 bg-slate-50/50" style={{ flex: 1, overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
            <div className="mx-auto" style={{ maxWidth: '650px' }}>
                {/* Header Banner */}
                <div className="d-flex align-items-center gap-3 mb-4 ps-2">
                    <div className="d-flex align-items-center justify-content-center bg-dark text-white rounded-3 fs-3" style={{ width: '48px', height: '48px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                        ⚙️
                    </div>
                    <div>
                        <h4 className="fw-bold text-slate-900 mb-0">POS System Control Settings</h4>
                        <p className="text-muted small mb-0">Configure branding, print protocols, and taxations</p>
                    </div>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                    {/* Card 1: Restaurant Identity */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                            <span className="fs-5">🏢</span>
                            <h6 className="fw-bold text-slate-800 mb-0">Restaurant Identity</h6>
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-semibold text-slate-600">Restaurant Name</label>
                            <input 
                                type="text" 
                                className="form-control form-control-lg border-slate-200 focus:border-dark focus:ring-0 rounded-3 text-slate-900" 
                                style={{ fontSize: '0.95rem' }}
                                required 
                                value={posSettings.restaurantName}
                                onChange={(e) => setPosSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="form-label small fw-semibold text-slate-600">Restaurant Address</label>
                            <textarea 
                                className="form-control border-slate-200 focus:border-dark focus:ring-0 rounded-3 text-slate-900" 
                                rows="2" 
                                style={{ fontSize: '0.95rem' }}
                                required 
                                value={posSettings.address}
                                onChange={(e) => setPosSettings(prev => ({ ...prev, address: e.target.value }))}
                            ></textarea>
                        </div>
                    </div>

                    {/* Card 2: Financials & Taxes */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                            <span className="fs-5">💸</span>
                            <h6 className="fw-bold text-slate-800 mb-0">Taxes & Financial Settings</h6>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label small fw-semibold text-slate-600">Default Tax Rate (%)</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="form-control form-control-lg border-slate-200 focus:border-dark focus:ring-0 rounded-3 text-slate-900" 
                                    style={{ fontSize: '0.95rem' }}
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
                                <div className="d-flex gap-2 mt-2 px-1">
                                    <span className="bg-slate-100 text-slate-700 border border-slate-200/80 rounded px-2.5 py-1 text-[11px] font-semibold">CGST: {(posSettings.cgst ?? (posSettings.taxRate / 2)).toFixed(2)}%</span>
                                    <span className="bg-slate-100 text-slate-700 border border-slate-200/80 rounded px-2.5 py-1 text-[11px] font-semibold">SGST: {(posSettings.sgst ?? (posSettings.taxRate / 2)).toFixed(2)}%</span>
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label small fw-semibold text-slate-600">Service Charge (%)</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="form-control form-control-lg border-slate-200 focus:border-dark focus:ring-0 rounded-3 text-slate-900" 
                                    style={{ fontSize: '0.95rem' }}
                                    required 
                                    value={posSettings.serviceCharge}
                                    onChange={(e) => setPosSettings(prev => ({ ...prev, serviceCharge: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>

                        <div className="mt-3 p-3 bg-slate-50 rounded-3 border border-slate-100">
                            <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 mb-3">
                                <label className="form-check-label text-slate-700 fw-semibold mb-0" htmlFor="servesLiquorCheck" style={{ cursor: 'pointer' }}>
                                    🍹 Restaurant Serves Liquor
                                </label>
                                <input 
                                    className="form-check-input ms-0" 
                                    type="checkbox" 
                                    id="servesLiquorCheck" 
                                    style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
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
                            
                            <div className="transition-all duration-300">
                                <label className="form-label small fw-semibold text-slate-600">State VAT Tax Rate (%)</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="form-control border-slate-200 focus:border-dark focus:ring-0 rounded-3 text-slate-900" 
                                    style={{ fontSize: '0.95rem' }}
                                    required 
                                    disabled={!posSettings.isRestaurantServesLiquor}
                                    value={posSettings.isRestaurantServesLiquor ? (posSettings.stateVatTaxRate ?? 0) : 0}
                                    onChange={(e) => setPosSettings(prev => ({ ...prev, stateVatTaxRate: parseFloat(e.target.value) || 0 }))}
                                />
                                <div className="form-text small text-muted mt-1 px-1">VAT rate applies specifically to alcoholic beverage categories.</div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: System Preferences */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                            <span className="fs-5">⚙️</span>
                            <h6 className="fw-bold text-slate-800 mb-0">System Preferences & Hardware</h6>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 border-bottom border-slate-100 pb-3">
                                <div>
                                    <label className="form-check-label text-slate-700 fw-semibold mb-0" htmlFor="serialPrinterCheck" style={{ cursor: 'pointer' }}>🖨️ Thermal Printing</label>
                                    <div className="text-muted small" style={{ fontSize: '0.78rem' }}>Enable Web Serial Direct Thermal Printing</div>
                                </div>
                                <input 
                                    className="form-check-input ms-0" 
                                    type="checkbox" 
                                    id="serialPrinterCheck" 
                                    style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                                    checked={posSettings.enableThermalPrinting ?? true}
                                    onChange={(e) => setPosSettings(prev => ({ ...prev, enableThermalPrinting: e.target.checked }))}
                                />
                            </div>

                            <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 border-bottom border-slate-100 pb-3">
                                <div>
                                    <label className="form-check-label text-slate-700 fw-semibold mb-0" htmlFor="autoCleanCheck" style={{ cursor: 'pointer' }}>🧹 Auto-Clean Tables</label>
                                    <div className="text-muted small" style={{ fontSize: '0.78rem' }}>Automatically clean tables when marked Dirty</div>
                                </div>
                                <input 
                                    className="form-check-input ms-0" 
                                    type="checkbox" 
                                    id="autoCleanCheck" 
                                    style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                                    checked={posSettings.autoCleanTables ?? false}
                                    onChange={(e) => setPosSettings(prev => ({ ...prev, autoCleanTables: e.target.checked }))}
                                />
                            </div>

                            <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 pb-1">
                                <div>
                                    <label className="form-check-label text-slate-700 fw-semibold mb-0" htmlFor="enableTablesCheck" style={{ cursor: 'pointer' }}>🪟 Seating & Reservations</label>
                                    <div className="text-muted small" style={{ fontSize: '0.78rem' }}>Enable Table Seating & Cleaning System across the POS</div>
                                </div>
                                <input 
                                    className="form-check-input ms-0" 
                                    type="checkbox" 
                                    id="enableTablesCheck" 
                                    style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                                    checked={posSettings.isEnableTables ?? false}
                                    onChange={(e) => setPosSettings(prev => ({ ...prev, isEnableTables: e.target.checked }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="btn btn-dark w-100 py-3 fw-bold rounded-3 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all" 
                        style={{ fontSize: '1rem', letterSpacing: '0.5px' }}
                        disabled={saving}
                    >
                        {saving ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : "💾 "} 
                        {saving ? "Saving Changes..." : "Save Configured Preferences"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;
