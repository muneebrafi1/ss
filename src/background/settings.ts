/**
 * User settings, stored locally and never transmitted.
 */

export interface Settings {
  /** Master switch. When off, nothing is collected on any site. */
  enabled: boolean
  /** Hostnames the user has switched scanning off for. */
  disabledHosts: string[]
  /** Whether the first-run welcome page has been shown. */
  welcomeShown: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  disabledHosts: [],
  welcomeShown: false,
}

const KEY = 'settings'

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(KEY)
  return { ...DEFAULT_SETTINGS, ...(stored[KEY] as Partial<Settings> | undefined) }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch }
  await chrome.storage.local.set({ [KEY]: next })
  return next
}

/**
 * Whether a hostname should be scanned at all.
 *
 * Checked before any injection or request recording, so a disabled site costs
 * nothing rather than being collected and then filtered out.
 */
export function isHostEnabled(settings: Settings, hostname: string): boolean {
  if (!settings.enabled) return false
  return !settings.disabledHosts.includes(hostname)
}

export async function setHostEnabled(hostname: string, enabled: boolean): Promise<Settings> {
  const settings = await getSettings()
  const disabledHosts = settings.disabledHosts.filter((h) => h !== hostname)
  if (!enabled) disabledHosts.push(hostname)
  return saveSettings({ disabledHosts })
}
