/**
 * Main Application Entry Point
 * 
 * REAL DATA MODE - Loads actual CSV files from data folder
 * Premium Features: Dark Mode, PDF Export, Search/Filter, India Map, Trend Charts
 * Advanced Analytics: AI Insights, Predictions, Comparative Analysis
 */

import { STATES, STATE_POPULATION, UI_CONFIG } from './config/constants.js';
import { loadAllRealData } from './services/real-data-loader.js';
import { initIndiaMap, updateIndiaMap } from './components/india-map.js';
import { initVelocityChart, initHealthChart, updateCharts } from './components/charts.js';
import { exportDashboardPDF } from './services/pdf-export.js';
import { generateInsights, getKeyInsight } from './services/ai-summary.js';
import { generateAllPredictions, getNationalPrediction } from './services/predictions.js';
import { compareStates, generateRankings, renderComparisonUI } from './components/comparison.js';

// ═══════════════════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════════════════

const appState = {
  currentPage: 'dashboard',
  selectedState: null,
  metrics: {},
  alerts: [],
  insights: [],
  isLoading: true,
  loadError: null,
  dataSummary: null
};

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const init = async () => {
  console.log('🚀 Initializing Aadhaar Intelligence Platform...');
  console.log('📊 MODE: REAL DATA (Loading from CSV files)');

  updateConnectionStatus('Loading Data...');

  // Setup navigation
  setupNavigation();

  // Start live clock
  startLiveClock();

  // Populate state selector with VALID states only
  populateStateSelector();

  // Show loading state
  showLoadingState();

  try {
    // Load REAL data from CSV files
    const result = await loadAllRealData((type, current, total) => {
      updateConnectionStatus(`Loading ${type}... (${current + 1}/${total})`);
    });

    appState.metrics = result.metrics;
    appState.alerts = result.alerts;
    appState.insights = result.insights;
    appState.dataSummary = result.summary;
    appState.isLoading = false;

    // Update connection status to show real data (only valid states count)
    updateConnectionStatus(`Live Data (${result.summary.stateCount} States)`);

    // Update all panels
    updateDashboard();
    updateAlertsPanel();
    updateInsightsPanel();

    // Update state selector with loaded data
    updateStateSelector();

    // Initialize Premium Features
    initPremiumFeatures();

    // Initialize Advanced Analytics
    initAdvancedAnalytics();

    hideLoadingState();

    console.log('✅ Platform initialized with REAL data');
    console.log(`   Total Enrollments: ${result.summary.totalEnrollments.toLocaleString()}`);
    console.log(`   Total Demographic Updates: ${result.summary.totalDemographic.toLocaleString()}`);
    console.log(`   Total Biometric Updates: ${result.summary.totalBiometric.toLocaleString()}`);
    console.log(`   States: ${result.summary.stateCount}`);
    console.log(`   Alerts: ${result.summary.alertCount}`);

  } catch (error) {
    console.error('❌ Failed to load data:', error);
    appState.loadError = error.message;
    appState.isLoading = false;
    updateConnectionStatus('Data Load Error');
    showError(error.message);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LIVE CLOCK & REFRESH
// ═══════════════════════════════════════════════════════════════════════════

const startLiveClock = () => {
  const clockEl = document.getElementById('live-clock');
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  updateClock();
  setInterval(updateClock, 1000);
};

// Refresh data function (global for onclick)
window.refreshData = async () => {
  const btn = document.getElementById('refresh-btn');
  if (!btn || appState.isLoading) return;

  btn.classList.add('spinning');
  btn.disabled = true;
  updateConnectionStatus('Refreshing...');

  try {
    const result = await loadAllRealData();
    appState.metrics = result.metrics;
    appState.alerts = result.alerts;
    appState.insights = result.insights;
    appState.dataSummary = result.summary;

    updateConnectionStatus(`Live Data (${result.summary.stateCount} States)`);
    updateDashboard();
    updateAlertsPanel();
    updateInsightsPanel();
    updateStateSelector();

    console.log('🔄 Data refreshed successfully');
  } catch (error) {
    console.error('❌ Refresh failed:', error);
    updateConnectionStatus('Refresh Error');
  } finally {
    btn.classList.remove('spinning');
    btn.disabled = false;
  }
};

const showLoadingState = () => {
  const metricsGrid = document.querySelector('.metrics-grid');
  if (metricsGrid) {
    metricsGrid.innerHTML = `
      <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 1rem; color: #6c757d;">Loading real data from CSV files...</p>
        <p style="font-size: 0.8rem; color: #adb5bd;">This may take a moment for large datasets</p>
      </div>
    `;
  }
};

const hideLoadingState = () => {
  // Will be replaced by updateDashboard
};

const showError = (message) => {
  const main = document.querySelector('.main-content');
  if (main) {
    main.innerHTML = `
      <div class="error-state" style="text-align: center; padding: 3rem;">
        <div style="font-size: 3rem;">⚠️</div>
        <h2>Data Loading Error</h2>
        <p>${message}</p>
        <p style="color: #6c757d; margin-top: 1rem;">
          Make sure CSV files exist in the /data folder and try refreshing.
        </p>
      </div>
    `;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════

const setupNavigation = () => {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
    });
  });

  // Handle browser back/forward
  window.addEventListener('hashchange', () => {
    const page = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(page, false);
  });

  // Initial page from hash
  const initialPage = window.location.hash.replace('#', '') || 'dashboard';
  navigateTo(initialPage, false);
};

const navigateTo = (page, updateHash = true) => {
  appState.currentPage = page;

  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Show/hide pages
  document.querySelectorAll('.page').forEach(pageEl => {
    pageEl.classList.toggle('active', pageEl.id === `page-${page}`);
  });

  // Update URL hash
  if (updateHash) {
    window.location.hash = page;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD UPDATES
// ═══════════════════════════════════════════════════════════════════════════

const updateConnectionStatus = (status) => {
  const statusEl = document.getElementById('connection-status');
  const statusDot = document.querySelector('.status-dot');

  if (statusEl) statusEl.textContent = status;
  if (statusDot) {
    statusDot.classList.toggle('live', status.includes('Live') || status.includes('States'));
  }
};

const updateDashboard = () => {
  const metricsArray = Object.values(appState.metrics);
  if (metricsArray.length === 0) return;

  // Rebuild metrics grid if needed
  const metricsGrid = document.querySelector('.metrics-grid');
  if (metricsGrid && metricsGrid.querySelector('.loading-state')) {
    metricsGrid.innerHTML = `
      <div class="metric-card" data-metric="saturation">
        <div class="metric-header">
          <span class="metric-label">Saturation Index</span>
          <span class="metric-trend" id="saturation-trend">--</span>
        </div>
        <div class="metric-value" id="saturation-value">--</div>
        <div class="metric-subtext" id="saturation-interpretation">Aadhaar coverage as % of population</div>
        <div class="metric-bar">
          <div class="metric-bar-fill" id="saturation-bar" style="width: 0%"></div>
        </div>
      </div>
      <div class="metric-card" data-metric="velocity">
        <div class="metric-header">
          <span class="metric-label">Enrollment Velocity</span>
          <span class="metric-trend" id="velocity-trend">--</span>
        </div>
        <div class="metric-value" id="velocity-value">--</div>
        <div class="metric-subtext" id="velocity-interpretation">Daily enrollments (7-day avg)</div>
      </div>
      <div class="metric-card" data-metric="stability">
        <div class="metric-header">
          <span class="metric-label">Biometric Stability</span>
          <span class="metric-trend" id="stability-trend">--</span>
        </div>
        <div class="metric-value" id="stability-value">--</div>
        <div class="metric-subtext" id="stability-interpretation">Lower scores indicate refresh pressure</div>
        <div class="metric-bar">
          <div class="metric-bar-fill" id="stability-bar" style="width: 0%"></div>
        </div>
      </div>
      <div class="metric-card" data-metric="health">
        <div class="metric-header">
          <span class="metric-label">Health Score</span>
          <span class="metric-trend" id="health-trend">--</span>
        </div>
        <div class="metric-value" id="health-value">--</div>
        <div class="metric-subtext" id="health-interpretation">Composite inclusion indicator</div>
        <div class="metric-bar">
          <div class="metric-bar-fill health" id="health-bar" style="width: 0%"></div>
        </div>
      </div>
    `;
  }

  // Calculate national aggregates from REAL data
  const totalEnrollments = metricsArray.reduce((sum, m) => sum + (m.total_enrollments || 0), 0);
  const avgSaturation = metricsArray.reduce((sum, m) => sum + (m.saturation_index || 0), 0) / metricsArray.length;
  const totalVelocity = metricsArray.reduce((sum, m) => sum + (m.enrollment_velocity_7d || 0), 0);
  const avgStability = metricsArray.reduce((sum, m) => sum + (m.stability_score || 0), 0) / metricsArray.length;
  const avgHealth = metricsArray.reduce((sum, m) => sum + (m.health_score || 0), 0) / metricsArray.length;

  // Update metric cards with REAL values
  updateMetricCard('saturation', avgSaturation.toFixed(1) + '%', 'stable', avgSaturation);
  updateMetricCard('velocity', formatNumber(totalVelocity) + '/day', getTrendFromValue(totalVelocity, totalVelocity * 0.9));
  updateMetricCard('stability', avgStability.toFixed(0), getStatusFromScore(avgStability), avgStability);
  updateMetricCard('health', avgHealth.toFixed(0), getStatusFromScore(avgHealth), avgHealth);

  // Update states table with REAL data
  updateStatesTable(metricsArray);

  // Update changes panel
  updateChangesPanel(metricsArray);
};

const updateMetricCard = (metric, value, trend, barValue = null) => {
  const valueEl = document.getElementById(`${metric}-value`);
  const trendEl = document.getElementById(`${metric}-trend`);
  const barEl = document.getElementById(`${metric}-bar`);

  if (valueEl) valueEl.textContent = value;

  if (trendEl) {
    trendEl.textContent = getTrendArrow(trend);
    trendEl.className = `metric-trend ${trend}`;
  }

  if (barEl && barValue !== null) {
    barEl.style.width = `${Math.min(100, barValue)}%`;
  }
};

const updateStatesTable = (metrics) => {
  const tbody = document.getElementById('states-tbody');
  if (!tbody) return;

  // Sort by health score
  const sorted = [...metrics].sort((a, b) => (b.health_score || 0) - (a.health_score || 0));

  tbody.innerHTML = sorted.map(m => `
    <tr data-state="${m.state}">
      <td><strong>${m.state}</strong></td>
      <td>${(m.health_score || 0).toFixed(0)}</td>
      <td>${(m.saturation_index || 0).toFixed(1)}%</td>
      <td>${formatNumber(m.enrollment_velocity_7d || 0)}/day</td>
      <td class="trend ${m.trend || 'stable'}">${getTrendArrow(m.trend)}</td>
      <td>
        <div class="status-cell">
          <span class="status-indicator ${getStatusFromScore(m.health_score)}"></span>
          <span>${getStatusLabel(m.health_score)}</span>
        </div>
      </td>
    </tr>
  `).join('');

  // Add click handlers for drill-down
  tbody.querySelectorAll('tr').forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      const state = row.dataset.state;
      selectState(state);
      navigateTo('regional');
    });
  });
};

const updateChangesPanel = (metrics) => {
  const container = document.getElementById('changes-list');
  const countEl = document.getElementById('changes-count');
  if (!container) return;

  // Find significant velocity changes (REAL data)
  const changes = metrics
    .filter(m => {
      if (!m.enrollment_velocity_7d || !m.enrollment_velocity_30d) return false;
      const changePct = Math.abs((m.enrollment_velocity_7d - m.enrollment_velocity_30d) / m.enrollment_velocity_30d);
      return changePct > 0.1;
    })
    .map(m => {
      const change = ((m.enrollment_velocity_7d - m.enrollment_velocity_30d) / m.enrollment_velocity_30d * 100);
      return {
        state: m.state,
        change: change.toFixed(0),
        direction: change > 0 ? 'increased' : 'decreased',
        velocity7d: m.enrollment_velocity_7d,
        velocity30d: m.enrollment_velocity_30d
      };
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  if (countEl) countEl.textContent = changes.length;

  if (changes.length === 0) {
    container.innerHTML = '<div class="empty-state">No significant velocity changes detected</div>';
    return;
  }

  container.innerHTML = changes.map(c => `
    <div class="alert-item ${c.direction === 'increased' ? 'info' : 'warning'}">
      <div class="alert-content-inner">
        <div class="alert-title">${c.state}</div>
        <div class="alert-description">
          Enrollment velocity ${c.direction} by ${Math.abs(c.change)}% 
          (${formatNumber(c.velocity7d)}/day vs ${formatNumber(c.velocity30d)}/day baseline)
        </div>
      </div>
    </div>
  `).join('');
};

// ═══════════════════════════════════════════════════════════════════════════
// ALERTS PANEL
// ═══════════════════════════════════════════════════════════════════════════

const updateAlertsPanel = () => {
  const container = document.getElementById('alerts-list');
  const countEl = document.getElementById('alerts-count');
  if (!container) return;

  const alerts = appState.alerts;

  if (countEl) {
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    countEl.textContent = criticalCount || alerts.length;
    countEl.className = `badge ${criticalCount > 0 ? 'critical' : ''}`;
  }

  if (alerts.length === 0) {
    container.innerHTML = '<div class="empty-state">No active alerts. All indicators within normal ranges.</div>';
    return;
  }

  container.innerHTML = alerts.slice(0, 10).map(alert => `
    <div class="alert-item ${alert.severity}">
      <span class="alert-severity ${alert.severity}">${alert.severity}</span>
      <div class="alert-content-inner">
        <div class="alert-title">${alert.state} — ${alert.indicator}</div>
        <div class="alert-description">${alert.explanation}</div>
      </div>
    </div>
  `).join('');

  // Show banner for critical alerts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  if (criticalAlerts.length > 0) {
    showAlertBanner(`${criticalAlerts.length} critical alert(s) require attention`);
  }
};

const showAlertBanner = (message) => {
  const banner = document.getElementById('alert-banner');
  const content = banner?.querySelector('.alert-content');

  if (banner && content) {
    content.textContent = message;
    banner.classList.remove('hidden');
  }
};

window.dismissAlertBanner = () => {
  const banner = document.getElementById('alert-banner');
  if (banner) banner.classList.add('hidden');
};

// ═══════════════════════════════════════════════════════════════════════════
// INSIGHTS PANEL
// ═══════════════════════════════════════════════════════════════════════════

const updateInsightsPanel = () => {
  const container = document.getElementById('insights-container');
  if (!container) return;

  const insights = appState.insights;

  if (insights.length === 0) {
    container.innerHTML = `
      <div class="empty-state large">
        <div class="placeholder-icon">📊</div>
        <p>No policy insights currently active</p>
        <p class="subtext">Insights are generated when significant patterns are detected</p>
      </div>
    `;
    return;
  }

  container.innerHTML = insights.map(insight => `
    <div class="insight-card" onclick="showInsightDetail('${insight.id}')">
      <div class="insight-header">
        <span class="insight-title">${insight.title}</span>
        <span class="insight-priority ${insight.priority}">${insight.priority}</span>
      </div>
      <p class="insight-description">${insight.description}</p>
      <div class="insight-regions">
        ${(insight.affectedRegions || []).map(r => `<span class="insight-region-tag">${r}</span>`).join('')}
      </div>
    </div>
  `).join('');
};

window.showInsightDetail = (insightId) => {
  const insight = appState.insights.find(i => i.id === insightId);
  if (!insight) return;

  const modal = document.getElementById('insight-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  if (title) title.textContent = insight.title;

  if (body) {
    body.innerHTML = `
      <div class="insight-detail">
        <p><strong>Category:</strong> ${insight.category}</p>
        <p><strong>Priority:</strong> ${insight.priority}</p>
        <h3>Analysis</h3>
        <p>${insight.description}</p>
        <h3>Affected Regions</h3>
        <p>${(insight.affectedRegions || []).join(', ')}</p>
        <h3>Recommended Action</h3>
        <p>${insight.recommendation}</p>
        ${insight.dataPoints ? `
          <h3>Data Points</h3>
          <ul>
            ${Object.entries(insight.dataPoints).map(([k, v]) => `<li><strong>${k}:</strong> ${typeof v === 'number' ? v.toLocaleString() : v}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `;
  }

  if (modal) modal.classList.remove('hidden');
};

window.closeInsightModal = () => {
  const modal = document.getElementById('insight-modal');
  if (modal) modal.classList.add('hidden');
};

// ═══════════════════════════════════════════════════════════════════════════
// REGIONAL PAGE
// ═══════════════════════════════════════════════════════════════════════════

const populateStateSelector = () => {
  const selector = document.getElementById('state-selector');
  if (!selector) return;

  // Will be populated dynamically after data loads
  selector.innerHTML = '<option value="">Select State (loading...)...</option>';

  selector.addEventListener('change', (e) => {
    selectState(e.target.value);
  });
};

const updateStateSelector = () => {
  const selector = document.getElementById('state-selector');
  if (!selector) return;

  const states = Object.keys(appState.metrics).sort();
  selector.innerHTML = '<option value="">Select State...</option>' +
    states.map(s => `<option value="${s}">${s}</option>`).join('');
};

const selectState = (state) => {
  appState.selectedState = state;

  // Update selector if states are loaded
  if (Object.keys(appState.metrics).length > 0) {
    updateStateSelector();
  }

  const selector = document.getElementById('state-selector');
  if (selector) selector.value = state;

  const content = document.getElementById('regional-content');
  const placeholder = document.getElementById('regional-placeholder');

  if (!state) {
    content?.classList.add('hidden');
    placeholder?.classList.remove('hidden');
    return;
  }

  content?.classList.remove('hidden');
  placeholder?.classList.add('hidden');

  updateRegionalContent(state);
};

const updateRegionalContent = (state) => {
  const metrics = appState.metrics[state] || {};
  const population = metrics.population_millions || STATE_POPULATION[state] || 50;

  // State summary
  document.getElementById('selected-state-name').textContent = state;
  document.getElementById('state-population').textContent = `${population}M`;
  document.getElementById('state-enrollments').textContent = formatNumber(metrics.total_enrollments || 0);
  document.getElementById('state-saturation').textContent = (metrics.saturation_index || 0).toFixed(1) + '%';

  // Status
  const statusEl = document.getElementById('selected-state-status');
  if (statusEl) {
    const status = getStatusFromScore(metrics.health_score);
    statusEl.innerHTML = `
      <span class="status-indicator ${status}"></span>
      <span class="status-text">${getStatusLabel(metrics.health_score)}</span>
    `;
  }

  // Indicators (REAL VALUES)
  document.getElementById('regional-velocity').textContent = formatNumber(metrics.enrollment_velocity_7d || 0) + '/day';
  const velocityChange = metrics.enrollment_velocity_30d > 0
    ? ((metrics.enrollment_velocity_7d / metrics.enrollment_velocity_30d - 1) * 100).toFixed(0)
    : 0;
  document.getElementById('regional-velocity-detail').textContent = `${velocityChange}% vs 30-day avg`;

  document.getElementById('regional-volatility').textContent = (metrics.volatility_index || 0).toFixed(0) + '%';
  document.getElementById('regional-volatility-detail').textContent = getVolatilityLabel(metrics.volatility_index);

  document.getElementById('regional-stability').textContent = (metrics.stability_score || 0).toFixed(0);
  document.getElementById('regional-stability-detail').textContent = getStabilityLabel(metrics.stability_score);

  // Migration stress (calculated from demographic data)
  const stressValue = metrics.total_demographic_updates && metrics.total_enrollments
    ? Math.floor((metrics.total_demographic_updates / metrics.total_enrollments) * 1000)
    : 0;
  document.getElementById('regional-stress').textContent = stressValue;
  document.getElementById('regional-stress-detail').textContent = 'Updates per 1000 enrollments';

  // Regional anomalies (REAL alerts)
  const anomalies = appState.alerts.filter(a => a.state === state);
  const anomaliesContainer = document.getElementById('regional-anomalies');
  if (anomaliesContainer) {
    if (anomalies.length === 0) {
      anomaliesContainer.innerHTML = '<div class="empty-state">No anomalies detected in this region</div>';
    } else {
      anomaliesContainer.innerHTML = anomalies.map(a => `
        <div class="alert-item ${a.severity}">
          <span class="alert-severity ${a.severity}">${a.severity}</span>
          <div class="alert-content-inner">
            <div class="alert-title">${a.indicator}</div>
            <div class="alert-description">${a.explanation}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // Suggested actions
  const actionsContainer = document.getElementById('regional-actions');
  if (actionsContainer) {
    const actions = generateSuggestedActions(state, metrics);
    actionsContainer.innerHTML = actions.map(a => `
      <div class="action-item">
        <span class="action-icon">${a.icon}</span>
        <div class="action-content">
          <div class="action-title">${a.title}</div>
          <div class="action-description">${a.description}</div>
        </div>
      </div>
    `).join('');
  }
};

const generateSuggestedActions = (state, metrics) => {
  const actions = [];

  if ((metrics.saturation_index || 0) < 70) {
    actions.push({
      icon: '📋',
      title: 'Expand Enrollment Coverage',
      description: `Current saturation is ${metrics.saturation_index?.toFixed(1)}%. Deploy mobile enrollment camps in underserved districts.`
    });
  }

  if ((metrics.enrollment_velocity_7d || 0) < (metrics.enrollment_velocity_30d || 1) * 0.7) {
    actions.push({
      icon: '⚡',
      title: 'Investigate Velocity Drop',
      description: `7-day velocity (${formatNumber(metrics.enrollment_velocity_7d)}) is below 30-day average. Check enrollment center capacity.`
    });
  }

  if ((metrics.stability_score || 100) < 60) {
    actions.push({
      icon: '🔧',
      title: 'Address Biometric Quality',
      description: `Stability score is ${metrics.stability_score}. Audit capture equipment quality and schedule maintenance.`
    });
  }

  if ((metrics.volatility_index || 0) > 100) {
    actions.push({
      icon: '📊',
      title: 'Reduce Operational Volatility',
      description: `High volatility (${metrics.volatility_index?.toFixed(0)}%). Review staffing consistency and operating hours.`
    });
  }

  if (actions.length === 0) {
    actions.push({
      icon: '✅',
      title: 'Maintain Current Operations',
      description: `All indicators are within acceptable ranges. Total enrollments: ${formatNumber(metrics.total_enrollments)}.`
    });
  }

  return actions;
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(0);
};

const getTrendArrow = (trend) => {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '→';
  }
};

const getTrendFromValue = (current, baseline) => {
  const change = (current - baseline) / baseline;
  if (change > 0.1) return 'up';
  if (change < -0.1) return 'down';
  return 'stable';
};

const getStatusFromScore = (score) => {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'stable';
  if (score >= 40) return 'warning';
  return 'critical';
};

const getStatusLabel = (score) => {
  if (score >= 80) return 'Healthy';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Needs Attention';
  return 'Critical';
};

const getVolatilityLabel = (vol) => {
  if (!vol) return 'No data';
  if (vol < 50) return 'Stable operations';
  if (vol < 100) return 'Moderate variation';
  return 'High irregularity';
};

const getStabilityLabel = (score) => {
  if (!score) return 'No data';
  if (score >= 80) return 'Excellent stability';
  if (score >= 60) return 'Good stability';
  if (score >= 40) return 'Elevated refresh activity';
  return 'High biometric pressure';
};

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM FEATURES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize all premium features after data loads
 */
const initPremiumFeatures = () => {
  console.log('🎨 Initializing Premium Features...');

  // Initialize Theme
  initTheme();

  // Initialize India Map
  initIndiaMap(appState.metrics, (stateName) => {
    selectState(stateName);
    navigateTo('regional');
  });

  // Initialize Charts
  initVelocityChart(appState.metrics);
  initHealthChart(appState.metrics);

  console.log('✅ Premium Features initialized');
};

/**
 * Initialize theme from localStorage
 */
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
};

/**
 * Toggle between light and dark theme
 */
window.toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);

  // Update charts for new theme colors
  if (Object.keys(appState.metrics).length > 0) {
    updateCharts(appState.metrics);
  }
};

/**
 * Update theme toggle icon
 */
const updateThemeIcon = (theme) => {
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }
};

// Sort state tracking
const sortState = {
  column: 'health',
  direction: 'desc'
};

/**
 * Sort table by column with toggle direction
 */
window.sortTable = (column) => {
  // Toggle direction if same column
  if (sortState.column === column) {
    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortState.column = column;
    sortState.direction = 'desc';
  }

  // Update header styling
  document.querySelectorAll('.sortable').forEach(th => {
    th.classList.remove('asc', 'desc');
    const icon = th.querySelector('.sort-icon');
    if (icon) icon.textContent = '↕';

    if (th.dataset.sort === column) {
      th.classList.add(sortState.direction);
      if (icon) icon.textContent = sortState.direction === 'asc' ? '↑' : '↓';
    }
  });

  // Sort metrics and re-render table
  const metricsArray = Object.values(appState.metrics);
  const sorted = [...metricsArray].sort((a, b) => {
    let valA, valB;

    switch (column) {
      case 'state':
        valA = a.state || '';
        valB = b.state || '';
        break;
      case 'health':
        valA = a.health_score || 0;
        valB = b.health_score || 0;
        break;
      case 'saturation':
        valA = a.saturation_index || 0;
        valB = b.saturation_index || 0;
        break;
      case 'velocity':
        valA = a.enrollment_velocity_7d || 0;
        valB = b.enrollment_velocity_7d || 0;
        break;
      case 'status':
        valA = a.health_score || 0;
        valB = b.health_score || 0;
        break;
      default:
        valA = 0;
        valB = 0;
    }

    if (typeof valA === 'string') {
      const cmp = valA.localeCompare(valB);
      return sortState.direction === 'asc' ? cmp : -cmp;
    }

    return sortState.direction === 'asc' ? valA - valB : valB - valA;
  });

  updateStatesTableWithData(sorted);
};

/**
 * Update states table with provided data
 */
const updateStatesTableWithData = (sorted) => {
  const tbody = document.getElementById('states-tbody');
  if (!tbody) return;

  tbody.innerHTML = sorted.map(m => `
    <tr data-state="${m.state}">
      <td><strong>${m.state}</strong></td>
      <td class="${getValueClass(m.health_score)}">${(m.health_score || 0).toFixed(0)}</td>
      <td>${(m.saturation_index || 0).toFixed(1)}%</td>
      <td>${formatNumber(m.enrollment_velocity_7d || 0)}/day</td>
      <td class="trend ${m.trend || 'stable'}">${getTrendArrow(m.trend)}</td>
      <td>
        <div class="status-cell">
          <span class="status-indicator ${getStatusFromScore(m.health_score)}"></span>
          <span>${getStatusLabel(m.health_score)}</span>
        </div>
      </td>
    </tr>
  `).join('');

  // Re-add click handlers
  tbody.querySelectorAll('tr').forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      const state = row.dataset.state;
      selectState(state);
      navigateTo('regional');
    });
  });
};

/**
 * Get CSS class for value coloring
 */
const getValueClass = (score) => {
  if (score >= 70) return 'value-positive';
  if (score >= 40) return 'value-warning';
  return 'value-negative';
};

/**
 * Filter states by search query
 */
window.filterStates = (query) => {
  const tbody = document.getElementById('states-tbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  const q = query.toLowerCase().trim();

  rows.forEach(row => {
    const stateName = row.querySelector('td')?.textContent.toLowerCase() || '';
    row.style.display = stateName.includes(q) ? '' : 'none';
  });
};

/**
 * Filter alerts by severity
 */
window.filterAlerts = (severity) => {
  const container = document.getElementById('alerts-list');
  if (!container) return;

  const alerts = container.querySelectorAll('.alert-item');

  alerts.forEach(alert => {
    if (severity === 'all') {
      alert.style.display = '';
    } else {
      const hasSeverity = alert.classList.contains(severity);
      alert.style.display = hasSeverity ? '' : 'none';
    }
  });

  // Update visible count
  const visibleCount = [...alerts].filter(a => a.style.display !== 'none').length;
  const countEl = document.getElementById('alerts-count');
  if (countEl) countEl.textContent = visibleCount;
};

/**
 * Export dashboard to PDF
 */
window.exportPDF = () => {
  const btn = document.getElementById('export-pdf');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '📄 Generating...';
  }

  try {
    exportDashboardPDF(appState.metrics, appState.alerts, appState.dataSummary);
    console.log('📄 PDF exported successfully');
  } catch (error) {
    console.error('PDF export failed:', error);
    alert('PDF export failed. Please try again.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📄 Export PDF';
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update AI Insights panel with real data
 */
const updateAIInsights = () => {
  const container = document.getElementById('ai-insights-container');
  if (!container) return;

  const insights = generateInsights(appState.metrics, appState.alerts);

  if (insights.length === 0) {
    container.innerHTML = `
      <div class="insight-card info">
        <div class="insight-icon">📊</div>
        <div class="insight-content">
          <div class="insight-title">No insights available</div>
          <div class="insight-description">Waiting for sufficient data to generate insights.</div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = insights.slice(0, 4).map(insight => `
    <div class="insight-card ${insight.priority}">
      <div class="insight-icon">${insight.icon}</div>
      <div class="insight-content">
        <div class="insight-title">${insight.title}</div>
        <div class="insight-description">${insight.description}</div>
      </div>
    </div>
  `).join('');
};

/**
 * Update Predictions panel with 30-day forecasts
 */
const updatePredictions = () => {
  const national = getNationalPrediction(appState.metrics);
  if (!national) return;

  // Update summary stats
  const nationalEl = document.getElementById('pred-national');
  const improvingEl = document.getElementById('pred-improving');
  const decliningEl = document.getElementById('pred-declining');

  if (nationalEl) nationalEl.textContent = national.predictedNationalSaturation.toFixed(1) + '%';
  if (improvingEl) improvingEl.textContent = national.statesImproving;
  if (decliningEl) decliningEl.textContent = national.needsAttention.length;

  // Update prediction list
  const listEl = document.getElementById('prediction-list');
  if (!listEl) return;

  const predictions = generateAllPredictions(appState.metrics, 30).slice(0, 6);

  listEl.innerHTML = predictions.map(p => `
    <div class="prediction-card">
      <div class="state-name">
        ${p.state}
        <span class="trend-arrow ${p.trend}">
          ${p.trend === 'improving' ? '↗' : p.trend === 'declining' ? '↘' : '→'}
        </span>
      </div>
      <div class="prediction-bar">
        <div class="current" style="width: ${p.currentSaturation}%"></div>
        <div class="predicted" style="width: ${p.predictedSaturation}%"></div>
      </div>
      <div class="prediction-values">
        <span>Now: ${p.currentSaturation.toFixed(1)}%</span>
        <span>30d: ${p.predictedSaturation.toFixed(1)}%</span>
      </div>
    </div>
  `).join('');
};

/**
 * Populate comparison dropdowns with state list
 */
const populateComparisonDropdowns = () => {
  const selectA = document.getElementById('compare-state-a');
  const selectB = document.getElementById('compare-state-b');

  if (!selectA || !selectB) return;

  const states = Object.values(appState.metrics)
    .map(m => m.state)
    .sort();

  const options = states.map(s => `<option value="${s}">${s}</option>`).join('');

  selectA.innerHTML = '<option value="">Select State A...</option>' + options;
  selectB.innerHTML = '<option value="">Select State B...</option>' + options;

  // Set default comparison (top 2 states by population)
  if (states.length >= 2) {
    selectA.value = states.find(s => s.includes('Uttar Pradesh')) || states[0];
    selectB.value = states.find(s => s.includes('Maharashtra')) || states[1];
    updateComparison();
  }
};

/**
 * Update comparison result
 */
window.updateComparison = () => {
  const selectA = document.getElementById('compare-state-a');
  const selectB = document.getElementById('compare-state-b');
  const resultEl = document.getElementById('comparison-result');

  if (!selectA || !selectB || !resultEl) return;

  const stateA = appState.metrics[selectA.value];
  const stateB = appState.metrics[selectB.value];

  if (!stateA || !stateB) {
    resultEl.innerHTML = `
      <div class="comparison-result" style="text-align: center; color: var(--color-text-muted);">
        Select two states to compare their performance metrics
      </div>
    `;
    return;
  }

  const comparison = compareStates(stateA, stateB);
  resultEl.innerHTML = renderComparisonUI(comparison);
};

/**
 * Update rankings grid
 */
const updateRankings = () => {
  const rankings = generateRankings(appState.metrics);

  const renderRankingList = (list, valueKey, format) => {
    return list.slice(0, 5).map((item, idx) => `
      <div class="ranking-item">
        <span class="ranking-position">#${idx + 1}</span>
        <span class="ranking-name">${item.state}</span>
        <span class="ranking-value">${format(item[valueKey])}</span>
      </div>
    `).join('');
  };

  const healthEl = document.getElementById('rankings-health');
  const satEl = document.getElementById('rankings-saturation');
  const velEl = document.getElementById('rankings-velocity');

  if (healthEl) healthEl.innerHTML = renderRankingList(rankings.byHealth, 'health_score', v => (v || 0).toFixed(0));
  if (satEl) satEl.innerHTML = renderRankingList(rankings.bySaturation, 'saturation_index', v => (v || 0).toFixed(1) + '%');
  if (velEl) velEl.innerHTML = renderRankingList(rankings.byVelocity, 'enrollment_velocity_7d', v => formatNumber(v || 0) + '/day');
};

/**
 * Initialize all analytics features
 */
const initAdvancedAnalytics = () => {
  console.log('🧠 Initializing Advanced Analytics...');

  updateAIInsights();
  updatePredictions();
  populateComparisonDropdowns();
  updateRankings();

  console.log('✅ Advanced Analytics initialized');
};

// ═══════════════════════════════════════════════════════════════════════════
// START APPLICATION
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', init);

