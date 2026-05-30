// Styling dependencies
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './custom.css';

// Bootstrap JavaScript behaviors
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Clean Architecture Components
import { FirebaseAuthRepository } from './infrastructure/firebase/firebaseAuthRepository.js';
import { LocalStorageTimeLogRepository } from './infrastructure/localstorage/localStorageTimeLogRepository.js';
import { AppState } from './presentation/state/appState.js';
import { initDashboard } from './presentation/dashboard.js';

// Instantiate Concrete Repositories (Infrastructure)
const authRepository = new FirebaseAuthRepository();
const timeLogRepository = new LocalStorageTimeLogRepository();

// Instantiate State Manager (Presentation State)
const appState = new AppState();

// Wire everything together
async function bootstrap() {
  try {
    // 1. Initialise the application state
    // This starts authentication listeners and triggers initial data queries
    await appState.init(authRepository, timeLogRepository);
    
    // 2. Initialise the dashboard UI controls and bind to state triggers
    initDashboard(appState);
    
    console.log('WorkTracker successfully bootstrapped.');
  } catch (error) {
    console.error('Bootstrap failure:', error);
  }
}

// Start the application
bootstrap();
