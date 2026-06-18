import { AuthRepository } from '../../domain/repositories/AuthRepository.js';
import { User } from '../../domain/entities/User.js';
import { auth, isFirebaseConfigured } from './firebaseConfig.js';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

export class FirebaseAuthRepository extends AuthRepository {
  constructor() {
    super();
    this.mockUserKey = 'worktracker_mock_user';
    this.subscribers = new Set();
    
    if (!isFirebaseConfigured) {
      // Listen to cross-tab storage changes in mock mode
      window.addEventListener('storage', (e) => {
        if (e.key === this.mockUserKey) {
          this._notifySubscribers(this.getCurrentUser());
        }
      });
    }
  }

  async loginWithGoogle() {
    if (isFirebaseConfigured && auth) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        return new User(fbUser.uid, fbUser.email, fbUser.displayName, fbUser.photoURL);
      } catch (error) {
        console.error('Firebase Auth Login Error:', error);
        throw error;
      }
    } else {
      // Simulate Google Login delay
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = new User(
            'mock-uid-12345',
            'john.doe@example.com',
            'John Doe (Demo)',
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
          );
          localStorage.setItem(this.mockUserKey, JSON.stringify(mockUser));
          this._notifySubscribers(mockUser);
          resolve(mockUser);
        }, 800);
      });
    }
  }

  async logout() {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Firebase Auth Logout Error:', error);
        throw error;
      }
    } else {
      localStorage.removeItem(this.mockUserKey);
      this._notifySubscribers(null);
    }
  }

  subscribeToAuthState(callback) {
    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          callback(new User(fbUser.uid, fbUser.email, fbUser.displayName, fbUser.photoURL));
        } else {
          callback(null);
        }
      });
    } else {
      this.subscribers.add(callback);
      // Immediately invoke with current state
      callback(this.getCurrentUser());
      // Return unsubscribe function
      return () => {
        this.subscribers.delete(callback);
      };
    }
  }

  getCurrentUser() {
    if (isFirebaseConfigured && auth) {
      const fbUser = auth.currentUser;
      if (fbUser) {
        return new User(fbUser.uid, fbUser.email, fbUser.displayName, fbUser.photoURL);
      }
      return null;
    } else {
      const stored = localStorage.getItem(this.mockUserKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return new User(parsed.uid, parsed.email, parsed.displayName, parsed.photoURL);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  _notifySubscribers(user) {
    for (const subscriber of this.subscribers) {
      subscriber(user);
    }
  }
}
