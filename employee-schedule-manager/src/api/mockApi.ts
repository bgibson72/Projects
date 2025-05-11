import axios, { AxiosError } from 'axios';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'employee';
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  color: string;
  idNumber: string;
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

interface Request {
  id: string;
  employee: string;
  type: 'Time Off' | 'Shift Coverage';
  date: string;
  time?: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

const mockApi = axios.create({
  baseURL: '/api',
});

mockApi.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL && config.url ? `${config.baseURL}${config.url}` : 'unknown';
    console.log(
      'mockApi: Requesting:',
      config.url,
      config.params,
      config.headers,
      config.method,
      'full URL:',
      fullUrl,
    );
    return config;
  },
  (error) => {
    console.error('mockApi: Request error:', error.message);
    return Promise.reject(error);
  },
);

mockApi.interceptors.response.use(
  (response) => {
    console.log(
      'mockApi: Response:',
      response.config.url,
      response.status,
      response.statusText,
      response.headers,
      response.data,
    );
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      throw new Error('Received HTML instead of JSON for ' + (response.config.url || 'unknown'));
    }
    return response;
  },
  (error) => {
    console.error(
      'mockApi: Response error:',
      error.config?.url,
      error.message,
      error.response?.status,
      error.response?.statusText,
      error.response?.headers,
      error.response?.data,
    );
    return Promise.reject(error);
  },
);

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    console.log('mockApi: loginUser called with email:', email);
    const response = await mockApi.get<User[]>('/users.json', { params: { email, password } });
    console.log(
      'mockApi: loginUser response:',
      response.status,
      response.statusText,
      response.data,
    );
    const user = response.data.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password,
    );
    console.log('mockApi: loginUser matched user:', user);
    return user || null;
  } catch (err: unknown) {
    const error = err as AxiosError;
    console.error(
      'mockApi: loginUser error:',
      error.message,
      error.response?.status,
      error.response?.statusText,
      error.response?.data,
    );
    throw error;
  }
};

export const getShifts = async (): Promise<Shift[]> => {
  try {
    const response = await mockApi.get<Shift[]>('/shifts.json');
    console.log(
      'mockApi: getShifts response:',
      response.status,
      response.statusText,
      response.data,
    );
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of shifts, received: ' + typeof response.data);
    }
    return response.data;
  } catch (err: unknown) {
    console.error('mockApi: getShifts error:', err);
    throw err;
  }
};

export const addShift = async (shift: Shift): Promise<Shift> => {
  try {
    const response = await mockApi.post<Shift>('/shifts.json', shift);
    console.log('mockApi: addShift response:', response.status, response.statusText, response.data);
    return response.data;
  } catch (err: unknown) {
    console.error('mockApi: addShift error:', err);
    throw err;
  }
};

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await mockApi.get<Employee[]>('/employees.json');
    console.log(
      'mockApi: getEmployees response:',
      response.status,
      response.statusText,
      response.data,
    );
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of employees, received: ' + typeof response.data);
    }
    return response.data;
  } catch (err: unknown) {
    console.error('mockApi: getEmployees error:', err);
    throw err;
  }
};

export const addEmployee = async (employee: Employee): Promise<Employee> => {
  try {
    const response = await mockApi.post<Employee>('/employees.json', employee);
    console.log(
      'mockApi: addEmployee response:',
      response.status,
      response.statusText,
      response.data,
    );
    return response.data;
  } catch (err: unknown) {
    console.error('mockApi: addEmployee error:', err);
    throw err;
  }
};

export const updateEmployee = async (
  id: string,
  employee: Partial<Employee>,
): Promise<Employee> => {
  try {
    const response = await mockApi.put<Employee>(`/employees.json/${id}`, employee);
    console.log(
      'mockApi: updateEmployee response:',
      response.status,
      response.statusText,
      response.data,
    );
    return response.data;
  } catch (err: unknown) {
    console.error('mockApi: updateEmployee error:', err);
    throw err;
  }
};

export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    const response = await mockApi.delete(`/employees.json/${id}`);
    console.log('mockApi: deleteEmployee response:', response.status, response.statusText);
  } catch (err: unknown) {
    console.error('mockApi: deleteEmployee error:', err);
    throw err;
  }
};

export const getRequests = async (): Promise<Request[]> => {
  try {
    const response = await mockApi.get<Request[]>('/requests.json');
    console.log(
      'mockApi: getRequests response:',
      response.status,
      response.statusText,
      response.data,
    );
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array of requests, received: ' + typeof response.data);
    }
    return response.data;
  } catch (err: unknown) {
    console.error('mockApi: getRequests error:', err);
    throw err;
  }
};

export const addRequest = async (request: Request): Promise<Request> => {
  try {
    const response = await mockApi.post<Request>('/requests.json', request);
    console.log(
      'mockApi: addRequest response:',
      response.status,
      response.statusText,
      response.data,
    );
    return response.data;
  } catch (err: unknown) {
    console.error('mockApi: addRequest error:', err);
    throw err;
  }
};

export const updateRequest = async (id: string, request: Partial<Request>): Promise<Request> => {
  try {
    const response = await mockApi.put<Request>(`/requests.json/${id}`, request);
    console.log(
      'mockApi: updateRequest response:',
      response.status,
      response.statusText,
      response.data,
    );
    return response.data;
  } catch (err: unknown) {
    console.error('mockApi: updateRequest error:', err);
    throw err;
  }
};

export const updateProfile = async (id: string, profile: Partial<User>): Promise<User> => {
  try {
    const response = await mockApi.put<User>(`/users.json/${id}`, profile);
    console.log(
      'mockApi: updateProfile response:',
      response.status,
      response.statusText,
      response.data,
    );
    return response.data;
  } catch (err: unknown) {
    console.error('mockApi: updateProfile error:', err);
    throw err;
  }
};
