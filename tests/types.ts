import { HttpFinishAction, HttpStartAction } from "../src/action";

export type Parameter = void;
export type Request = {
	foo: number;
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
