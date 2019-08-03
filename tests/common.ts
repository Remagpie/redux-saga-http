import { HttpAction, HttpFinishAction, HttpStartAction } from "../src/action";

export type Parameter = void;
export type Request = {
	foo: number;
	bar: string;
};

export const payload: HttpAction<Parameter, Request>["payload"] = {
	params: undefined,
	request: {
		foo: 42,
		bar: "dummy",
	},
};

export type FetchAction = {
	type: "FETCH";
	payload: {
		input: RequestInfo;
		init?: RequestInit;
	};
};

export type CallbackAction = {
	type: "CALLBACK";
	payload: {
		params: Parameter;
		request: Request;
		response: Response;
	};
};

export type Action =
	| HttpStartAction<Parameter, Request>
	| HttpFinishAction<Parameter, Request>
	| FetchAction
	| CallbackAction;
