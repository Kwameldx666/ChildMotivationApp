import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 20,
  duration: "30s"
};

const baseUrl = __ENV.BASE_URL || "http://localhost:8085";
const healthPath = __ENV.HEALTH_PATH || "/notification-service/health";

export default function () {
  const response = http.get(`${baseUrl}${healthPath}`);

  check(response, {
    "status is 200": (r) => r.status === 200,
    "body has health marker": (r) => {
      const body = (r.body || "").toLowerCase();
      return body.includes("ok") || body.includes("healthy") || body.includes("health");
    }
  });

  sleep(1);
}
