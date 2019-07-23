type HttpAction<Query, Body> = {
	type: string;
	payload: {
		query: Query;
		body: Body;
	};
};

type HttpSuccessAction<Query, Body> = {
	type: string;
	payload: {
		query: Query;
		body: Body;
	};
	error?: false;
};

type HttpFailAction<Query, Body> = {
	type: string;
	payload: {
		query: Query;
		body: Body;
		error: Error;
	};
	error: true;
};

export type HttpSagaAction<Query, Body> =
	| HttpSuccessAction<Query, Body>
	| HttpFailAction<Query, Body>;

export function createHttpAction<Query, Body>(type: string) {
	return (payload: { query: Query; body: Body }): HttpAction<Query, Body> => {
		return {
			type,
			payload,
		};
	};
}
