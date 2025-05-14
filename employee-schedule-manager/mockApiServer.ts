import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// File paths for data storage
const usersFile = path.join(__dirname, 'public/api/users.json');
const shiftsFile = path.join(__dirname, 'public/api/shifts.json');
const requestsFile = path.join(__dirname, 'public/api/requests.json');
const employeesFile = path.join(__dirname, 'public/api/employees.json');
const shiftCoverageRequestsFile = path.join(__dirname, 'public/api/shiftCoverageRequests.json');

// Interfaces for data types
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'employee';
}

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

interface Request {
  id: string;
  employee: string;
  type: 'Time Off' | 'Shift Coverage';
  date: string;
  time?: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

interface ShiftCoverageRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Pending' | 'Covered';
}

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

// Initial data (if files don't exist, these will be used)
let users: User[] = [
  {
    id: 'u1',
    email: 'bob@example.com',
    password: 'password123',
    name: 'Bob Smith',
    role: 'admin',
  },
  {
    id: 'u2',
    email: 'alice@example.com',
    password: 'bob123',
    name: 'Alice Johnson',
    role: 'employee',
  },
];

let shifts: Shift[] = [
  {
    id: 's1',
    employeeId: 'u1',
    employeeName: 'Bob Smith',
    date: '2025-05-12',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    color: '#007bff',
  },
  {
    id: 's2',
    employeeId: 'u2',
    employeeName: 'Alice Johnson',
    date: '2025-05-13',
    startTime: '08:00 AM',
    endTime: '10:00 AM',
    color: '#ff4d4d',
  },
  {
    id: 's3',
    employeeId: 'u1',
    employeeName: 'Bob Smith',
    date: '2025-06-10',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    color: '#007bff',
  },
];

let requests: Request[] = [
  {
    id: 'r1',
    employee: 'Alice Johnson',
    type: 'Time Off',
    date: '2025-05-14',
    time: 'All Day',
    status: 'Pending',
  },
];

let shiftCoverageRequests: ShiftCoverageRequest[] = [];

let employees: Employee[] = [
  {
    id: 'u1',
    firstName: 'Bob',
    lastName: 'Smith',
    position: 'Manager',
    email: 'bob@example.com',
    phone: '123-456-7890',
    idNumber: 'EMP001',
    color: '#007bff',
  },
  {
    id: 'u2',
    firstName: 'Alice',
    lastName: 'Johnson',
    position: 'Technician',
    email: 'alice@example.com',
    phone: '098-765-4321',
    idNumber: 'EMP002',
    color: '#ff4d4d',
  },
];

// Load data from files
const loadData = async (): Promise<void> => {
  try {
    const usersData = await fs.readFile(usersFile, 'utf-8');
    users = JSON.parse(usersData) as User[];
  } catch (err: unknown) {
    console.log('Users file not found, using default data');
  }

  try {
    const shiftsData = await fs.readFile(shiftsFile, 'utf-8');
    shifts = JSON.parse(shiftsData) as Shift[];
  } catch (err: unknown) {
    console.log('Shifts file not found, using default data');
  }

  try {
    const requestsData = await fs.readFile(requestsFile, 'utf-8');
    requests = JSON.parse(requestsData) as Request[];
  } catch (err: unknown) {
    console.log('Requests file not found, using default data');
  }

  try {
    const employeesData = await fs.readFile(employeesFile, 'utf-8');
    employees = JSON.parse(employeesData) as Employee[];
  } catch (err: unknown) {
    console.log('Employees file not found, using default data');
  }

  try {
    const shiftCoverageRequestsData = await fs.readFile(shiftCoverageRequestsFile, 'utf-8');
    shiftCoverageRequests = JSON.parse(shiftCoverageRequestsData) as ShiftCoverageRequest[];
  } catch (err: unknown) {
    console.log('Shift Coverage Requests file not found, using default data');
  }
};

// Save data to files
const saveData = async (): Promise<void> => {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
  await fs.writeFile(shiftsFile, JSON.stringify(shifts, null, 2));
  await fs.writeFile(requestsFile, JSON.stringify(requests, null, 2));
  await fs.writeFile(employeesFile, JSON.stringify(employees, null, 2));
  await fs.writeFile(shiftCoverageRequestsFile, JSON.stringify(shiftCoverageRequests, null, 2));
};

// Load data on startup
loadData().catch((err) => console.error('Failed to load data:', err));

// Helper function to parse time (e.g., "09:00 AM") to minutes for comparison
const parseTimeToMinutes = (time: string): number => {
  const [timePart, period] = time.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);
  let adjustedHours = hours;
  if (period === 'PM' && hours !== 12) adjustedHours += 12;
  if (period === 'AM' && hours === 12) adjustedHours = 0;
  return adjustedHours * 60 + minutes;
};

// Helper function to format minutes back to time (e.g., 540 -> "09:00 AM")
const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const adjustedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${adjustedHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
};

// API Endpoints

// Users
app.get('/api/users', (req: Request, res: Response<User[]>) => {
  res.json(users);
});

// Shifts
app.get('/api/shifts', (req: Request, res: Response<Shift[]>) => {
  res.json(shifts);
});

app.post('/api/shifts', async (req: Request<unknown, unknown, Shift>, res: Response<Shift>) => {
  const shift = req.body;
  shifts.push(shift);
  await saveData();
  res.status(201).json(shift);
});

// Time Off Requests
app.get('/api/requests', (req: Request, res: Response<Request[]>) => {
  res.json(requests);
});

app.post('/api/requests', async (req: Request<unknown, unknown, Request>, res: Response<Request>) => {
  const request = req.body;
  const originalShiftsLength = shifts.length;
  requests.push(request);

  // Check for overlapping shifts and create shift coverage requests
  const employeeShifts = shifts.filter((shift) => shift.employeeName === request.employee);
  const requestStartDate = new Date(request.date);
  const requestEndDate = request.time === 'All Day' ? requestStartDate : new Date(request.date);

  for (let i = 0; i < employeeShifts.length; i++) {
    const shift = employeeShifts[i];
    const shiftDate = new Date(shift.date);
    if (shiftDate >= requestStartDate && shiftDate <= requestEndDate) {
      if (request.status === 'Approved') {
        // If the request is approved, remove the shift (for Full Day or fully overlapping Partial Day)
        if (request.time === 'All Day') {
          const globalIndex = shifts.findIndex((s) => s.id === shift.id);
          if (globalIndex !== -1) {
            shifts.splice(globalIndex, 1);
          }
        } else if (request.time) {
          const [requestStartTime, requestEndTime] = request.time.split('-');
          const requestStartMinutes = parseTimeToMinutes(requestStartTime.trim());
          const requestEndMinutes = parseTimeToMinutes(requestEndTime.trim());
          const shiftStartMinutes = parseTimeToMinutes(shift.startTime);
          const shiftEndMinutes = parseTimeToMinutes(shift.endTime);

          if (requestStartMinutes <= shiftStartMinutes && requestEndMinutes >= shiftEndMinutes) {
            // Request fully covers the shift, remove it
            const globalIndex = shifts.findIndex((s) => s.id === shift.id);
            if (globalIndex !== -1) {
              shifts.splice(globalIndex, 1);
            }
          }
        }
      }

      // Generate Shift Coverage Requests for remaining portions
      if (request.time === 'All Day') {
        const coverageRequest: ShiftCoverageRequest = {
          id: `scr${Date.now()}`,
          employeeId: shift.employeeId,
          employeeName: shift.employeeName,
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          status: 'Pending',
        };
        shiftCoverageRequests.push(coverageRequest);
      } else if (request.time) {
        const [requestStartTime, requestEndTime] = request.time.split('-');
        const requestStartMinutes = parseTimeToMinutes(requestStartTime.trim());
        const requestEndMinutes = parseTimeToMinutes(requestEndTime.trim());
        const shiftStartMinutes = parseTimeToMinutes(shift.startTime);
        const shiftEndMinutes = parseTimeToMinutes(shift.endTime);

        if (requestStartMinutes > shiftStartMinutes && requestEndMinutes < shiftEndMinutes) {
          // Split shift into two parts: before and after the request
          const coverageRequest1: ShiftCoverageRequest = {
            id: `scr${Date.now()}`,
            employeeId: shift.employeeId,
            employeeName: shift.employeeName,
            date: shift.date,
            startTime: shift.startTime,
            endTime: requestStartTime.trim(),
            status: 'Pending',
          };
          const coverageRequest2: ShiftCoverageRequest = {
            id: `scr${Date.now() + 1}`,
            employeeId: shift.employeeId,
            employeeName: shift.employeeName,
            date: shift.date,
            startTime: requestEndTime.trim(),
            endTime: shift.endTime,
            status: 'Pending',
          };
          shiftCoverageRequests.push(coverageRequest1, coverageRequest2);
        } else if (requestStartMinutes > shiftStartMinutes && requestEndMinutes >= shiftEndMinutes) {
          // Only the part before the request needs coverage
          const coverageRequest: ShiftCoverageRequest = {
            id: `scr${Date.now()}`,
            employeeId: shift.employeeId,
            employeeName: shift.employeeName,
            date: shift.date,
            startTime: shift.startTime,
            endTime: requestStartTime.trim(),
            status: 'Pending',
          };
          shiftCoverageRequests.push(coverageRequest);
        } else if (requestStartMinutes <= shiftStartMinutes && requestEndMinutes < shiftEndMinutes) {
          // Only the part after the request needs coverage
          const coverageRequest: ShiftCoverageRequest = {
            id: `scr${Date.now()}`,
            employeeId: shift.employeeId,
            employeeName: shift.employeeName,
            date: shift.date,
            startTime: requestEndTime.trim(),
            endTime: shift.endTime,
            status: 'Pending',
          };
          shiftCoverageRequests.push(coverageRequest);
        }
      }
    }
  }

  await saveData();
  res.status(201).json(request);
});

// Shift Coverage Requests
app.get('/api/shiftCoverageRequests', (req: Request, res: Response<ShiftCoverageRequest[]>) => {
  res.json(shiftCoverageRequests);
});

app.post('/api/shiftCoverageRequests', async (req: Request<unknown, unknown, ShiftCoverageRequest>, res: Response<ShiftCoverageRequest>) => {
  const coverageRequest = req.body;
  shiftCoverageRequests.push(coverageRequest);
  await saveData();
  res.status(201).json(coverageRequest);
});

// Employees
app.get('/api/employees', (req: Request, res: Response<Employee[]>) => {
  res.json(employees);
});

app.post('/api/employees', async (req: Request<unknown, unknown, Employee>, res: Response<Employee>) => {
  const employee = req.body;
  employees.push(employee);
  await saveData();
  res.status(201).json(employee);
});

app.put('/api/employees/:id', async (req: Request<{ id: string }, unknown, Employee>, res: Response<Employee | { error: string }>) => {
  const { id } = req.params;
  const updatedEmployee = req.body;
  const index = employees.findIndex((emp) => emp.id === id);
  if (index !== -1) {
    employees[index] = updatedEmployee;
    await saveData();
    res.json(updatedEmployee);
  } else {
    res.status(404).json({ error: 'Employee not found' });
  }
});

app.delete('/api/employees/:id', async (req: Request<{ id: string }>, res: Response<void | { error: string }>) => {
  const { id } = req.params;
  const index = employees.findIndex((emp) => emp.id === id);
  if (index !== -1) {
    employees.splice(index, 1);
    await saveData();
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Employee not found' });
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});