import React, { useState, useEffect, useCallback } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parse, getDay, isBefore, isAfter } from 'date-fns';
import { Plus, Pencil, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ShiftCoverageRequest } from '../types/shiftCoverageTypes';
import DatePicker, { registerLocale } from 'react-datepicker';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { enUS } from 'date-fns/locale';

registerLocale('en-US', enUS);

const viewOptions = [
  { label: 'By Date', value: 'monthly' },
  { label: 'By Employee', value: 'byEmployee' },
];

// Type for a shift
interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  color: string;
  date: string;
  startTime: string;
  endTime: string;
  repeatDays?: number[];
  repeatWeekly?: boolean;
  repeatEndDate?: string;
}

export default function Schedule({ employees, setEmployees }: { employees: any[], setEmployees: (emps: any[]) => void }) {
  const { user } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 4, 1));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('monthly');
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    // Fetch shifts from Firestore on mount
    const fetchShifts = async () => {
      const querySnapshot = await getDocs(collection(db, 'shifts'));
      const shiftDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShifts(shiftDocs as Shift[]);
    };
    fetchShifts();
  }, []);

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showAddShift, setShowAddShift] = useState(false);
  const [shiftSuccess, setShiftSuccess] = useState<string>('');

  // Helper to get all days in the current month view
  const getMonthMatrix = () => {
    const matrix = [];
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    let day = start;
    while (day <= end) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      matrix.push(week);
    }
    return matrix;
  };

  // Monthly View
  const renderMonthly = () => (
    <div className="bg-white text-bradley-dark-gray p-6 rounded-lg border-2 border-bradley-medium-gray shadow-[0_6px_0_0_#939598FF] overflow-x-auto dark:bg-bradley-dark-card dark:text-bradley-dark-card-text dark:border-bradley-light-gray dark:shadow-[0_6px_0_0_#E2E8F0FF]">
      <table className="min-w-full border-2 border-bradley-medium-gray dark:border-bradley-light-gray rounded-lg overflow-hidden table-fixed bg-white dark:bg-bradley-dark-card">
        <colgroup>
          {Array.from({ length: 7 }).map((_, i) => (
            <col key={i} style={{ width: '120px' }} />
          ))}
        </colgroup>
        <thead className="border-b-2 border-bradley-medium-gray dark:border-bradley-light-gray bg-bradley-light-gray dark:bg-bradley-dark-surface">
          <tr className="bg-bradley-light-gray dark:bg-bradley-dark-surface">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
              <th key={d} className="px-2 py-2 text-center text-bradley-dark-gray dark:text-bradley-light-gray border-r-2 last:border-r-0 border-bradley-medium-gray dark:border-bradley-light-gray font-medium" style={{ width: '120px' }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-bradley-dark-card">
          {getMonthMatrix().map((week, i) => (
            <tr key={i} className="border-b-2 last:border-b-0 border-bradley-medium-gray dark:border-bradley-light-gray">
              {week.map((day, j) => {
                const dayShifts = shifts.filter(s => s.date === format(day, 'MM-dd-yyyy'));
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPrevOrNextMonth = !isCurrentMonth;
                return (
                  <td key={j} className={`h-24 align-top px-2 py-1 border-t-2 border-bradley-medium-gray dark:border-bradley-light-gray border-r-2 last:border-r-0 border-bradley-medium-gray dark:border-bradley-light-gray ${isCurrentMonth ? 'bg-white dark:bg-[#181a20]' : 'bg-[#e2e8f0] dark:bg-bradley-dark-gray'}`} style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}>
                    <div className="text-xs font-semibold mb-1 text-right pr-1">
                      {isToday ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-bradley-red text-white">{format(day, 'd')}</span>
                      ) : (
                        <span className={
  isToday
    ? "inline-flex items-center justify-center w-6 h-6 rounded-full bg-bradley-red text-white"
    : isCurrentMonth
      ? "text-bradley-dark-gray dark:text-bradley-light-gray"
      : "text-bradley-dark-gray dark:text-bradley-light-gray/80"
}>
  {format(day, 'd')}
</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayShifts.map(shift => (
                        <div
                          key={shift.id}
                          className={`rounded text-xs flex items-center gap-1 ${user?.role === 'admin' ? 'cursor-pointer hover:opacity-80' : ''}`}
                          style={{
                            background: (employees.find(e => e.id === shift.employeeId)?.color || shift.color),
                            color: '#fff',
                            padding: '2px 6px'
                          }}
                          onClick={user?.role === 'admin' ? () => { setEditingShift(shift); setShowShiftModal(true); } : undefined}
                        >
                          <span className="font-semibold leading-tight">{getEmployeeName(employees.find(e => e.id === shift.employeeId))}</span>
                          <span className="leading-tight text-[11px]">{shortTime(shift.startTime)}-{shortTime(shift.endTime)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Helper to convert 08:00 AM to 8am, 12:00 PM to 12pm, etc.
  function shortTime(time: string): string {
    const [h, m, period] = time.split(/:| /);
    let hour = parseInt(h, 10);
    let ampm = period ? period.toLowerCase() : '';
    if (hour === 0) hour = 12;
    if (hour > 12) hour -= 12;
    return `${hour}${ampm}`;
  }

  // By Employee View
  const renderByEmployee = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // Use selectedDate to determine the week
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const employeeRows = employees.map(emp => {
      const row = weekDays.map((date, idx) => {
        const dateStr = format(date, 'MM-dd-yyyy');
        const empShifts = shifts.filter(s =>
          s.employeeId === emp.id && s.date === dateStr
        );
        return (
          <td key={days[idx]} className="px-2 py-1 border-t-2 border-r-2 last:border-r-0 border-bradley-medium-gray dark:border-bradley-light-gray align-top">
            {empShifts.length === 0 ? null : (
              <div className="flex flex-col gap-1">
                {empShifts.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(shift => (
                  <div
                    key={shift.id}
                    className={`mb-1 px-2 py-1 rounded text-xs flex items-center gap-1 ${user?.role === 'admin' ? 'cursor-pointer hover:opacity-80' : ''}`}
                    style={{
                      background: emp.color || shift.color,
                      color: '#fff',
                      minHeight: '22px',
                      fontWeight: 500
                    }}
                    onClick={user?.role === 'admin' ? () => { setEditingShift(shift); setShowShiftModal(true); } : undefined}
                  >
                    <span>{shift.startTime} - {shift.endTime}</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        );
      });
      return (
        <tr key={emp.id}>
          <td className="px-2 py-1 border-t-2 border-r-2 border-bradley-medium-gray dark:border-bradley-light-gray font-semibold text-bradley-dark-gray dark:text-bradley-light-gray align-top" style={{ minWidth: 140 }}>{getEmployeeName(emp)}</td>
          {row}
        </tr>
      );
    });
    return (
      <div className="bg-white p-6 rounded-lg border-2 border-bradley-medium-gray shadow-[0_6px_0_0_#939598FF] overflow-x-auto dark:bg-bradley-dark-card dark:border-bradley-light-gray dark:shadow-[0_6px_0_0_#E2E8F0FF]">
        <table className="min-w-full border-2 border-bradley-medium-gray dark:border-bradley-light-gray rounded-lg overflow-hidden table-fixed">
          <colgroup>
            <col style={{ width: '140px' }} />
            {Array.from({ length: 7 }).map((_, i) => (
              <col key={i} style={{ width: '120px' }} />
            ))}
          </colgroup>
          <thead className="border-b-2 border-bradley-medium-gray dark:border-bradley-light-gray">
            <tr className="bg-bradley-light-gray dark:bg-bradley-dark-surface">
              <th className="px-2 py-2 text-left text-bradley-dark-gray dark:text-bradley-light-gray border-r-2 border-bradley-medium-gray dark:border-bradley-light-gray font-medium" style={{ width: '140px' }}>Employee</th>
              {weekDays.map((date, idx) => (
                <th key={idx} className="px-2 py-2 text-center text-bradley-dark-gray dark:text-bradley-light-gray border-r-2 last:border-r-0 border-bradley-medium-gray dark:border-bradley-light-gray font-medium" style={{ width: '120px' }}>
                  {format(date, 'EEE, MMM d')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employeeRows}
          </tbody>
        </table>
      </div>
    );
  };

  // Shift Modal (Add/Edit)
  const ShiftModal = ({ shift, onClose, onSave, onDelete, isEdit }: {
    shift: Shift | null;
    onClose: () => void;
    onSave: (shift: Shift | Shift[]) => void;
    onDelete: (id: string | undefined, deleteAll: boolean) => void;
    isEdit: boolean;
  }) => {
    const [date, setDate] = useState<Date>(shift?.date ? new Date(shift.date) : selectedDate);
    const [startTime, setStartTime] = useState<string>(shift?.startTime || '08:00 AM');
    const [endTime, setEndTime] = useState<string>(shift?.endTime || '12:00 PM');
    const [repeatEndDate, setRepeatEndDate] = useState<Date | null>(shift?.repeatEndDate ? new Date(shift.repeatEndDate) : null);
    const [assignedEmployee, setAssignedEmployee] = useState<string>(shift?.employeeId || employees[0].id);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteAllRepeats, setDeleteAllRepeats] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState<string>('');
    const [deleteError, setDeleteError] = useState<string>('');
    const [deleting, setDeleting] = useState(false);
    const [repeatDays, setRepeatDays] = useState<number[]>(shift?.repeatDays || []);
    const [repeatWeekly, setRepeatWeekly] = useState<boolean>(shift?.repeatWeekly || false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [repeatEndDatePickerOpen, setRepeatEndDatePickerOpen] = useState(false);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Generate 30-min time options from 8:00 AM to 10:00 PM
    const timeOptions = [];
    for (let h = 8; h <= 22; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        const ampm = h < 12 ? 'AM' : 'PM';
        const min = m === 0 ? '00' : '30';
        timeOptions.push(`${hour12}:${min} ${ampm}`);
      }
    }

    const handleDayToggle = (idx: number) => {
      setRepeatDays((prev: number[]) => prev.includes(idx) ? prev.filter((d: number) => d !== idx) : [...prev, idx]);
    };

    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      // If repeating weekly and days selected, generate all shifts for each week/day in range
      if (repeatWeekly && repeatDays.length > 0 && repeatEndDate && date) {
        const start = new Date(date);
        const end = new Date(repeatEndDate);
        // Find the first week start (Sunday) on or before the start date
        let weekStart = new Date(start);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const shiftsToAdd: Shift[] = [];
        for (let d = new Date(weekStart); d <= end; d.setDate(d.getDate() + 7)) {
          // For each selected day of week
          repeatDays.forEach(dayIdx => {
            // Calculate the date for this day in the current week
            const shiftDate = new Date(d);
            shiftDate.setDate(shiftDate.getDate() + (dayIdx - shiftDate.getDay()));
            // Only add if in range
            if (shiftDate >= start && shiftDate <= end) {
              shiftsToAdd.push({
                id: '', // id will be set in handleSaveShift
                date: format(shiftDate, 'MM-dd-yyyy'),
                startTime,
                endTime,
                employeeId: assignedEmployee,
                employeeName: getEmployeeName(employees.find(e => e.id === assignedEmployee)),
                color: employees.find(e => e.id === assignedEmployee)?.color || '#FFD6E0',
                repeatDays,
                repeatWeekly,
                repeatEndDate: format(end, 'MM-dd-yyyy'),
              });
            }
          });
        }
        onSave(shiftsToAdd);
        return;
      }
      // Otherwise, single shift
      const newShift: Shift = {
        id: shift?.id || '',
        date: date ? format(date, 'MM-dd-yyyy') : '',
        startTime,
        endTime,
        employeeId: assignedEmployee,
        employeeName: getEmployeeName(employees.find(e => e.id === assignedEmployee)),
        color: employees.find(e => e.id === assignedEmployee)?.color || '#FFD6E0',
        repeatDays,
        repeatWeekly,
        repeatEndDate: repeatEndDate ? format(repeatEndDate, 'MM-dd-yyyy') : '',
      };
      onSave(newShift);
    };

    const handleDelete = () => {
      if (shift?.repeatWeekly || (shift?.repeatDays && shift.repeatDays.length > 0)) {
        setShowDeleteDialog(true);
      } else {
        doDelete(false);
      }
    };

    const doDelete = async (allRepeats: boolean) => {
      setDeleting(true);
      setDeleteStatus('');
      setDeleteError('');
      try {
        await onDelete(shift?.id, allRepeats);
        setDeleteStatus('Shift deleted successfully!');
        setTimeout(() => {
          setDeleting(false);
          setDeleteStatus('');
          onClose();
        }, 1200);
      } catch (err: any) {
        setDeleteError(err.message || 'Failed to delete shift.');
        setDeleting(false);
      }
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div className="bg-white p-6 rounded-lg border border-bradley-dark-gray shadow-bradley w-full max-w-md relative">
          {/* Delete button in upper right */}
          {isEdit && (
            <button
              className="absolute top-4 right-4 text-white bg-bradley-red rounded-full p-2 hover:bg-bradley-dark-gray transition"
              title="Delete shift"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={20} />
            </button>
          )}
          <h2 className="text-xl font-bold mb-4">{isEdit ? 'Edit Shift' : 'Add Shift'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="relative">
              <label className="block mb-1 font-medium">Date</label>
              <ReactDatePicker
                selected={date}
                onChange={d => { setDate(d as Date); setDatePickerOpen(false); }}
                dateFormat="MM-dd-yyyy"
                className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100 pr-10"
                wrapperClassName="w-full"
                popperClassName="!z-[9999]"
                required
                autoComplete="off"
                showPopperArrow={false}
                open={datePickerOpen}
                onClickOutside={() => setDatePickerOpen(false)}
                // Fix: onInputClick expects no arguments, so use a function with no parameters
                onInputClick={() => {}}
                customInput={
                  <div className="relative">
                    <input
                      className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100 pr-10"
                      value={date ? format(date, 'MM-dd-yyyy') : ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (!val) setDate(new Date());
                        else {
                          const parsed = new Date(val);
                          setDate(isNaN(parsed.getTime()) ? new Date() : parsed);
                        }
                      }}
                      placeholder="MM-DD-YYYY"
                      readOnly
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-bradley-dark-gray hover:text-bradley-red focus:outline-none"
                      tabIndex={-1}
                      onClick={e => {
                        e.preventDefault();
                        setDatePickerOpen((open) => !open);
                      }}
                    >
                      <Calendar size={18} />
                    </button>
                  </div>
                }
                allowSameDay
              />
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block mb-1 font-medium">Start Time</label>
                <select
                  className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                >
                  {timeOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="w-1/2">
                <label className="block mb-1 font-medium">End Time</label>
                <select
                  className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                >
                  {timeOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Repeats on</label>
              <div className="flex gap-2 flex-wrap">
                {daysOfWeek.map((d, idx) => (
                  <label key={d} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={repeatDays.includes(idx)}
                      onChange={() => handleDayToggle(idx)}
                    />
                    <span>{d}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={repeatWeekly}
                  onChange={e => setRepeatWeekly(e.target.checked)}
                />
                Shift Repeats Every Week?
              </label>
            </div>
            {repeatWeekly && (
              <div className="relative">
                <label className="block mb-1 font-medium">End Date</label>
                <ReactDatePicker
                  selected={repeatEndDate}
                  onChange={d => { setRepeatEndDate(d as Date); setRepeatEndDatePickerOpen(false); }}
                  dateFormat="MM-dd-yyyy"
                  className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100 pr-10"
                  wrapperClassName="w-full"
                  popperClassName="!z-[9999]"
                  required
                  autoComplete="off"
                  showPopperArrow={false}
                  open={repeatEndDatePickerOpen}
                  onClickOutside={() => setRepeatEndDatePickerOpen(false)}
                  // Fix: onInputClick expects no arguments, so use a function with no parameters
                  onInputClick={() => {}}
                  customInput={
                    <div className="relative">
                      <input
                        className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100 pr-10"
                        value={repeatEndDate ? format(repeatEndDate, 'MM-dd-yyyy') : ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (!val) setRepeatEndDate(null);
                          else {
                            const parsed = new Date(val);
                            setRepeatEndDate(isNaN(parsed.getTime()) ? null : parsed);
                          }
                        }}
                        placeholder="MM-DD-YYYY"
                        readOnly
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-bradley-dark-gray hover:text-bradley-red focus:outline-none"
                        tabIndex={-1}
                        onClick={e => {
                          e.preventDefault();
                          setRepeatEndDatePickerOpen((open) => !open);
                        }}
                      >
                        <Calendar size={18} />
                      </button>
                    </div>
                  }
                  allowSameDay
                />
              </div>
            )}
            <div>
              <label className="block mb-1 font-medium">Assign to Employee</label>
              <select
                className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100"
                value={assignedEmployee}
                onChange={e => setAssignedEmployee(e.target.value)}
                style={{ backgroundColor: '#fff', color: '#222', opacity: 1 }}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                onClick={onClose}
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

          {/* Delete dialog for repeating shifts */}
          {showDeleteDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">Delete Repeating Shift</h3>
                <p className="mb-4">This shift is part of a repeating series. What would you like to do?</p>
                <div className="flex flex-col gap-2 mb-4">
                  <button
                    className="px-4 py-2 bg-bradley-red text-white rounded-md"
                    onClick={() => { setShowDeleteDialog(false); doDelete(false); }}
                    disabled={deleting}
                  >
                    Delete Only This Shift
                  </button>
                  <button
                    className="px-4 py-2 bg-bradley-red text-white rounded-md"
                    onClick={() => { setShowDeleteDialog(false); doDelete(true); }}
                    disabled={deleting}
                  >
                    Delete All Repeating Shifts
                  </button>
                </div>
                <button
                  className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {/* Delete feedback in modal */}
          {deleteStatus && (
            <div className="mb-4 p-2 bg-green-100 text-green-800 rounded text-center">{deleteStatus}</div>
          )}
          {deleteError && (
            <div className="mb-4 p-2 bg-red-100 text-red-800 rounded text-center">{deleteError}</div>
          )}
        </div>
      </div>
    );

  };

  // Add/Edit shift logic (now supports single or array of shifts)
  const handleSaveShift = async (shiftOrShifts: Shift | Shift[]) => {
    if (Array.isArray(shiftOrShifts)) {
      // Multiple shifts (repeating)
      const newShifts = shiftOrShifts.map(s => ({ ...s, id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }));
      setShifts([...shifts, ...newShifts]);
      await Promise.all(newShifts.map(async s => {
        const { id, ...shiftData } = s;
        await setDoc(doc(db, 'shifts', id), shiftData);
      }));
      setShiftSuccess('Repeating shifts added successfully!');
    } else {
      const shift = shiftOrShifts;
      if (shift.id) {
        // Edit existing
        setShifts(shifts.map(s => s.id === shift.id ? { ...s, ...shift } : s));
        const { id, ...shiftData } = shift;
        await updateDoc(doc(db, 'shifts', shift.id), shiftData);
        setShiftSuccess('Shift updated successfully!');
      } else {
        // Add new
        const newId = `shift-${Date.now()}`;
        const newShift = { ...shift, id: newId };
        setShifts([...shifts, newShift]);
        const { id, ...shiftData } = newShift;
        await setDoc(doc(db, 'shifts', newId), shiftData);
        setShiftSuccess('Shift added successfully!');
      }
    }
    setShowShiftModal(false);
    setShowAddShift(false);
    setEditingShift(null);
    setTimeout(() => setShiftSuccess(''), 3000);
  };

  // Delete shift(s)
  const handleDeleteShift = async (id: string | undefined, deleteAll: boolean) => {
    if (!id) return;
    if (deleteAll) {
      // Delete all repeating shifts for this employee
      const toDelete = shifts.filter(s => s.repeatWeekly && s.employeeId === editingShift?.employeeId);
      await Promise.all(toDelete.map(s => deleteDoc(doc(db, 'shifts', s.id))));
      setShifts(shifts.filter(s => !(s.repeatWeekly && s.employeeId === editingShift?.employeeId)));
    } else {
      await deleteDoc(doc(db, 'shifts', id));
      setShifts(shifts.filter(s => s.id !== id));
    }
    setShiftSuccess('Shift deleted successfully!');
    setTimeout(() => setShiftSuccess(''), 3000);
  };

  // Navigation
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="p-6 md:pl-48">
      {shiftSuccess && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-800 border border-green-300 text-center font-medium">
          {shiftSuccess}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        {/* View options on left */}
        <div className="flex gap-2 items-center flex-1">
          {viewOptions.map(opt => (
            <button
              key={opt.value}
              className={`px-3 py-2 rounded-md font-medium text-bradley-light-gray transition-colors duration-100 focus:ring-2 focus:ring-bradley-red focus:outline-none ${view === opt.value ? 'bg-bradley-red' : 'bg-bradley-medium-gray'}`}
              onClick={() => setView(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          <button
            className={`px-3 py-2 rounded-md font-medium text-bradley-light-gray transition-colors duration-100 focus:ring-2 focus:ring-bradley-red focus:outline-none ${((view === 'today') ? 'bg-bradley-red' : 'bg-bradley-medium-gray')}`}
            style={{ marginLeft: '8px' }}
            onClick={() => {
              if (view === 'byEmployee') setSelectedDate(new Date());
              else setCurrentMonth(new Date());
            }}
            aria-label="Go to Today"
          >
            Today
          </button>
        </div>
        {/* Navigation arrows and label for By Employee view */}
        {view === 'byEmployee' ? (
          <div className="flex items-center gap-2 flex-1 justify-center">
            <button
              className="px-4 py-2 rounded-md flex items-center justify-center focus:ring-2 focus:ring-bradley-red focus:outline-none bg-bradley-light-gray text-bradley-dark-gray dark:bg-bradley-dark-gray dark:text-bradley-light-gray border-none shadow-none hover:bg-white dark:hover:bg-bradley-dark-surface"
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              aria-label="Previous Week"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-2xl font-bold mx-2 min-w-[180px] text-center flex items-center justify-center text-bradley-dark-gray dark:text-bradley-light-gray">
              {format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'MMM d')} - {format(addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), 6), 'MMM d')}
            </span>
            <button
              className="px-4 py-2 rounded-md flex items-center justify-center focus:ring-2 focus:ring-bradley-red focus:outline-none bg-bradley-light-gray text-bradley-dark-gray dark:bg-bradley-dark-gray dark:text-bradley-light-gray border-none shadow-none hover:bg-white dark:hover:bg-bradley-dark-surface"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              aria-label="Next Week"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 justify-center">
            <button
              className="px-4 py-2 rounded-md flex items-center justify-center focus:ring-2 focus:ring-bradley-red focus:outline-none bg-bradley-light-gray text-bradley-dark-gray dark:bg-bradley-dark-gray dark:text-bradley-light-gray border-none shadow-none hover:bg-white dark:hover:bg-bradley-dark-surface"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-2xl font-bold mx-2 min-w-[180px] text-center flex items-center justify-center text-bradley-dark-gray dark:text-bradley-light-gray">
              {view === 'byEmployee'
                ? `${format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'MMM d')} - ${format(addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), 6), 'MMM d')}`
                : format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              className="px-4 py-2 rounded-md flex items-center justify-center focus:ring-2 focus:ring-bradley-red focus:outline-none bg-bradley-light-gray text-bradley-dark-gray dark:bg-bradley-dark-gray dark:text-bradley-light-gray border-none shadow-none hover:bg-white dark:hover:bg-bradley-dark-surface"
              onClick={handleNextMonth}
              aria-label="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        {/* Add Shift button on right, admin only */}
        <div className="flex flex-1 justify-end">
          {user?.role === 'admin' && (
            <button
              className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] border border-bradley-red active:shadow-[0_1px_1px_0_#870F0F] flex items-center gap-2"
              onClick={() => { setShowAddShift(true); setEditingShift(null); setShowShiftModal(true); }}
            >
              <Plus size={18} /> Add Shift
            </button>
          )}
        </div>
      </div>
      {view === 'monthly' && renderMonthly()}
      {view === 'byEmployee' && renderByEmployee()}
      {showShiftModal && user?.role === 'admin' && (
        <ShiftModal
          shift={editingShift}
          onClose={() => { setShowShiftModal(false); setEditingShift(null); setShowAddShift(false); }}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          isEdit={!!editingShift}
        />
      )}
    </div>
  );
}

// Helper to get a dark version of the color for text
function getDarkTextColor(bg: string): string {
  switch (bg) {
    case '#E57373': return '#870F0F'; // dark pink
    case '#FFD54F': return '#8A6D1B'; // dark yellow
    case '#4DB6AC': return '#15544B'; // dark mint
    case '#9575CD': return '#3B2370'; // dark lavender
    case '#FFB74D': return '#8A4B1B'; // dark peach
    case '#64B5F6': return '#174A7E'; // dark blue
    case '#81C784': return '#256029'; // dark green
    default: return '#222';
  }
}

// Helper to get full name from employee object
function getEmployeeName(emp: any) {
  return emp ? `${emp.firstName} ${emp.lastName}` : '';
}