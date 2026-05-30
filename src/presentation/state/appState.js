import { loginWithGoogle as loginWithGoogleUseCase } from '../../domain/usecases/loginWithGoogle.js';
import { logout as logoutUseCase } from '../../domain/usecases/logout.js';
import { subscribeToAuthState as subscribeToAuthStateUseCase } from '../../domain/usecases/subscribeToAuthState.js';
import { startTimeTracking as startTimeTrackingUseCase } from '../../domain/usecases/startTimeTracking.js';
import { stopTimeTracking as stopTimeTrackingUseCase } from '../../domain/usecases/stopTimeTracking.js';
import { getTimeLogs as getTimeLogsUseCase } from '../../domain/usecases/getTimeLogs.js';
import { deleteTimeLog as deleteTimeLogUseCase } from '../../domain/usecases/deleteTimeLog.js';

export class AppState {
  constructor() {
    this.state = {
      user: null,
      timeLogs: [],
      activeTimer: null,
      isLoading: true,
      error: null
    };
    this.listeners = new Set();
    this.authRepository = null;
    this.timeLogRepository = null;
  }

  // Register listener for state changes
  subscribe(listener) {
    this.listeners.add(listener);
    // Call immediately with current state
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  _notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  _updateState(updates) {
    this.state = { ...this.state, ...updates };
    this._notify();
  }

  // Initialize the state and subscriptions
  async init(authRepository, timeLogRepository) {
    this.authRepository = authRepository;
    this.timeLogRepository = timeLogRepository;

    this._updateState({ isLoading: true });

    // Subscribe to authentication changes
    subscribeToAuthStateUseCase(this.authRepository, async (user) => {
      this._updateState({ user });
      
      if (user) {
        // Load user specific data
        await this.loadUserData(user.uid);
      } else {
        // Load guest data
        await this.loadUserData(null);
      }
    });
  }

  async loadUserData(userId) {
    try {
      this._updateState({ isLoading: true });
      const [logs, activeTimer] = await Promise.all([
        getTimeLogsUseCase(this.timeLogRepository, userId),
        this.timeLogRepository.getActiveTimer(userId)
      ]);
      this._updateState({
        timeLogs: logs,
        activeTimer,
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error('Failed to load user data:', err);
      this._updateState({
        isLoading: false,
        error: 'Failed to load time tracker data.'
      });
    }
  }

  async login() {
    try {
      this._updateState({ isLoading: true, error: null });
      await loginWithGoogleUseCase(this.authRepository);
    } catch (err) {
      console.error('Login action failed:', err);
      this._updateState({ 
        isLoading: false, 
        error: 'Authentication failed. Please try again.' 
      });
    }
  }

  async logout() {
    try {
      this._updateState({ isLoading: true, error: null });
      await logoutUseCase(this.authRepository);
    } catch (err) {
      console.error('Logout action failed:', err);
      this._updateState({ 
        isLoading: false, 
        error: 'Failed to log out.' 
      });
    }
  }

  async startTimer(projectName, description) {
    try {
      const userId = this.state.user ? this.state.user.uid : null;
      const activeTimer = await startTimeTrackingUseCase(
        this.timeLogRepository, 
        { projectName, description }, 
        userId
      );
      this._updateState({ activeTimer });
    } catch (err) {
      console.error('Failed to start timer:', err);
      this._updateState({ error: 'Failed to start the timer.' });
    }
  }

  async stopTimer() {
    try {
      const userId = this.state.user ? this.state.user.uid : null;
      const newLog = await stopTimeTrackingUseCase(this.timeLogRepository, userId);
      
      // Update logs list
      const updatedLogs = [newLog, ...this.state.timeLogs];
      this._updateState({
        activeTimer: null,
        timeLogs: updatedLogs
      });
    } catch (err) {
      console.error('Failed to stop timer:', err);
      this._updateState({ error: 'Failed to stop the timer.' });
    }
  }

  async deleteLog(id) {
    try {
      const userId = this.state.user ? this.state.user.uid : null;
      const success = await deleteTimeLogUseCase(this.timeLogRepository, id, userId);
      if (success) {
        const updatedLogs = this.state.timeLogs.filter(log => log.id !== id);
        this._updateState({ timeLogs: updatedLogs });
      }
    } catch (err) {
      console.error('Failed to delete time log:', err);
      this._updateState({ error: 'Failed to delete time log.' });
    }
  }
}
