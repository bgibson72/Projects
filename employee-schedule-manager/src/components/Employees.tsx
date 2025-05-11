import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Edit, Trash2 } from 'lucide-react';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from '@/api/mockApi';

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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    position: '',
    email: '',
    phone: '',
    idNumber: '',
    color: '#60A5FA',
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees();
        console.log('Fetched employees:', data);
        setEmployees(data);
      } catch {
        console.error('Failed to fetch employees');
      }
    };
    fetchEmployees();
  }, []);

  const sortedEmployees = [...employees].sort((a, b) => {
    if (a.lastName === b.lastName) {
      return a.firstName.localeCompare(b.firstName);
    }
    return a.lastName.localeCompare(b.lastName);
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEmployee({ ...form, id: `e${Date.now()}` });
      const data = await getEmployees();
      setEmployees(data);
      setIsAddOpen(false);
      setIsCustomColor(false);
      setForm({
        firstName: '',
        lastName: '',
        position: '',
        email: '',
        phone: '',
        idNumber: '',
        color: '#60A5FA',
      });
    } catch {
      console.error('Failed to add employee');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployee) {
      try {
        await updateEmployee(selectedEmployee.id, form);
        const data = await getEmployees();
        setEmployees(data);
        setIsEditOpen(false);
        setIsCustomColor(false);
        setSelectedEmployee(null);
        setForm({
          firstName: '',
          lastName: '',
          position: '',
          email: '',
          phone: '',
          idNumber: '',
          color: '#60A5FA',
        });
      } catch {
        console.error('Failed to update employee');
      }
    }
  };

  const handleDelete = async () => {
    if (selectedEmployee) {
      try {
        await deleteEmployee(selectedEmployee.id);
        const data = await getEmployees();
        setEmployees(data);
        setIsDeleteOpen(false);
        setSelectedEmployee(null);
      } catch {
        console.error('Failed to delete employee');
      }
    }
  };

  const colorOptions = [
    '#ffb74d', // Orange
    '#fff176', // Yellow
    '#81c784', // Green
    '#7986cb', // Blue
    '#ba68c8', // Purple
    '#e57373', // Red
    '#f1948a', // Light Red
    '#76d7c4', // Teal
    '#85c1e9', // Light Blue
  ];

  return (
    <div className='bg-white p-6 rounded-lg shadow-lg'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-3xl font-bold text-bradley-dark-gray'>Employees</h1>
        {user?.role === 'admin' && (
          <button
            className='bg-bradley-red text-white px-4 py-2 rounded-md hover:bg-bradley-dark-red'
            onClick={() => setIsAddOpen(true)}
          >
            Add Employee
          </button>
        )}
      </div>
      <table className='w-full border-collapse'>
        <thead>
          <tr className='bg-gray-200'>
            <th className='p-2 text-left'>Name</th>
            <th className='p-2 text-left'>Position</th>
            <th className='p-2 text-left'>Email</th>
            {user?.role === 'admin' && (
              <>
                <th className='p-2 text-left'>Phone</th>
                <th className='p-2 text-left'>ID Number</th>
                <th className='p-2 text-left'>Color</th>
                <th className='p-2 text-left'>Actions</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedEmployees.map((emp) => (
            <tr key={emp.id} className='border-b'>
              <td className='p-2'>{`${emp.lastName}, ${emp.firstName}`}</td>
              <td className='p-2'>{emp.position}</td>
              <td className='p-2'>{emp.email}</td>
              {user?.role === 'admin' && (
                <>
                  <td className='p-2'>{emp.phone}</td>
                  <td className='p-2'>{emp.idNumber}</td>
                  <td className='p-2'>
                    <div className='w-6 h-6 rounded' style={{ backgroundColor: emp.color }} />
                  </td>
                  <td className='p-2 flex space-x-2'>
                    <button
                      className='text-bradley-blue hover:text-bradley-accent'
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setForm({
                          firstName: emp.firstName,
                          lastName: emp.lastName,
                          position: emp.position,
                          email: emp.email,
                          phone: emp.phone,
                          idNumber: emp.idNumber,
                          color: emp.color,
                        });
                        setIsEditOpen(true);
                        setIsCustomColor(!colorOptions.includes(emp.color));
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className='text-bradley-red hover:text-red-700'
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {isAddOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-full max-w-md'>
            <h2 className='text-xl font-bold mb-4 text-bradley-dark-gray'>Add Employee</h2>
            <form onSubmit={handleAddSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  Last Name <span className='text-bradley-red'>*</span>
                </label>
                <input
                  type='text'
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  First Name <span className='text-bradley-red'>*</span>
                </label>
                <input
                  type='text'
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  Position <span className='text-bradley-red'>*</span>
                </label>
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  required
                >
                  <option value='Service Desk Consultant'>Service Desk Consultant</option>
                  <option value='Senior Service Desk Consultant'>
                    Senior Service Desk Consultant
                  </option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  Email <span className='text-bradley-red'>*</span>
                </label>
                <input
                  type='email'
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Phone</label>
                <input
                  type='tel'
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  ID Number <span className='text-bradley-red'>*</span>
                </label>
                <input
                  type='text'
                  value={form.idNumber}
                  onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Color</label>
                <div className='grid grid-cols-5 gap-2 mt-1'>
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type='button'
                      className={`w-8 h-8 rounded-md border ${
                        form.color === color
                          ? 'border-bradley-dark-red'
                          : 'border-bradley-medium-gray'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setForm({ ...form, color });
                        setIsCustomColor(false);
                      }}
                    ></button>
                  ))}
                  <button
                    type='button'
                    className={`w-8 h-8 rounded-md border flex items-center justify-center text-sm font-bold ${
                      isCustomColor
                        ? 'border-bradley-dark-red bg-bradley-light-gray'
                        : 'border-bradley-medium-gray bg-bradley-light-gray'
                    }`}
                    onClick={() => {
                      setForm({ ...form, color: '#000000' });
                      setIsCustomColor(true);
                    }}
                  >
                    +
                  </button>
                </div>
                {isCustomColor && (
                  <input
                    type='text'
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder='Custom hex (e.g., #123456)'
                    className='mt-2 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  />
                )}
              </div>
              <div className='flex justify-end space-x-2'>
                <button
                  type='button'
                  className='px-4 py-2 bg-bradley-light-gray rounded-md hover:bg-bradley-medium-gray text-bradley-dark-gray'
                  onClick={() => {
                    setIsAddOpen(false);
                    setIsCustomColor(false);
                  }}
                >
                  Discard
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-bradley-red text-white rounded-md hover:bg-bradley-dark-red'
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEditOpen && selectedEmployee && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-full max-w-md'>
            <h2 className='text-xl font-bold mb-4 text-bradley-dark-gray'>Edit Employee</h2>
            <form onSubmit={handleEditSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  Last Name <span className='text-bradley-red'>*</span>
                </label>
                <input
                  type='text'
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  First Name <span className='text-bradley-red'>*</span>
                </label>
                <input
                  type='text'
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  Position <span className='text-bradley-red'>*</span>
                </label>
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  required
                >
                  <option value='Service Desk Consultant'>Service Desk Consultant</option>
                  <option value='Senior Service Desk Consultant'>
                    Senior Service Desk Consultant
                  </option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  Email <span className='text-bradley-red'>*</span>
                </label>
                <input
                  type='email'
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Phone</label>
                <input
                  type='tel'
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  ID Number <span className='text-bradley-red'>*</span>
                </label>
                <input
                  type='text'
                  value={form.idNumber}
                  onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Color</label>
                <div className='grid grid-cols-5 gap-2 mt-1'>
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type='button'
                      className={`w-8 h-8 rounded-md border ${
                        form.color === color
                          ? 'border-bradley-dark-red'
                          : 'border-bradley-medium-gray'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setForm({ ...form, color });
                        setIsCustomColor(false);
                      }}
                    ></button>
                  ))}
                  <button
                    type='button'
                    className={`w-8 h-8 rounded-md border flex items-center justify-center text-sm font-bold ${
                      isCustomColor
                        ? 'border-bradley-dark-red bg-bradley-light-gray'
                        : 'border-bradley-medium-gray bg-bradley-light-gray'
                    }`}
                    onClick={() => {
                      setForm({ ...form, color: '#000000' });
                      setIsCustomColor(true);
                    }}
                  >
                    +
                  </button>
                </div>
                {isCustomColor && (
                  <input
                    type='text'
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder='Custom hex (e.g., #123456)'
                    className='mt-2 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  />
                )}
              </div>
              <div className='flex justify-end space-x-2'>
                <button
                  type='button'
                  className='px-4 py-2 bg-bradley-light-gray rounded-md hover:bg-bradley-medium-gray text-bradley-dark-gray'
                  onClick={() => {
                    setIsEditOpen(false);
                    setIsCustomColor(false);
                  }}
                >
                  Discard
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-bradley-red text-white rounded-md hover:bg-bradley-dark-red'
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isDeleteOpen && selectedEmployee && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-full max-w-sm'>
            <h2 className='text-xl font-bold mb-4 text-bradley-dark-gray'>Are you sure?</h2>
            <p className='mb-4'>
              Delete {selectedEmployee.firstName} {selectedEmployee.lastName}?
            </p>
            <div className='flex justify-end space-x-2'>
              <button
                className='px-4 py-2 bg-bradley-light-gray rounded-md hover:bg-bradley-medium-gray text-bradley-dark-gray'
                onClick={() => setIsDeleteOpen(false)}
              >
                No
              </button>
              <button
                className='px-4 py-2 bg-bradley-red text-white rounded-md hover:bg-bradley-dark-red'
                onClick={handleDelete}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
