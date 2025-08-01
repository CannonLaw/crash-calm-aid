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