import { HttpAction, HttpFinishAction, HttpStartAction } from "../src/action";

export type Parameter = {
	f: number;
	b: string;
};
export type Request = {
	foo: number;
	bar: string;
};

export const path = "https://www.example.com/:f/:b";
export const compiledPath = "https://www.example.com/21/d";
export const payload: HttpAction<Parameter, Request>["payload"] = {
	params: {
		f: 21,
		b: "d",
	},
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
