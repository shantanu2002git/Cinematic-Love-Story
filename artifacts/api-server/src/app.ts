import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const configuredOrigins = process.env.CORS_ORIGIN
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(
  configuredOrigins?.length
    ? configuredOrigins
    : process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
  }),
);
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ message });
});

export default app;
