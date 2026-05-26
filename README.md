# SQLLab

A client-side web application for learning SQL with real query execution against a sample SQLite database. Uses SQL.js to run SQL entirely in your browser - no backend required.

## Features

- **Real SQL Execution**: Run actual SQL queries against a SQLite database using WebAssembly
- **Syntax Highlighting**: CodeMirror-powered SQL editor with Dracula theme
- **Schema Viewer**: View database table structures and column types
- **Query Hints**: Learn SQL concepts with examples for SELECT, JOIN, WHERE, GROUP BY, and more
- **Query History**: Track your recent queries for easy replay
- **Export Results**: Export query results to CSV format
- **Restore Database**: Reset the database to its original state
- **Dark Mode**: Modern dark theme for comfortable coding
- **No Backend**: Runs entirely in the browser using SQL.js WebAssembly

## Database Schema

The sample database contains four tables:

- **departments**: Company departments (id, name, budget)
- **employees**: Employee information (id, name, email, department_id, salary, hire_date)
- **projects**: Project details (id, name, budget, deadline)
- **employee_projects**: Many-to-many relationship (employee_id, project_id, role)

## Quick Start

Simply open `index.html` in your web browser - no installation required!

For the best experience, serve the project through a local web server:

**Using Python:**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
```

**Using VS Code Live Server:**
Install the "Live Server" extension and click "Go Live"

Then navigate to `http://localhost:8000`

## Usage

1. **Write SQL queries** in the editor
2. **Click "Run Query"** or press `Ctrl+Enter` / `Cmd+Enter` to execute
3. **View results** in the results panel below
4. **Explore the schema** on the right sidebar
5. **Click hint buttons** to learn SQL concepts with examples
6. **Export results** to CSV with the export button

## Example Queries

```sql
-- Select all employees
SELECT * FROM employees;

-- Join employees with departments
SELECT e.name, d.name as department
FROM employees e
JOIN departments d ON e.department_id = d.id;

-- Find employees with salary above average
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Count employees per department
SELECT d.name, COUNT(e.id) as employee_count
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name;

-- Find projects and their assigned employees
SELECT p.name as project, e.name as employee, ep.role
FROM projects p
JOIN employee_projects ep ON p.id = ep.project_id
JOIN employees e ON ep.employee_id = e.id;
```

## Project Structure

```
SQLLab/
├── index.html              # Main HTML page
├── sample.db              # SQLite database file (read-only)
├── static/
│   ├── css/
│   │   └── style.css      # Application styles
│   ├── js/
│   │   └── editor.js      # Editor and query logic
│   └── database/
│       └── sample.db      # Database for web access
├── LICENSE                # MIT License
└── README.md              # This file
```

## Technologies

- **Database Engine**: SQL.js 1.8.0 (SQLite compiled to WebAssembly)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Editor**: CodeMirror 5.65.13
- **Theme**: Dracula

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.