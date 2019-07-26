import { HttpFinishAction, HttpSagaAction } from "./action";
import { HttpError } from "./error";

function unreachable(_value: never): any {}

export type HttpState = {
	resolved: boolean;
	error?: HttpError;
};

function getStep(base: string, type: string) {
	const regexp = new RegExp(`(?:${base})/(START|FINISH)`);
	const match = regexp.exec(type);
	if (match == null) {
		return undefined;
	}
	return match[1] as "START" | "FINISH";
}

export function createSingleHttpReducer<Parameter, Request>(type: string) {
	type P = Parameter;
	type Q = Request;
	type State = HttpState;

	const initialState: State = { resolved: true };
	return (state = initialState, action: HttpSagaAction<P, Q>): State => {
		const step = getStep(type, action.type);
		if (step == null) {
			return state;
		}
		switch (step) {
			case "START": {
				return {
					resolved: false,
				};
			}
			case "FINISH": {
				const finishAction: HttpFinishAction<P, Q> = action;
				return {
					resolved: true,
					error: finishAction.error
						? finishAction.payload.error
						: undefined,
				};
			}
			default: {
				return unreachable(step);
			}
		}
	};
}

export function createObjectHttpReducer<Parameter, Request>(
	type: string,
	key: (payload: { params: Parameter; request: Request }) => string
) {
	type P = Parameter;
	type Q = Request;
	type State = {
		[id: string]: HttpState;
	};

	const initialState: State = {};
	return (state = initialState, action: HttpSagaAction<P, Q>): State => {
		const step = getStep(type, action.type);
		if (step == null) {
			return state;
		}
		switch (step) {
			case "START": {
				return {
					...state,
					[key(action.payload)]: {
						resolved: false,
					},
				};
			}
			case "FINISH": {
				const finishAction: HttpFinishAction<P, Q> = action;
				return {
					...state,
					[key(action.payload)]: {
						resolved: true,
						error: finishAction.error
							? finishAction.payload.error
							: undefined,
					},
				};
			}
			default: {
				return unreachable(step);
			}
		}
	};
}

export function createArrayHttpReducer<Parameter, Request>(
	type: string,
	key: (payload: { params: Parameter; request: Request }) => number
) {
	type P = Parameter;
	type Q = Request;
	type State = {
		[id: number]: HttpState;
	};

	const initialState: State = {};
	return (state = initialState, action: HttpSagaAction<P, Q>): State => {
		const step = getStep(type, action.type);
		if (step == null) {
			return state;
		}
		switch (step) {
			case "START": {
				return {
					...state,
					[key(action.payload)]: {
						resolved: false,
					},
				};
			}
			case "FINISH": {
				const finishAction: HttpFinishAction<P, Q> = action;
				return {
					...state,
					[key(action.payload)]: {
						resolved: true,
						error: finishAction.error
							? finishAction.payload.error
							: undefined,
					},
				};
			}
			default: {
				return unreachable(step);
			}
		}
	};
}
