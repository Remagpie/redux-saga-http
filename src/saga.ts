import * as pathToRegexp from "path-to-regexp";
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

function* httpRequest<Parameter extends object, Request>(
	params: Parameter,
	request: Request,
	options: {
		type: string;
		path: string;
		method: Method;
	}
) {
	const path = pathToRegexp.compile(options.path)(params);

	const init: RequestInit = {
		method: options.method,
		headers: { "Content-Type": "application/json" },
		body: request === undefined ? undefined : JSON.stringify(request),
	};

	const response: Response = yield fetch(path, init);
	if (response.status >= 400) {
		throw new StatusError(response);
	}

	return response;
}

type CreateSagaOption<Parameter, Request> = {
	type: string;
	path: string;
	method: Method;
	selector: (
		state: any,
		payload: HttpAction<Parameter, Request>["payload"]
	) => HttpState;
	callback?: (data: {
		params: Parameter;
		request: Request;
		response: Response;
	}) => IterableIterator<any>;
};

export function createHttpSaga<Parameter extends object, Request>(
	options: CreateSagaOption<Parameter, Request>
) {
	type P = Parameter;
	type Q = Request;
	type State = HttpState;
	return function*() {
		yield effects.takeEvery(options.type, function*(
			action: HttpAction<P, Q>
		) {
			// Debounce requests
			const selector = (state: any) =>
				options.selector(state, action.payload);
			const state: State = yield effects.select(selector);
			if (state != null && !state.resolved) {
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
		});
	};
}

export function createGetSaga<Parameter extends object, Request>(
	options: Omit<CreateSagaOption<Parameter, Request>, "method">
) {
	return createHttpSaga({
		...options,
		method: "GET",
	});
}

export function createPutSaga<Parameter extends object, Request>(
	options: Omit<CreateSagaOption<Parameter, Request>, "method">
) {
	return createHttpSaga({
		...options,
		method: "PUT",
	});
}

export function createPostSaga<Parameter extends object, Request>(
	options: Omit<CreateSagaOption<Parameter, Request>, "method">
) {
	return createHttpSaga({
		...options,
		method: "POST",
	});
}

export function createDeleteSaga<Parameter extends object, Request>(
	options: Omit<CreateSagaOption<Parameter, Request>, "method">
) {
	return createHttpSaga({
		...options,
		method: "DELETE",
	});
}

export function createPatchSaga<Parameter extends object, Request>(
	options: Omit<CreateSagaOption<Parameter, Request>, "method">
) {
	return createHttpSaga({
		...options,
		method: "PATCH",
	});
}
