const APIFY_API = "https://api.apify.com/v2";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDatasetItems(datasetId: string, token: string): Promise<Array<Record<string, unknown>>> {
  const datasetRes = await fetch(
    `${APIFY_API}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(token)}`,
  );
  if (!datasetRes.ok) {
    return [];
  }
  const items = (await datasetRes.json()) as unknown;
  return Array.isArray(items) ? (items as Array<Record<string, unknown>>) : [];
}

/**
 * Run an Apify actor and return dataset rows once the run finishes (sync first, then poll).
 */
export async function runApifyActorForItems(
  actorId: string,
  token: string,
  input: Record<string, unknown>,
  options?: { maxWaitMs?: number; pollIntervalMs?: number; syncTimeoutSec?: number },
): Promise<Array<Record<string, unknown>>> {
  const maxWaitMs = options?.maxWaitMs ?? 120_000;
  const pollIntervalMs = options?.pollIntervalMs ?? 3_000;
  const syncTimeoutSec = options?.syncTimeoutSec ?? 75;
  const actorPath = encodeURIComponent(actorId.trim());

  const syncRes = await fetch(
    `${APIFY_API}/acts/${actorPath}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${syncTimeoutSec}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (syncRes.ok) {
    const items = (await syncRes.json()) as unknown;
    if (Array.isArray(items) && items.length > 0) {
      return items as Array<Record<string, unknown>>;
    }
  }

  const runRes = await fetch(
    `${APIFY_API}/acts/${actorPath}/runs?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!runRes.ok) {
    throw new Error(`Apify run failed (${runRes.status})`);
  }

  const runPayload = (await runRes.json()) as {
    data?: { id?: string; defaultDatasetId?: string; status?: string };
  };
  const runId = runPayload.data?.id;
  const datasetId = runPayload.data?.defaultDatasetId;
  if (!runId || !datasetId) {
    throw new Error("Apify run returned no run/dataset id");
  }

  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const statusRes = await fetch(
      `${APIFY_API}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`,
    );
    if (!statusRes.ok) {
      break;
    }
    const statusPayload = (await statusRes.json()) as {
      data?: { status?: string };
    };
    const status = statusPayload.data?.status;
    if (status === "SUCCEEDED") {
      return fetchDatasetItems(datasetId, token);
    }
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Apify run ${status}`);
    }
    await sleep(pollIntervalMs);
  }

  return [];
}
