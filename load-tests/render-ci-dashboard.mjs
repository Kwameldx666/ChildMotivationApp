import { readFile, writeFile } from "node:fs/promises";

const inputDir = process.argv[2] ?? "artifacts";
const outputPath = process.argv[3] ?? "artifacts/ci-dashboard.html";

async function readJson(path, fallback) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const unitSummary = await readJson(`${inputDir}/unit-tests/summary.json`, []);
const integrationSummary = await readJson(`${inputDir}/integration-tests/summary.json`, []);
const architectureSummary = await readJson(`${inputDir}/architecture-tests/summary.json`, []);
const frontendSummary = await readJson(`${inputDir}/frontend/summary.json`, null);
const k6Summary = await readJson(`${inputDir}/load-tests/summary.json`, null);

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}

const testSuites = [
  ...asArray(unitSummary),
  ...asArray(integrationSummary),
  ...asArray(architectureSummary)
].map((s) => ({
  suite: s.suite,
  total: Number(s.total ?? 0),
  passed: Number(s.passed ?? 0),
  failed: Number(s.failed ?? 0),
  skipped: Number(s.skipped ?? 0)
}));

const totalTests = testSuites.reduce((acc, x) => acc + x.total, 0);
const totalPassed = testSuites.reduce((acc, x) => acc + x.passed, 0);
const totalFailed = testSuites.reduce((acc, x) => acc + x.failed, 0);
const totalSkipped = testSuites.reduce((acc, x) => acc + x.skipped, 0);

function metricValue(metric, key) {
  if (!metric) {
    return 0;
  }

  if (metric.values && Object.prototype.hasOwnProperty.call(metric.values, key)) {
    return Number(metric.values[key]);
  }

  if (Object.prototype.hasOwnProperty.call(metric, key)) {
    return Number(metric[key]);
  }

  return 0;
}

const k6Metrics = k6Summary?.metrics ?? {};
const reqs = k6Metrics.http_reqs ?? null;
const duration = k6Metrics.http_req_duration ?? null;
const checks = k6Metrics.checks ?? null;

const k6Requests = metricValue(reqs, "count");
const k6Rate = metricValue(reqs, "rate");
const k6P95 = metricValue(duration, "p(95)");
const k6Avg = metricValue(duration, "avg");
const k6ChecksPass = metricValue(checks, "passes");
const k6ChecksFail = metricValue(checks, "fails");

const lintErrors = Number(frontendSummary?.lintErrors ?? 0);
const lintWarnings = Number(frontendSummary?.lintWarnings ?? 0);
const frontendTests = Number(frontendSummary?.nodeTestPassed ?? 0);

function fix(v, d = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) {
    return "0";
  }
  return n.toFixed(d);
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CI Quality Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg: #f7f8fb;
      --ink: #101828;
      --muted: #475467;
      --card: #ffffff;
      --line: #e4e7ec;
      --ok: #16a34a;
      --warn: #f59e0b;
      --bad: #dc2626;
      --blue: #2563eb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Inter", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(1200px 500px at 10% -20%, #dbeafe 0, transparent 60%),
        radial-gradient(900px 400px at 100% 0, #fee2e2 0, transparent 55%),
        var(--bg);
      padding: 24px;
    }
    h1 {
      margin: 0;
      font-size: 30px;
      letter-spacing: 0.2px;
    }
    .sub {
      color: var(--muted);
      margin: 8px 0 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 8px 26px rgba(16, 24, 40, 0.08);
    }
    .label {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .value {
      font-size: 30px;
      font-weight: 700;
    }
    .charts {
      margin-top: 14px;
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }
    .panel-title {
      margin: 0 0 8px;
      font-size: 14px;
      color: var(--muted);
      text-transform: uppercase;
    }
    canvas {
      width: 100% !important;
      height: 300px !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 14px;
    }
    th, td {
      text-align: left;
      padding: 9px;
      border-bottom: 1px solid var(--line);
    }
  </style>
</head>
<body>
  <h1>CI Quality Dashboard</h1>
  <div class="sub">Auto-generated from CI artifacts</div>

  <div class="grid">
    <div class="card"><div class="label">Total Tests</div><div class="value">${fix(totalTests, 0)}</div></div>
    <div class="card"><div class="label">Passed</div><div class="value" style="color:var(--ok)">${fix(totalPassed, 0)}</div></div>
    <div class="card"><div class="label">Failed</div><div class="value" style="color:var(--bad)">${fix(totalFailed, 0)}</div></div>
    <div class="card"><div class="label">Frontend Lint Errors</div><div class="value" style="color:${lintErrors > 0 ? "var(--bad)" : "var(--ok)"}">${fix(lintErrors, 0)}</div></div>
    <div class="card"><div class="label">k6 Requests</div><div class="value">${fix(k6Requests, 0)}</div></div>
    <div class="card"><div class="label">k6 p95 (ms)</div><div class="value">${fix(k6P95, 2)}</div></div>
  </div>

  <div class="charts">
    <div class="card">
      <h3 class="panel-title">Test Suites</h3>
      <canvas id="testsBar"></canvas>
    </div>
    <div class="card">
      <h3 class="panel-title">Test Outcomes</h3>
      <canvas id="testsPie"></canvas>
    </div>
    <div class="card">
      <h3 class="panel-title">Frontend Quality</h3>
      <canvas id="frontendBar"></canvas>
    </div>
    <div class="card">
      <h3 class="panel-title">Load Test Snapshot</h3>
      <canvas id="k6Bar"></canvas>
    </div>
  </div>

  <div class="card" style="margin-top:14px;">
    <h3 class="panel-title">Suite Table</h3>
    <table>
      <thead>
        <tr><th>Suite</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th></tr>
      </thead>
      <tbody>
        ${testSuites.length === 0
          ? "<tr><td colspan=\"5\">No suite summaries found</td></tr>"
          : testSuites
              .map((s) => `<tr><td>${s.suite}</td><td>${s.total}</td><td>${s.passed}</td><td>${s.failed}</td><td>${s.skipped}</td></tr>`)
              .join("")}
      </tbody>
    </table>
  </div>

  <script>
    const suiteLabels = ${JSON.stringify(testSuites.map((x) => x.suite))};
    const suitePassed = ${JSON.stringify(testSuites.map((x) => x.passed))};
    const suiteFailed = ${JSON.stringify(testSuites.map((x) => x.failed))};

    new Chart(document.getElementById("testsBar"), {
      type: "bar",
      data: {
        labels: suiteLabels,
        datasets: [
          { label: "Passed", data: suitePassed, backgroundColor: "#16a34a" },
          { label: "Failed", data: suiteFailed, backgroundColor: "#dc2626" }
        ]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });

    new Chart(document.getElementById("testsPie"), {
      type: "doughnut",
      data: {
        labels: ["Passed", "Failed", "Skipped"],
        datasets: [{
          data: [${fix(totalPassed, 0)}, ${fix(totalFailed, 0)}, ${fix(totalSkipped, 0)}],
          backgroundColor: ["#16a34a", "#dc2626", "#94a3b8"]
        }]
      },
      options: { plugins: { legend: { position: "bottom" } } }
    });

    new Chart(document.getElementById("frontendBar"), {
      type: "bar",
      data: {
        labels: ["Lint Errors", "Lint Warnings", "Node Tests Passed"],
        datasets: [{
          data: [${fix(lintErrors, 0)}, ${fix(lintWarnings, 0)}, ${fix(frontendTests, 0)}],
          backgroundColor: ["#dc2626", "#f59e0b", "#2563eb"]
        }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById("k6Bar"), {
      type: "bar",
      data: {
        labels: ["Requests", "Req/s", "Avg ms", "p95 ms", "Checks Pass", "Checks Fail"],
        datasets: [{
          data: [${fix(k6Requests, 2)}, ${fix(k6Rate, 2)}, ${fix(k6Avg, 2)}, ${fix(k6P95, 2)}, ${fix(k6ChecksPass, 0)}, ${fix(k6ChecksFail, 0)}],
          backgroundColor: ["#2563eb", "#0ea5e9", "#22c55e", "#10b981", "#16a34a", "#dc2626"]
        }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  </script>
</body>
</html>`;

await writeFile(outputPath, html, "utf8");
console.log(`CI dashboard saved to ${outputPath}`);
