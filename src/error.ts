export class StatusError extends Error {
	public readonly response: Response;

	constructor(response: Response) {
		super(`Http Status Code Error: ${response.status}`);
		Object.setPrototypeOf(this, StatusError.prototype);
		this.name = "StatusError";
		this.response = response;
	}
}

// FIXME: Find out how to express AbortError (it's currently DOMError)
export type HttpError = StatusError | TypeError | DOMError;
