/**
 * Interface for TimeLog Repository
 */
export class TimeLogRepository {
  getTimeLogs() {
    throw new Error('Method getTimeLogs() must be implemented');
  }

  saveTimeLog(timeLog) {
    throw new Error('Method saveTimeLog() must be implemented');
  }

  deleteTimeLog(id) {
    throw new Error('Method deleteTimeLog() must be implemented');
  }

  getActiveTimer() {
    throw new Error('Method getActiveTimer() must be implemented');
  }

  setActiveTimer(timerState) {
    throw new Error('Method setActiveTimer() must be implemented');
  }

  clearActiveTimer() {
    throw new Error('Method clearActiveTimer() must be implemented');
  }
}
