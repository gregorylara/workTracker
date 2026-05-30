import { TimeLog } from '../entities/TimeLog.js';

/**
 * Use case to stop tracking work and save the time log
 * @param {TimeLogRepository} timeLogRepository 
 * @param {string} userId 
 * @returns {Promise<TimeLog>} The created TimeLog entity
 */
export async function stopTimeTracking(timeLogRepository, userId) {
  const activeTimer = await timeLogRepository.getActiveTimer(userId);
  if (!activeTimer) {
    throw new Error('No active timer running');
  }

  const endTime = new Date().toISOString();
  const start = new Date(activeTimer.startTime);
  const end = new Date(endTime);
  // Duration in seconds (minimum 0)
  const duration = Math.max(0, Math.floor((end - start) / 1000));

  const timeLog = new TimeLog({
    projectName: activeTimer.projectName,
    description: activeTimer.description,
    startTime: activeTimer.startTime,
    endTime,
    duration
  });

  await timeLogRepository.saveTimeLog(timeLog, userId);
  await timeLogRepository.clearActiveTimer(userId);
  
  return timeLog;
}
