# redux-saga-http

Send http requests with [redux-saga](https://github.com/redux-saga/redux-saga).

_`redux-saga-http` uses `fetch` API for API calls_

_`redux-saga-http` uses [flux standard actions](https://github.com/redux-utilities/flux-standard-action)_

## Introduction

Calling a remote API asynchronously is one of the most irritating task for developing web applications. Everything would be simple if all you want is just retrieving the data from the server, but real world requirements are more complex than that. In most cases, multiple components need to fetch the same data and the progress and the result should be shared across them. You'll also need to call a callback function before reporting that the API call has finished. The calling process should be transparent enough for easy debugging. Unfortunately, it's really hard to acheive all of these with naive approach.

Many people tries to utilize [redux](https://github.com/reduxjs/redux) to meet these requirements, but there's no common consensus on **how** should we implement this. Every implementation has their own boilerplate or helper function for managing the API calls. They look slightly different from each other, but basically they are doing the same thing. This library tries to reduce the boilerplates you had to write.

## Install

```sh
npm install --save redux-saga-http
# or
yarn add redux-saga-http
```

## Usage

### Simple API call

```ts
const type = "API/GET_USER_LIST";
const getUserList = createHttpAction<Parameter, Request>(type);
const reducer = createSingleHttpReducer(type);
const saga = createGetSaga<Parameter, Request>({
	type,
	path: "https://www.example.com/users",
	selector: (state: State) => state.api.getUserList,
	callback: function*({ response }) {
		const users = yield response.json();
		yield put({
			type: "UPDATE_USER_LIST",
			payload: users,
		});
	},
});

// Send request
dispatch(getUserList(undefined, requestBody));

// Get current state
const isLoading = !state.api.getUserList.resolved;
```

### Parameterized API call

```ts
const type = "API/GET_USER";
const getUserList = createHttpAction<Parameter, Request>(type);
const reducer = createObjectHttpReducer(type, ({ params }) => params.id);
const saga = createGetSaga<Parameter, Request>({
	type,
	path: "https://www.example.com/users/:id",
	selector: (state: State, { request }) => state.api.getUser[request.id],
	callback: function*({ response }) {
		const user = yield response.json();
		yield put({
			type: "UPDATE_USER",
			payload: user,
		});
	},
});

// Send request
dispatch(getUser({ id: 42 }, requestBody));

// Get current state
const isLoading = !state.api.getUser[42].resolved;
```

## How it works

### Actions

Every http reducer/saga creators accept `type` argument. Http sagas are triggered when an action with the type `type` is dispatched, and start asynchronous API call with `fetch` API.

At the start of the API call, action with the type `${type}/START` is dispatched.

At the end of the API call, action with the type `${type}/FINISH` is dispatched. If there was an error during the saga execution, `error` field of the action will be `true` and the error will be attached to the payload. This action will be dispatched **after** the callback is called.

### Redux State Management

There are three types of http reducers: single, object, and array. Each of them have different model for internal redux state, which is as follows:

_NOTE: `HttpState = { resolved: boolean; error?: Error }`_

| Reducer |             State             |
| :------ | :---------------------------: |
| Single  |          `HttpState`          |
| Object  | `{ [id: string]: HttpState }` |
| Array   | `{ [id: number]: HttpState }` |

### Action Creator

#### `createHttpAction`

| Argument |   Type   | Description          |
| :------- | :------: | :------------------- |
| `type`   | `string` | `type` of the action |

Creates an action creator for http actions. Sagas created by [`create...Saga`](#saga) will accept this action and start fetching the remote data.

### Reducer

#### `createSingleHttpReducer`

| Argument |   Type   | Description          |
| :------- | :------: | :------------------- |
| `type`   | `string` | `type` of the action |

Creates a reducer for processing simple http saga actions. Accepts `${types}/START` and `${types}/FINISH` typed actions, and updates the state accordingly.

#### `createObjectHttpReducer`

| Argument |         Type          | Description          |
| :------- | :-------------------: | :------------------- |
| `type`   |       `string`        | `type` of the action |
| `key`    | `(payload) => string` | key extractor        |

Creates an reducer for processing complex reducer for processing http saga actions. Only the `state[key(action.payload)]` is updated by each action, so multiple actions can be processed in parallel.

#### `createArrayHttpReducer`

| Argument |         Type          | Description          |
| :------- | :-------------------: | :------------------- |
| `type`   |       `string`        | `type` of the action |
| `key`    | `(payload) => number` | key extractor        |

Creates an reducer for processing complex reducer for processing http saga actions. Same as [`createObjectHttpReducer`](#createobjecthttpreducer), but the type of the key is number.

The reducer returned by this function currently uses plain object, not an array for redux state. This may be subject to change, so users should not rely on object-specific behavior.

### Saga

#### `createHttpSaga`

| Argument   |                   Type                    | Description                                     |
| :--------- | :---------------------------------------: | :---------------------------------------------- |
| `type`     |                 `string`                  | `type` of the action                            |
| `path`     |                 `string`                  | Path of the remote endpoint                     |
| `method`   |  `GET \| PUT \| POST \| DELETE \| PATCH`  | Method of the API call                          |
| `selector` |      `(state, payload) => HttpState`      | Redux selector for the current action           |
| `callback` | `*({ params, request, response }) => any` | Callback function called **after** the API call |

Creates an saga for fetching the remote data and dispatching the start/finish actions.

`path` uses [path-to-regexp](https://github.com/pillarjs/path-to-regexp) for filling the url parameters, and uses `action.payload.params` as parameters.

`selector` is used for retrieving current API call status, and http action is ignored if the state returned by the `selector` says previous call is not resolved yet.

`callback` is a **generator function** called **after** the API call, and **before** dispatching the finish action.

#### `create{Get,Put,Post,Delete,Patch}Saga`

| Argument   |                   Type                    | Description                                     |
| :--------- | :---------------------------------------: | :---------------------------------------------- |
| `type`     |                 `string`                  | `type` of the action                            |
| `path`     |                 `string`                  | Path of the remote endpoint                     |
| `selector` |      `(state, payload) => HttpState`      | Redux selector for the current action           |
| `callback` | `*({ params, request, response }) => any` | Callback function called **after** the API call |

A shortcut function for [`createHttpSaga`](#createhttpsaga) with common http methods.

## License

BSD-2-Clause
