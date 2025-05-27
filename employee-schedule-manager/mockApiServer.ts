import express, { Request, Response, NextFunction, RequestHandler } from 'express';

const app = express();

// Custom JSON parsing middleware
const jsonParser: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['content-type'] === 'application/json') {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        req.body = JSON.parse(data);
        next();
      } catch (err) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
  } else {
    next();
  }
};
app.use(jsonParser);

// Manual CORS middleware
const corsMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  console.log('Applying CORS middleware for request:', req.method, req.url);
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Cache-Control');
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }
  next();
};
app.use(corsMiddleware);

// Cache-control middleware to prevent caching
const noCacheMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
};
app.use(noCacheMiddleware);

// Interfaces for data types
interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'employee';
  color?: string; // Added color property
  passwordResetRequired?: boolean;
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

interface RequestType {
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
  username: string;
  phone: string;
  color: string;
  role: 'admin' | 'employee';
}

interface Announcement {
  id: string;
  content: string;
  timestamp: string;
}

// In-memory data with explicit types
let users: User[] = [
  {
    id: 'u1',
    username: 'bob',
    password: 'bob123',
    name: 'Bob Smith',
    role: 'employee',
    color: '#007bff', // Added color to match Employee
  },
  {
    id: 'u2',
    username: 'admin',
    password: 'admin',
    name: 'Bryan',
    role: 'admin',
    color: '#ff4d4d', // Added color to match Employee
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
    id: 's3',
    employeeId: 'u1',
    employeeName: 'Bob Smith',
    date: '2025-06-10',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    color: '#007bff',
  },
];

let requests: RequestType[] = [
  {
    id: 'r1',
    employee: 'Bob Smith',
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
    position: 'Technician',
    username: 'bob',
    phone: '123-456-7890',
    color: '#007bff',
    role: 'employee',
  },
  {
    id: 'u2',
    firstName: 'Bryan',
    lastName: '',
    position: 'Manager',
    username: 'admin',
    phone: '098-765-4321',
    color: '#ff4d4d',
    role: 'admin',
  },
];

let announcements: Announcement[] = [];

// API Endpoints

// Users
app.get('/api/users', (req: Request, res: Response) => {
  try {
    console.log('Handling GET /api/users, current users:', users);
    res.json(users);
  } catch (err: unknown) {
    console.error('Error in /api/users endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/users', async (req: Request, res: Response) => {
  try {
    console.log('Handling PUT /api/users, request body:', req.body);
    users = req.body as User[];
    res.json(users);
  } catch (err: unknown) {
    console.error('Error in PUT /api/users endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Shifts
app.get('/api/shifts', (req: Request, res: Response) => {
  try {
    console.log('Handling GET /api/shifts, current shifts:', shifts);
    res.json(shifts);
  } catch (err: unknown) {
    console.error('Error in /api/shifts endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/shifts', async (req: Request, res: Response) => {
  try {
    console.log('Handling POST /api/shifts, request body:', req.body);
    const shift: Shift | Shift[] = req.body;
    if (Array.isArray(shift)) {
      shifts = shift;
    } else {
      shifts = [...shifts, shift];
    }
    res.status(201).json(shift);
  } catch (err: unknown) {
    console.error('Error in POST /api/shifts endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Time Off Requests
app.get('/api/requests', (req: Request, res: Response) => {
  try {
    console.log('Handling GET /api/requests, current requests:', requests);
    res.json(requests);
  } catch (err: unknown) {
    console.error('Error in /api/requests endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/requests', async (req: Request, res: Response) => {
  try {
    console.log('Handling POST /api/requests, request body:', req.body);
    const request: RequestType | RequestType[] = req.body;
    if (Array.isArray(request)) {
      requests = request;
    } else {
      requests = [...requests, request];
    }
    res.status(201).json(request);
  } catch (err: unknown) {
    console.error('Error in POST /api/requests endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Shift Coverage Requests
app.get('/api/shiftCoverageRequests', (req: Request, res: Response) => {
  try {
    console.log('Handling GET /api/shiftCoverageRequests, current shiftCoverageRequests:', shiftCoverageRequests);
    res.json(shiftCoverageRequests);
  } catch (err: unknown) {
    console.error('Error in /api/shiftCoverageRequests endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/shiftCoverageRequests', async (req: Request, res: Response) => {
  try {
    console.log('Handling POST /api/shiftCoverageRequests, request body:', req.body);
    const coverageRequest: ShiftCoverageRequest | ShiftCoverageRequest[] = req.body;
    if (Array.isArray(coverageRequest)) {
      shiftCoverageRequests = coverageRequest;
    } else {
      shiftCoverageRequests = [...shiftCoverageRequests, coverageRequest];
    }
    res.status(201).json(coverageRequest);
  } catch (err: unknown) {
    console.error('Error in POST /api/shiftCoverageRequests endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Employees
app.get('/api/employees', (req: Request, res: Response) => {
  try {
    console.log('Handling GET /api/employees, current employees:', employees);
    // Only filter by role, not addedByAdmin
    const filteredEmployees = employees.filter(emp => emp.role !== 'admin');
    res.json({
      version: '2025-05-18-v1',
      timestamp: new Date().toISOString(),
      data: filteredEmployees,
    });
  } catch (err: unknown) {
    console.error('Error in /api/employees endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/employees', async (req: Request, res: Response) => {
  try {
    console.log('Handling POST /api/employees, request body:', req.body);
    const employee: Employee = { ...req.body };
    employees = [...employees, employee];
    res.status(201).json(employee);
  } catch (err: unknown) {
    console.error('Error in POST /api/employees endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    console.log('Handling PUT /api/employees/:id, request body:', req.body);
    const { id } = req.params;
    const updatedEmployee: Employee = { ...req.body };
    const index = employees.findIndex((emp) => emp.id === id);
    if (index !== -1) {
      employees = [
        ...employees.slice(0, index),
        updatedEmployee,
        ...employees.slice(index + 1),
      ];
      res.json(updatedEmployee);
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (err: unknown) {
    console.error('Error in PUT /api/employees/:id endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    console.log('Handling DELETE /api/employees/:id, id:', req.params.id);
    const { id } = req.params;
    const index = employees.findIndex((emp) => emp.id === id);
    if (index !== -1) {
      employees = [
        ...employees.slice(0, index),
        ...employees.slice(index + 1),
      ];
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (err: unknown) {
    console.error('Error in DELETE /api/employees/:id endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Announcements
app.get('/api/announcements', (req: Request, res: Response) => {
  try {
    console.log('Handling GET /api/announcements, current announcements:', announcements);
    res.json(announcements);
  } catch (err: unknown) {
    console.error('Error in /api/announcements endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/announcements', async (req: Request, res: Response) => {
  try {
    console.log('Handling POST /api/announcements, request body:', req.body);
    const announcement: Announcement = req.body;
    announcements = [...announcements, announcement];
    res.status(201).json(announcement);
  } catch (err: unknown) {
    console.error('Error in POST /api/announcements endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});