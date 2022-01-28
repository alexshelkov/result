import { Response, Success, Failure } from './result';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GetData<Res> = Res extends Response<infer Data, any>
  ? Data
  : Res extends Success<infer Data>
  ? Data
  : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GetError<Res> = Res extends Response<any, infer Fail>
  ? Fail
  : Res extends Failure<infer Fail>
  ? Fail
  : never;
