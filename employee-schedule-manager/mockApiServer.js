"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
// Custom JSON parsing middleware
const jsonParser = (req, res, next) => {
    if (req.headers['content-type'] === 'application/json') {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            try {
                req.body = JSON.parse(data);
                next();
            }
            catch (err) {
                res.status(400).json({ error: 'Invalid JSON' });
            }
        });
    }
    else {
        next();
    }
};
app.use(jsonParser);
// Manual CORS middleware
const corsMiddleware = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
};
app.use(corsMiddleware);
// In-memory data with explicit types
let users = [
    {
        id: 'u1',
        username: 'bob',
        password: 'password123',
        name: 'Bob Smith',
        role: 'employee',
    },
    {
        id: 'u2',
        username: 'admin',
        password: 'admin',
        name: 'Bryan',
        role: 'admin',
    },
];
let shifts = [
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
let requests = [
    {
        id: 'r1',
        employee: 'Bob Smith',
        type: 'Time Off',
        date: '2025-05-14',
        time: 'All Day',
        status: 'Pending',
    },
];
let shiftCoverageRequests = [];
let employees = [
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
let announcements = [];
// API Endpoints
// Users
app.get('/api/users', (req, res) => {
    try {
        console.log('Handling GET /api/users, current users:', users);
        res.json(users);
    }
    catch (err) {
        console.error('Error in /api/users endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.put('/api/users', async (req, res) => {
    try {
        console.log('Handling PUT /api/users, request body:', req.body);
        users = req.body; // Update the entire users array
        res.json(users);
    }
    catch (err) {
        console.error('Error in PUT /api/users endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Shifts
app.get('/api/shifts', (req, res) => {
    try {
        console.log('Handling GET /api/shifts, current shifts:', shifts);
        res.json(shifts);
    }
    catch (err) {
        console.error('Error in /api/shifts endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/api/shifts', async (req, res) => {
    try {
        console.log('Handling POST /api/shifts, request body:', req.body);
        const shift = req.body;
        if (Array.isArray(shift)) {
            shifts = shift; // Handle array update from Dashboard
        }
        else {
            shifts = [...shifts, shift]; // Immutable update for single shift
        }
        res.status(201).json(shift);
    }
    catch (err) {
        console.error('Error in POST /api/shifts endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Time Off Requests
app.get('/api/requests', (req, res) => {
    try {
        console.log('Handling GET /api/requests, current requests:', requests);
        res.json(requests);
    }
    catch (err) {
        console.error('Error in /api/requests endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/api/requests', async (req, res) => {
    try {
        console.log('Handling POST /api/requests, request body:', req.body);
        const request = req.body;
        if (Array.isArray(request)) {
            requests = request; // Handle array update from Dashboard
        }
        else {
            requests = [...requests, request]; // Immutable update for single request
        }
        res.status(201).json(request);
    }
    catch (err) {
        console.error('Error in POST /api/requests endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Shift Coverage Requests
app.get('/api/shiftCoverageRequests', (req, res) => {
    try {
        console.log('Handling GET /api/shiftCoverageRequests, current shiftCoverageRequests:', shiftCoverageRequests);
        res.json(shiftCoverageRequests);
    }
    catch (err) {
        console.error('Error in /api/shiftCoverageRequests endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/api/shiftCoverageRequests', async (req, res) => {
    try {
        console.log('Handling POST /api/shiftCoverageRequests, request body:', req.body);
        const coverageRequest = req.body;
        if (Array.isArray(coverageRequest)) {
            shiftCoverageRequests = coverageRequest; // Handle array update from Dashboard
        }
        else {
            shiftCoverageRequests = [...shiftCoverageRequests, coverageRequest]; // Immutable update for single request
        }
        res.status(201).json(coverageRequest);
    }
    catch (err) {
        console.error('Error in POST /api/shiftCoverageRequests endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Employees
app.get('/api/employees', (req, res) => {
    try {
        console.log('Handling GET /api/employees, current employees:', employees);
        res.json(employees);
    }
    catch (err) {
        console.error('Error in /api/employees endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/api/employees', async (req, res) => {
    try {
        console.log('Handling POST /api/employees, request body:', req.body);
        const employee = req.body;
        employees = [...employees, employee]; // Immutable update
        res.status(201).json(employee);
    }
    catch (err) {
        console.error('Error in POST /api/employees endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.put('/api/employees/:id', async (req, res) => {
    try {
        console.log('Handling PUT /api/employees/:id, request body:', req.body);
        const { id } = req.params;
        const updatedEmployee = req.body;
        const index = employees.findIndex((emp) => emp.id === id);
        if (index !== -1) {
            employees = [
                ...employees.slice(0, index),
                updatedEmployee,
                ...employees.slice(index + 1),
            ]; // Immutable update
            res.json(updatedEmployee);
        }
        else {
            res.status(404).json({ error: 'Employee not found' });
        }
    }
    catch (err) {
        console.error('Error in PUT /api/employees/:id endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.delete('/api/employees/:id', async (req, res) => {
    try {
        console.log('Handling DELETE /api/employees/:id, id:', req.params.id);
        const { id } = req.params;
        const index = employees.findIndex((emp) => emp.id === id);
        if (index !== -1) {
            employees = [
                ...employees.slice(0, index),
                ...employees.slice(index + 1),
            ]; // Immutable update
            res.status(204).send();
        }
        else {
            res.status(404).json({ error: 'Employee not found' });
        }
    }
    catch (err) {
        console.error('Error in DELETE /api/employees/:id endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Announcements
app.get('/api/announcements', (req, res) => {
    try {
        console.log('Handling GET /api/announcements, current announcements:', announcements);
        res.json(announcements);
    }
    catch (err) {
        console.error('Error in /api/announcements endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/api/announcements', async (req, res) => {
    try {
        console.log('Handling POST /api/announcements, request body:', req.body);
        const announcement = req.body;
        announcements = [...announcements, announcement]; // Immutable update
        res.status(201).json(announcement);
    }
    catch (err) {
        console.error('Error in POST /api/announcements endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Mock API server running on http://localhost:${PORT}`);
});
