import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone: string;
  idNumber: string;
  color: string;
}

export default function Employees() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    position: '',
    email: '',
    phone: '',
    idNumber: '',
    color: '#000000',
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/employees');
        if (!response.ok) throw new Error('Failed to fetch employees');
        const data = await response.json();
        setEmployees(data);
      } catch (err: unknown) {
        console.error('Employees: Failed to fetch employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newEmployee = {
        id: `e${Date.now()}`,
        ...formData,
      };
      const response = await fetch('http://localhost:3001/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      });
      if (!response.ok) throw new Error('Failed to add employee');
      setEmployees((prev) => [...prev, newEmployee]);
      setFormData({
        firstName: '',
        lastName: '',
        position: '',
        email: '',
        phone: '',
        idNumber: '',
        color: '#000000',
      });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      console.error('Employees: Failed to add employee:', err);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee) return;
    try {
      const updatedEmployee = { ...currentEmployee, ...formData };
      const response = await fetch(`http://localhost:3001/api/employees/${currentEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEmployee),
      });
      if (!response.ok) throw new Error('Failed to update employee');
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === currentEmployee.id ? updatedEmployee : emp))
      );
      setFormData({
        firstName: '',
        lastName: '',
        position: '',
        email: '',
        phone: '',
        idNumber: '',
        color: '#000000',
      });
      setCurrentEmployee(null);
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      console.error('Employees: Failed to update employee:', err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/employees/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete employee');
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (err: unknown) {
      console.error('Employees: Failed to delete employee:', err);
    }
  };

  const openEditModal = (employee: Employee) => {
    setCurrentEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      email: employee.email,
      phone: employee.phone,
      idNumber: employee.idNumber,
      color: employee.color,
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className='bg-white p-6 rounded-lg shadow-lg'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold text-bradley-dark-gray'>Employees</h1>
        <button
          className='px-4 py-2 bg-[#f7695f] text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Employee
        </button>
      </div>

      {/* Employee List */}
      <div className='space-y-4'>
        {employees.map((employee) => (
          <div key={employee.id} className='flex justify-between items-center border-b border-bradley-medium-gray pb-2'>
            <div>
              <p className='text-bradley-dark-gray'>
                {employee.firstName} {employee.lastName} - {employee.position}
              </p>
              <p className='text-sm text-bradley-medium-gray'>{employee.email}</p>
              <p className='text-sm text-bradley-medium-gray'>{employee.phone}</p>
              <p className='text-sm text-bradley-medium-gray'>ID: {employee.idNumber}</p>
            </div>
            <div className='flex space-x-2'>
              <button
                className='px-3 py-1 bg-[#f7695f] text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
                onClick={() => openEditModal(employee)}
              >
                Edit
              </button>
              <button
                className='px-3 py-1 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'
                onClick={() => handleDeleteEmployee(employee.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-full max-w-lg'>
            <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>Add Employee</h2>
            <form onSubmit={handleAddEmployee} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>First Name</label>
                <input
                  type='text'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Last Name</label>
                <input
                  type='text'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Position</label>
                <input
                  type='text'
                  name='position'
                  value={formData.position}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Email</label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Phone</label>
                <input
                  type='text'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>ID Number</label>
                <input
                  type='text'
                  name='idNumber'
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Color</label>
                <input
                  type='color'
                  name='color'
                  value={formData.color}
                  onChange={handleInputChange}
                  className='mt-1 w-full h-10 border border-bradley-medium-gray rounded-md'
                />
              </div>
              <div className='flex justify-end space-x-2'>
                <button
                  type='button'
                  className='px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-[#f7695f] text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && currentEmployee && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-full max-w-lg'>
            <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>Edit Employee</h2>
            <form onSubmit={handleEditEmployee} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>First Name</label>
                <input
                  type='text'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Last Name</label>
                <input
                  type='text'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Position</label>
                <input
                  type='text'
                  name='position'
                  value={formData.position}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Email</label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Phone</label>
                <input
                  type='text'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>ID Number</label>
                <input
                  type='text'
                  name='idNumber'
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Color</label>
                <input
                  type='color'
                  name='color'
                  value={formData.color}
                  onChange={handleInputChange}
                  className='mt-1 w-full h-10 border border-bradley-medium-gray rounded-md'
                />
              </div>
              <div className='flex justify-end space-x-2'>
                <button
                  type='button'
                  className='px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setCurrentEmployee(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-[#f7695f] text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}