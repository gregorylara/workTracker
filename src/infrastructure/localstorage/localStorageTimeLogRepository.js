import { TimeLogRepository } from '../../domain/repositories/TimeLogRepository';
import { TimeLog } from '../../domain/entities/TimeLog';

export class LocalStorageTimeLogRepository extends TimeLogRepository {
  constructor() {
    super();
    this.logsPrefix = 'worktracker_logs_';
    this.timerPrefix = 'worktracker_timer_';
  }

  _getLogsKey(userId) {
    const id = userId || 'guest';
    return `${this.logsPrefix}${id}`;
  }

  _getTimerKey(userId) {
    const id = userId || 'guest';
    return `${this.timerPrefix}${id}`;
  }

  async getTimeLogs(userId) {
    const key = this._getLogsKey(userId);
    const data = localStorage.getItem(key);
    if (!data) return [];
    try {
      const rawLogs = JSON.parse(data);
      return rawLogs.map(log => new TimeLog(log));
    } catch (error) {
      console.error('Error parsing time logs from LocalStorage:', error);
      return [];
    }
  }

  async saveTimeLog(timeLog, userId) {
    const key = this._getLogsKey(userId);
    const logs = await this.getTimeLogs(userId);
    
    // Check if updating or creating new
    const index = logs.findIndex(l => l.id === timeLog.id);
    if (index !== -1) {
      logs[index] = timeLog;
    } else {
      logs.unshift(timeLog); // Insert newest first
    }
    
    localStorage.setItem(key, JSON.stringify(logs));
    return timeLog;
  }

  async deleteTimeLog(id, userId) {
    const key = this._getLogsKey(userId);
    const logs = await this.getTimeLogs(userId);
    const filteredLogs = logs.filter(l => l.id !== id);
    localStorage.setItem(key, JSON.stringify(filteredLogs));
    return true;
  }

  async getActiveTimer(userId) {
    const key = this._getTimerKey(userId);
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data); // Returns { projectName, description, startTime }
    } catch {
      return null;
    }
  }

  async setActiveTimer(timerState, userId) {
    const key = this._getTimerKey(userId);
    localStorage.setItem(key, JSON.stringify(timerState));
    return timerState;
  }

  async clearActiveTimer(userId) {
    const key = this._getTimerKey(userId);
    localStorage.removeItem(key);
    return true;
  }
}
