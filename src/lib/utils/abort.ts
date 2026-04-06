export function createAbortError() {
	const error = new Error("The operation was aborted.");
	error.name = "AbortError";
	return error;
}

export function throwIfAborted(signal?: AbortSignal) {
	if (signal?.aborted) {
		throw createAbortError();
	}
}

export function isAbortError(error: unknown) {
	return error instanceof Error && error.name === "AbortError";
}

export async function abortableDelay(ms: number, signal?: AbortSignal) {
	throwIfAborted(signal);

	return await new Promise<void>((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			cleanup();
			resolve();
		}, ms);

		const onAbort = () => {
			clearTimeout(timeoutId);
			cleanup();
			reject(createAbortError());
		};

		const cleanup = () => {
			signal?.removeEventListener("abort", onAbort);
		};

		signal?.addEventListener("abort", onAbort, { once: true });
	});
}
