// SQL Hints data (embedded for client-side use)
const SQL_HINTS = {
    select: {
        title: 'SELECT Statement',
        description: 'Retrieves data from one or more tables.',
        example: 'SELECT column1, column2 FROM table_name WHERE condition;'
    },
    insert: {
        title: 'INSERT Statement',
        description: 'Adds new rows to a table.',
        example: 'INSERT INTO table_name (column1, column2) VALUES (value1, value2);'
    },
    update: {
        title: 'UPDATE Statement',
        description: 'Modifies existing data in a table.',
        example: 'UPDATE table_name SET column1 = value1 WHERE condition;'
    },
    delete: {
        title: 'DELETE Statement',
        description: 'Removes rows from a table.',
        example: 'DELETE FROM table_name WHERE condition;'
    },
    create: {
        title: 'CREATE TABLE Statement',
        description: 'Creates a new table with specified columns.',
        example: 'CREATE TABLE table_name (id INTEGER PRIMARY KEY, name TEXT);'
    },
    alter: {
        title: 'ALTER TABLE Statement',
        description: 'Modifies the structure of an existing table.',
        example: 'ALTER TABLE table_name ADD COLUMN new_column TEXT;'
    },
    drop: {
        title: 'DROP TABLE Statement',
        description: 'Deletes a table and all its data permanently.',
        example: 'DROP TABLE table_name;'
    },
    join: {
        title: 'JOIN Clause',
        description: 'Combines rows from two or more tables based on related columns.',
        example: 'SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.id;'
    },
    where: {
        title: 'WHERE Clause',
        description: 'Filters records that fulfill a specified condition.',
        example: 'SELECT * FROM table_name WHERE column = value;'
    },
    groupby: {
        title: 'GROUP BY Clause',
        description: 'Groups rows that have the same values into summary rows.',
        example: 'SELECT column, COUNT(*) FROM table_name GROUP BY column;'
    },
    orderby: {
        title: 'ORDER BY Clause',
        description: 'Sorts the result set in ascending or descending order.',
        example: 'SELECT * FROM table_name ORDER BY column DESC;'
    },
    aggregate: {
        title: 'Aggregate Functions',
        description: 'Performs a calculation on a set of values and returns a single value.',
        example: 'SELECT COUNT(*), SUM(column), AVG(column) FROM table_name;'
    },
    having: {
        title: 'HAVING Clause',
        description: 'Filters records after GROUP BY aggregation.',
        example: 'SELECT column, COUNT(*) FROM table_name GROUP BY column HAVING COUNT(*) > 1;'
    },
    subquery: {
        title: 'Subquery',
        description: 'A query nested inside another query.',
        example: 'SELECT * FROM table1 WHERE id IN (SELECT id FROM table2 WHERE condition);'
    },
    distinct: {
        title: 'DISTINCT Keyword',
        description: 'Returns only distinct (different) values.',
        example: 'SELECT DISTINCT column FROM table_name;'
    },
    limit: {
        title: 'LIMIT Clause',
        description: 'Specifies the maximum number of rows to return.',
        example: 'SELECT * FROM table_name LIMIT 10;'
    },
    union: {
        title: 'UNION Operator',
        description: 'Combines the result sets of two or more SELECT statements.',
        example: 'SELECT column FROM table1 UNION SELECT column FROM table2;'
    },
    like: {
        title: 'LIKE Operator',
        description: 'Searches for a specified pattern in a column.',
        example: 'SELECT * FROM table_name WHERE column LIKE \'pattern%\';'
    },
    in: {
        title: 'IN Operator',
        description: 'Allows you to specify multiple values in a WHERE clause.',
        example: 'SELECT * FROM table_name WHERE column IN (value1, value2, value3);'
    },
    between: {
        title: 'BETWEEN Operator',
        description: 'Selects values within a given range.',
        example: 'SELECT * FROM table_name WHERE column BETWEEN value1 AND value2;'
    },
    isnull: {
        title: 'IS NULL Operator',
        description: 'Tests for NULL values.',
        example: 'SELECT * FROM table_name WHERE column IS NULL;'
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    const editor = CodeMirror.fromTextArea(document.getElementById('sqlEditor'), {
        mode: 'text/x-sql',
        theme: 'dracula',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentWithTabs: true,
        smartIndent: true,
        lineWrapping: true,
        extraKeys: {
            'Ctrl-Enter': () => executeQuery(false),
            'Cmd-Enter': () => executeQuery(false)
        }
    });

    const executeBtn = document.getElementById('executeBtn');
    const exportBtn = document.getElementById('exportBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const queryStatus = document.getElementById('queryStatus');
    const resultsContainer = document.getElementById('resultsContainer');
    const schemaViewer = document.getElementById('schemaViewer');
    const hintDisplay = document.getElementById('hintDisplay');
    const hintButtons = document.querySelectorAll('.hint-btn');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    executeBtn.addEventListener('click', () => executeQuery(false));
    exportBtn.addEventListener('click', exportResults);
    restoreBtn.addEventListener('click', restoreDatabase);
    clearHistoryBtn.addEventListener('click', clearHistory);

    let currentResults = {
        columns: [],
        rows: []
    };

    let db = null;
    let initialDbBuffer = null;
    let queryHistory = [];

    try {
        await initializeDatabase();
        loadHistory();
        hintButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const hintId = this.getAttribute('data-hint');
                loadHint(hintId);
            });
        });
    } catch (error) {
        showStatus('Error initializing database: ' + error.message, 'error');
        schemaViewer.innerHTML = `<p class="error-message">Failed to load database: ${error.message}</p>`;
    }

    async function initializeDatabase() {
        showStatus('Loading database...', 'info');

        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        const response = await fetch('/static/database/sample.db');
        const buffer = await response.arrayBuffer();
        initialDbBuffer = new Uint8Array(buffer);

        db = new SQL.Database(initialDbBuffer);
        window.SQL = SQL;

        loadSchema();
        showStatus('Database loaded successfully', 'success');
    }

    function executeQuery(confirmed = false) {
        const query = editor.getValue().trim();

        if (!query) {
            showStatus('Please enter a SQL query', 'error');
            return;
        }

        if (!db) {
            showStatus('Database not initialized', 'error');
            return;
        }

        const upperQuery = query.toUpperCase();
        const dangerousPatterns = ['DROP', 'DELETE', 'UPDATE', 'ALTER', 'INSERT'];
        const isDangerous = dangerousPatterns.some(pattern => upperQuery.includes(pattern));

        if (isDangerous && !confirmed) {
            let operation = 'Query';
            let message = 'This operation will modify or delete data.';
            const details = [];

            if (upperQuery.includes('DROP TABLE')) {
                operation = 'DROP TABLE';
                message = 'This will permanently delete a table and all its data!';
                const tableNameMatch = query.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
                if (tableNameMatch) {
                    details.push(`Table "${tableNameMatch[1]}" will be permanently deleted.`);
                }
            } else if (upperQuery.includes('DELETE')) {
                operation = 'DELETE';
                message = 'This will delete rows from the database!';
                const tableMatch = query.match(/DELETE\s+FROM\s+(\w+)/i);
                if (tableMatch) {
                    details.push(`All rows matching your condition will be deleted from "${tableMatch[1]}".`);
                }
            } else if (upperQuery.includes('UPDATE')) {
                operation = 'UPDATE';
                message = 'This will modify existing data!';
                const tableMatch = query.match(/UPDATE\s+(\w+)/i);
                if (tableMatch) {
                    details.push(`Rows in "${tableMatch[1]}" will be modified.`);
                }
            } else if (upperQuery.includes('INSERT')) {
                operation = 'INSERT';
                message = 'This will add new data to the database!';
                details.push('New rows will be inserted into the table.');
            } else if (upperQuery.includes('ALTER')) {
                operation = 'ALTER TABLE';
                message = 'This will change the database structure!';
                details.push('The table structure will be modified.');
            }

            showConfirmationDialog(operation, message, details);
            showStatus('Confirmation required', 'warning');
            return;
        }

        showStatus('Executing query...', 'success');

        try {
            const results = db.exec(query);

            if (results.length === 0) {
                if (upperQuery.startsWith('SELECT')) {
                    resultsContainer.innerHTML = '<p class="placeholder">No results found</p>';
                    exportBtn.style.display = 'none';
                    showStatus('Query executed, no results returned', 'info');
                } else {
                    resultsContainer.innerHTML = '<p class="success-message">Query executed successfully</p>';
                    showStatus('Query executed successfully', 'success');
                }
            } else {
                const firstResult = results[0];
                const columns = firstResult.columns;
                const rows = [];

                for (let i = 0; i < firstResult.values.length; i++) {
                    const row = {};
                    for (let j = 0; j < columns.length; j++) {
                        row[columns[j]] = firstResult.values[i][j];
                    }
                    rows.push(row);
                }

                displayResults(columns, rows, rows.length);
                showStatus(`Query executed successfully. ${rows.length} rows returned.`, 'success');
            }

            saveToHistory(query);
            loadSchema();
        } catch (error) {
            showStatus(error.message, 'error');
            resultsContainer.innerHTML = `<p class="error-message">${escapeHtml(error.message)}</p>`;
        }
    }

    function showConfirmationDialog(operation, message, details = []) {
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        dialog.innerHTML = `
            <div class="confirmation-content">
                <h3>⚠️ Dangerous Operation</h3>
                <p class="confirmation-message">${escapeHtml(message)}</p>
                ${details.length > 0 ? `
                    <div class="confirmation-details">
                        <h4>What will happen:</h4>
                        <ul>
                            ${details.map(detail => `<li>${escapeHtml(detail)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div class="confirmation-buttons">
                    <button class="btn btn-cancel" id="cancelBtn">Cancel</button>
                    <button class="btn btn-danger" id="confirmBtn">Confirm ${escapeHtml(operation)}</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        document.getElementById('cancelBtn').addEventListener('click', () => {
            dialog.remove();
            showStatus('Operation cancelled', 'info');
        });

        document.getElementById('confirmBtn').addEventListener('click', () => {
            dialog.remove();
            executeQuery(true);
        });
    }

    function showStatus(message, type) {
        queryStatus.textContent = message;
        queryStatus.className = 'query-status ' + type;
        queryStatus.style.display = 'block';

        setTimeout(() => {
            queryStatus.style.display = 'none';
        }, 5000);
    }

    function displayResults(columns, rows, rowCount) {
        if (rows.length === 0) {
            resultsContainer.innerHTML = '<p class="placeholder">No results found</p>';
            exportBtn.style.display = 'none';
            return;
        }

        currentResults = {
            columns: columns,
            rows: rows
        };
        exportBtn.style.display = 'inline-block';

        let html = '<table class="results-table"><thead><tr>';
        columns.forEach(col => {
            html += `<th>${escapeHtml(col)}</th>`;
        });
        html += '</tr></thead><tbody>';

        rows.forEach(row => {
            html += '<tr>';
            columns.forEach(col => {
                html += `<td>${escapeHtml(String(row[col] ?? ''))}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        html += `<p class="row-count">${rowCount} row${rowCount !== 1 ? 's' : ''} returned</p>`;

        resultsContainer.innerHTML = html;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function loadSchema() {
        if (!db) return;

        try {
            const schema = {};

            const tableResults = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name!='sqlite_sequence';");

            if (tableResults.length > 0) {
                const tables = tableResults[0].values.map(row => row[0]);

                tables.forEach(tableName => {
                    const pragmaResults = db.exec(`PRAGMA table_info(${tableName});`);
                    if (pragmaResults.length > 0) {
                        schema[tableName] = pragmaResults[0].values.map(row => ({
                            name: row[1],
                            type: row[2] || 'ANY'
                        }));
                    }
                });
            }

            displaySchema(schema);
        } catch (error) {
            schemaViewer.innerHTML = `<p class="error-message">Error loading schema: ${escapeHtml(error.message)}</p>`;
        }
    }

    function displaySchema(schema) {
        let html = '';

        for (const [tableName, columns] of Object.entries(schema)) {
            html += `<div class="table-schema">
                <div class="table-name table-clickable" data-table="${escapeHtml(tableName)}">${escapeHtml(tableName)}</div>
                <ul class="column-list">`;

            columns.forEach(col => {
                html += `<li>${escapeHtml(col.name)}: ${escapeHtml(col.type)}</li>`;
            });

            html += '</ul></div>';
        }

        schemaViewer.innerHTML = html;

        document.querySelectorAll('.table-clickable').forEach(tableElement => {
            tableElement.addEventListener('click', function() {
                const tableName = this.getAttribute('data-table');
                loadTableData(tableName);
            });
        });
    }

    function loadTableData(tableName) {
        showStatus(`Loading data for ${escapeHtml(tableName)}...`, 'info');

        try {
            const results = db.exec(`SELECT * FROM ${tableName} LIMIT 100;`);

            if (results.length === 0) {
                resultsContainer.innerHTML = '<p class="placeholder">No data found</p>';
                exportBtn.style.display = 'none';
                showStatus(`No data in ${escapeHtml(tableName)}`, 'info');
                return;
            }

            const firstResult = results[0];
            const columns = firstResult.columns;
            const rows = [];

            for (let i = 0; i < firstResult.values.length; i++) {
                const row = {};
                for (let j = 0; j < columns.length; j++) {
                    row[columns[j]] = firstResult.values[i][j];
                }
                rows.push(row);
            }

            displayResults(columns, rows, rows.length);
            editor.setValue(`SELECT * FROM ${tableName} LIMIT 100;`);
            showStatus(`Loaded data from ${escapeHtml(tableName)}`, 'success');
        } catch (error) {
            showStatus('Error loading table data: ' + error.message, 'error');
            resultsContainer.innerHTML = `<p class="error-message">${escapeHtml(error.message)}</p>`;
        }
    }

    function loadHint(hintId) {
        const hint = SQL_HINTS[hintId];
        if (hint) {
            displayHint(hint);
        } else {
            hintDisplay.innerHTML = `<p class="error-message">Hint not found</p>`;
        }
    }

    function displayHint(hint) {
        hintDisplay.innerHTML = `
            <h3>${escapeHtml(hint.title)}</h3>
            <p>${escapeHtml(hint.description)}</p>
            <code>${escapeHtml(hint.example)}</code>
        `;
    }

    function loadHistory() {
        const saved = localStorage.getItem('sqllab_history');
        if (saved) {
            try {
                queryHistory = JSON.parse(saved);
            } catch (e) {
                queryHistory = [];
            }
        }
        displayHistory();
    }

    function saveToHistory(query) {
        queryHistory.unshift(query);
        if (queryHistory.length > 20) {
            queryHistory.pop();
        }
        localStorage.setItem('sqllab_history', JSON.stringify(queryHistory));
        displayHistory();
    }

    function clearHistory() {
        queryHistory = [];
        localStorage.removeItem('sqllab_history');
        displayHistory();
        showStatus('History cleared', 'info');
    }

    function displayHistory() {
        if (queryHistory.length === 0) {
            historyList.innerHTML = '<p class="placeholder">No queries yet</p>';
            return;
        }

        let html = '';
        queryHistory.forEach((query, index) => {
            const displayQuery = query.length > 50 ? query.substring(0, 50) + '...' : query;
            html += `<div class="history-item" data-query="${escapeHtml(query)}">
                <span class="history-query">${escapeHtml(displayQuery)}</span>
            </div>`;
        });

        historyList.innerHTML = html;

        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', function() {
                const query = this.getAttribute('data-query');
                editor.setValue(query);
                showStatus('Query loaded from history', 'info');
            });
        });
    }

    function restoreDatabase() {
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        dialog.innerHTML = `
            <div class="confirmation-content">
                <h3>Restore Database</h3>
                <p class="confirmation-message">This will reset the database to its original state. All your changes will be lost!</p>
                <div class="confirmation-buttons">
                    <button class="btn btn-cancel" id="cancelRestoreBtn">Cancel</button>
                    <button class="btn btn-danger" id="confirmRestoreBtn">Restore</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        document.getElementById('cancelRestoreBtn').addEventListener('click', () => {
            dialog.remove();
            showStatus('Restore cancelled', 'info');
        });

        document.getElementById('confirmRestoreBtn').addEventListener('click', () => {
            showStatus('Restoring database...', 'info');

            try {
                db = new window.SQL.Database(new Uint8Array(initialDbBuffer));
                loadSchema();
                resultsContainer.innerHTML = '<p class="placeholder">Run a query to see results here</p>';
                exportBtn.style.display = 'none';
                dialog.remove();
                showStatus('Database restored successfully', 'success');
            } catch (error) {
                dialog.remove();
                showStatus('Error restoring database: ' + error.message, 'error');
            }
        });
    }

    function exportResults() {
        if (currentResults.columns.length === 0 || currentResults.rows.length === 0) {
            showStatus('No data to export', 'error');
            return;
        }

        showStatus('Exporting results...', 'info');

        try {
            const csvRows = [currentResults.columns.join(',')];
            currentResults.rows.forEach(row => {
                const values = currentResults.columns.map(col => {
                    const value = row[col] ?? '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
                csvRows.push(values.join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `query_results_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showStatus('Export successful', 'success');
        } catch (error) {
            showStatus('Error exporting: ' + error.message, 'error');
        }
    }
});