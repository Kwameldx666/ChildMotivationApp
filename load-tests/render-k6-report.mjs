import { readFile, writeFile } from "node:fs/promises";

const inputPath = process.argv[2] ?? "load-tests/summary.json";
const outputPath = process.argv[3] ?? "load-tests/k6-report.html";

function metricValue(metric, key) {
  if (!metric) {
    return 0;
  }

  // k6 summary-export can be either:
  // 1) { metrics: { m: { values: { avg, p(95), ... } } } }
  // 2) { metrics: { m: { avg, p(95), ... } } }
  if (metric.values && Object.prototype.hasOwnProperty.call(metric.values, key)) {
    return metric.values[key];
  }

  if (Object.prototype.hasOwnProperty.call(metric, key)) {
    return metric[key];
  }

  return 0;
}

function toFixedSafe(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return "0";
  }
  return num.toFixed(digits);
}

const raw = await readFile(inputPath, "utf8");
const summary = JSON.parse(raw);
const metrics = summary.metrics ?? {};

const duration = metrics.http_req_duration ?? {};
const checks = metrics.checks ?? {};
const reqs = metrics.http_reqs ?? {};
const failed = metrics.http_req_failed ?? {};

const totalChecks = Number(metricValue(checks, "passes")) + Number(metricValue(checks, "fails"));
const passRate = totalChecks > 0 ? (Number(metricValue(checks, "passes")) / totalChecks) * 100 : 0;

function getFailedRate(metric) {
  const rate = metricValue(metric, "rate");
  if (Number.isFinite(Number(rate)) && Number(rate) > 0) {
    return Number(rate);
  }

  const value = metricValue(metric, "value");
  if (Number.isFinite(Number(value))) {
    return Number(value);
  }

  const passes = Number(metricValue(metric, "passes"));
  const fails = Number(metricValue(metric, "fails"));
  const total = passes + fails;
  if (total > 0) {
    return fails / total;
  }

  return 0;
}

const failedRate = getFailedRate(failed);

function evaluateThreshold(metricName, thresholdExpr) {
  const match = /^(avg|min|max|med|rate|value|count|p\((\d+(?:\.\d+)?)\))\s*(<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)$/.exec(
    thresholdExpr
  );

  if (!match) {
    return null;
  }

  const lhsKey = match[1];
  const op = match[3];
  const rhs = Number(match[4]);
  const metric = metrics[metricName];
  const lhs = Number(metricValue(metric, lhsKey));

  if (!Number.isFinite(lhs)) {
    return null;
  }

  switch (op) {
    case "<":
      return lhs < rhs;
    case "<=":
      return lhs <= rhs;
    case ">":
      return lhs > rhs;
    case ">=":
      return lhs >= rhs;
    default:
      return null;
  }
}

const thresholds = [];
for (const [name, metric] of Object.entries(metrics)) {
  if (!metric?.thresholds) {
    continue;
  }

  for (const [thresholdName, thresholdResult] of Object.entries(metric.thresholds)) {
    const derivedOk = evaluateThreshold(name, thresholdName);
    const rawOk =
      typeof thresholdResult === "boolean"
        ? thresholdResult
        : Boolean(thresholdResult?.ok);

    thresholds.push({
      metric: name,
      threshold: thresholdName,
      ok: derivedOk ?? rawOk
    });
  }
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>k6 Load Test Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg: #0d1117;
      --card: #161b22;
      --ink: #e6edf3;
      --muted: #9da7b3;
      --ok: #2ea043;
      --bad: #f85149;
      --accent: #58a6ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      color: var(--ink);
      background: radial-gradient(1000px 600px at 10% -10%, #1f2a3a, transparent), var(--bg);
      padding: 24px;
    }
    h1 {
      margin-top: 0;
      font-size: 28px;
      letter-spacing: 0.2px;
    }
    .sub { color: var(--muted); margin-bottom: 20px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }
    .card {
      background: linear-gradient(180deg, #1a212c 0%, var(--card) 100%);
      border: 1px solid #2b3442;
      border-radius: 12px;
      padding: 14px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    }
    .label { color: var(--muted); font-size: 12px; margin-bottom: 8px; text-transform: uppercase; }
    .value { font-size: 26px; font-weight: 700; }
    .charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 14px;
      margin-top: 12px;
    }
    canvas {
      width: 100% !important;
      height: 280px !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 14px;
    }
    th, td {
      padding: 10px;
      border-bottom: 1px solid #2b3442;
      text-align: left;
    }
    .ok { color: var(--ok); font-weight: 700; }
    .bad { color: var(--bad); font-weight: 700; }
  </style>
</head>
<body>
  <h1>k6 Load Test Report</h1>
  <div class="sub">Generated from ${inputPath}</div>

  <div class="grid">
    <div class="card"><div class="label">Requests</div><div class="value">${toFixedSafe(metricValue(reqs, "count"), 0)}</div></div>
    <div class="card"><div class="label">Req/s</div><div class="value">${toFixedSafe(metricValue(reqs, "rate"), 2)}</div></div>
    <div class="card"><div class="label">Avg Duration (ms)</div><div class="value">${toFixedSafe(metricValue(duration, "avg"), 2)}</div></div>
    <div class="card"><div class="label">p95 Duration (ms)</div><div class="value">${toFixedSafe(metricValue(duration, "p(95)"), 2)}</div></div>
    <div class="card"><div class="label">Failed Requests (%)</div><div class="value">${toFixedSafe(failedRate * 100, 2)}</div></div>
    <div class="card"><div class="label">Checks Pass Rate (%)</div><div class="value">${toFixedSafe(passRate, 2)}</div></div>
  </div>

  <div class="charts">
    <div class="card">
      <div class="label">Duration Profile</div>
      <canvas id="durationChart"></canvas>
    </div>
    <div class="card">
      <div class="label">Checks</div>
      <canvas id="checksChart"></canvas>
    </div>
  </div>

  <div class="card" style="margin-top:14px;">
    <div class="label">Thresholds</div>
    <table>
      <thead>
        <tr><th>Metric</th><th>Threshold</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${thresholds.length === 0
          ? "<tr><td colspan=\"3\">No thresholds found</td></tr>"
          : thresholds
              .map((t) => `<tr><td>${t.metric}</td><td>${t.threshold}</td><td class=\"${t.ok ? "ok" : "bad"}\">${t.ok ? "PASS" : "FAIL"}</td></tr>`)
              .join("")}
      </tbody>
    </table>
  </div>

  <script>
    new Chart(document.getElementById("durationChart"), {
      type: "bar",
      data: {
        labels: ["avg", "p(90)", "p(95)", "max"],
        datasets: [{
          label: "ms",
          backgroundColor: ["#58a6ff", "#1f6feb", "#2ea043", "#f85149"],
          data: [
            ${toFixedSafe(metricValue(duration, "avg"), 2)},
            ${toFixedSafe(metricValue(duration, "p(90)"), 2)},
            ${toFixedSafe(metricValue(duration, "p(95)"), 2)},
            ${toFixedSafe(metricValue(duration, "max"), 2)}
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    new Chart(document.getElementById("checksChart"), {
      type: "doughnut",
      data: {
        labels: ["Pass", "Fail"],
        datasets: [{
          data: [${toFixedSafe(metricValue(checks, "passes"), 0)}, ${toFixedSafe(metricValue(checks, "fails"), 0)}],
          backgroundColor: ["#2ea043", "#f85149"]
        }]
      },
      options: {
        plugins: { legend: { position: "bottom" } }
      }
    });
  </script>
</body>
</html>`;

await writeFile(outputPath, html, "utf8");
console.log(`k6 HTML report saved to ${outputPath}`);
