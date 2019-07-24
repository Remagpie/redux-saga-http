import { HttpFinishAction, HttpStartAction } from "./action";
import { HttpError } from "./error";

function unreachable(_value: never): any {}

export type HttpState = {
	resolved: boolean;
	error?: HttpError;
};

export function createSingleHttpReducer<Parameter, Request>(type: string) {
	type P = Parameter;
	type Q = Request;
	type State = HttpState;
	const regexp = new RegExp(`(?:${type})/(START|FINISH)`);

	return (
		state: State = { resolved: true },
		action: HttpStartAction<P, Q> | HttpFinishAction<P, Q>
	): State => {
		const match = regexp.exec(action.type);
		if (match === null) {
			return state;
		}
		const step = match[1] as "START" | "FINISH";
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
