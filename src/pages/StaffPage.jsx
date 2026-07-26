import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { usePOS } from '../context/POSContext';

const StaffPage = () => {
    const { staffList, setStaffList } = usePOS();
    const [showAddStaffForm, setShowAddStaffForm] = useState(false);
    const [newStaffData, setNewStaffData] = useState({
        name: '',
        role: 'Waiter',
        status: 'Active'
    });

    const handleAddStaff = (e) => {
        e.preventDefault();
        if (!newStaffData.name) return;
        const newStaff = {
            id: staffList.length + 101,
            name: newStaffData.name,
            role: newStaffData.role,
            status: newStaffData.status,
            ordersHandled: 0
        };
        setStaffList(prev => [...prev, newStaff]);
        setNewStaffData({ name: '', role: 'Waiter', status: 'Active' });
        setShowAddStaffForm(false);
        toast.success("Staff member registered successfully!");
    };

    const toggleStaffStatus = (id) => {
        setStaffList(prev => prev.map(s => {
            if (s.id === id) {
                const nextStatus = s.status === 'Active' ? 'On Break' : (s.status === 'On Break' ? 'Off Duty' : 'Active');
                return { ...s, status: nextStatus };
            }
            return s;
        }));
    };

    const removeStaff = (id) => {
        if (!window.confirm("Remove this team member?")) return;
        setStaffList(prev => prev.filter(s => s.id !== id));
    };

    return (
        <div className="container-fluid py-4 bg-slate-50" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                        <div>
                            <h5 className="fw-bold text-slate-900 mb-1">Staff Directory</h5>
                            <p className="text-muted small mb-0">Manage floor servers, kitchen chefs, and terminal operators</p>
                        </div>
                        <button 
                            className="btn btn-primary text-white fw-bold"
                            onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                        >
                            {showAddStaffForm ? "✕ Close Form" : "+ Register Staff"}
                        </button>
                    </div>

                    {showAddStaffForm && (
                        <form onSubmit={handleAddStaff} className="bg-light p-4 rounded-3 border mb-4">
                            <h6 className="fw-bold mb-3">Register New Staff Member</h6>
                            <div className="row g-3">
                                <div className="col-md-5">
                                    <label className="form-label small fw-bold">Full Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="E.g., Amit Patel" 
                                        required
                                        value={newStaffData.name}
                                        onChange={(e) => setNewStaffData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-bold">Role</label>
                                    <select 
                                        className="form-select"
                                        value={newStaffData.role}
                                        onChange={(e) => setNewStaffData(prev => ({ ...prev, role: e.target.value }))}
                                    >
                                        <option value="Waiter">Waiter / Server</option>
                                        <option value="Chef">Kitchen Chef</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Cashier">Cashier</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-bold">Initial Status</label>
                                    <select 
                                        className="form-select"
                                        value={newStaffData.status}
                                        onChange={(e) => setNewStaffData(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="Active">Active / On Duty</option>
                                        <option value="On Break">On Break</option>
                                        <option value="Off Duty">Off Duty</option>
                                    </select>
                                </div>
                                <div className="col-12 d-flex gap-2 justify-content-end mt-3">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddStaffForm(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-success btn-sm px-4 text-white">Register Member</button>
                                </div>
                            </div>
                        </form>
                    )}

                    <div className="row g-4">
                        {staffList.map((staff) => {
                            return (
                                <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={staff.id}>
                                    <div className={`table-card-pos ${staff.status === 'Active' ? 'available' : (staff.status === 'On Break' ? 'occupied' : 'dirty')}`} style={{ minHeight: '210px' }}>
                                        <div className="card-header-pos" style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                                            {staff.status === 'Active' ? 'On Duty' : staff.status}
                                        </div>
                                        <div className="card-body-pos p-3 d-flex flex-column justify-content-between">
                                            <div>
                                                <div className="table-title-pos mb-1" style={{ fontSize: '1.1rem' }}>{staff.name}</div>
                                                <div className="text-muted small mb-2 fw-medium">{staff.role}</div>
                                                <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />
                                                <div className="text-secondary small mb-3">
                                                    Orders Handled: <strong className="text-dark">{staff.ordersHandled}</strong>
                                                </div>
                                            </div>
                                            <div className="card-actions-pos" style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                <button 
                                                    className="btn-action-pos btn-blue"
                                                    style={{ flex: 1.2, padding: '8px 4px', fontSize: '0.75rem', backgroundColor: '#2196f3', color: 'white' }}
                                                    onClick={() => toggleStaffStatus(staff.id)}
                                                >
                                                    Shift Toggle
                                                </button>
                                                <button 
                                                    className="btn-action-pos btn-dark"
                                                    style={{ flex: 0.8, padding: '8px 4px', fontSize: '0.75rem', backgroundColor: '#ef4444', color: 'white' }}
                                                    onClick={() => removeStaff(staff.id)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffPage;
