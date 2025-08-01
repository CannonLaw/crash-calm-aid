import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Formats a date to the user's local timezone for display
 */
export const formatToLocalTime = (date: string | Date): string => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(new Date(date), userTimeZone, 'MMM dd, yyyy \'at\' h:mm a');
};

/**
 * Formats a date for PDF generation in the user's local timezone
 */
export const formatForPDF = (date: string | Date): string => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(new Date(date), userTimeZone, 'MMMM dd, yyyy \'at\' h:mm a');
};

/**
 * Formats just the date part for display
 */
export const formatDateOnly = (date: string | Date): string => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(new Date(date), userTimeZone, 'MMM dd, yyyy');
};

/**
 * Formats just the time part for display
 */
export const formatTimeOnly = (date: string | Date): string => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(new Date(date), userTimeZone, 'h:mm a');
};

/**
 * Gets the current date and time in local timezone formatted for datetime-local input
 */
export const getCurrentLocalDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formats a datetime-local string for PDF generation
 * Treats the input as already being in local time (not UTC)
 */
export const formatLocalDateTimeForPDF = (datetimeLocalString: string): string => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Create a Date object treating the string as local time
  const [datePart, timePart] = datetimeLocalString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  // Create date in local timezone
  const localDate = new Date(year, month - 1, day, hour, minute);
  return formatInTimeZone(localDate, userTimeZone, 'MMMM dd, yyyy \'at\' h:mm a');
};