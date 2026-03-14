import http from "k6/http";
import { check, sleep } from "k6";

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 499 }));

const baseUrl = __ENV.BASE_URL || "http://localhost:8081";
const loginEmail = __ENV.LOGIN_EMAIL || "";
const loginPassword = __ENV.LOGIN_PASSWORD || "";
const strictThresholds = (__ENV.STRICT_THRESHOLDS || "false").toLowerCase() === "true";

const commonParams = {
  headers: {
    "Content-Type": "application/json"
  }
};

export const options = {
  vus: Number(__ENV.VUS || 8),
  duration: __ENV.DURATION || "2m",
  thresholds: strictThresholds
    ? {
        http_req_failed: ["rate<0.25"],
        checks: ["rate>0.75"],
        http_req_duration: ["p(95)<5000"]
      }
    : {}
};

function hasCredentials() {
  return Boolean(loginEmail && loginPassword);
}

function loginIfNeeded() {
  if (!hasCredentials()) {
    return false;
  }

  const response = http.post(
    `${baseUrl}/api-gateway/auth/login`,
    JSON.stringify({ email: loginEmail, password: loginPassword }),
    {
      ...commonParams,
      tags: { flow: "sequential", step: "login" }
    }
  );

  return check(response, {
    "login status is 2xx": (r) => r.status >= 200 && r.status < 300
  });
}

function getWithChecks(path, step, expectAuth) {
  const response = http.get(`${baseUrl}${path}`, {
    tags: { flow: "sequential", step }
  });

  if (expectAuth && hasCredentials()) {
    check(response, {
      [`${step} status is 2xx`]: (r) => r.status >= 200 && r.status < 300
    });
  } else {
    check(response, {
      [`${step} status is not 5xx`]: (r) => r.status < 500
    });
  }

  return response;
}

export default function () {
  // 1) Public catalog/tiers lookup
  getWithChecks("/api-gateway/user-service/subscription/tiers", "subscription_tiers", false);
  sleep(0.2);

  // 2) Authentication (optional via env vars)
  const authenticated = loginIfNeeded();
  sleep(0.2);

  // 3) Sequential business reads through gateway
  getWithChecks("/api-gateway/notifications/unread/count", "notifications_unread_count", true);
  sleep(0.2);

  getWithChecks("/api-gateway/tasks", "tasks_list", true);
  sleep(0.2);

  getWithChecks("/api-gateway/shop/products", "shop_products", true);
  sleep(0.2);

  getWithChecks("/api-gateway/shop/orders", "shop_orders", true);
  sleep(0.2);

  if (authenticated) {
    getWithChecks("/api-gateway/user-service/subscription/me", "subscription_me", true);
    sleep(0.2);
  }

  // 4) End of one strict sequential chain
  sleep(1);
}
