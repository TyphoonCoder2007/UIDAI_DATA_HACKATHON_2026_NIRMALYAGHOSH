/**
 * AI-Powered Summary Service
 * 
 * Generates natural language insights from real data using rule-based logic
 * No LLM needed - pure algorithmic analysis
 */

/**
 * Generate today's key insights from metrics data
 * @param {Object} metrics - State-wise metrics object
 * @param {Array} alerts - Active alerts array
 * @returns {Array} Array of insight objects
 */
export const generateInsights = (metrics, alerts) => {
    const insights = [];
    const metricsArray = Object.values(metrics);

    if (metricsArray.length === 0) return insights;

    // 1. Find biggest velocity changes
    const velocityChanges = metricsArray
        .filter(m => m.enrollment_velocity_7d && m.enrollment_velocity_30d)
        .map(m => ({
            state: m.state,
            change: ((m.enrollment_velocity_7d - m.enrollment_velocity_30d) / m.enrollment_velocity_30d) * 100,
            velocity7d: m.enrollment_velocity_7d,
            velocity30d: m.enrollment_velocity_30d
        }))
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    // Biggest drop
    const biggestDrop = velocityChanges.find(v => v.change < -15);
    if (biggestDrop) {
        insights.push({
            type: 'velocity_drop',
            priority: 'critical',
            icon: '📉',
            title: `${biggestDrop.state} enrollment dropped ${Math.abs(biggestDrop.change).toFixed(0)}%`,
            description: `7-day velocity (${formatNumber(biggestDrop.velocity7d)}/day) is significantly below 30-day average (${formatNumber(biggestDrop.velocity30d)}/day). Immediate attention required.`,
            state: biggestDrop.state,
            metric: biggestDrop.change
        });
    }

    // Biggest increase
    const biggestIncrease = velocityChanges.find(v => v.change > 20);
    if (biggestIncrease) {
        insights.push({
            type: 'velocity_surge',
            priority: 'positive',
            icon: '📈',
            title: `${biggestIncrease.state} shows ${biggestIncrease.change.toFixed(0)}% velocity increase`,
            description: `Enrollment velocity surged from ${formatNumber(biggestIncrease.velocity30d)}/day to ${formatNumber(biggestIncrease.velocity7d)}/day. Investigate success factors for replication.`,
            state: biggestIncrease.state,
            metric: biggestIncrease.change
        });
    }

    // 2. States nearing saturation (>95%)
    const nearSaturation = metricsArray
        .filter(m => m.saturation_index > 95)
        .sort((a, b) => b.saturation_index - a.saturation_index);

    if (nearSaturation.length > 0) {
        insights.push({
            type: 'saturation_achieved',
            priority: 'positive',
            icon: '🎯',
            title: `${nearSaturation.length} state(s) approaching universal coverage`,
            description: `${nearSaturation.map(s => s.state).join(', ')} have achieved >95% saturation. These can serve as models for other regions.`,
            states: nearSaturation.map(s => s.state),
            metric: nearSaturation[0].saturation_index
        });
    }

    // 3. Critical health scores
    const criticalStates = metricsArray
        .filter(m => m.health_score < 40)
        .sort((a, b) => a.health_score - b.health_score);

    if (criticalStates.length > 0) {
        insights.push({
            type: 'health_critical',
            priority: 'critical',
            icon: '⚠️',
            title: `${criticalStates.length} state(s) in critical condition`,
            description: `${criticalStates.slice(0, 3).map(s => `${s.state} (${s.health_score.toFixed(0)})`).join(', ')} require urgent intervention to improve enrollment infrastructure.`,
            states: criticalStates.map(s => s.state),
            metric: criticalStates[0].health_score
        });
    }

    // 4. Calculate national statistics
    const avgVelocity = metricsArray.reduce((sum, m) => sum + (m.enrollment_velocity_7d || 0), 0) / metricsArray.length;
    const totalEnrollments = metricsArray.reduce((sum, m) => sum + (m.total_enrollments || 0), 0);

    // Velocity outliers (2x above average)
    const outliers = metricsArray.filter(m => m.enrollment_velocity_7d > avgVelocity * 2);
    if (outliers.length > 0) {
        insights.push({
            type: 'high_performers',
            priority: 'info',
            icon: '🌟',
            title: `${outliers.length} states performing 2x above average`,
            description: `${outliers.slice(0, 3).map(s => s.state).join(', ')} are driving enrollment velocity. National average: ${formatNumber(avgVelocity)}/day.`,
            states: outliers.map(s => s.state),
            metric: avgVelocity
        });
    }

    // 5. Daily summary
    insights.push({
        type: 'daily_summary',
        priority: 'info',
        icon: '📊',
        title: 'Daily Operations Summary',
        description: `Monitoring ${metricsArray.length} states with ${formatNumber(totalEnrollments)} total enrollments. ${alerts.filter(a => a.severity === 'critical').length} critical alerts require attention.`,
        metric: totalEnrollments
    });

    return insights;
};

/**
 * Get the most important insight for the header banner
 */
export const getKeyInsight = (metrics, alerts) => {
    const insights = generateInsights(metrics, alerts);

    // Priority order: velocity_drop > health_critical > velocity_surge > others
    const priorityOrder = ['velocity_drop', 'health_critical', 'velocity_surge', 'saturation_achieved'];

    for (const type of priorityOrder) {
        const insight = insights.find(i => i.type === type);
        if (insight) return insight;
    }

    return insights[0] || null;
};

/**
 * Format number for display
 */
const formatNumber = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + ' L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
};

export default { generateInsights, getKeyInsight };
