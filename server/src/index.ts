import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import {
  searchFilings,
  fetchSubmissions,
  fetchFormD,
  fetchFundOverview,
  searchIapdFirms,
  type FundOverview,
  type IapdSearchResult,
} from "./edgar.js";

const app = express();
const PORT = Number(process.env.PORT ?? 5174);

app.use(cors());
app.use(express.json());

// Tiny in-memory cache so we don't hammer SEC during demos / hot reloads.
type CacheEntry<T> = { value: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  if (hit && hit.expiresAt > now) return Promise.resolve(hit.value);
  return loader().then((value) => {
    cache.set(key, { value, expiresAt: now + ttlMs });
    return value;
  });
}

const FIVE_MINUTES = 5 * 60 * 1000;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "fund-verification-server", time: new Date().toISOString() });
});

app.get(
  "/api/edgar/search",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = String(req.query.q ?? "");
      if (!q) return res.status(400).json({ error: "Missing query parameter ?q=" });
      const forms = req.query.forms ? String(req.query.forms) : "D";
      const from = req.query.from ? Number(req.query.from) : 0;
      const size = req.query.size ? Number(req.query.size) : 20;
      const key = `search:${q}:${forms}:${from}:${size}`;
      const data = await cached(key, FIVE_MINUTES, () =>
        searchFilings({ q, forms, from, size }),
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

app.get(
  "/api/edgar/submissions/:cik",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cik = String(req.params.cik);
      const key = `submissions:${cik}`;
      const data = await cached(key, FIVE_MINUTES, () => fetchSubmissions(cik));
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

app.get(
  "/api/edgar/form-d",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cik = String(req.query.cik ?? "");
      const accession = String(req.query.accession ?? "");
      if (!cik || !accession) {
        return res
          .status(400)
          .json({ error: "Missing required ?cik= and ?accession=" });
      }
      const key = `form-d:${cik}:${accession}`;
      const data = await cached(key, 24 * 60 * 60 * 1000, () =>
        fetchFormD(cik, accession),
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

app.get(
  "/api/fund/overview",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fund = req.query.fund ? String(req.query.fund) : "";
      const firm = req.query.firm ? String(req.query.firm) : fund;
      if (!fund) {
        return res.status(400).json({
          error: "Missing required ?fund= (legal fund name to search EDGAR)",
        });
      }
      const parseTop = req.query.parseTop ? Number(req.query.parseTop) : 6;
      const key = `fund-overview:${fund}:${firm}:${parseTop}`;
      const data = await cached<FundOverview>(key, FIVE_MINUTES, () =>
        fetchFundOverview(fund, firm, parseTop),
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

app.get(
  "/api/iapd/firm",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query.q ? String(req.query.q) : "";
      if (!q) return res.status(400).json({ error: "Missing required ?q=" });
      const key = `iapd:${q}`;
      const data = await cached<IapdSearchResult>(key, FIVE_MINUTES, () =>
        searchIapdFirms(q),
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

// Generic error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[edgar-proxy]", err);
  res.status(500).json({
    error: err?.message ?? "Unknown server error",
  });
});

app.listen(PORT, () => {
  console.log(`[edgar-proxy] listening on http://localhost:${PORT}`);
});
