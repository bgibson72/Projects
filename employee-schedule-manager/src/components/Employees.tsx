import React, { useState, useEffect } from 'react';
import { Pencil, KeyRound, Trash2, Plus } from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase';
import { useAuthStore } from '../store/authStore';

const pastelColors = [
  '#E57373', // darker pink
  '#FFD54F', // darker yellow
  '#4DB6AC', // darker mint
  '#9575CD', // darker lavender
  '#FFB74D', // darker peach
  '#64B5F6', // darker blue
  '#81C784', // darker green
];

export default function Employees({ employees, setEmployees }: { employees: any[], setEmployees: (emps: any[]) => void }) {
  const { user } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    lastName: '',
    firstName: '',
    username: '',
    position: '',
    email: '',
    phone: '',
    color: pastelColors[0],
    tempPassword: '',
  });
  const [colorChoice, setColorChoice] = useState(pastelColors[0]);
  const [customColor, setCustomColor] = useState('');
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editColorChoice, setEditColorChoice] = useState(pastelColors[0]);
  const [editCustomColor, setEditCustomColor] = useState('');
  const [showEditCustomColor, setShowEditCustomColor] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmployee, setResetEmployee] = useState<any>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [showAffirm, setShowAffirm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string>('');
  const [resetError, setResetError] = useState<string>('');

  useEffect(() => {
    // Fetch employees from Firestore on mount
    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const emps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(emps);
    };
    fetchEmployees();
    // eslint-disable-next-line
  }, []);

  const handleColorSelect = (color: string) => {
    setColorChoice(color);
    setShowCustomColor(false);
    setCustomColor('');
  };

  const handleCustomColor = () => {
    setShowCustomColor(true);
    setColorChoice('');
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const empData = { ...newEmployee, color: showCustomColor ? customColor : colorChoice };
      // Call the Cloud Function to create the Auth user, Firestore doc, and set custom claim
      const functions = getFunctions();
      const createEmployee = httpsCallable(functions, 'createEmployee');
      const result: any = await createEmployee({
        email: empData.email,
        tempPassword: empData.tempPassword,
        firstName: empData.firstName,
        lastName: empData.lastName,
        username: empData.username,
        position: empData.position,
        phone: empData.phone,
        color: empData.color
      });
      // Fetch updated employees from Firestore
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const emps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(emps);
      setShowAdd(false);
      setNewEmployee({ lastName: '', firstName: '', username: '', position: '', email: '', phone: '', color: pastelColors[0], tempPassword: '' });
      setColorChoice(pastelColors[0]);
      setCustomColor('');
      setShowCustomColor(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add employee.');
    } finally {
      setAddLoading(false);
    }
  };

  // Edit Employee handlers
  const handleEditClick = (emp: any) => {
    setEditEmployee(emp);
    setEditColorChoice(emp.color);
    setEditCustomColor('');
    setShowEditCustomColor(false);
    setShowEdit(true);
  };
  const handleEditColorSelect = (color: string) => {
    setEditColorChoice(color);
    setShowEditCustomColor(false);
    setEditCustomColor('');
  };
  const handleEditCustomColor = () => {
    setShowEditCustomColor(true);
    setEditColorChoice('');
  };
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const updated = { ...editEmployee, color: showEditCustomColor ? editCustomColor : editColorChoice };
      // If email has changed, update in Auth and Firestore via Cloud Function
      if (editEmployee.email !== employees.find(emp => emp.id === editEmployee.id)?.email) {
        const functions = getFunctions();
        const updateEmployeeEmail = httpsCallable(functions, 'updateEmployeeEmail');
        await updateEmployeeEmail({ uid: editEmployee.id, newEmail: editEmployee.email });
      } else {
        // Otherwise, just update Firestore
        await updateDoc(doc(db, 'employees', editEmployee.id), updated);
      }
      setEmployees(employees.map((emp: any) => emp.id === editEmployee.id ? { ...updated, id: editEmployee.id } : emp));
      setShowEdit(false);
      setEditEmployee(null);
      setEditColorChoice(pastelColors[0]);
      setEditCustomColor('');
      setShowEditCustomColor(false);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };
  // Password Reset handlers
  const handleResetClick = (emp: any) => {
    setResetEmployee(emp);
    setResetPassword('');
    setVerifyPassword('');
    setShowPassword(false);
    setShowVerifyPassword(false);
    setShowResetPassword(true);
  };
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    try {
      // Here you would call your backend to reset the password
      setShowAffirm(true);
    } catch (err: any) {
      setResetError(err?.message || 'Failed to reset password. Please try again.');
    }
  };
  const handleAffirmYes = () => {
    // Here you would call your backend to reset the password
    setShowAffirm(false);
    setShowResetPassword(false);
    setResetEmployee(null);
    setResetPassword('');
    setVerifyPassword('');
  };
  const handleAffirmNo = () => {
    setShowAffirm(false);
  };

  const handleDeleteEmployee = async (empId: string) => {
    await deleteDoc(doc(db, 'employees', empId));
    setEmployees(employees.filter(emp => emp.id !== empId));
  };

  return (
    <div className="p-6 md:pl-48">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        {user?.role === 'admin' && (
          <button
            className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F] flex items-center gap-2"
            onClick={() => setShowAdd(true)}
          >
            <Plus size={18} /> Add Employee
          </button>
        )}
      </div>
      {/* Add Employee Popup */}
      {showAdd && user?.role === 'admin' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg border border-bradley-dark-gray shadow-bradley w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Employee</h2>
            {addError && (
              <div className="mb-2 p-2 rounded bg-red-100 text-red-800 border border-red-300 text-center font-medium">
                {addError}
              </div>
            )}
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Last Name"
                  className="border border-bradley-dark-gray px-2 py-1 rounded w-1/2 bg-white"
                  value={newEmployee.lastName}
                  onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="First Name"
                  className="border border-bradley-dark-gray px-2 py-1 rounded w-1/2 bg-white"
                  value={newEmployee.firstName}
                  onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Username"
                className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white"
                value={newEmployee.username}
                onChange={e => setNewEmployee({ ...newEmployee, username: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Position"
                className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white"
                value={newEmployee.position}
                onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white"
                value={newEmployee.email}
                onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white"
                value={newEmployee.phone}
                onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                required
              />
              <div>
                <label className="block mb-1 font-medium">Temporary Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Temporary Password"
                    className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white"
                    value={newEmployee.tempPassword}
                    onChange={e => setNewEmployee({ ...newEmployee, tempPassword: e.target.value })}
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-bradley-dark-gray"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.1-2.727A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L6 6" /></svg>
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Color Assignment</label>
                <div className="flex gap-2 items-center">
                  {pastelColors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${colorChoice === color ? 'border-bradley-red' : 'border-bradley-dark-gray'}`}
                      style={{ background: color }}
                      onClick={() => handleColorSelect(color)}
                    />
                  ))}
                  <button
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${showCustomColor ? 'border-bradley-red' : 'border-bradley-dark-gray'}`}
                    onClick={handleCustomColor}
                  >
                    <Plus size={16} />
                  </button>
                  {showCustomColor && (
                    <input
                      type="text"
                      placeholder="#HEX"
                      className="ml-2 border border-bradley-dark-gray px-2 py-1 rounded w-24 bg-white"
                      value={customColor}
                      onChange={e => setCustomColor(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                  onClick={() => {
                    setShowAdd(false);
                    setNewEmployee({ lastName: '', firstName: '', username: '', position: '', email: '', phone: '', color: pastelColors[0], tempPassword: '' });
                    setColorChoice(pastelColors[0]);
                    setCustomColor('');
                    setShowCustomColor(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                  disabled={addLoading}
                >
                  {addLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley">
        <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Current Roster</h2>
        {employees.length === 0 ? (
          <p className="text-lg text-bradley-medium-gray">No employees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-bradley-medium-gray">
              <thead>
                <tr className="bg-bradley-light-gray">
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Last Name</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">First Name</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Position</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Email Address</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Phone Number</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Color</th>
                  {user?.role === 'admin' && (
                    <th className="px-4 py-2 text-center text-bradley-dark-gray">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-t border-bradley-medium-gray">
                    <td className="px-4 py-2 text-bradley-dark-gray">{emp.lastName}</td>
                    <td className="px-4 py-2 text-bradley-dark-gray">{emp.firstName}</td>
                    <td className="px-4 py-2 text-bradley-dark-gray">{emp.position}</td>
                    <td className="px-4 py-2 text-bradley-dark-gray">{emp.email}</td>
                    <td className="px-4 py-2 text-bradley-dark-gray">{emp.phone}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block w-6 h-6 rounded-full border border-bradley-dark-gray" style={{ background: emp.color }}></span>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-4 py-2 flex space-x-2 justify-center">
                        <span title="Edit" className="cursor-pointer text-black" onClick={() => handleEditClick(emp)}>
                          <Pencil size={18} />
                        </span>
                        <span title="Reset Password" className="cursor-pointer text-black" onClick={() => handleResetClick(emp)}>
                          <KeyRound size={18} />
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Edit Employee Popup */}
      {showEdit && editEmployee && user?.role === 'admin' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg border border-bradley-dark-gray shadow-bradley w-full max-w-md relative">
            <h2 className="text-xl font-bold mb-4">Edit Employee</h2>
            {/* Delete button in top right */}
            <button
              className="absolute top-4 right-4 text-bradley-red hover:underline font-semibold flex items-center gap-1"
              onClick={async () => {
                setEditError('');
                try {
                  const functions = getFunctions();
                  const deleteEmployee = httpsCallable(functions, 'deleteEmployee');
                  await deleteEmployee({ uid: editEmployee.id });
                  setEmployees(employees.filter(emp => emp.id !== editEmployee.id));
                  setShowEdit(false);
                  setEditEmployee(null);
                  setEditColorChoice(pastelColors[0]);
                  setEditCustomColor('');
                  setShowEditCustomColor(false);
                } catch (err: any) {
                  // If error is 'no user record', fallback to deleting Firestore doc only
                  const msg = err?.message || '';
                  if (msg.includes('no user record') || msg.includes('no user record corresponding')) {
                    try {
                      await deleteDoc(doc(db, 'employees', editEmployee.id));
                      setEmployees(employees.filter(emp => emp.id !== editEmployee.id));
                      setShowEdit(false);
                      setEditEmployee(null);
                      setEditColorChoice(pastelColors[0]);
                      setEditCustomColor('');
                      setShowEditCustomColor(false);
                      // Optionally show a warning to the user
                      alert('Employee was removed from the database, but no corresponding Auth account was found.');
                    } catch (firestoreErr: any) {
                      setEditError(firestoreErr?.message || 'Failed to delete employee from database.');
                    }
                  } else {
                    setEditError(msg || 'Failed to delete employee. Please try again.');
                  }
                }
              }}
              title="Delete Employee"
            >
              <Trash2 size={18} /> Delete
            </button>
            {/* Error feedback for delete or edit errors */}
            {editError && (
              <div className="mb-2 p-2 rounded bg-red-100 text-red-800 border border-red-300 text-center font-medium">
                {editError}
              </div>
            )}
            <form onSubmit={handleEditEmployee} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Last Name"
                  className="border border-bradley-dark-gray px-2 py-1 rounded w-1/2 bg-white"
                  value={editEmployee.lastName}
                  onChange={e => setEditEmployee({ ...editEmployee, lastName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="First Name"
                  className="border border-bradley-dark-gray px-2 py-1 rounded w-1/2 bg-white"
                  value={editEmployee.firstName}
                  onChange={e => setEditEmployee({ ...editEmployee, firstName: e.target.value })}
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Username"
                className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white"
                value={editEmployee.username}
                onChange={e => setEditEmployee({ ...editEmployee, username: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Position"
                className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white"
                value={editEmployee.position}
                onChange={e => setEditEmployee({ ...editEmployee, position: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white"
                value={editEmployee.email}
                onChange={e => setEditEmployee({ ...editEmployee, email: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white"
                value={editEmployee.phone}
                onChange={e => setEditEmployee({ ...editEmployee, phone: e.target.value })}
                required
              />
              <div>
                <label className="block mb-1 font-medium">Color Assignment</label>
                <div className="flex gap-2 items-center">
                  {pastelColors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${editColorChoice === color ? 'border-bradley-red' : 'border-bradley-dark-gray'}`}
                      style={{ background: color }}
                      onClick={() => handleEditColorSelect(color)}
                    />
                  ))}
                  <button
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${showEditCustomColor ? 'border-bradley-red' : 'border-bradley-dark-gray'}`}
                    onClick={handleEditCustomColor}
                  >
                    <Plus size={16} />
                  </button>
                  {showEditCustomColor && (
                    <input
                      type="text"
                      placeholder="#HEX"
                      className="ml-2 border border-bradley-dark-gray px-2 py-1 rounded w-24 bg-white"
                      value={editCustomColor}
                      onChange={e => setEditCustomColor(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Reset Password Popup */}
      {showResetPassword && resetEmployee && user?.role === 'admin' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg border border-bradley-dark-gray shadow-bradley w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reset Password</h2>
            {resetError && (
              <div className="mb-2 p-2 rounded bg-red-100 text-red-800 border border-red-300 text-center font-medium">
                {resetError}
              </div>
            )}
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-bradley-dark-gray"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.1-2.727A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L6 6" /></svg>
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Verify New Password</label>
                <div className="relative">
                  <input
                    type={showVerifyPassword ? 'text' : 'password'}
                    value={verifyPassword}
                    onChange={e => setVerifyPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-bradley-dark-gray"
                    onClick={() => setShowVerifyPassword(v => !v)}
                  >
                    {showVerifyPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.1-2.727A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L6 6" /></svg>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                  onClick={() => setShowResetPassword(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                  disabled={!resetPassword || resetPassword !== verifyPassword}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Affirmation Popup */}
      {showAffirm && user?.role === 'admin' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg border border-bradley-dark-gray shadow-bradley w-full max-w-xs text-center">
            <h2 className="text-xl font-bold mb-4">Are you sure?</h2>
            <div className="flex justify-center gap-4 mt-4">
              <button
                className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                onClick={handleAffirmYes}
              >
                Yes
              </button>
              <button
                className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                onClick={handleAffirmNo}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}