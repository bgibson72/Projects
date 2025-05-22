import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Edit, Lock, Trash, Eye, EyeOff, Plus } from 'lucide-react';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  username: string;
  phone: string;
  color: string;
  role: 'admin' | 'employee';
  addedByAdmin?: boolean;
}

export default function Employees() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string>('');
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [changePasswordEmployee, setChangePasswordEmployee] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState<boolean>(false);
  const [showAddCustomColorPicker, setShowAddCustomColorPicker] = useState<boolean>(false);
  const [showEditCustomColorPicker, setShowEditCustomColorPicker] = useState<boolean>(false);
  const [addEmployeeForm, setAddEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    position: '',
    username: '',
    phone: '',
    color: '#A3BFFA', // Default to first pastel color
  });

  // Define pastel colors for selection
  const pastelColors = [
    '#A3BFFA', // Pastel Blue
    '#FBB6CE', // Pastel Pink
    '#B5EAD7', // Pastel Green
    '#FFDAC1', // Pastel Peach
    '#C7CEEA', // Pastel Lavender
    '#FFD1DC', // Pastel Rose
    '#E2F0CB', // Pastel Mint
  ];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployees([]);
        const response = await fetch('http://localhost:3001/api/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }
        const responseData = await response.json();
        console.log('Fetched employees response:', responseData);
        const data = Array.isArray(responseData) ? responseData : responseData.data || [];
        const filteredData = data.filter((emp: Employee) => {
          if (emp.role === 'admin') {
            return false;
          }
          return true;
        });
        console.log('Client-side filtered employees:', filteredData);
        setEmployees(filteredData);
      } catch (err: unknown) {
        console.error('Employees: Failed to fetch employees:', err);
        setError('Failed to load employees. Please try again.');
      }
    };
    fetchEmployees();
  }, []);

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newEmployee: Employee = {
        id: `u${Date.now()}`,
        firstName: addEmployeeForm.firstName,
        lastName: addEmployeeForm.lastName,
        position: addEmployeeForm.position,
        username: addEmployeeForm.username,
        phone: addEmployeeForm.phone,
        color: addEmployeeForm.color,
        role: 'employee',
        addedByAdmin: true,
      };

      // Add employee to /api/employees
      const employeeResponse = await fetch('http://localhost:3001/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      });
      if (!employeeResponse.ok) {
        throw new Error('Failed to add employee');
      }

      // Add user to /api/users with default password and reset requirement
      const usersResponse = await fetch('http://localhost:3001/api/users');
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      const users = await usersResponse.json();
      const newUser = {
        id: newEmployee.id,
        username: newEmployee.username,
        password: 'password123',
        name: `${newEmployee.firstName} ${newEmployee.lastName}`.trim(),
        role: 'employee',
        passwordResetRequired: true,
      };
      const updatedUsers = [...users, newUser];
      const putUsersResponse = await fetch('http://localhost:3001/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUsers),
      });
      if (!putUsersResponse.ok) {
        throw new Error('Failed to update users');
      }

      setEmployees((prev) => [...prev, newEmployee]);
      setAddEmployeeForm({
        firstName: '',
        lastName: '',
        position: '',
        username: '',
        phone: '',
        color: '#A3BFFA',
      });
      setShowAddCustomColorPicker(false);
      setIsAddEmployeeOpen(false);
    } catch (err: unknown) {
      console.error('Employees: Failed to add employee:', err);
      setError('Failed to add employee. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/employees/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (err: unknown) {
      console.error('Employees: Failed to delete employee:', err);
      setError('Failed to delete employee. Please try again.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;
    try {
      const response = await fetch(`http://localhost:3001/api/employees/${editEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editEmployee),
      });
      if (!response.ok) {
        throw new Error('Failed to update employee');
      }
      const updatedEmployee = await response.json();
      setEmployees(employees.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
      setEditEmployee(null);
      setShowEditCustomColorPicker(false);
    } catch (err: unknown) {
      console.error('Employees: Failed to update employee:', err);
      setError('Failed to update employee. Please try again.');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordEmployee || !newPassword) return;
    try {
      const response = await fetch('http://localhost:3001/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      interface User {
        id: string;
        password?: string;
        passwordResetRequired?: boolean;
      }
      const users = await response.json();
      const updatedUsers = users.map((u: User) =>
        u.id === changePasswordEmployee.id ? { ...u, password: newPassword, passwordResetRequired: true } : u
      );
      const putResponse = await fetch('http://localhost:3001/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUsers),
      });
      if (!putResponse.ok) {
        throw new Error('Failed to update password');
      }
      setChangePasswordEmployee(null);
      setNewPassword('');
      setShowPassword(false);
    } catch (err: unknown) {
      console.error('Employees: Failed to update password:', err);
      setError('Failed to update password. Please try again.');
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-6 text-center text-bradley-dark-gray">Access Denied</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-bradley-dark-gray">Employees</h1>
        <button
          className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
          onClick={() => setIsAddEmployeeOpen(true)}
        >
          Add Employee
        </button>
      </div>
      {error && <p className="text-bradley-red text-sm mb-4">{error}</p>}
      <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley">
        <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Employee List</h2>
        {employees.length === 0 ? (
          <p className="text-lg text-bradley-medium-gray">No employees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-bradley-medium-gray">
              <thead>
                <tr className="bg-bradley-light-gray">
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">First Name</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Last Name</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Position</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Username</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Phone</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Color</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-t border-bradley-medium-gray">
                    <td className="px-4 py-2 text-bradley-dark-gray">{emp.firstName}</td>
                    <td className="px-4 py-2 text-bradley-dark-gray">{emp.lastName}</td>
                    <td className="px-4 py-2 text-bradley-dark-gray">{emp.position}</td>
                    <td className="px-4 py-2 text-bradley-dark-gray">{emp.username}</td>
                    <td className="px-4 py-2 text-bradley-dark-gray">{emp.phone}</td>
                    <td className="px-4 py-2">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: emp.color }} />
                    </td>
                    <td className="px-4 py-2 flex space-x-2">
                      <button
                        onClick={() => setEditEmployee(emp)}
                        className="p-1 text-bradley-dark-gray hover:text-bradley-blue focus:outline-none"
                        title="Edit"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => setChangePasswordEmployee(emp)}
                        className="p-1 text-bradley-dark-gray hover:text-bradley-blue focus:outline-none"
                        title="Change Password"
                      >
                        <Lock size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1 text-bradley-dark-gray hover:text-bradley-red focus:outline-none"
                        title="Delete"
                      >
                        <Trash size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Popup */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4 text-bradley-dark-gray">Add Employee</h3>
            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">First Name</label>
                <input
                  type="text"
                  value={addEmployeeForm.firstName}
                  onChange={(e) => setAddEmployeeForm({ ...addEmployeeForm, firstName: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Last Name</label>
                <input
                  type="text"
                  value={addEmployeeForm.lastName}
                  onChange={(e) => setAddEmployeeForm({ ...addEmployeeForm, lastName: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Position</label>
                <input
                  type="text"
                  value={addEmployeeForm.position}
                  onChange={(e) => setAddEmployeeForm({ ...addEmployeeForm, position: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Username</label>
                <input
                  type="text"
                  value={addEmployeeForm.username}
                  onChange={(e) => setAddEmployeeForm({ ...addEmployeeForm, username: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Phone Number</label>
                <input
                  type="text"
                  value={addEmployeeForm.phone}
                  onChange={(e) => setAddEmployeeForm({ ...addEmployeeForm, phone: e.target.value })}
                  placeholder="123-456-7890"
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Color Assignment</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {pastelColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${addEmployeeForm.color === color && !showAddCustomColorPicker ? 'border-bradley-blue' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setAddEmployeeForm({ ...addEmployeeForm, color });
                        setShowAddCustomColorPicker(false);
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${showAddCustomColorPicker ? 'border-bradley-blue' : 'border-transparent'}`}
                    style={{ backgroundColor: showAddCustomColorPicker ? addEmployeeForm.color : '#E5E7EB' }}
                    onClick={() => setShowAddCustomColorPicker(true)}
                  >
                    <Plus size={16} className="text-bradley-dark-gray" />
                  </button>
                </div>
                {showAddCustomColorPicker && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-bradley-dark-gray">Custom Hex Value</label>
                    <input
                      type="text"
                      value={addEmployeeForm.color}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Basic hex validation (starts with #, 7 characters)
                        if (value.match(/^#[0-9A-Fa-f]{6}$/) || value === '') {
                          setAddEmployeeForm({ ...addEmployeeForm, color: value });
                        }
                      }}
                      placeholder="#FF0000"
                      className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                  onClick={() => {
                    setAddEmployeeForm({
                      firstName: '',
                      lastName: '',
                      position: '',
                      username: '',
                      phone: '',
                      color: '#A3BFFA',
                    });
                    setShowAddCustomColorPicker(false);
                    setIsAddEmployeeOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Popup */}
      {editEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4 text-bradley-dark-gray">Edit Employee</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">First Name</label>
                <input
                  type="text"
                  value={editEmployee.firstName}
                  onChange={(e) => setEditEmployee({ ...editEmployee, firstName: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Last Name</label>
                <input
                  type="text"
                  value={editEmployee.lastName}
                  onChange={(e) => setEditEmployee({ ...editEmployee, lastName: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Position</label>
                <input
                  type="text"
                  value={editEmployee.position}
                  onChange={(e) => setEditEmployee({ ...editEmployee, position: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Username</label>
                <input
                  type="text"
                  value={editEmployee.username}
                  onChange={(e) => setEditEmployee({ ...editEmployee, username: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Phone</label>
                <input
                  type="text"
                  value={editEmployee.phone}
                  onChange={(e) => setEditEmployee({ ...editEmployee, phone: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Color Assignment</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {pastelColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${editEmployee.color === color && !showEditCustomColorPicker ? 'border-bradley-blue' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setEditEmployee({ ...editEmployee, color });
                        setShowEditCustomColorPicker(false);
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${showEditCustomColorPicker ? 'border-bradley-blue' : 'border-transparent'}`}
                    style={{ backgroundColor: showEditCustomColorPicker ? editEmployee.color : '#E5E7EB' }}
                    onClick={() => setShowEditCustomColorPicker(true)}
                  >
                    <Plus size={16} className="text-bradley-dark-gray" />
                  </button>
                </div>
                {showEditCustomColorPicker && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-bradley-dark-gray">Custom Hex Value</label>
                    <input
                      type="text"
                      value={editEmployee.color}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.match(/^#[0-9A-Fa-f]{6}$/) || value === '') {
                          setEditEmployee({ ...editEmployee, color: value });
                        }
                      }}
                      placeholder="#FF0000"
                      className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                  onClick={() => {
                    setEditEmployee(null);
                    setShowEditCustomColorPicker(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Popup */}
      {changePasswordEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4 text-bradley-dark-gray">
              Change Password for {changePasswordEmployee.firstName}
            </h3>
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-bradley-dark-gray">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-bradley-dark-gray"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                  onClick={() => {
                    setChangePasswordEmployee(null);
                    setNewPassword('');
                    setShowPassword(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                >
                  Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}