/**
 * Use case to retrieve all time logs for a user
 * @param {TimeLogRepository} timeLogRepository 
 * @param {string} userId 
 * @returns {Promise<TimeLog[]>} List of TimeLog entities
 */
export function getTimeLogs(timeLogRepository, userId) {
  return timeLogRepository.getTimeLogs(userId);
}
