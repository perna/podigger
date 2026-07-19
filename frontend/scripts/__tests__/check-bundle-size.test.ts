/**
 * T036 (004 T111) — bundle-size guard test.
 *
 * Stubs `child_process.spawnSync` (the analyze build) and the fs reads
 * (baseline, build manifest, chunk sizes) to assert the guard's contract:
 * exit 0 when the delta is < 10 %, exit 1 when it is > 10 %, and the
 * baseline is read from `scripts/baseline-bundle.json`.
 *
 * @see specs/005-frontend-coverage-cleanup/spec.md FR-001
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const spawnSyncMock = vi.fn();
const existsSyncMock = vi.fn();
const readFileSyncMock = vi.fn();
const statSyncMock = vi.fn();
const writeFileSyncMock = vi.fn();

vi.mock("node:child_process", () => ({
  default: { spawnSync: (...args: unknown[]) => spawnSyncMock(...args) },
  spawnSync: (...args: unknown[]) => spawnSyncMock(...args),
}));
vi.mock("node:fs", () => ({
  default: {
    readFileSync: (...args: unknown[]) => readFileSyncMock(...args),
    writeFileSync: (...args: unknown[]) => writeFileSyncMock(...args),
    existsSync: (...args: unknown[]) => existsSyncMock(...args),
    statSync: (...args: unknown[]) => statSyncMock(...args),
  },
  readFileSync: (...args: unknown[]) => readFileSyncMock(...args),
  writeFileSync: (...args: unknown[]) => writeFileSyncMock(...args),
  existsSync: (...args: unknown[]) => existsSyncMock(...args),
  statSync: (...args: unknown[]) => statSyncMock(...args),
}));

const { check } = await import("../../scripts/check-bundle-size.mjs");

function setupFs(baselineBytes: number, currentBytes: number) {
  existsSyncMock.mockReturnValue(true);
  readFileSyncMock.mockImplementation((path: unknown) => {
    const p = String(path);
    if (p.endsWith("baseline-bundle.json")) {
      return JSON.stringify({ home: { rootMainBytes: baselineBytes } });
    }
    if (p.endsWith("build-manifest.json")) {
      return JSON.stringify({ rootMainFiles: ["static/chunks/main.js"] });
    }
    throw new Error(`unexpected readFileSync: ${p}`);
  });
  statSyncMock.mockReturnValue({ size: currentBytes });
  spawnSyncMock.mockReturnValue({ status: 0, stdout: "", stderr: "" });
}

describe("check-bundle-size (004 T111)", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`);
      }) as never);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("passes (no exit 1) when the delta is < 10 %", () => {
    setupFs(1_000_000, 1_050_000); // +5 %
    check();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("OK: root-main bundle"),
    );
  });

  it("exits 1 when the delta is > 10 %", () => {
    setupFs(1_000_000, 1_200_000); // +20 %
    expect(() => check()).toThrow("process.exit(1)");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("FAIL: root-main bundle grew"),
    );
  });

  it("reads the baseline from scripts/baseline-bundle.json", () => {
    setupFs(1_000_000, 1_000_000);
    check();
    expect(readFileSyncMock).toHaveBeenCalledWith(
      expect.stringMatching(/baseline-bundle\.json$/),
      "utf8",
    );
  });
});
