import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { usePOS } from '../context/POSContext';

const SettingsPage = () => {
    const { posSettings, setPosSettings, user } = usePOS();
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
                    service_charge: posSettings.serviceCharge,
                    enable_thermal_printing: posSettings.enableThermalPrinting ?? true,
                    auto_clean_tables: posSettings.autoCleanTables ?? false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            alert(data.message || "POS settings updated successfully.");
        } catch (error) {
            console.error("Failed to update POS settings:", error);
            alert("Failed to update settings. " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container py-4 bg-slate-50" style={{ flex: 1, minHeight: 'calc(100vh - 112px)' }}>
            <div className="card shadow-sm border-0 rounded-3 mx-auto bg-white" style={{ maxWidth: '600px' }}>
                <div className="card-body p-4">
                    <h5 className="fw-bold text-slate-900 mb-2">⚙️ POS Settings</h5>
                    <p className="text-muted small mb-4">Configure calculations, printer defaults, and branding info</p>

                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Restaurant Name</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                required 
                                value={posSettings.restaurantName}
                                onChange={(e) => setPosSettings(prev => ({ ...prev, restaurantName: e.target.value }))}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Restaurant Address</label>
                            <textarea 
                                className="form-control" 
                                rows="2" 
                                required 
                                value={posSettings.address}
                                onChange={(e) => setPosSettings(prev => ({ ...prev, address: e.target.value }))}
                            ></textarea>
                        </div>
                        <div className="row mb-4">
                            <div className="col-md-6 mb-3">
                                <label className="form-label small fw-bold">Tax Rate (%)</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="form-control" 
                                    required 
                                    value={posSettings.taxRate}
                                    onChange={(e) => setPosSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label small fw-bold">Service Charge (%)</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="form-control" 
                                    required 
                                    value={posSettings.serviceCharge}
                                    onChange={(e) => setPosSettings(prev => ({ ...prev, serviceCharge: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>
                        
                        <hr className="my-4" />
                        <h6 className="fw-bold mb-3 text-slate-800">Hardware & Printers</h6>
                        <div className="mb-3 form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id="serialPrinterCheck" 
                                checked={posSettings.enableThermalPrinting ?? true}
                                onChange={(e) => setPosSettings(prev => ({ ...prev, enableThermalPrinting: e.target.checked }))}
                            />
                            <label className="form-check-label text-slate-700" htmlFor="serialPrinterCheck">Enable Web Serial Direct Thermal Printing</label>
                        </div>
                        <div className="mb-4 form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id="autoCleanCheck" 
                                checked={posSettings.autoCleanTables ?? false}
                                onChange={(e) => setPosSettings(prev => ({ ...prev, autoCleanTables: e.target.checked }))}
                            />
                            <label className="form-check-label text-slate-700" htmlFor="autoCleanCheck">Automatically clean tables when marked Dirty</label>
                        </div>

                        <button type="submit" className="btn btn-dark w-100 py-2.5 fw-bold" disabled={saving}>
                            {saving ? "Saving..." : "Save Configuration"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
