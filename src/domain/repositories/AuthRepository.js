/**
 * Interface for Authentication Repository
 */
export class AuthRepository {
  loginWithGoogle() {
    throw new Error('Method loginWithGoogle() must be implemented');
  }

  logout() {
    throw new Error('Method logout() must be implemented');
  }

  subscribeToAuthState(callback) {
    throw new Error('Method subscribeToAuthState() must be implemented');
  }

  getCurrentUser() {
    throw new Error('Method getCurrentUser() must be implemented');
  }
}
