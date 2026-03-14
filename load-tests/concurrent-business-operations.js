import http from "k6/http";
import { check, sleep } from "k6";

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 499 }));

const gatewayBaseUrl = __ENV.GATEWAY_BASE_URL || __ENV.BASE_URL || "http://gateway-service:8081";
const aiBaseUrl = __ENV.AI_BASE_URL || "http://ai-service:8080";
const loginEmail = __ENV.LOGIN_EMAIL || "";
const loginPassword = __ENV.LOGIN_PASSWORD || "";
const requestPauseSeconds = Number(__ENV.REQUEST_PAUSE_SECONDS || 0.1);
const strictThresholds = (__ENV.STRICT_THRESHOLDS || "false").toLowerCase() === "true";

const commonParams = {
  headers: {
    "Content-Type": "application/json"
  }
};

export const options = {
  scenarios: {
    anonymous_browse: {
      executor: "constant-vus",
      exec: "anonymousBrowse",
      vus: Number(__ENV.BROWSE_VUS || 6),
      duration: __ENV.DURATION || "2m",
      gracefulStop: "5s"
    },
    auth_ops: {
      executor: "constant-vus",
      exec: "authOps",
      vus: Number(__ENV.AUTH_VUS || 8),
      duration: __ENV.DURATION || "2m",
      gracefulStop: "5s"
    },
    task_ops: {
      executor: "constant-vus",
      exec: "taskOps",
      vus: Number(__ENV.TASK_VUS || 8),
      duration: __ENV.DURATION || "2m",
      gracefulStop: "5s"
    },
    shop_ops: {
      executor: "constant-vus",
      exec: "shopOps",
      vus: Number(__ENV.SHOP_VUS || 6),
      duration: __ENV.DURATION || "2m",
      gracefulStop: "5s"
    },
    notification_ops: {
      executor: "constant-vus",
      exec: "notificationOps",
      vus: Number(__ENV.NOTIFICATION_VUS || 6),
      duration: __ENV.DURATION || "2m",
      gracefulStop: "5s"
    },
    ai_ops: {
      executor: "constant-vus",
      exec: "aiOps",
      vus: Number(__ENV.AI_VUS || 4),
      duration: __ENV.DURATION || "2m",
      gracefulStop: "5s"
    }
  },
  thresholds: strictThresholds
    ? {
        http_req_failed: ["rate<0.25"],
        checks: ["rate>0.75"],
        http_req_duration: ["p(95)<3000"]
      }
    : {}
};

function hasCredentials() {
  return Boolean(loginEmail && loginPassword);
}

function loginIfConfigured() {
  if (!hasCredentials()) {
    return false;
  }

  const response = http.post(
    `${gatewayBaseUrl}/api-gateway/auth/login`,
    JSON.stringify({ email: loginEmail, password: loginPassword }),
    {
      ...commonParams,
      tags: {
        test_type: "concurrent_business_operations",
        flow: "concurrent",
        service: "auth-service",
        op: "login"
      }
    }
  );

  return check(response, {
    "login status is 2xx": (r) => r.status >= 200 && r.status < 300
  });
}

function pauseIfNeeded() {
  if (requestPauseSeconds > 0) {
    sleep(requestPauseSeconds);
  }
}

function read(baseUrl, path, op, service, requiresAuth) {
  const response = http.get(`${baseUrl}${path}`, {
    tags: {
      test_type: "concurrent_business_operations",
      flow: "concurrent",
      service,
      op
    }
  });

  if (requiresAuth && hasCredentials()) {
    check(response, {
      [`${op} status is 2xx`]: (r) => r.status >= 200 && r.status < 300
    });
  } else {
    check(response, {
      [`${op} status is not 5xx`]: (r) => r.status < 500
    });
  }

  return response;
}

export function anonymousBrowse() {
  read(gatewayBaseUrl, "/api-gateway/user-service/subscription/tiers", "tiers", "user-service", false);
  pauseIfNeeded();
}

export function authOps() {
  loginIfConfigured();
  read(gatewayBaseUrl, "/api-gateway/user-service/subscription/me", "subscription_me", "auth-service", true);
  pauseIfNeeded();
}

export function taskOps() {
  read(gatewayBaseUrl, "/api-gateway/tasks", "tasks_list", "task-service", true);
  pauseIfNeeded();
}

export function shopOps() {
  read(gatewayBaseUrl, "/api-gateway/shop/products", "shop_products", "shop-service", true);
  read(gatewayBaseUrl, "/api-gateway/shop/orders", "shop_orders", "shop-service", true);
  pauseIfNeeded();
}

export function notificationOps() {
  read(gatewayBaseUrl, "/api-gateway/notifications/unread/count", "notifications_unread_count", "notification-service", true);
  pauseIfNeeded();
}

export function aiOps() {
  read(aiBaseUrl, "/ai-service/health", "health", "ai-service", false);
  pauseIfNeeded();
}
