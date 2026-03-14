import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 20,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"]
  }
};

const baseUrl = __ENV.BASE_URL || "http://localhost:8085";

export default function () {
  const response = http.get(`${baseUrl}/notification-service/health`);

  check(response, {
    "status is 200": (r) => r.status === 200,
    "body has ok": (r) => r.body.includes("ok")
  });

  sleep(1);
}
