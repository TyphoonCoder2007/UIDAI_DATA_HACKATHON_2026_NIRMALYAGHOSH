/**
 * Predictive Insights Service
 * 
 * Uses linear regression to predict future saturation and enrollment trends
 * All calculations based on real velocity data
 */

/**
 * Calculate predicted saturation in N days
 * @param {Object} metrics - State metrics object
 * @param {number} days - Number of days to predict (default 30)
 * @returns {Object} Prediction object
 */
export const predictSaturation = (metrics, days = 30) => {
    const currentSaturation = metrics.saturation_index || 0;
    const dailyVelocity = metrics.enrollment_velocity_7d || 0;
    const population = (metrics.population_millions || 50) * 1000000;

    // Calculate daily saturation increase rate
    const dailySaturationIncrease = (dailyVelocity / population) * 100;

    // Linear projection
    const predictedSaturation = Math.min(100, currentSaturation + (dailySaturationIncrease * days));

    // Calculate confidence based on velocity stability
    const velocityRatio = metrics.enrollment_velocity_30d > 0
        ? metrics.enrollment_velocity_7d / metrics.enrollment_velocity_30d
        : 1;
    const confidence = Math.max(0.3, Math.min(0.95, 1 - Math.abs(1 - velocityRatio)));

    // Trend direction
    const trend = dailySaturationIncrease > 0.01 ? 'improving' :
        dailySaturationIncrease < -0.01 ? 'declining' : 'stable';

    return {
        state: metrics.state,
        currentSaturation,
        predictedSaturation,
        change: predictedSaturation - currentSaturation,
        daysToProject: days,
        dailyRate: dailySaturationIncrease,
        confidence,
        trend,
        daysToFullSaturation: dailySaturationIncrease > 0
            ? Math.ceil((100 - currentSaturation) / dailySaturationIncrease)
            : null
    };
};

/**
 * Generate predictions for all states
 * @param {Object} metricsData - All states metrics
 * @param {number} days - Days to predict
 * @returns {Array} Array of predictions sorted by improvement potential
 */
export const generateAllPredictions = (metricsData, days = 30) => {
    const predictions = Object.values(metricsData)
        .filter(m => m.state && m.saturation_index !== undefined)
        .map(m => predictSaturation(m, days))
        .sort((a, b) => b.change - a.change);

    return predictions;
};

/**
 * Get states that will reach target saturation
 * @param {Object} metricsData - All states metrics
 * @param {number} targetSaturation - Target percentage (default 95)
 * @param {number} withinDays - Time window in days
 * @returns {Array} States that will reach target
 */
export const getStatesReachingTarget = (metricsData, targetSaturation = 95, withinDays = 90) => {
    const predictions = Object.values(metricsData)
        .map(m => {
            const pred = predictSaturation(m, withinDays);
            return {
                ...pred,
                willReachTarget: pred.predictedSaturation >= targetSaturation,
                daysToTarget: pred.dailyRate > 0
                    ? Math.ceil((targetSaturation - pred.currentSaturation) / pred.dailyRate)
                    : null
            };
        })
        .filter(p => p.willReachTarget && p.currentSaturation < targetSaturation)
        .sort((a, b) => (a.daysToTarget || Infinity) - (b.daysToTarget || Infinity));

    return predictions;
};

/**
 * Calculate national prediction summary
 * @param {Object} metricsData - All states metrics
 * @returns {Object} National summary
 */
export const getNationalPrediction = (metricsData) => {
    const predictions = generateAllPredictions(metricsData, 30);

    if (predictions.length === 0) return null;

    const avgCurrentSaturation = predictions.reduce((sum, p) => sum + p.currentSaturation, 0) / predictions.length;
    const avgPredictedSaturation = predictions.reduce((sum, p) => sum + p.predictedSaturation, 0) / predictions.length;
    const avgChange = avgPredictedSaturation - avgCurrentSaturation;

    const improving = predictions.filter(p => p.trend === 'improving').length;
    const declining = predictions.filter(p => p.trend === 'declining').length;

    return {
        currentNationalSaturation: avgCurrentSaturation,
        predictedNationalSaturation: avgPredictedSaturation,
        expectedChange: avgChange,
        statesImproving: improving,
        statesDeclining: declining,
        statesStable: predictions.length - improving - declining,
        topImprovers: predictions.slice(0, 5),
        needsAttention: predictions.filter(p => p.change < 0).slice(0, 5)
    };
};

export default {
    predictSaturation,
    generateAllPredictions,
    getStatesReachingTarget,
    getNationalPrediction
};
