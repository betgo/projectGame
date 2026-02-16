export const INSPECTOR_SPEED_MIN = 0.5;
export const INSPECTOR_SPEED_MAX = 8;
export const INSPECTOR_SPEED_STEP = 0.5;
export const INSPECTOR_MAP_SIZE_MIN = 4;
export const INSPECTOR_MAP_SIZE_MAX = 48;

export type MapAxis = "width" | "height";

export type NumericDraftCommit = {
  value: number;
  blocked: boolean;
  message: string | null;
};

function toFiniteNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function parseDraftNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isStepAligned(value: number, min: number, step: number): boolean {
  const steps = (value - min) / step;
  return Math.abs(steps - Math.round(steps)) < 1e-6;
}

function axisLabel(axis: MapAxis): string {
  return axis === "width" ? "Width" : "Height";
}

export function formatInspectorNumber(value: number): string {
  return formatNumber(value);
}

export function sanitizeSpeed(value: number, fallback: number): number {
  const numeric = toFiniteNumber(value, fallback);
  const clamped = clamp(numeric, INSPECTOR_SPEED_MIN, INSPECTOR_SPEED_MAX);
  const snapped =
    INSPECTOR_SPEED_MIN +
    Math.round((clamped - INSPECTOR_SPEED_MIN) / INSPECTOR_SPEED_STEP) * INSPECTOR_SPEED_STEP;
  return Number(snapped.toFixed(1));
}

export function sanitizeMapSize(value: number, fallback: number): number {
  const numeric = toFiniteNumber(value, fallback);
  const rounded = Math.round(numeric);
  return clamp(rounded, INSPECTOR_MAP_SIZE_MIN, INSPECTOR_MAP_SIZE_MAX);
}

export function getSpeedDraftHint(raw: string): string | null {
  const parsed = parseDraftNumber(raw);
  if (parsed === null) {
    return "Preview speed is required.";
  }
  if (parsed < INSPECTOR_SPEED_MIN || parsed > INSPECTOR_SPEED_MAX) {
    return `Preview speed is clamped to ${formatNumber(INSPECTOR_SPEED_MIN)}-${formatNumber(INSPECTOR_SPEED_MAX)}.`;
  }
  if (!isStepAligned(parsed, INSPECTOR_SPEED_MIN, INSPECTOR_SPEED_STEP)) {
    return `Preview speed snaps to ${formatNumber(INSPECTOR_SPEED_STEP)} steps.`;
  }
  return null;
}

export function getMapSizeDraftHint(raw: string, axis: MapAxis): string | null {
  const parsed = parseDraftNumber(raw);
  const label = axisLabel(axis);
  if (parsed === null) {
    return `${label} is required.`;
  }
  if (!Number.isInteger(parsed)) {
    return `${label} rounds to the nearest integer.`;
  }
  if (parsed < INSPECTOR_MAP_SIZE_MIN || parsed > INSPECTOR_MAP_SIZE_MAX) {
    return `${label} is clamped to ${INSPECTOR_MAP_SIZE_MIN}-${INSPECTOR_MAP_SIZE_MAX}.`;
  }
  return null;
}

export function commitSpeedDraft(raw: string, fallback: number): NumericDraftCommit {
  const parsed = parseDraftNumber(raw);
  if (parsed === null) {
    return {
      value: fallback,
      blocked: true,
      message: "Preview speed is required."
    };
  }

  const sanitized = sanitizeSpeed(parsed, fallback);
  if (sanitized !== parsed) {
    return {
      value: sanitized,
      blocked: false,
      message: `Preview speed adjusted to ${formatNumber(sanitized)}.`
    };
  }

  return {
    value: sanitized,
    blocked: false,
    message: null
  };
}

export function commitMapSizeDraft(raw: string, fallback: number, axis: MapAxis): NumericDraftCommit {
  const parsed = parseDraftNumber(raw);
  const label = axisLabel(axis);

  if (parsed === null) {
    return {
      value: fallback,
      blocked: true,
      message: `${label} is required.`
    };
  }

  const sanitized = sanitizeMapSize(parsed, fallback);
  if (sanitized !== parsed) {
    return {
      value: sanitized,
      blocked: false,
      message: `${label} adjusted to ${sanitized}.`
    };
  }

  return {
    value: sanitized,
    blocked: false,
    message: null
  };
}
