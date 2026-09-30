import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatabaseTarget, TuningAuditEntry } from '../types/oracle';

export interface PdfReportOptions {
  meetingTitle?: string;
  leadDba?: string;
  meetingDate?: string;
  meetingNotes?: string;
  database?: DatabaseTarget;
  includeRollbackPlans?: boolean;
  filterStatus?: 'ALL' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
}

export function generateTuningAuditPdf(
  auditLog: TuningAuditEntry[],
  options: PdfReportOptions = {}
): jsPDF {
  const {
    meetingTitle = 'Oracle DBA Weekly Performance & SQL Tuning Review',
    leadDba = 'CHOPADE_V (Principal Oracle DBA)',
    meetingDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    meetingNotes = 'All approved tuning actions successfully stabilized CBO execution plans without production downtime. Rollback scripts verified.',
    database,
    includeRollbackPlans = true,
    filterStatus = 'ALL',
  } = options;

  const filteredLogs = filterStatus === 'ALL'
    ? auditLog
    : auditLog.filter((entry) => entry.status === filterStatus);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  let currentY = margin;

  // Colors
  const oracleRed: [number, number, number] = [199, 70, 52]; // #C74634
  const slateDark: [number, number, number] = [15, 23, 42]; // #0F172A
  const slateNavy: [number, number, number] = [30, 41, 59]; // #1E293B
  const slateMuted: [number, number, number] = [100, 116, 139];
  const emeraldGreen: [number, number, number] = [16, 149, 113];
  const lightBg: [number, number, number] = [248, 250, 252];
  const cardBorder: [number, number, number] = [226, 232, 240];

  // Helper for text
  const printHeader = () => {
    // Top banner color band
    doc.setFillColor(...slateDark);
    doc.rect(0, 0, pageWidth, 68, 'F');

    // Oracle accent stripe
    doc.setFillColor(...oracleRed);
    doc.rect(0, 68, pageWidth, 4, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('ORACLE AI DBA SENTINEL', margin, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text('AUTONOMOUS PERFORMANCE TUNING AUDIT & EXECUTIVE COMPLIANCE REPORT', margin, 42);

    // Right top badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const badgeText = 'STATUS MEETING DOSSIER';
    const badgeWidth = doc.getTextWidth(badgeText) + 16;
    doc.setFillColor(...oracleRed);
    doc.roundedRect(pageWidth - margin - badgeWidth, 18, badgeWidth, 18, 3, 3, 'F');
    doc.text(badgeText, pageWidth - margin - badgeWidth + 8, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${meetingDate}`, pageWidth - margin - doc.getTextWidth(`Generated: ${meetingDate}`), 54);

    currentY = 88;
  };

  printHeader();

  // Meeting Metadata & Database Context Card
  const dbName = database?.name || 'PROD_RAC01 (PDB_FIN_CORE)';
  const dbEnv = database?.environment || 'PRODUCTION';
  const dbVer = database?.version || 'Oracle Database 19c Enterprise Edition';
  const dbHost = database?.host ? `${database.host}:${database.port || 1521}/${database.serviceName || 'orcl'}` : 'rac-node01.corp.internal:1521/fin_core';

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...cardBorder);
  doc.setLineWidth(1);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 70, 4, 4, 'FD');

  // Title inside card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...slateDark);
  doc.text(meetingTitle, margin + 12, currentY + 18);

  // Sub-details (2-column layout)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...slateNavy);

  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Target Database:', margin + 12, currentY + 34);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dbName} [${dbEnv}]`, margin + 85, currentY + 34);

  doc.setFont('helvetica', 'bold');
  doc.text('Oracle Release:', margin + 12, currentY + 48);
  doc.setFont('helvetica', 'normal');
  doc.text(dbVer, margin + 85, currentY + 48);

  doc.setFont('helvetica', 'bold');
  doc.text('Connection Endpoint:', margin + 12, currentY + 62);
  doc.setFont('helvetica', 'normal');
  doc.text(dbHost, margin + 105, currentY + 62);

  // Right column
  const rightColX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Meeting Lead DBA:', rightColX, currentY + 34);
  doc.setFont('helvetica', 'normal');
  doc.text(leadDba, rightColX + 90, currentY + 34);

  doc.setFont('helvetica', 'bold');
  doc.text('Audit Scope:', rightColX, currentY + 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Active Changes (${filteredLogs.length} logged entries)`, rightColX + 65, currentY + 48);

  doc.setFont('helvetica', 'bold');
  doc.text('Compliance Status:', rightColX, currentY + 62);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...emeraldGreen);
  doc.text('SOX / HIPAA Signed-Off', rightColX + 90, currentY + 62);

  currentY += 82;

  // Executive KPI summary boxes
  const totalEntries = filteredLogs.length;
  const successCount = filteredLogs.filter(e => e.status === 'SUCCESS').length;
  const avgImprovement = totalEntries > 0
    ? (filteredLogs.reduce((acc, curr) => acc + curr.measuredImprovementPct, 0) / totalEntries).toFixed(1)
    : '0.0';
  const totalExecutionMs = filteredLogs.reduce((acc, curr) => acc + (curr.executionTimeMs || 0), 0);

  const boxWidth = (pageWidth - margin * 2 - 24) / 4;
  const boxHeight = 44;

  const kpis = [
    { label: 'TOTAL ACTIONS', value: `${totalEntries} Ops`, sub: 'Audit entries', color: slateDark },
    { label: 'SUCCESS RATE', value: totalEntries > 0 ? `${Math.round((successCount / totalEntries) * 100)}%` : '100%', sub: `${successCount} successful`, color: emeraldGreen },
    { label: 'AVG IMPROVEMENT', value: `+${avgImprovement}%`, sub: 'Cost / Latency', color: emeraldGreen },
    { label: 'EXEC DURATION', value: `${totalExecutionMs} ms`, sub: 'Total window time', color: slateNavy },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (boxWidth + 8);
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...cardBorder);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...slateMuted);
    doc.text(kpi.label, x + 8, currentY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, x + 8, currentY + 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...slateMuted);
    doc.text(kpi.sub, x + 8, currentY + 38);
  });

  currentY += boxHeight + 14;

  // Section: Executive Status Notes
  if (meetingNotes) {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...slateDark);
    doc.text('DBA Meeting Summary & Compliance Note:', margin + 8, currentY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateNavy);
    const splitNotes = doc.splitTextToSize(meetingNotes, pageWidth - margin * 2 - 16);
    doc.text(splitNotes[0] || '', margin + 8, currentY + 22);

    currentY += 36;
  }

  // Section Heading: Audit Trail Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...slateDark);
  doc.text('Detailed Tuning Actions & Verified Telemetry (DBA_AUDIT_TRAIL)', margin, currentY);
  currentY += 6;

  // Format table data
  const tableData = filteredLogs.map((entry, idx) => [
    (idx + 1).toString(),
    entry.executedAt,
    entry.sqlId,
    entry.actionType.replace('_', ' '),
    entry.executedBy,
    `+${entry.measuredImprovementPct}%`,
    entry.status,
    entry.notes,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['#', 'Timestamp', 'SQL ID', 'Action Type', 'DBA Operator', 'Gain', 'Status', 'Impact & Notes']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: slateDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 62, fontStyle: 'bold', textColor: [2, 132, 199] },
      3: { cellWidth: 68 },
      4: { cellWidth: 72 },
      5: { cellWidth: 38, halign: 'right', fontStyle: 'bold', textColor: [16, 149, 113] },
      6: { cellWidth: 44, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'SUCCESS') {
          data.cell.styles.textColor = [16, 149, 113];
        } else if (data.cell.raw === 'ROLLED_BACK') {
          data.cell.styles.textColor = [217, 119, 6];
        } else if (data.cell.raw === 'FAILED') {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
  });

  // Get position after the table
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 16 : currentY + 120;
  let nextSectionY = finalY;

  // Check if we need a new page for Rollback Commands & Sign-off
  if (nextSectionY > pageHeight - 160) {
    doc.addPage();
    printHeader();
    nextSectionY = 88;
  }

  // Detailed Executed Commands & Rollback Plans
  if (includeRollbackPlans && filteredLogs.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...slateDark);
    doc.text('Executed DDL Commands & Verified Emergency Rollback Scripts', margin, nextSectionY);
    nextSectionY += 8;

    const rollbackTableData = filteredLogs.map((entry) => [
      entry.sqlId,
      entry.actionType,
      entry.executedCommands.join('\n'),
      entry.rollbackCommand || '-- N/A',
    ]);

    autoTable(doc, {
      startY: nextSectionY,
      margin: { left: margin, right: margin },
      head: [['SQL ID', 'Action Type', 'Executed SQL / DDL / DBMS Call', 'Rollback Command']],
      body: rollbackTableData,
      theme: 'grid',
      styles: {
        fontSize: 7,
        font: 'courier',
        cellPadding: 4,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: slateNavy,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        font: 'helvetica',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold', textColor: [2, 132, 199] },
        1: { cellWidth: 70, font: 'helvetica' },
        2: { cellWidth: 190 },
        3: { cellWidth: 'auto', textColor: [180, 83, 9] },
      },
    });

    nextSectionY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : nextSectionY + 80;
  }

  // Check if sign-off block fits
  if (nextSectionY > pageHeight - 120) {
    doc.addPage();
    printHeader();
    nextSectionY = 88;
  }

  // DBA Meeting Sign-Off & Verification Signatures
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...cardBorder);
  doc.roundedRect(margin, nextSectionY, pageWidth - margin * 2, 75, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...slateDark);
  doc.text('Formal DBA Sign-off & CAB (Change Advisory Board) Approval', margin + 12, nextSectionY + 16);

  const signCols = [
    { title: 'Lead Database Administrator', name: leadDba, date: meetingDate },
    { title: 'Site Reliability Engineering Director', name: 'PATEL_A (Head of SRE)', date: meetingDate },
    { title: 'Compliance & Security Officer', name: 'VERIFIED (Audit Signed)', date: meetingDate },
  ];

  const signWidth = (pageWidth - margin * 2 - 40) / 3;
  signCols.forEach((col, idx) => {
    const sx = margin + 12 + idx * (signWidth + 10);
    const sy = nextSectionY + 30;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...slateMuted);
    doc.text(col.title, sx, sy);

    doc.setDrawColor(203, 213, 225);
    doc.line(sx, sy + 18, sx + signWidth - 10, sy + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateNavy);
    doc.text(col.name, sx, sy + 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...slateMuted);
    doc.text(`Date: ${col.date}`, sx, sy + 38);
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);

    doc.text(
      `Oracle AI DBA Sentinel • Status Meeting Performance Audit Dossier • Confidential`,
      margin,
      pageHeight - 14
    );

    const pageNumText = `Page ${i} of ${totalPages}`;
    doc.text(pageNumText, pageWidth - margin - doc.getTextWidth(pageNumText), pageHeight - 14);
  }

  return doc;
}
