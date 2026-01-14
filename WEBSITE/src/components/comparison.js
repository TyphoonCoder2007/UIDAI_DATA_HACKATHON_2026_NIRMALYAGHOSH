/**
 * Comparative Analysis Component
 * 
 * Enables side-by-side state comparison with rankings
 */

/**
 * Compare two states and generate comparison data
 * @param {Object} stateA - First state metrics
 * @param {Object} stateB - Second state metrics
 * @returns {Object} Comparison result
 */
export const compareStates = (stateA, stateB) => {
    if (!stateA || !stateB) return null;

    const metrics = [
        {
            name: 'Health Score',
            key: 'health_score',
            format: (v) => v?.toFixed(0) || '0',
            higherIsBetter: true
        },
        {
            name: 'Saturation Index',
            key: 'saturation_index',
            format: (v) => (v?.toFixed(1) || '0') + '%',
            higherIsBetter: true
        },
        {
            name: 'Enrollment Velocity',
            key: 'enrollment_velocity_7d',
            format: (v) => formatNumber(v || 0) + '/day',
            higherIsBetter: true
        },
        {
            name: 'Total Enrollments',
            key: 'total_enrollments',
            format: (v) => formatNumber(v || 0),
            higherIsBetter: true
        },
        {
            name: 'Biometric Updates',
            key: 'total_biometric_updates',
            format: (v) => formatNumber(v || 0),
            higherIsBetter: false // Lower is better (less need for updates)
        },
        {
            name: 'Stability Score',
            key: 'stability_score',
            format: (v) => v?.toFixed(0) || '0',
            higherIsBetter: true
        }
    ];

    const comparisons = metrics.map(metric => {
        const valA = stateA[metric.key] || 0;
        const valB = stateB[metric.key] || 0;
        const diff = valA - valB;
        const percentDiff = valB !== 0 ? (diff / valB) * 100 : 0;

        let winner = null;
        if (Math.abs(diff) > 0.01) {
            winner = metric.higherIsBetter
                ? (valA > valB ? 'A' : 'B')
                : (valA < valB ? 'A' : 'B');
        }

        return {
            ...metric,
            valueA: valA,
            valueB: valB,
            formattedA: metric.format(valA),
            formattedB: metric.format(valB),
            difference: diff,
            percentDifference: percentDiff,
            winner
        };
    });

    // Calculate overall winner
    const winsA = comparisons.filter(c => c.winner === 'A').length;
    const winsB = comparisons.filter(c => c.winner === 'B').length;

    return {
        stateA: stateA.state,
        stateB: stateB.state,
        comparisons,
        winsA,
        winsB,
        overallWinner: winsA > winsB ? stateA.state : winsB > winsA ? stateB.state : 'Tie',
        summary: generateComparisonSummary(stateA, stateB, comparisons)
    };
};

/**
 * Generate comparison summary text
 */
const generateComparisonSummary = (stateA, stateB, comparisons) => {
    const winsA = comparisons.filter(c => c.winner === 'A').length;
    const winsB = comparisons.filter(c => c.winner === 'B').length;

    if (winsA > winsB) {
        const margin = ((winsA / comparisons.length) * 100).toFixed(0);
        return `${stateA.state} outperforms ${stateB.state} in ${winsA} out of ${comparisons.length} metrics (${margin}% advantage).`;
    } else if (winsB > winsA) {
        const margin = ((winsB / comparisons.length) * 100).toFixed(0);
        return `${stateB.state} outperforms ${stateA.state} in ${winsB} out of ${comparisons.length} metrics (${margin}% advantage).`;
    } else {
        return `${stateA.state} and ${stateB.state} are evenly matched across all metrics.`;
    }
};

/**
 * Generate rankings for all states
 * @param {Object} metricsData - All states metrics
 * @returns {Object} Rankings by different metrics
 */
export const generateRankings = (metricsData) => {
    const states = Object.values(metricsData).filter(m => m.state);

    const rankings = {
        byHealth: [...states].sort((a, b) => (b.health_score || 0) - (a.health_score || 0)),
        bySaturation: [...states].sort((a, b) => (b.saturation_index || 0) - (a.saturation_index || 0)),
        byVelocity: [...states].sort((a, b) => (b.enrollment_velocity_7d || 0) - (a.enrollment_velocity_7d || 0)),
        byEnrollments: [...states].sort((a, b) => (b.total_enrollments || 0) - (a.total_enrollments || 0))
    };

    // Add rank numbers and percentiles
    Object.keys(rankings).forEach(key => {
        rankings[key] = rankings[key].map((state, index) => ({
            ...state,
            rank: index + 1,
            percentile: Math.round(((states.length - index) / states.length) * 100)
        }));
    });

    return rankings;
};

/**
 * Get percentile standings for a specific state
 * @param {string} stateName - Name of state
 * @param {Object} metricsData - All states metrics
 * @returns {Object} Percentile standings
 */
export const getStatePercentiles = (stateName, metricsData) => {
    const rankings = generateRankings(metricsData);

    const getStanding = (rankingList) => {
        const entry = rankingList.find(s => s.state === stateName);
        return entry ? { rank: entry.rank, percentile: entry.percentile, total: rankingList.length } : null;
    };

    return {
        state: stateName,
        health: getStanding(rankings.byHealth),
        saturation: getStanding(rankings.bySaturation),
        velocity: getStanding(rankings.byVelocity),
        enrollments: getStanding(rankings.byEnrollments)
    };
};

/**
 * Render comparison UI
 */
export const renderComparisonUI = (comparison) => {
    if (!comparison) return '';

    return `
        <div class="comparison-result">
            <div class="comparison-header">
                <div class="comparison-state state-a">
                    <h3>${comparison.stateA}</h3>
                    <span class="wins-badge">${comparison.winsA} wins</span>
                </div>
                <div class="comparison-vs">VS</div>
                <div class="comparison-state state-b">
                    <h3>${comparison.stateB}</h3>
                    <span class="wins-badge">${comparison.winsB} wins</span>
                </div>
            </div>
            <div class="comparison-summary">${comparison.summary}</div>
            <div class="comparison-metrics">
                ${comparison.comparisons.map(c => `
                    <div class="comparison-row">
                        <div class="metric-name">${c.name}</div>
                        <div class="metric-value ${c.winner === 'A' ? 'winner' : ''}">${c.formattedA}</div>
                        <div class="metric-diff ${c.winner === 'A' ? 'positive' : c.winner === 'B' ? 'negative' : ''}">
                            ${c.winner === 'A' ? '✓' : c.winner === 'B' ? '✗' : '='}
                        </div>
                        <div class="metric-value ${c.winner === 'B' ? 'winner' : ''}">${c.formattedB}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

/**
 * Format number helper
 */
const formatNumber = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + ' L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
};

export default {
    compareStates,
    generateRankings,
    getStatePercentiles,
    renderComparisonUI
};
