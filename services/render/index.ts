import express from "express";
import { createClient } from "@supabase/supabase-js";
import { renderJob, videosJob, prepJob, imagesJob } from "./render-job.ts";

// Validate required environment variables on startup
const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY", "AUTOMATION_SECRET"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const app = express();
app.use(express.json({ limit: "100mb" }));

const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT_JOBS || 3);
let activeJobs = 0;
const jobQueue: string[] = []; // in-memory queue of job IDs

function isAuthorized(req: express.Request): boolean {
  const secret = process.env.AUTOMATION_SECRET;
  return !!secret && req.headers["x-automation-secret"] === secret;
}

// Process queue: run up to MAX_CONCURRENT jobs
function processQueue() {
  while (activeJobs < MAX_CONCURRENT && jobQueue.length > 0) {
    const jobId = jobQueue.shift()!;
    runPipeline(jobId);
  }
  if (jobQueue.length > 0) {
    console.log(`[queue] ${activeJobs}/${MAX_CONCURRENT} active, ${jobQueue.length} waiting`);
  }
}

async function runPipeline(jobId: string) {
  activeJobs++;
  let title = jobId;

  try {
    const { data: job } = await supabase.from("automation_jobs").select("title").eq("id", jobId).single();
    title = job?.title || jobId;
    console.log(`[pipeline] ${title} starting (${activeJobs}/${MAX_CONCURRENT} slots, ${jobQueue.length} queued)`);

    await prepJob(jobId);
    await imagesJob(jobId);
    await videosJob(jobId);
    await renderJob(jobId);
    console.log(`[pipeline] ${title} COMPLETE ✓`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[pipeline] ${title} failed: ${msg}`);

    const isRetryable = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")
      || msg.includes("503") || msg.includes("502") || msg.includes("unavailable");
    if (isRetryable) {
      console.log(`[pipeline] ${title} → back to queue (retryable)`);
      await supabase.from("automation_jobs").update({
        status: "queued", current_step: null, started_at: null,
        error: null, project_id: null, completed_at: null,
      }).eq("id", jobId);
      jobQueue.push(jobId); // re-add to end of queue
    }
  } finally {
    activeJobs--;
    console.log(`[queue] Slot freed. ${activeJobs}/${MAX_CONCURRENT} active, ${jobQueue.length} waiting`);
    setTimeout(() => processQueue(), 5000);
  }
}

app.get("/health", (_req, res) => res.json({ status: "ok", active: activeJobs, queued: jobQueue.length, max: MAX_CONCURRENT }));

// Receive all job IDs at once — Railway manages queue + concurrency
app.post("/enqueue", async (req, res) => {
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });
  const { jobIds } = req.body;
  if (!jobIds?.length) return res.status(400).json({ error: "jobIds required" });

  // Dedupe: don't add jobs already in queue or running
  const existingSet = new Set(jobQueue);
  let added = 0;
  for (const id of jobIds) {
    if (!existingSet.has(id)) {
      jobQueue.push(id);
      existingSet.add(id);
      added++;
    }
  }

  console.log(`[queue] Received ${jobIds.length} jobs, added ${added} new. Total queue: ${jobQueue.length}`);
  res.json({ added, total: jobQueue.length, active: activeJobs });

  processQueue();
});

// Legacy: single job trigger
app.post("/full-pipeline", async (req, res) => {
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });
  const { jobId } = req.body;
  if (!jobId) return res.status(400).json({ error: "jobId required" });

  jobQueue.push(jobId);
  res.json({ queued: true, position: jobQueue.length, active: activeJobs });
  processQueue();
});

app.post("/videos", async (req, res) => {
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });
  const { jobId } = req.body;
  if (!jobId) return res.status(400).json({ error: "jobId required" });

  res.json({ accepted: true, jobId });

  try {
    await videosJob(jobId);
    console.log(`[videos] Job ${jobId} videos completed, triggering render...`);
    // Chain to render
    await renderJob(jobId);
    console.log(`[render] Job ${jobId} completed`);
  } catch (error) {
    console.error(`[videos+render] Job ${jobId} failed:`, error instanceof Error ? error.message : error);
  }
});

// Backfill: generate thumbnail + short for existing songs
app.post("/backfill", async (req, res) => {
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });
  const { jobId } = req.body;
  if (!jobId) return res.status(400).json({ error: "jobId required" });

  res.json({ accepted: true, jobId });

  try {
    const { backfillJob } = await import("./render-job.ts");
    await backfillJob(jobId);
    console.log(`[backfill] Job ${jobId} completed`);
  } catch (error) {
    console.error(`[backfill] Job ${jobId} failed:`, error instanceof Error ? error.message : error);
  }
});

app.post("/render", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { jobId } = req.body;
  if (!jobId) return res.status(400).json({ error: "jobId required" });

  // Return immediately, process in background
  res.json({ accepted: true, jobId });

  // Process render in background (no timeout!)
  try {
    await renderJob(jobId);
    console.log(`[render] Job ${jobId} completed`);
  } catch (error) {
    console.error(`[render] Job ${jobId} failed:`, error instanceof Error ? error.message : error);
  }
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`Render service running on port ${port}`));

// Graceful shutdown: wait for in-flight jobs before exiting
function gracefulShutdown(signal: string) {
  console.log(`[shutdown] ${signal} received. Active jobs: ${activeJobs}, queued: ${jobQueue.length}`);
  server.close(() => {
    console.log("[shutdown] HTTP server closed. Waiting for active jobs...");
  });

  // Give active jobs up to 60s to finish, then force exit
  const deadline = Date.now() + 60_000;
  const check = setInterval(() => {
    if (activeJobs === 0 || Date.now() > deadline) {
      clearInterval(check);
      if (activeJobs > 0) {
        console.error(`[shutdown] Force exit with ${activeJobs} active jobs`);
      } else {
        console.log("[shutdown] All jobs finished. Exiting cleanly.");
      }
      process.exit(activeJobs > 0 ? 1 : 0);
    }
  }, 1000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
