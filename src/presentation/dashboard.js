import { Chart } from 'chart.js/auto';
import { Modal } from 'bootstrap';

// Helper: Format duration from seconds to HH:MM:SS
function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Helper: Format duration for user-friendly display (always showing seconds)
function formatFriendlyDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const parts = [];
  if (h > 0) {
    parts.push(`${h}h`);
    parts.push(`${m}m`);
    parts.push(`${s}s`);
  } else if (m > 0) {
    parts.push(`${m}m`);
    parts.push(`${s}s`);
  } else {
    parts.push(`${s}s`);
  }
  return parts.join(' ');
}

// Helper: Format date for log list (e.g. May 30, 2026 at 4:15 PM)
function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Helper: Get list of months present in logs (for filtering)
function getAvailableMonths(logs) {
  const months = new Set();
  logs.forEach(log => {
    const date = new Date(log.startTime);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    months.add(key);
  });
  return Array.from(months).sort().reverse(); // Newest first
}

// Helper: Format month key (YYYY-MM) to readable name (e.g., "May 2026")
function formatMonthKey(key) {
  const [year, month] = key.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

export function initDashboard(appState) {
  let timerInterval = null;
  let projectChartInstance = null;
  let resumeModalInstance = null;

  const modalEl = document.getElementById('resumeDescriptionModal');
  if (modalEl) {
    resumeModalInstance = new Modal(modalEl);
  }
  
  // Local UI filters state
  const filters = {
    search: '',
    project: 'all',
    month: 'current' // 'current', 'all', or YYYY-MM
  };

  // Bind State Subscription
  appState.subscribe((state) => {
    renderUI(state);
  });

  // Handle Dynamic Timer Tick
  function startTick(startTime) {
    if (timerInterval) clearInterval(timerInterval);
    
    const displayElement = document.getElementById('activeTimerDisplay');
    const updateTick = () => {
      const start = new Date(startTime);
      const elapsed = Math.floor((new Date() - start) / 1000);
      if (displayElement) {
        displayElement.textContent = formatDuration(elapsed);
      }
    };
    
    updateTick();
    timerInterval = setInterval(updateTick, 1000);
  }

  function stopTick() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Setup Static DOM Event Listeners (Delegated)
  setupEventListeners(appState);

  // Main Render Function
  function renderUI(state) {
    // 1. Render Auth/Header
    renderNavbar(state);

    // 2. Render Loading/Errors
    renderLoadingAndError(state);

    if (state.isLoading) return;

    // 3. Render Active Timer Container
    renderActiveTimerCard(state);

    // 4. Update Project Select Options (for filtering and logging autocomplete)
    populateProjectDatalistsAndFilters(state.timeLogs);

    // 5. Filter Logs based on user choices
    const filteredLogs = applyFilters(state.timeLogs);

    // 6. Render Dashboard Statistics
    renderStats(state.timeLogs, filteredLogs);

    // 7. Render Charts
    renderAnalytics(filteredLogs);

    // 8. Render Logs History List
    renderLogsList(state, filteredLogs);
  }

  // Render Navbar / Authenticated Info
  function renderNavbar(state) {
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) return;

    if (state.user) {
      authContainer.innerHTML = `
        <div class="d-flex align-items-center gap-3">
          <img src="${state.user.photoURL || 'https://via.placeholder.com/150'}" alt="${state.user.displayName}" class="avatar-img" />
          <span class="d-none d-md-inline text-secondary small">Hello, <strong>${state.user.displayName}</strong></span>
          <button id="logoutBtn" class="btn btn-secondary-custom btn-sm py-1 px-3">
            <i class="bi bi-box-arrow-right me-1"></i> Sign Out
          </button>
        </div>
      `;
      
      // Bind logout
      document.getElementById('logoutBtn').addEventListener('click', () => {
        appState.logout();
      });
    } else {
      authContainer.innerHTML = `
        <button id="loginBtn" class="btn btn-google">
          <svg class="me-2" width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.9c1.69-1.55 2.69-3.84 2.69-6.57z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.9-2.24c-.8.54-1.84.87-3.06.87-2.35 0-4.34-1.58-5.05-3.72H.95v2.3C2.43 15.89 5.48 18 9 18z"/>
            <path fill="#FBBC05" d="M3.95 10.71a5.4 5.4 0 0 1 0-3.42V4.99H.95A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.95 4.01l3-2.3z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.3A8.99 8.99 0 0 0 9 0C5.48 0 2.43 2.11.95 5L3.95 7.3c.71-2.14 2.7-3.72 5.05-3.72z"/>
          </svg>
          Sign In with Google
        </button>
      `;

      // Bind login
      document.getElementById('loginBtn').addEventListener('click', () => {
        appState.login();
      });
    }
  }

  // Render Loader and Error Alert
  function renderLoadingAndError(state) {
    const loader = document.getElementById('loaderSection');
    const mainContent = document.getElementById('mainContentSection');
    const errorAlert = document.getElementById('errorAlert');

    if (loader) {
      loader.classList.toggle('d-none', !state.isLoading);
    }
    
    if (mainContent) {
      mainContent.classList.toggle('d-none', state.isLoading);
    }

    if (errorAlert) {
      if (state.error) {
        errorAlert.textContent = state.error;
        errorAlert.classList.remove('d-none');
      } else {
        errorAlert.classList.add('d-none');
      }
    }
  }

  // Render Timer Inputs and running state
  function renderActiveTimerCard(state) {
    const trackingCard = document.getElementById('trackingCard');
    if (!trackingCard) return;

    if (state.activeTimer) {
      // Start real-time tick in UI
      startTick(state.activeTimer.startTime);

      trackingCard.innerHTML = `
        <div class="card-body p-4 text-center">
          <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
            <span class="timer-pulse-dot"></span>
            <span class="text-danger small fw-semibold text-uppercase tracking-wider">Active Session</span>
          </div>
          <h3 class="h4 mb-1 text-white truncate-1">${state.activeTimer.projectName}</h3>
          <p class="text-secondary small mb-4 truncate-2">${state.activeTimer.description || 'No description provided'}</p>
          
          <div class="timer-display mb-4" id="activeTimerDisplay">00:00:00</div>
          
          <button id="stopTimerBtn" class="btn btn-danger-custom w-100 py-3 fs-5 fw-medium d-flex align-items-center justify-content-center gap-2">
            <i class="bi bi-stop-fill fs-4"></i> Stop Time Tracking
          </button>
        </div>
      `;

      // Bind Stop Action
      document.getElementById('stopTimerBtn').addEventListener('click', () => {
        stopTick();
        appState.stopTimer();
      });
    } else {
      stopTick();

      trackingCard.innerHTML = `
        <div class="card-body p-4">
          <h4 class="h5 mb-4 text-white">Start New Tracker</h4>
          <form id="startTimerForm">
            <div class="mb-3">
              <label for="projectNameInput" class="form-label text-secondary small">Project Name</label>
              <input 
                type="text" 
                class="form-control form-control-custom" 
                id="projectNameInput" 
                placeholder="e.g., Website Redesign" 
                list="existingProjectsDatalist"
                required
              />
              <datalist id="existingProjectsDatalist"></datalist>
            </div>
            
            <div class="mb-4">
              <label for="descriptionInput" class="form-label text-secondary small">Task Description</label>
              <textarea 
                class="form-control form-control-custom" 
                id="descriptionInput" 
                rows="2" 
                placeholder="What are you working on?"
              ></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary-custom w-100 py-2.5 d-flex align-items-center justify-content-center gap-2">
              <i class="bi bi-play-fill fs-5"></i> Start Tracking
            </button>
          </form>
        </div>
      `;

      // Bind Start Action
      document.getElementById('startTimerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const projectName = document.getElementById('projectNameInput').value.trim();
        const description = document.getElementById('descriptionInput').value.trim();
        appState.startTimer(projectName, description);
      });
    }
  }

  // Populate dynamic select list elements
  function populateProjectDatalistsAndFilters(logs) {
    const projects = Array.from(new Set(logs.map(log => log.projectName))).filter(Boolean);
    
    // Autocomplete datalist for Project input
    const datalist = document.getElementById('existingProjectsDatalist');
    if (datalist) {
      datalist.innerHTML = projects.map(proj => `<option value="${proj}"></option>`).join('');
    }

    // Filter project dropdown
    const projFilter = document.getElementById('projectFilterSelect');
    if (projFilter && projFilter.children.length <= 1) {
      const prevVal = filters.project;
      projFilter.innerHTML = '<option value="all">All Projects</option>' + 
        projects.map(proj => `<option value="${proj}">${proj}</option>`).join('');
      projFilter.value = prevVal;
    }

    // Filter month dropdown
    const monthFilter = document.getElementById('monthFilterSelect');
    if (monthFilter) {
      const prevVal = filters.month;
      const availableMonths = getAvailableMonths(logs);
      
      let html = `
        <option value="current">Current Month</option>
        <option value="all">All Months</option>
      `;
      
      availableMonths.forEach(m => {
        html += `<option value="${m}">${formatMonthKey(m)}</option>`;
      });
      
      monthFilter.innerHTML = html;
      monthFilter.value = prevVal;
    }
  }

  // Filter logs based on inputs
  function applyFilters(logs) {
    return logs.filter(log => {
      // 1. Search filter
      const searchLower = filters.search.toLowerCase();
      const matchSearch = !searchLower || 
        log.projectName.toLowerCase().includes(searchLower) || 
        (log.description && log.description.toLowerCase().includes(searchLower));

      // 2. Project filter
      const matchProj = filters.project === 'all' || log.projectName === filters.project;

      // 3. Month filter
      let matchMonth = true;
      const logDate = new Date(log.startTime);
      const logYear = logDate.getFullYear();
      const logMonth = logDate.getMonth(); // 0-11
      const logMonthKey = `${logYear}-${(logMonth + 1).toString().padStart(2, '0')}`;

      if (filters.month === 'current') {
        const now = new Date();
        matchMonth = (logYear === now.getFullYear() && logMonth === now.getMonth());
      } else if (filters.month !== 'all') {
        matchMonth = (logMonthKey === filters.month);
      }

      return matchSearch && matchProj && matchMonth;
    });
  }

  // Render statistical summary counters
  function renderStats(allLogs, filteredLogs) {
    // Calculate stats based on FILTERED range to make numbers dynamic to filter
    const totalSeconds = filteredLogs.reduce((acc, log) => acc + log.duration, 0);
    
    const uniqueProjects = new Set(filteredLogs.map(log => log.projectName)).size;
    const sessionCount = filteredLogs.length;

    const statsHoursVal = document.getElementById('statsHoursVal');
    const statsProjectsVal = document.getElementById('statsProjectsVal');
    const statsLogsVal = document.getElementById('statsLogsVal');

    if (statsHoursVal) statsHoursVal.textContent = formatFriendlyDuration(totalSeconds);
    if (statsProjectsVal) statsProjectsVal.textContent = `${uniqueProjects}`;
    if (statsLogsVal) statsLogsVal.textContent = `${sessionCount}`;

    // Update label to reflect filter scope
    const filterScopeText = document.getElementById('filterScopeText');
    if (filterScopeText) {
      if (filters.month === 'current') {
        filterScopeText.textContent = 'This Month';
      } else if (filters.month === 'all') {
        filterScopeText.textContent = 'Total / All Time';
      } else {
        filterScopeText.textContent = formatMonthKey(filters.month);
      }
    }
  }

  // Draw or update Chart.js
  function renderAnalytics(logs) {
    const ctx = document.getElementById('projectChart');
    const placeholder = document.getElementById('chartPlaceholder');
    
    if (!ctx) return;

    // Aggregate durations per project
    const projectDurations = {};
    logs.forEach(log => {
      const proj = log.projectName || 'Untitled Project';
      const hours = log.duration / 3600;
      projectDurations[proj] = (projectDurations[proj] || 0) + hours;
    });

    const labels = Object.keys(projectDurations);
    const data = Object.values(projectDurations).map(val => parseFloat(val.toFixed(2)));

    if (labels.length === 0) {
      ctx.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      if (projectChartInstance) {
        projectChartInstance.destroy();
        projectChartInstance = null;
      }
      return;
    }

    ctx.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';

    // Redraw
    if (projectChartInstance) {
      projectChartInstance.data.labels = labels;
      projectChartInstance.data.datasets[0].data = data;
      projectChartInstance.update();
    } else {
      projectChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            label: 'Hours Spent',
            data: data,
            backgroundColor: [
              'rgba(99, 102, 241, 0.85)',  // Indigo
              'rgba(16, 185, 129, 0.85)',  // Emerald
              'rgba(245, 158, 11, 0.85)',  // Amber
              'rgba(244, 63, 94, 0.85)',   // Rose
              'rgba(6, 182, 212, 0.85)',   // Cyan
              'rgba(168, 85, 247, 0.85)'   // Purple
            ],
            borderColor: '#121a2c',
            borderWidth: 2,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#9ca3af',
                font: {
                  family: 'Outfit',
                  size: 11
                },
                padding: 15
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ` ${context.label}: ${context.raw} hrs`;
                }
              }
            }
          },
          cutout: '65%'
        }
      });
    }
  }

  // Render List of logs
  function renderLogsList(state, filteredLogs) {
    const listContainer = document.getElementById('logsListContainer');
    if (!listContainer) return;

    if (filteredLogs.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-clock-history text-secondary display-6 mb-3 d-block"></i>
          <p class="text-secondary small">No time logs recorded for this selection.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filteredLogs.map(log => {
      const formattedDate = formatDateTime(log.startTime);
      const friendlyDuration = formatFriendlyDuration(log.duration);
      
      return `
        <div class="log-item d-flex align-items-center justify-content-between gap-3" data-id="${log.id}">
          <div class="overflow-hidden">
            <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span class="badge bg-secondary-subtle text-secondary small px-2.5 py-1 rounded-pill">${log.projectName}</span>
              <span class="text-muted small fs-7">${formattedDate}</span>
            </div>
            <p class="text-white small mb-0 text-truncate text-break">${log.description || '<span class="text-muted font-italic">No description</span>'}</p>
          </div>
          <div class="d-flex align-items-center gap-2 shrink-0">
            <span class="fw-semibold text-success small me-1">${friendlyDuration}</span>
            <button class="btn btn-resume-custom btn-sm resume-log-btn" 
                    data-project="${log.projectName}" 
                    data-description="${log.description || ''}"
                    ${state.activeTimer ? 'disabled' : ''}
                    title="Continue working on this project">
              <i class="bi bi-play-fill"></i>
            </button>
            <button class="btn btn-danger-custom btn-sm delete-log-btn" data-id="${log.id}" title="Delete log">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to Resume Buttons
    listContainer.querySelectorAll('.resume-log-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const projectName = btn.getAttribute('data-project');
        const previousDesc = btn.getAttribute('data-description') || '';
        
        // Pre-fill inputs in our custom modal
        const projectInput = document.getElementById('modalProjectNameInput');
        const descriptionInput = document.getElementById('modalDescriptionInput');
        const modalForm = document.getElementById('resumeModalForm');
        
        if (projectInput) projectInput.value = projectName;
        if (descriptionInput) descriptionInput.value = previousDesc;
        if (modalForm) modalForm.dataset.project = projectName;
        
        // Show the custom modal
        if (resumeModalInstance) {
          resumeModalInstance.show();
        }
      });
    });

    // Attach click listeners to Delete Buttons
    listContainer.querySelectorAll('.delete-log-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const logId = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this time log?')) {
          appState.deleteLog(logId);
        }
      });
    });
  }

  // Setup dynamic listeners
  function setupEventListeners(appState) {
    // 1. Search Box Input
    const searchInput = document.getElementById('historySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value.trim();
        // Trigger a localized state re-render
        renderUI(appState.state);
      });
    }

    // 2. Project Filter Select
    const projectSelect = document.getElementById('projectFilterSelect');
    if (projectSelect) {
      projectSelect.addEventListener('change', (e) => {
        filters.project = e.target.value;
        renderUI(appState.state);
      });
    }

    // 3. Month Filter Select
    const monthSelect = document.getElementById('monthFilterSelect');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        filters.month = e.target.value;
        renderUI(appState.state);
      });
    }

    // 4. Modal Form Submission
    const resumeForm = document.getElementById('resumeModalForm');
    if (resumeForm) {
      resumeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const projectName = resumeForm.dataset.project;
        const description = document.getElementById('modalDescriptionInput').value.trim();
        
        if (resumeModalInstance) {
          resumeModalInstance.hide();
        }
        
        appState.startTimer(projectName, description);
      });
    }
  }
}
