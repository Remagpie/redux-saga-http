/* eslint-disable no-unused-expressions */

import { expect } from "chai";
import { BAD_REQUEST, OK } from "http-status-codes";
import { AnyAction } from "redux";
import * as effects from "redux-saga/effects";
import SagaTester from "redux-saga-tester";

import {
	createHttpAction,
	HttpAction,
	HttpFailAction,
	HttpFinishAction,
	HttpStartAction,
} from "../../src/action";
import { StatusError } from "../../src/error";
import { createArrayHttpReducer, HttpState } from "../../src/reducer";
import { createHttpSaga } from "../../src/saga";
import {
	compiledPath,
	path,
	payload,
	Action,
	CallbackAction,
	FetchAction,
	Parameter,
	Request,
} from "../common";

type ObjectHttpState = {
	[id: string]: HttpState;
};

function mockFetch(dispatch: (a: AnyAction) => void, status: number) {
	(global as any).fetch = async (input: RequestInfo, init?: RequestInit) => {
		dispatch({
			type: "FETCH",
			payload: {
				input,
				init,
			},
		});
		return {
			status,
		};
	};
}

describe("Array Http Saga Integration", () => {
	const type = "TYPE";
	const method = "POST";
	const actionCreator = createHttpAction<Parameter, Request>(type);
	const key = ({ request }: { request: Request }) => request.foo;

	function filterActions(actions: Action[], id: number): Action[] {
		return actions.filter((act) => {
			switch (act.type) {
				case type:
				case `${type}/START`:
				case `${type}/FINISH`:
				case "CALLBACK": {
					const a = act as
						| HttpAction<Parameter, Request>
						| HttpStartAction<Parameter, Request>
						| HttpFinishAction<Parameter, Request>
						| CallbackAction;
					return key(a.payload) === id;
				}
				case "FETCH": {
					const a = act as FetchAction;
					const body = JSON.parse(a.payload.init!.body as string);
					return key({ request: body }) === id;
				}
				default: {
					return false;
				}
			}
		});
	}

	const httpActions = [
		actionCreator({
			...payload,
			request: {
				...payload.request,
				foo: 41,
			},
		}),
		actionCreator({
			...payload,
			request: {
				...payload.request,
				foo: 43,
			},
		}),
	];
	const reducer = createArrayHttpReducer<Parameter, Request>(type, key);
	const saga = createHttpSaga<Parameter, Request>({
		type,
		path,
		method,
		selector: (s: ObjectHttpState, a) => s[key(a.payload)],
		*callback(data: any): IterableIterator<any> {
			yield effects.put({
				type: "CALLBACK",
				payload: data,
			});
		},
	});
	let tester: SagaTester<ObjectHttpState>;

	beforeEach(() => {
		tester = new SagaTester<ObjectHttpState>({
			reducers: reducer,
			initialState: {},
		});
		mockFetch(tester.dispatch.bind(tester), OK);
		tester.start(saga);
	});

	it("should dispatch start action at the start", async () => {
		for (const ha of httpActions) {
			tester.dispatch(ha);
		}
		await tester.waitFor("CALLBACK");
		if (tester.numCalled("CALLBACK") < 2) {
			await tester.waitFor("CALLBACK", true);
		}
		const allActions = tester.getCalledActions() as Action[];
		const actions = httpActions.map((ha) =>
			filterActions(allActions, key(ha.payload))
		);
		for (let i = 0; i < actions.length; ++i) {
			const as = actions[i];
			expect(as[1]).to.be.deep.equal({
				type: `${type}/START`,
				payload: httpActions[i].payload,
			});
		}
	});

	it("should send http request in the middle", async () => {
		for (const ha of httpActions) {
			tester.dispatch(ha);
		}
		await tester.waitFor("CALLBACK");
		if (tester.numCalled("CALLBACK") < 2) {
			await tester.waitFor("CALLBACK", true);
		}
		const allActions = tester.getCalledActions() as Action[];
		const actions = httpActions.map((ha) =>
			filterActions(allActions, key(ha.payload))
		);
		for (let i = 0; i < actions.length; ++i) {
			const fetchAction = actions[i][2] as FetchAction;
			expect(fetchAction).to.have.property("type", "FETCH");
			expect(fetchAction.payload).to.have.property("input", compiledPath);
			expect(fetchAction.payload).to.have.deep.property("init", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(httpActions[i].payload.request),
			});
		}
	});

	it("should call callback before dispatching finish action", async () => {
		for (const ha of httpActions) {
			tester.dispatch(ha);
		}
		await tester.waitFor("CALLBACK");
		if (tester.numCalled("CALLBACK") < 2) {
			await tester.waitFor("CALLBACK", true);
		}
		const allActions = tester.getCalledActions() as Action[];
		const actions = httpActions.map((ha) =>
			filterActions(allActions, key(ha.payload))
		);
		for (let i = 0; i < actions.length; ++i) {
			expect(actions[i][3]).to.be.deep.equal({
				type: "CALLBACK",
				payload: {
					...httpActions[i].payload,
					response: {
						status: OK,
					},
				},
			});
		}
	});

	it("should dispatch finish action at the end", async () => {
		for (const ha of httpActions) {
			tester.dispatch(ha);
		}
		await tester.waitFor("CALLBACK");
		if (tester.numCalled("CALLBACK") < 2) {
			await tester.waitFor("CALLBACK", true);
		}
		const allActions = tester.getCalledActions() as Action[];
		const actions = httpActions.map((ha) =>
			filterActions(allActions, key(ha.payload))
		);
		for (let i = 0; i < actions.length; ++i) {
			expect(actions[i][actions[i].length - 1]).to.be.deep.equal({
				type: `${type}/FINISH`,
				payload: httpActions[i].payload,
			});
		}
	});

	it("should add error to finish action for unsuccessful status code", async () => {
		mockFetch(tester.dispatch.bind(tester), BAD_REQUEST);
		for (const ha of httpActions) {
			tester.dispatch(ha);
		}
		await tester.waitFor(`${type}/FINISH`);
		if (tester.numCalled(`${type}/FINISH`) < 2) {
			await tester.waitFor(`${type}/FINISH`, true);
		}
		const allActions = tester.getCalledActions() as Action[];
		const actions = httpActions.map((ha) =>
			filterActions(allActions, key(ha.payload))
		);
		for (let i = 0; i < actions.length; ++i) {
			const action = actions[i][actions[i].length - 1] as HttpFailAction<
				Parameter,
				Request
			>;
			expect(action.type).to.be.equal(`${type}/FINISH`);
			expect(action.payload).to.include(httpActions[i].payload);
			expect(action.error).to.be.true;

			const error = action.payload.error as StatusError;
			expect(error).to.be.instanceof(StatusError);
			expect(error.response.status).to.be.equal(BAD_REQUEST);
		}
	});

	it("should not execute saga if there is unresolved request", async () => {
		for (const ha of httpActions) {
			// Transition to unresolved state by sending start action
			tester.dispatch({
				type: `${type}/START`,
				payload: ha.payload,
			});
		}
		for (const ha of httpActions) {
			tester.dispatch(ha);
		}
		await tester.waitFor(`${type}/START`);
		if (tester.numCalled(`${type}/START`) < 2) {
			await tester.waitFor(`${type}/START`, true);
		}
		const allActions = tester.getCalledActions() as Action[];
		const actions = httpActions.map((ha) =>
			filterActions(allActions, key(ha.payload))
		);
		for (let i = 0; i < actions.length; ++i) {
			// start action + http action
			expect(actions[i]).to.be.lengthOf(2);
		}
	});

	afterEach(() => {
		delete (global as any).fetch;
	});
});
