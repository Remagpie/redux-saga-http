// eslint-disable-next-line import/no-extraneous-dependencies
import { Reducer } from "redux";

import { HttpFinishAction } from "./action";
import { HttpError } from "./error";

/* istanbul ignore next */
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

type SingleState = HttpState;
export function createSingleHttpReducer<Parameter, Request>(
	type: string
): Reducer<SingleState> {
	type P = Parameter;
	type Q = Request;

	const initialState: SingleState = { resolved: true };
	return (state = initialState, action) => {
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
				const finishAction = action as HttpFinishAction<P, Q>;
				return {
					resolved: true,
					error: finishAction.error
						? finishAction.payload.error
						: undefined,
				};
			}
			/* istanbul ignore next */
			default: {
				return unreachable(step);
			}
		}
	};
}

type ObjectState = { [id: string]: HttpState };
export function createObjectHttpReducer<Parameter, Request>(
	type: string,
	key: (payload: { params: Parameter; request: Request }) => string
): Reducer<ObjectState> {
	type P = Parameter;
	type Q = Request;

	const initialState: ObjectState = {};
	return (state = initialState, action) => {
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
				const finishAction = action as HttpFinishAction<P, Q>;
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
			/* istanbul ignore next */
			default: {
				return unreachable(step);
			}
		}
	};
}

type ArrayState = { [id: number]: HttpState };
export function createArrayHttpReducer<Parameter, Request>(
	type: string,
	key: (payload: { params: Parameter; request: Request }) => number
): Reducer<ArrayState> {
	type P = Parameter;
	type Q = Request;

	const initialState: ArrayState = {};
	return (state = initialState, action) => {
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
				const finishAction = action as HttpFinishAction<P, Q>;
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
			/* istanbul ignore next */
			default: {
				return unreachable(step);
			}
		}
	};
}
