/**
 * Use case to log out the current user
 * @param {AuthRepository} authRepository 
 * @returns {Promise<void>}
 */
export function logout(authRepository) {
  return authRepository.logout();
}
