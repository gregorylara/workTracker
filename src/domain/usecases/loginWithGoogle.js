/**
 * Use case to log in a user with Google provider
 * @param {AuthRepository} authRepository 
 * @returns {Promise<User>}
 */
export function loginWithGoogle(authRepository) {
  return authRepository.loginWithGoogle();
}
