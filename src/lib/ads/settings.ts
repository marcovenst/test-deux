import fs from "node:fs/promises";
import path from "node:path";

import {
  getAdsConfigFromEnv,
  mergeAdsConfig,
  type AdsConfig,
  type AdsConfigOverrides,
} from "@/lib/ads/config";

const SETTINGS_PATH = path.join(process.cwd(), "data", "ads-settings.json");

async function ensureDataDir() {
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
}

export async function readAdsOverrides(): Promise<AdsConfigOverrides | null> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8");
    return JSON.parse(raw) as AdsConfigOverrides;
  } catch {
    return null;
  }
}

export async function writeAdsOverrides(overrides: AdsConfigOverrides) {
  await ensureDataDir();
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(overrides, null, 2), "utf8");
}

export async function getEffectiveAdsConfig(): Promise<AdsConfig> {
  const envConfig = getAdsConfigFromEnv();
  const overrides = await readAdsOverrides();
  return mergeAdsConfig(envConfig, overrides);
}

