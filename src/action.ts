export type HttpAction<Parameter, Request> = {
	type: string;
	payload: {
		params: Parameter;
		request: Request;
	};
};

export type HttpStartAction<Parameter, Request> = {
	type: string;
	payload: {
		params: Parameter;
		request: Request;
	};
};

export type HttpSuccessAction<Parameter, Request> = {
	type: string;
	payload: {
		params: Parameter;
		request: Request;
	};
	error?: false;
};

export type HttpFailAction<Parameter, Request> = {
	type: string;
	payload: {
		params: Parameter;
		request: Request;
		error: Error;
	};
	error: true;
};

export type HttpFinishAction<Parameter, Request> =
	| HttpSuccessAction<Parameter, Request>
	| HttpFailAction<Parameter, Request>;

export function createHttpAction<Parameter, Request>(type: string) {
	type P = Parameter;
	type Q = Request;
	return (payload: { params: P; request: Q }): HttpAction<P, Q> => {
		return {
			type,
			payload,
		};
	};
}
