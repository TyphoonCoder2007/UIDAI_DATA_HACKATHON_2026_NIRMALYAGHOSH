/**
 * PDF Export Service
 * 
 * Exports dashboard data to PDF using jsPDF with real metrics
 */

/**
 * Export the current dashboard state to PDF
 */
export const exportDashboardPDF = (metrics, alerts, summary) => {
    if (!window.jspdf) {
        console.error('jsPDF not loaded');
        alert('PDF export library not loaded. Please try again.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-IN');

    // Title
    doc.setFontSize(20);
    doc.setTextColor(26, 26, 46);
    doc.text('Aadhaar Intelligence Platform', 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(108, 117, 125);
    doc.text(`Report Generated: ${dateStr} at ${timeStr}`, 20, 30);

    // Divider
    doc.setDrawColor(233, 236, 239);
    doc.line(20, 35, 190, 35);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 46);
    doc.text('Executive Summary', 20, 45);

    doc.setFontSize(10);
    doc.setTextColor(52, 58, 64);

    let y = 55;
    const metricsArray = Object.values(metrics);

    // Calculate national aggregates
    const totalEnrollments = metricsArray.reduce((sum, m) => sum + (m.total_enrollments || 0), 0);
    const avgSaturation = metricsArray.reduce((sum, m) => sum + (m.saturation_index || 0), 0) / metricsArray.length;
    const totalVelocity = metricsArray.reduce((sum, m) => sum + (m.enrollment_velocity_7d || 0), 0);
    const avgHealth = metricsArray.reduce((sum, m) => sum + (m.health_score || 0), 0) / metricsArray.length;

    const summaryData = [
        `Total States/UTs Monitored: ${metricsArray.length}`,
        `Total Enrollments Processed: ${formatNumber(totalEnrollments)}`,
        `Average Saturation Index: ${avgSaturation.toFixed(1)}%`,
        `Current Enrollment Velocity: ${formatNumber(totalVelocity)}/day`,
        `Average Health Score: ${avgHealth.toFixed(0)}/100`,
        `Active Alerts: ${alerts.length} (${alerts.filter(a => a.severity === 'critical').length} critical)`
    ];

    summaryData.forEach(line => {
        doc.text(`• ${line}`, 25, y);
        y += 8;
    });

    // State-wise Table
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 46);
    doc.text('State-wise Analysis', 20, y);
    y += 10;

    // Table using autoTable plugin
    const tableData = metricsArray
        .sort((a, b) => (b.health_score || 0) - (a.health_score || 0))
        .slice(0, 15)
        .map(m => [
            m.state,
            (m.health_score || 0).toFixed(0),
            (m.saturation_index || 0).toFixed(1) + '%',
            formatNumber(m.enrollment_velocity_7d || 0) + '/day',
            getStatusLabel(m.health_score)
        ]);

    if (doc.autoTable) {
        doc.autoTable({
            startY: y,
            head: [['State', 'Health', 'Saturation', 'Velocity', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [255, 107, 53],
                textColor: 255
            },
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 30, halign: 'center' },
                4: { cellWidth: 25, halign: 'center' }
            }
        });
        y = doc.lastAutoTable.finalY + 15;
    }

    // Alerts Section (new page if needed)
    if (y > 220) {
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(26, 26, 46);
    doc.text('Active Alerts', 20, y);
    y += 10;

    const criticalAlerts = alerts.filter(a => a.severity === 'critical').slice(0, 5);
    if (criticalAlerts.length > 0) {
        doc.setFontSize(9);
        criticalAlerts.forEach(alert => {
            doc.setTextColor(220, 53, 69);
            doc.text(`⚠ ${alert.state}: ${alert.indicator}`, 25, y);
            y += 5;
            doc.setTextColor(108, 117, 125);
            doc.text(`   ${alert.explanation.substring(0, 80)}...`, 25, y);
            y += 8;
        });
    } else {
        doc.setTextColor(40, 167, 69);
        doc.text('No critical alerts. All systems operating normally.', 25, y);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(173, 181, 189);
    doc.text('UIDAI Data Hackathon 2026 | Privacy-First Analytics | No PII Stored', 20, 285);

    // Save
    doc.save(`aadhaar-intelligence-report-${now.toISOString().split('T')[0]}.pdf`);

    return true;
};

const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
};

const getStatusLabel = (score) => {
    if (score >= 70) return 'Healthy';
    if (score >= 40) return 'Warning';
    return 'Critical';
};

export default { exportDashboardPDF };
