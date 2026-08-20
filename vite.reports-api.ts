import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { definePublicEnv } from "./vite.env";

/**
 * Local `/api/reports/*` during `vite dev`, and bundled Netlify functions
 * on production build. Keeps report email/cron working without Next.js routes.
 */
export function reportsApiPlugin(root: string, src: string): Plugin {
  return {
    name: "reports-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        void handleDevRequest(server, req, res, next);
      });
    },
    async closeBundle() {
      await bundleNetlifyReportFunctions(root, src);
    },
  };
}

async function handleDevRequest(
  server: ViteDevServer,
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  const pathOnly = (req.url ?? "").split("?")[0] ?? "";
  if (!pathOnly.startsWith("/api/reports/")) {
    next();
    return;
  }

  try {
    const mod = (await server.ssrLoadModule("/src/server/reports-api.ts")) as {
      handleReportsCron: (request: Request) => Promise<Response>;
      handleReportsEmail: (request: Request) => Promise<Response>;
      handleReportsStatus: () => Promise<Response>;
    };
    const request = await toWebRequest(req);
    let response: Response;
    if (pathOnly === "/api/reports/status") {
      response = await mod.handleReportsStatus();
    } else if (pathOnly === "/api/reports/email") {
      response = await mod.handleReportsEmail(request);
    } else if (pathOnly === "/api/reports/cron") {
      response = await mod.handleReportsCron(request);
    } else {
      next();
      return;
    }
    await writeWebResponse(res, response);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: true,
        message: err instanceof Error ? err.message : "Internal error",
      }),
    );
  }
}

async function bundleNetlifyReportFunctions(root: string, src: string) {
  const define = {
    "import.meta.env.MODE": JSON.stringify("production"),
    "import.meta.env.PROD": "true",
    "import.meta.env.DEV": "false",
    ...definePublicEnv(root, "production"),
  };

  const esbuild = await import("esbuild");
  await esbuild.build({
    absWorkingDir: root,
    entryPoints: {
      "reports-email": path.join(src, "server/entries/reports-email.ts"),
      "reports-status": path.join(src, "server/entries/reports-status.ts"),
      "reports-cron": path.join(src, "server/entries/reports-cron.ts"),
    },
    outdir: path.join(root, "netlify/functions"),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    alias: { "@": src },
    define,
    logLevel: "silent",
  });
}

function originFromReq(req: IncomingMessage): string {
  const host = req.headers.host ?? "localhost:5173";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const url = new URL(req.url ?? "/", originFromReq(req));
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  const method = (req.method ?? "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return new Request(url, { method, headers });
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return new Request(url, {
    method,
    headers,
    body: Buffer.concat(chunks),
  });
}

async function writeWebResponse(
  res: ServerResponse,
  response: Response,
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}
