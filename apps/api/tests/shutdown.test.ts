import { describe, expect, it, vi } from "vitest";
import { createShutdownHandler } from "../src/lib/shutdown.js";

describe("graceful shutdown", () => {
  it("closes the app, disconnects Prisma, logs, and sets success once", async () => {
    const closeApplication = vi.fn(async () => {});
    const disconnectDatabase = vi.fn(async () => {});
    const logInfo = vi.fn();
    const logError = vi.fn();
    const setExitCode = vi.fn();
    const shutdown = createShutdownHandler({
      closeApplication,
      disconnectDatabase,
      logInfo,
      logError,
      setExitCode,
    });

    await Promise.all([shutdown("SIGTERM"), shutdown("SIGINT")]);

    expect(closeApplication).toHaveBeenCalledOnce();
    expect(disconnectDatabase).toHaveBeenCalledOnce();
    expect(logInfo).toHaveBeenCalledWith({ signal: "SIGTERM" }, "graceful shutdown started");
    expect(logError).not.toHaveBeenCalled();
    expect(setExitCode).toHaveBeenCalledWith(0);
  });

  it("logs a controlled failure and sets a non-zero exit code", async () => {
    const error = new Error("close failed");
    const disconnectDatabase = vi.fn(async () => {});
    const logError = vi.fn();
    const setExitCode = vi.fn();
    const shutdown = createShutdownHandler({
      closeApplication: vi.fn(async () => { throw error; }),
      disconnectDatabase,
      logInfo: vi.fn(),
      logError,
      setExitCode,
    });

    await shutdown("SIGTERM");

    expect(disconnectDatabase).toHaveBeenCalledOnce();
    expect(logError).toHaveBeenCalledWith({ error, signal: "SIGTERM" }, "graceful shutdown failed");
    expect(setExitCode).toHaveBeenCalledWith(1);
  });
});
