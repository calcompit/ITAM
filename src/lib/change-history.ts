// Change History tracking utilities

export interface ChangeRecord {
  id: string;
  timestamp: number;
  type: 'pin' | 'unpin' | 'vnc' | 'status_change' | 'system_update';
  description: string;
  computerName?: string;
  ipAddress?: string;
  oldValue?: string;
  newValue?: string;
  user?: string;
}

// Store change record
export function addChangeRecord(record: Omit<ChangeRecord, 'id' | 'timestamp'>): void {
  try {
    const changeRecord: ChangeRecord = {
      ...record,
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    const existingRecords = getChangeRecords();
    const updatedRecords = [changeRecord, ...existingRecords].slice(0, 100); // Keep last 100 records
    localStorage.setItem('change_history', JSON.stringify(updatedRecords));
  } catch (error) {
    console.error('Failed to store change record:', error);
  }
}

// Get change records
export function getChangeRecords(): ChangeRecord[] {
  try {
    const records = localStorage.getItem('change_history');
    return records ? JSON.parse(records) : [];
  } catch (error) {
    console.error('Failed to get change records:', error);
    return [];
  }
}

// Clear old change records (older than 7 days)
export function clearOldChangeRecords(): void {
  try {
    const existingRecords = getChangeRecords();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const updatedRecords = existingRecords.filter(record => record.timestamp > sevenDaysAgo);
    localStorage.setItem('change_history', JSON.stringify(updatedRecords));
  } catch (error) {
    console.error('Failed to clear old change records:', error);
  }
}

// Format timestamp for display
export function formatChangeTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Get change type icon
export function getChangeTypeIcon(type: ChangeRecord['type']): string {
  switch (type) {
    case 'pin':
      return '📌';
    case 'unpin':
      return '📍';
    case 'vnc':
      return '🖥️';
    case 'status_change':
      return '🔄';
    case 'system_update':
      return '⚙️';
    default:
      return '📝';
  }
}

// Get change type color
export function getChangeTypeColor(type: ChangeRecord['type']): string {
  switch (type) {
    case 'pin':
      return 'text-blue-600';
    case 'unpin':
      return 'text-gray-600';
    case 'vnc':
      return 'text-green-600';
    case 'status_change':
      return 'text-orange-600';
    case 'system_update':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
}
