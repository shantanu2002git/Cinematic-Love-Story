import express, {
  type ErrorRequestHandler,
  type Express,
} from "express";
import type { IncomingMessage, ServerResponse } from "node:http";
import cors from "cors";
import { pinoHttp, type ReqId } from "pino-http";
import router from "./routes/index.ts";
import { logger } from "./lib/logger.ts";

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
      req(req: IncomingMessage & { id: ReqId }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
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

const handleError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ message });
};

app.use(handleError);

export default app;
