/**
 * India Map Component
 * 
 * Renders an interactive choropleth map of India using Leaflet.js
 * Colors states by health score from real data
 */

let indiaMap = null;
let stateLayer = null;

// India GeoJSON data (simplified state boundaries)
const INDIA_GEOJSON_URL = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson';

/**
 * Initialize the India map
 */
export const initIndiaMap = async (metricsData, onStateClick) => {
    const mapContainer = document.getElementById('india-map');
    if (!mapContainer || !window.L) {
        console.warn('Map container or Leaflet not available');
        return null;
    }

    // Create map centered on India
    indiaMap = L.map('india-map', {
        center: [22.5937, 78.9629], // Center of India
        zoom: 5,
        minZoom: 4,
        maxZoom: 8,
        scrollWheelZoom: true,
        zoomControl: true
    });

    // Add tile layer (subtle gray basemap)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap, &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(indiaMap);

    // Load and render GeoJSON
    try {
        const response = await fetch(INDIA_GEOJSON_URL);
        const geojson = await response.json();
        renderStates(geojson, metricsData, onStateClick);
    } catch (error) {
        console.error('Failed to load India GeoJSON:', error);
        // Fallback: show message
        mapContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: #6c757d;">Map data loading...</div>';
    }

    return indiaMap;
};

/**
 * Get color based on health score using gradient interpolation
 * Returns a color from red (0) to yellow (50) to green (100)
 */
const getColorByHealth = (healthScore) => {
    const score = Math.max(0, Math.min(100, healthScore || 0));

    // Define color stops
    const colors = [
        { stop: 0, color: [220, 53, 69] },    // Red (critical)
        { stop: 30, color: [253, 126, 20] },  // Orange
        { stop: 50, color: [255, 193, 7] },   // Yellow
        { stop: 70, color: [40, 167, 69] },   // Green (healthy)
        { stop: 100, color: [25, 135, 84] }   // Dark green (excellent)
    ];

    // Find the two color stops to interpolate between
    let lower = colors[0];
    let upper = colors[colors.length - 1];

    for (let i = 0; i < colors.length - 1; i++) {
        if (score >= colors[i].stop && score <= colors[i + 1].stop) {
            lower = colors[i];
            upper = colors[i + 1];
            break;
        }
    }

    // Interpolate
    const range = upper.stop - lower.stop;
    const factor = range > 0 ? (score - lower.stop) / range : 0;

    const r = Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * factor);
    const g = Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * factor);
    const b = Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * factor);

    return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Normalize state name for matching
 */
const normalizeForMatch = (name) => {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/&/g, 'and')
        .trim();
};

/**
 * Find metrics for a state (handles name variations)
 */
const findMetricsForState = (stateName, metricsData) => {
    const normalized = normalizeForMatch(stateName);

    // Direct match
    if (metricsData[stateName]) return metricsData[stateName];

    // Try normalized matching
    for (const [key, value] of Object.entries(metricsData)) {
        if (normalizeForMatch(key) === normalized) {
            return value;
        }
    }

    // Partial match for common variations
    const variations = {
        'andaman': 'Andaman and Nicobar Islands',
        'dadra': 'Dadra and Nagar Haveli and Daman and Diu',
        'jammu': 'Jammu and Kashmir',
        'nct': 'Delhi'
    };

    for (const [partial, full] of Object.entries(variations)) {
        if (normalized.includes(partial) && metricsData[full]) {
            return metricsData[full];
        }
    }

    return null;
};

/**
 * Render states on the map
 */
const renderStates = (geojson, metricsData, onStateClick) => {
    if (stateLayer) {
        indiaMap.removeLayer(stateLayer);
    }

    stateLayer = L.geoJSON(geojson, {
        style: (feature) => {
            const stateName = feature.properties.NAME_1 || feature.properties.name || feature.properties.ST_NM;
            const metrics = findMetricsForState(stateName, metricsData);
            const healthScore = metrics?.health_score || 0;

            return {
                fillColor: getColorByHealth(healthScore),
                weight: 1,
                opacity: 1,
                color: '#fff',
                fillOpacity: 0.7
            };
        },
        onEachFeature: (feature, layer) => {
            const stateName = feature.properties.NAME_1 || feature.properties.name || feature.properties.ST_NM;
            const metrics = findMetricsForState(stateName, metricsData);

            // Tooltip with real data
            const tooltipContent = metrics ? `
                <strong>${stateName}</strong><br>
                Health Score: ${(metrics.health_score || 0).toFixed(0)}<br>
                Saturation: ${(metrics.saturation_index || 0).toFixed(1)}%<br>
                Velocity: ${formatNumber(metrics.enrollment_velocity_7d || 0)}/day
            ` : `<strong>${stateName}</strong><br>No data available`;

            layer.bindTooltip(tooltipContent, {
                permanent: false,
                direction: 'auto',
                className: 'state-tooltip'
            });

            // Hover effects
            layer.on({
                mouseover: (e) => {
                    e.target.setStyle({
                        weight: 3,
                        fillOpacity: 0.9
                    });
                },
                mouseout: (e) => {
                    stateLayer.resetStyle(e.target);
                },
                click: () => {
                    if (onStateClick && metrics) {
                        onStateClick(stateName);
                    }
                }
            });
        }
    }).addTo(indiaMap);
};

/**
 * Update map with new data
 */
export const updateIndiaMap = (metricsData, onStateClick) => {
    if (!indiaMap || !stateLayer) return;

    // Re-fetch and render with new data
    fetch(INDIA_GEOJSON_URL)
        .then(res => res.json())
        .then(geojson => renderStates(geojson, metricsData, onStateClick))
        .catch(err => console.error('Failed to update map:', err));
};

/**
 * Format number for display
 */
const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
};

export default { initIndiaMap, updateIndiaMap };
