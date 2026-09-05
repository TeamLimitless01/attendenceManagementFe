/**
 * Utility functions for human-readable dates, times, and error handling across the application.
 */

export function formatDate(val: any): string {
  if (!val) return '--';
  try {
    const d = typeof val === 'string' && val.length === 10 ? new Date(`${val}T00:00:00`) : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (err) {
    return String(val);
  }
}

export function formatTime(val: any): string {
  if (!val) return '--';
  try {
    if (typeof val === 'string' && val.includes(':')) {
      const parts = val.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = String(minutes).padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${period}`;
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (err) {
    return String(val);
  }
}

export function formatTimeRange(start: any, end: any): string {
  const formattedStart = formatTime(start);
  const formattedEnd = formatTime(end);
  if (formattedStart === '--' && formattedEnd === '--') return '--';
  if (formattedStart === '--') return formattedEnd;
  if (formattedEnd === '--') return formattedStart;
  return `${formattedStart} - ${formattedEnd}`;
}

export function formatDateTime(val: any): string {
  if (!val) return '--';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  } catch (err) {
    return String(val);
  }
}

export function formatRelativeTime(val: any): string {
  if (!val) return '--';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 30) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(val);
  } catch (err) {
    return String(val);
  }
}

/**
 * Safely extracts a user-friendly error string from any thrown error object.
 */
export function getErrorMessage(err: any, fallback = 'An unexpected error occurred.'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  
  // Axios response structure from API
  const apiMsg = err?.response?.data?.error?.message || err?.response?.data?.message;
  if (typeof apiMsg === 'string' && apiMsg.trim().length > 0) {
    return apiMsg;
  }

  // Nested error object
  const nestedMsg = err?.error?.message || err?.message;
  if (typeof nestedMsg === 'string' && nestedMsg.trim().length > 0) {
    return nestedMsg;
  }

  if (typeof err === 'object') {
    try {
      const str = JSON.stringify(err);
      if (str !== '{}' && !str.startsWith('{"isAxiosError":')) return str;
    } catch (e) {
      // ignore
    }
  }

  return fallback;
}
