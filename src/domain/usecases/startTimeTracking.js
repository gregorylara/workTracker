/**
 * Use case to start tracking work on a project
 * @param {TimeLogRepository} timeLogRepository 
 * @param {Object} timerDetails 
 * @param {string} timerDetails.projectName 
 * @param {string} timerDetails.description 
 * @param {string} [timerDetails.startTime] 
 * @param {string} userId 
 * @returns {Promise<Object>} The active timer state
 */
export function startTimeTracking(timeLogRepository, { projectName, description, startTime }, userId) {
  const timerState = {
    projectName: projectName || 'Untitled Project',
    description: description || '',
    startTime: startTime || new Date().toISOString()
  };
  return timeLogRepository.setActiveTimer(timerState, userId);
}
