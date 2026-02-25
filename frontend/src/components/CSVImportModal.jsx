import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

/**
 * Reusable CSV Import Modal
 * 
 * Props:
 *   open        – boolean
 *   onClose     – () => void
 *   title       – string (e.g. "Import Students")
 *   templateHeaders – string[] (column headers for the downloadable template)
 *   sampleRow   – string[] (one row of example data)
 *   requiredFields – string[] (headers that MUST have a value)
 *   onImport    – async (rows: Object[]) => { success: number, errors: { row: number, message: string }[] }
 *   entityName  – string ("students" | "teachers" | "classes") for UX labels
 */
const CSVImportModal = ({ open, onClose, title, templateHeaders, sampleRow, requiredFields = [], onImport, entityName = 'records' }) => {
    const [file, setFile] = useState(null);
    const [parsedRows, setParsedRows] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [errors, setErrors] = useState([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef(null);

    const reset = () => {
        setFile(null);
        setParsedRows([]);
        setHeaders([]);
        setErrors([]);
        setImporting(false);
        setResult(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Parse CSV text into rows
    const parseCSV = (text) => {
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return { headers: [], rows: [] };

        // Handle quoted fields properly
        const parseLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') { inQuotes = !inQuotes; continue; }
                if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
                current += ch;
            }
            result.push(current.trim());
            return result;
        };

        const hdrs = parseLine(lines[0]);
        const rows = lines.slice(1).map((line, idx) => {
            const vals = parseLine(line);
            const obj = {};
            hdrs.forEach((h, i) => { obj[h] = vals[i] || ''; });
            obj._rowNum = idx + 2; // 1-indexed, skip header
            return obj;
        });
        return { headers: hdrs, rows };
    };

    // Validate rows against required fields
    const validateRows = (hdrs, rows) => {
        const errs = [];
        // Check that required template headers are present
        const missingHeaders = requiredFields.filter(rf => !hdrs.some(h => h.toLowerCase() === rf.toLowerCase()));
        if (missingHeaders.length > 0) {
            errs.push({ row: 0, message: `Missing required columns: ${missingHeaders.join(', ')}` });
        }
        rows.forEach((row, idx) => {
            requiredFields.forEach(rf => {
                const matchedHeader = hdrs.find(h => h.toLowerCase() === rf.toLowerCase());
                if (matchedHeader && !row[matchedHeader]?.trim()) {
                    errs.push({ row: idx + 2, message: `Row ${idx + 2}: "${rf}" is required` });
                }
            });
        });
        return errs;
    };

    const handleFile = useCallback((f) => {
        if (!f) return;
        if (!f.name.endsWith('.csv')) {
            setErrors([{ row: 0, message: 'Please upload a .csv file' }]);
            return;
        }
        setFile(f);
        setResult(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const { headers: hdrs, rows } = parseCSV(e.target.result);
            setHeaders(hdrs);
            setParsedRows(rows);
            const errs = validateRows(hdrs, rows);
            setErrors(errs);
        };
        reader.readAsText(f);
    }, [requiredFields]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        handleFile(f);
    };

    // Download template
    const downloadTemplate = () => {
        const csvContent = [
            templateHeaders.join(','),
            sampleRow ? sampleRow.join(',') : ''
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entityName}_template.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import
    const handleImport = async () => {
        if (parsedRows.length === 0) return;
        const blockingErrors = errors.filter(e => e.row === 0);
        if (blockingErrors.length > 0) return;
        setImporting(true);
        try {
            const res = await onImport(parsedRows);
            setResult(res);
        } catch (err) {
            setResult({ success: 0, errors: [{ row: 0, message: err.message || 'Import failed' }] });
        } finally {
            setImporting(false);
        }
    };

    if (!open) return null;

    const hasBlockingErrors = errors.some(e => e.row === 0);
    const rowErrors = errors.filter(e => e.row > 0);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                            <p className="text-xs text-gray-500">Upload a CSV file to bulk import {entityName}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Step 1: Template download + file upload */}
                    {!result && (
                        <>
                            <div className="flex items-center gap-3">
                                <button onClick={downloadTemplate}
                                    className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
                                    <Download className="w-4 h-4" /> Download Template
                                </button>
                                <span className="text-xs text-gray-400">Get the correct CSV format with headers & sample data</span>
                            </div>

                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                                    }`}
                            >
                                <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-primary' : 'text-gray-300'}`} />
                                <p className="text-sm font-medium text-gray-700">
                                    {file ? file.name : 'Drop your CSV file here or click to browse'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Supports .csv files only</p>
                                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                            </div>

                            {/* Errors */}
                            {errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-sm font-semibold text-red-700">
                                            {hasBlockingErrors ? 'Cannot import — fix these issues:' : `${rowErrors.length} validation warning(s):`}
                                        </span>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {errors.slice(0, 20).map((err, i) => (
                                            <p key={i} className="text-xs text-red-600">{err.message}</p>
                                        ))}
                                        {errors.length > 20 && <p className="text-xs text-red-400">...and {errors.length - 20} more</p>}
                                    </div>
                                </div>
                            )}

                            {/* Preview table */}
                            {parsedRows.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-bold text-gray-700">{parsedRows.length} row(s) ready to import</h4>
                                        {rowErrors.length > 0 && (
                                            <span className="text-xs text-amber-600 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> Rows with warnings will be skipped
                                            </span>
                                        )}
                                    </div>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto max-h-64">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="py-2 px-3 text-left font-semibold text-gray-500 w-10">#</th>
                                                        {headers.map((h, i) => (
                                                            <th key={i} className="py-2 px-3 text-left font-semibold text-gray-500 whitespace-nowrap">
                                                                {h}
                                                                {requiredFields.some(rf => rf.toLowerCase() === h.toLowerCase()) && (
                                                                    <span className="text-red-400 ml-0.5">*</span>
                                                                )}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {parsedRows.slice(0, 50).map((row, idx) => {
                                                        const rowHasError = errors.some(e => e.row === row._rowNum);
                                                        return (
                                                            <tr key={idx} className={rowHasError ? 'bg-red-50/50' : 'hover:bg-gray-50/50'}>
                                                                <td className="py-1.5 px-3 text-gray-400 font-mono">{row._rowNum}</td>
                                                                {headers.map((h, i) => (
                                                                    <td key={i} className="py-1.5 px-3 text-gray-700 max-w-[200px] truncate">{row[h]}</td>
                                                                ))}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {parsedRows.length > 50 && (
                                            <div className="px-3 py-2 bg-gray-50 text-xs text-gray-400 text-center">
                                                Showing first 50 of {parsedRows.length} rows
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="text-center py-6">
                            {result.success > 0 ? (
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            ) : (
                                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            )}
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Import Complete</h4>
                            <div className="flex items-center justify-center gap-6 mb-4">
                                <div className="text-center">
                                    <p className="text-3xl font-extrabold text-green-600">{result.success}</p>
                                    <p className="text-xs text-gray-500">Imported</p>
                                </div>
                                {result.errors?.length > 0 && (
                                    <div className="text-center">
                                        <p className="text-3xl font-extrabold text-red-500">{result.errors.length}</p>
                                        <p className="text-xs text-gray-500">Failed</p>
                                    </div>
                                )}
                            </div>
                            {result.errors?.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left max-h-40 overflow-y-auto">
                                    {result.errors.map((err, i) => (
                                        <p key={i} className="text-xs text-red-600 mb-1">{err.row ? `Row ${err.row}: ` : ''}{err.message}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex gap-2 shrink-0">
                    {result ? (
                        <button onClick={handleClose} className="flex-1 btn-primary py-2.5">Done</button>
                    ) : (
                        <>
                            <button onClick={handleClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button
                                onClick={handleImport}
                                disabled={parsedRows.length === 0 || importing || hasBlockingErrors}
                                className="flex-1 btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {importing ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                                ) : (
                                    <><Upload className="w-4 h-4" /> Import {parsedRows.length} {entityName}</>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CSVImportModal;
