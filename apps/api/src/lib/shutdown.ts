export interface ShutdownDependencies {
  closeApplication(): Promise<void>;
  disconnectDatabase(): Promise<void>;
  logInfo(context: { signal: string }, message: string): void;
  logError(context: { error: unknown; signal: string }, message: string): void;
  setExitCode(code: 0 | 1): void;
}

export function createShutdownHandler(dependencies: ShutdownDependencies) {
  let shutdownPromise: Promise<void> | undefined;

  return function shutdown(signal: string): Promise<void> {
    shutdownPromise ??= (async () => {
      dependencies.logInfo({ signal }, "graceful shutdown started");
      let failure: unknown;

      try {
        await dependencies.closeApplication();
      } catch (error) {
        failure = error;
      }

      try {
        await dependencies.disconnectDatabase();
      } catch (error) {
        failure ??= error;
      }

      if (failure) {
        dependencies.logError({ error: failure, signal }, "graceful shutdown failed");
        dependencies.setExitCode(1);
        return;
      }

      dependencies.setExitCode(0);
    })();
    return shutdownPromise;
  };
}
