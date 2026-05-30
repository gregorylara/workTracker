/**
 * Use case to subscribe to authentication state changes
 * @param {AuthRepository} authRepository 
 * @param {function(User|null): void} callback 
 * @returns {function(): void} Unsubscribe function
 */
export function subscribeToAuthState(authRepository, callback) {
  return authRepository.subscribeToAuthState(callback);
}
