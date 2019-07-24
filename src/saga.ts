import * as effects from "redux-saga/effects";

import {
	HttpAction,
	HttpStartAction,
	HttpSuccessAction,
	HttpFailAction,
} from "./action";
import { StatusError } from "./error";
import { HttpState } from "./reducer";

type Method = "GET" | "PUT" | "POST" | "DELETE" | "PATCH";

export function createHttpSaga<Parameter, Request>(options: {
	type: string;
	path: string;
	method: Method;
	selector: (state: any) => HttpState;
	callback?: (data: {
		params: Parameter;
		request: Request;
		response: Response;
	}) => IterableIterator<any>;
}) {
	type P = Parameter;
	type Q = Request;
	type State = HttpState;
	return function*(action: HttpAction<P, Q>) {
		// Debounce requests
		const state: State = yield effects.select(options.selector);
		if (!state.resolved) {
			return;
		}

		const { params, request } = action.payload;

		// Dispatch start action
		yield effects.put<HttpStartAction<P, Q>>({
			type: `${options.type}/START`,
			payload: {
				params,
				request,
			},
		});

		try {
			// Send HTTP request
			const response: Response = yield httpRequest(params, request, {
				type: options.type,
				path: options.path,
				method: options.method,
			});

			// Call callback function if provided
			if (options.callback !== undefined) {
				yield* options.callback({
					params,
					request,
					response,
				});
			}

			// Dispatch success action
			yield effects.put<HttpSuccessAction<P, Q>>({
				type: `${options.type}/FINISH`,
				payload: {
					params,
					request,
				},
			});
		} catch (error) {
			yield effects.put<HttpFailAction<P, Q>>({
				type: `${options.type}/FINISH`,
				payload: {
					params,
					request,
					error,
				},
				error: true,
			});
		}
	};
}

function* httpRequest<Parameter, Request>(
	params: Parameter,
	request: Request,
	options: {
		type: string;
		path: string;
		method: Method;
	}
) {
	type P = Parameter;
	type Q = Request;
	try {
		// FIXME: apply url parameters to path
		const { path, method } = options;

		const init: RequestInit = {
			method,
			headers: { "Content-Type": "application/json" },
			body: request === undefined ? undefined : JSON.stringify(request),
		};

		const response: Response = yield fetch(path, init);
		if (response.status >= 400) {
			throw new StatusError(response);
		}

		return response;
	} catch (error) {
		const failAction: HttpFailAction<P, Q> = {
			type: `${options.type}/FINISH`,
			payload: {
				params,
				request,
				error,
			},
			error: true,
		};
		yield effects.put(failAction);
		throw error;
	}
}
