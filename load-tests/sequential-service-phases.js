import http from "k6/http";
import { check, sleep } from "k6";

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 499 }));

const phaseDurationSeconds = Number(__ENV.PHASE_DURATION_SECONDS || 30);
const phaseVus = Number(__ENV.PHASE_VUS || 8);
const requestPauseSeconds = Number(__ENV.REQUEST_PAUSE_SECONDS || 0.05);
const strictThresholds = (__ENV.STRICT_THRESHOLDS || "false").toLowerCase() === "true";

const authBaseUrl = __ENV.AUTH_BASE_URL || "http://auth-service:8080";
const gatewayBaseUrl = __ENV.GATEWAY_BASE_URL || "http://gateway-service:8081";
const taskBaseUrl = __ENV.TASK_BASE_URL || "http://task-service:8080";
const shopBaseUrl = __ENV.SHOP_BASE_URL || "http://shop-service:8080";
const notificationBaseUrl = __ENV.NOTIFICATION_BASE_URL || "http://notification-service:8080";
const aiBaseUrl = __ENV.AI_BASE_URL || "http://ai-service:8080";

const userTiersPath = __ENV.USER_TIERS_PATH || "/api-gateway/user-service/subscription/tiers";

const phases = [
  { id: "auth_phase", exec: "authPhase", service: "auth-service" },
  { id: "user_phase", exec: "userPhase", service: "user-service" },
  { id: "task_phase", exec: "taskPhase", service: "task-service" },
  { id: "shop_phase", exec: "shopPhase", service: "shop-service" },
  { id: "notification_phase", exec: "notificationPhase", service: "notification-service" },
  { id: "ai_phase", exec: "aiPhase", service: "ai-service" }
];

function buildScenarios() {
  const scenarios = {};

  phases.forEach((phase, index) => {
    scenarios[phase.id] = {
      executor: "constant-vus",
      exec: phase.exec,
      vus: phaseVus,
      duration: `${phaseDurationSeconds}s`,
      startTime: `${index * phaseDurationSeconds}s`,
      gracefulStop: "5s"
    };
  });

  return scenarios;
}

export const options = {
  scenarios: buildScenarios(),
  thresholds: strictThresholds
    ? {
        http_req_failed: ["rate<0.1"],
        checks: ["rate>0.9"],
        http_req_duration: ["p(95)<2000"]
      }
    : {}
};

function hit(url, service, endpointTag) {
  const response = http.get(url, {
    tags: {
      test_type: "sequential_service_phases",
      service,
      endpoint: endpointTag
    }
  });

  check(response, {
    "status is not 5xx": (r) => r.status < 500
  });

  // Keep pacing configurable: lower pause -> higher RPS.
  if (requestPauseSeconds > 0) {
    sleep(requestPauseSeconds);
  }
  return response;
}

export function authPhase() {
  hit(`${authBaseUrl}/auth-service/health`, "auth-service", "health");
}

export function userPhase() {
  hit(`${gatewayBaseUrl}${userTiersPath}`, "user-service", "subscription_tiers");
}

export function taskPhase() {
  hit(`${taskBaseUrl}/task-service/health`, "task-service", "health");
}

export function shopPhase() {
  hit(`${shopBaseUrl}/shop-service/health`, "shop-service", "health");
}

export function notificationPhase() {
  hit(`${notificationBaseUrl}/notification-service/health`, "notification-service", "health");
}

export function aiPhase() {
  hit(`${aiBaseUrl}/ai-service/health`, "ai-service", "health");
}
