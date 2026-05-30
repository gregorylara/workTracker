/**
 * Use case to delete a time log by ID
 * @param {TimeLogRepository} timeLogRepository 
 * @param {string} id 
 * @param {string} userId 
 * @returns {Promise<boolean>} Success status
 */
export function deleteTimeLog(timeLogRepository, id, userId) {
  return timeLogRepository.deleteTimeLog(id, userId);
}
