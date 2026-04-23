import pRetry from "p-retry";

import { runClusteringJob } from "@/lib/clustering/cluster";
import { runIngestionPipeline } from "@/lib/ingestion/pipeline";
import { runSummarizationJob } from "@/lib/summarization/claude";
import { computeTrendScores } from "@/lib/trends/score";

type PipelineRunResult = {
  ingestion: Awaited<ReturnType<typeof runIngestionPipeline>>;
  clustering: Awaited<ReturnType<typeof runClusteringJob>>;
  scoringDaily: Awaited<ReturnType<typeof computeTrendScores>>;
  scoringWeekly: Awaited<ReturnType<typeof computeTrendScores>>;
  summarization: Awaited<ReturnType<typeof runSummarizationJob>>;
};

async function withRetry<T>(fn: () => Promise<T>, name: string): Promise<T> {
  return pRetry(fn, {
    retries: 2,
    minTimeout: 1000,
    maxTimeout: 6000,
    factor: 2,
    onFailedAttempt(error) {
      const message =
        error instanceof Error
          ? error.message
          : error.error instanceof Error
            ? error.error.message
            : "unknown error";
      console.warn(`[pipeline:${name}] attempt ${error.attemptNumber} failed: ${message}`);
    },
  });
}

export async function runFullPipeline(): Promise<PipelineRunResult> {
  const ingestion = await withRetry(() => runIngestionPipeline(), "ingestion");
  const clustering = await withRetry(() => runClusteringJob(), "clustering");
  const scoringDaily = await withRetry(() => computeTrendScores("daily"), "scoring-daily");
  const scoringWeekly = await withRetry(() => computeTrendScores("weekly"), "scoring-weekly");
  const summarization = await withRetry(() => runSummarizationJob(), "summarization");

  return {
    ingestion,
    clustering,
    scoringDaily,
    scoringWeekly,
    summarization,
  };
}

