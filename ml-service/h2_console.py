import time
from fastapi.responses import HTMLResponse
from sqlalchemy import text, inspect
from database import engine, SessionLocal, PredictionRecord

H2_CONSOLE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>H2 Database Console - AuthentiScan</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300b4d8'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z'/></svg>">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        body { background: #0f172a; color: #e2e8f0; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        
        /* Top Navigation / H2 Header */
        header {
            background: #1e293b;
            border-bottom: 1px solid #334155;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 48px;
            flex-shrink: 0;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .h2-badge {
            background: linear-gradient(135deg, #0284c7, #0369a1);
            color: #fff;
            font-weight: 800;
            font-size: 13px;
            padding: 3px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .title { font-size: 14px; font-weight: 600; color: #f8fafc; }
        .conn-info {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: #94a3b8;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 8px #10b981;
        }
        .btn-header {
            background: #334155;
            color: #f1f5f9;
            border: 1px solid #475569;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s;
        }
        .btn-header:hover { background: #475569; }

        /* Main Workspace layout */
        .workspace {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        /* Left Sidebar: Schema Tree & Queries */
        .sidebar {
            width: 280px;
            background: #111827;
            border-right: 1px solid #1f2937;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            flex-shrink: 0;
        }
        .sidebar-section {
            padding: 12px;
            border-bottom: 1px solid #1f2937;
        }
        .sidebar-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 700;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .tree-node {
            padding: 5px 8px;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            color: #d1d5db;
            user-select: none;
        }
        .tree-node:hover { background: #1f2937; color: #38bdf8; }
        .tree-children {
            margin-left: 18px;
            margin-top: 4px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .col-item {
            font-size: 11px;
            color: #9ca3af;
            padding: 3px 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            border-radius: 3px;
        }
        .col-item span.col-name { color: #e5e7eb; font-weight: 500; }
        .col-item span.col-type { color: #38bdf8; font-size: 10px; margin-left: 4px; }
        .query-chip {
            display: block;
            width: 100%;
            text-align: left;
            background: #1f2937;
            border: 1px solid #374151;
            color: #9ca3af;
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            margin-bottom: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: all 0.15s;
        }
        .query-chip:hover {
            background: #374151;
            color: #38bdf8;
            border-color: #0284c7;
        }

        /* Right Main Content */
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #0b0f19;
        }

        /* SQL Editor Section */
        .editor-container {
            padding: 12px 16px;
            background: #0f172a;
            border-bottom: 1px solid #1e293b;
            flex-shrink: 0;
        }
        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .toolbar-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .btn-primary {
            background: #0284c7;
            color: white;
            border: none;
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background 0.15s;
        }
        .btn-primary:hover { background: #0369a1; }
        .btn-secondary {
            background: #1e293b;
            color: #cbd5e1;
            border: 1px solid #334155;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.15s;
        }
        .btn-secondary:hover { background: #334155; color: white; }
        .sql-textarea {
            width: 100%;
            height: 110px;
            background: #020617;
            color: #38bdf8;
            border: 1px solid #334155;
            border-radius: 6px;
            padding: 10px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 13px;
            line-height: 1.5;
            resize: vertical;
            outline: none;
        }
        .sql-textarea:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
        }

        /* Results Section */
        .results-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 12px 16px;
        }
        .results-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
            color: #94a3b8;
        }
        .results-info { font-weight: 500; }
        .table-wrapper {
            flex: 1;
            overflow: auto;
            border: 1px solid #1e293b;
            border-radius: 6px;
            background: #020617;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            text-align: left;
        }
        th {
            background: #1e293b;
            color: #94a3b8;
            font-weight: 600;
            padding: 8px 12px;
            position: sticky;
            top: 0;
            border-bottom: 1px solid #334155;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }
        td {
            padding: 8px 12px;
            border-bottom: 1px solid #1e293b;
            color: #e2e8f0;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            white-space: nowrap;
        }
        tr:hover td { background: #0f172a; }
        
        .badge-real {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 11px;
        }
        .badge-fake {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 11px;
        }

        .alert-error {
            background: #450a0a;
            color: #fca5a5;
            border: 1px solid #991b1b;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #64748b;
            font-size: 13px;
            gap: 8px;
        }
    </style>
</head>
<body>
    <header>
        <div class="logo-section">
            <span class="h2-badge">H2 CONSOLE</span>
            <span class="title">AuthentiScan Database Console</span>
        </div>
        <div class="conn-info">
            <span><span class="status-dot"></span> <b>Connected</b>: <code id="db-type-label">SQLite (deepfake_db.sqlite)</code></span>
            <button class="btn-header" onclick="loadSchema()">Refresh Schema</button>
            <a href="/docs" target="_blank" class="btn-header">API Docs</a>
        </div>
    </header>

    <div class="workspace">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-section">
                <div class="sidebar-title">
                    <span>DATABASE OBJECTS</span>
                    <span id="table-count-badge" style="color: #38bdf8; font-size: 10px;">1 table</span>
                </div>
                <div id="schema-tree">
                    <div class="tree-node" onclick="setQuery('SELECT * FROM predictions ORDER BY id DESC;')">
                        <span>📁</span>
                        <b>PREDICTIONS</b>
                    </div>
                    <div class="tree-children" id="tree-cols">
                        <div class="col-item"><span class="col-name">id</span> <span class="col-type">INTEGER (PK)</span></div>
                        <div class="col-item"><span class="col-name">filename</span> <span class="col-type">VARCHAR(255)</span></div>
                        <div class="col-item"><span class="col-name">fake_probability</span> <span class="col-type">FLOAT</span></div>
                        <div class="col-item"><span class="col-name">prediction</span> <span class="col-type">VARCHAR(10)</span></div>
                        <div class="col-item"><span class="col-name">confidence</span> <span class="col-type">FLOAT</span></div>
                        <div class="col-item"><span class="col-name">created_at</span> <span class="col-type">DATETIME</span></div>
                    </div>
                </div>
            </div>

            <div class="sidebar-section">
                <div class="sidebar-title">SAMPLE SQL QUERIES</div>
                <button class="query-chip" onclick="setQuery('SELECT * FROM predictions ORDER BY id DESC LIMIT 50;')">
                    ▶ SELECT * FROM predictions
                </button>
                <button class="query-chip" onclick="setQuery('SELECT prediction, COUNT(*) as count, ROUND(AVG(confidence)*100, 1) as avg_confidence_pct FROM predictions GROUP BY prediction;')">
                    ▶ Summary: REAL vs FAKE
                </button>
                <button class="query-chip" onclick="setQuery('SELECT * FROM predictions WHERE prediction = \\'FAKE\\' ORDER BY fake_probability DESC;')">
                    ▶ Top Fake Detections
                </button>
                <button class="query-chip" onclick="setQuery('SELECT * FROM predictions WHERE prediction = \\'REAL\\' ORDER BY confidence DESC;')">
                    ▶ Top Real Detections
                </button>
                <button class="query-chip" onclick="setQuery('INSERT INTO predictions (filename, fake_probability, prediction, confidence, created_at) VALUES (\\'test_video.mp4\\', 0.95, \\'FAKE\\', 0.95, CURRENT_TIMESTAMP);')">
                    ▶ INSERT Sample Record
                </button>
                <button class="query-chip" onclick="setQuery('SELECT COUNT(*) as total_scans, MAX(created_at) as latest_scan FROM predictions;')">
                    ▶ Total Scans Count
                </button>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="main-content">
            <!-- SQL Editor -->
            <div class="editor-container">
                <div class="toolbar">
                    <div class="toolbar-left">
                        <button class="btn-primary" onclick="runQuery()">
                            <span>▶</span> Run (Ctrl+Enter)
                        </button>
                        <button class="btn-secondary" onclick="clearQuery()">Clear</button>
                        <button class="btn-secondary" onclick="exportCSV()">Export CSV</button>
                    </div>
                    <span style="font-size: 11px; color: #64748b;">Press <kbd style="background:#1e293b; padding:2px 4px; border-radius:3px;">Ctrl+Enter</kbd> to execute</span>
                </div>
                <textarea id="sql-input" class="sql-textarea" spellcheck="false">SELECT * FROM predictions ORDER BY id DESC;</textarea>
            </div>

            <!-- Query Results -->
            <div class="results-container">
                <div class="results-header">
                    <div id="results-status" class="results-info">Ready to execute SQL query</div>
                    <div id="results-count">0 rows</div>
                </div>

                <div class="table-wrapper" id="table-wrapper">
                    <div class="empty-state" id="empty-state">
                        <span>Click <b>Run</b> or choose a sample query on the left to inspect the database.</span>
                    </div>
                    <table id="data-table" style="display: none;">
                        <thead id="table-head"></thead>
                        <tbody id="table-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentColumns = [];
        let currentRows = [];

        function setQuery(sql) {
            document.getElementById('sql-input').value = sql;
            runQuery();
        }

        function clearQuery() {
            document.getElementById('sql-input').value = '';
            document.getElementById('sql-input').focus();
        }

        document.getElementById('sql-input').addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                runQuery();
            }
        });

        async function loadSchema() {
            try {
                const res = await fetch('/h2-console/schema');
                if (res.ok) {
                    const data = await res.json();
                    if (data.database_url) {
                        document.getElementById('db-type-label').textContent = data.database_url;
                    }
                }
            } catch(e) {
                console.error("Failed to load schema:", e);
            }
        }

        async function runQuery() {
            const sql = document.getElementById('sql-input').value.trim();
            if (!sql) return;

            const statusEl = document.getElementById('results-status');
            const countEl = document.getElementById('results-count');
            const tableEl = document.getElementById('data-table');
            const emptyEl = document.getElementById('empty-state');
            const thead = document.getElementById('table-head');
            const tbody = document.getElementById('table-body');

            statusEl.innerHTML = '<span style="color:#38bdf8;">Executing query...</span>';
            
            try {
                const startTime = performance.now();
                const res = await fetch('/h2-console/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sql })
                });

                const data = await res.json();
                const elapsed = (performance.now() - startTime).toFixed(1);

                if (!res.ok || !data.success) {
                    statusEl.innerHTML = `<span style="color:#f87171;">Query Error (${elapsed} ms)</span>`;
                    countEl.textContent = '0 rows';
                    tableEl.style.display = 'none';
                    emptyEl.style.display = 'block';
                    emptyEl.innerHTML = `<div class="alert-error"><b>Error:</b> ${data.error || 'Execution failed'}</div>`;
                    return;
                }

                currentColumns = data.columns || [];
                currentRows = data.rows || [];

                if (data.affected_rows !== undefined) {
                    statusEl.innerHTML = `<span style="color:#34d399;">Statement executed successfully in ${data.execution_time_ms} ms</span>`;
                    countEl.textContent = `${data.affected_rows} row(s) affected`;
                    tableEl.style.display = 'none';
                    emptyEl.style.display = 'block';
                    emptyEl.innerHTML = `<div style="color:#34d399; font-size: 14px; font-weight:600;">✓ Statement executed successfully. (${data.affected_rows} rows affected)</div>`;
                    return;
                }

                statusEl.innerHTML = `<span style="color:#34d399;">Query executed successfully in ${data.execution_time_ms} ms</span>`;
                countEl.textContent = `${currentRows.length} row(s) returned`;

                if (currentRows.length === 0) {
                    tableEl.style.display = 'none';
                    emptyEl.style.display = 'block';
                    emptyEl.innerHTML = `<span>(0 rows matching query)</span>`;
                    return;
                }

                // Render Table Headers
                thead.innerHTML = '<tr>' + currentColumns.map(col => `<th>${escapeHtml(col)}</th>`).join('') + '</tr>';

                // Render Table Body
                tbody.innerHTML = currentRows.map(row => {
                    return '<tr>' + currentColumns.map(col => {
                        let val = row[col];
                        if (val === null || val === undefined) return '<td style="color:#64748b;">NULL</td>';
                        if (col === 'prediction') {
                            if (val === 'REAL') return `<td><span class="badge-real">REAL</span></td>`;
                            if (val === 'FAKE') return `<td><span class="badge-fake">FAKE</span></td>`;
                        }
                        if (typeof val === 'number') {
                            return `<td style="color:#38bdf8;">${val}</td>`;
                        }
                        return `<td>${escapeHtml(String(val))}</td>`;
                    }).join('') + '</tr>';
                }).join('');

                emptyEl.style.display = 'none';
                tableEl.style.display = 'table';

            } catch (err) {
                statusEl.innerHTML = `<span style="color:#f87171;">Network / Server Error</span>`;
                emptyEl.style.display = 'block';
                tableEl.style.display = 'none';
                emptyEl.innerHTML = `<div class="alert-error">${err.message}</div>`;
            }
        }

        function exportCSV() {
            if (!currentRows || currentRows.length === 0) {
                alert("No data available to export.");
                return;
            }
            const headers = currentColumns.join(",");
            const rows = currentRows.map(row => 
                currentColumns.map(col => {
                    let v = row[col] === null || row[col] === undefined ? "" : String(row[col]);
                    return `"${v.replace(/"/g, '""')}"`;
                }).join(",")
            );
            const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `database_export_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function escapeHtml(text) {
            if (!text) return '';
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Auto execute on page load
        window.addEventListener('DOMContentLoaded', () => {
            loadSchema();
            runQuery();
        });
    </script>
</body>
</html>
"""

def execute_h2_query(sql_statement: str):
    sql_clean = sql_statement.strip()
    if not sql_clean:
        return {"success": False, "error": "Empty SQL statement"}

    # Remove trailing semicolon if single statement
    if sql_clean.endswith(";"):
        sql_clean = sql_clean[:-1].strip()

    start = time.perf_counter()
    session = SessionLocal()
    try:
        is_select = sql_clean.lstrip().upper().startswith(("SELECT", "PRAGMA", "EXPLAIN", "SHOW", "DESCRIBE"))
        
        result = session.execute(text(sql_clean))
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        if is_select:
            columns = list(result.keys())
            rows_raw = result.fetchall()
            rows = []
            for r in rows_raw:
                row_dict = {}
                for idx, col in enumerate(columns):
                    val = r[idx]
                    if hasattr(val, "isoformat"):
                        val = val.strftime("%Y-%m-%d %H:%M:%S")
                    row_dict[col] = val
                rows.append(row_dict)

            return {
                "success": True,
                "columns": columns,
                "rows": rows,
                "row_count": len(rows),
                "execution_time_ms": elapsed_ms
            }
        else:
            session.commit()
            affected = result.rowcount if hasattr(result, "rowcount") and result.rowcount >= 0 else 1
            return {
                "success": True,
                "affected_rows": affected,
                "execution_time_ms": elapsed_ms
            }
    except Exception as e:
        session.rollback()
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        session.close()

def get_h2_schema_info():
    inspector = inspect(engine)
    tables_info = []
    for table_name in inspector.get_table_names():
        columns = []
        for col in inspector.get_columns(table_name):
            columns.append({
                "name": col["name"],
                "type": str(col["type"]),
                "primary_key": bool(col.get("primary_key", False)),
                "nullable": bool(col.get("nullable", True))
            })
        tables_info.append({
            "table": table_name,
            "columns": columns
        })
    return {
        "database_url": str(engine.url),
        "tables": tables_info
    }
