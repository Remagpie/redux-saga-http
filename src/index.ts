type HttpState = {
	running: boolean;
	error?: Error;
};

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

type HttpSagaAction<Query, Body> =
	| HttpSuccessAction<Query, Body>
	| HttpFailAction<Query, Body>;
