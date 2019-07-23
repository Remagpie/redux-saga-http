export { createHttpAction } from "./action";

export type HttpState = {
	running: boolean;
	error?: Error;
};
