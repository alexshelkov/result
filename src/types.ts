interface CompareResult {
  status: 'success' | 'error';
  order?: number;
  code?: number;
}

export interface ResultHelpers<Data, Fail> {
  isOk(): this is PartialSuccess<Data>;

  isErr(): this is PartialFailure<Fail>;

  ok(): this extends PartialSuccess<Data> ? Data : never;

  err(): this extends PartialFailure<Fail> ? Fail : never;
}

export interface PartialSuccess<Data> extends CompareResult {
  status: 'success';
  data: Data;
}

export interface PartialFailure<Fail> extends Error, CompareResult {
  status: 'error';
  error: Fail;
}

export interface Success<Data> extends PartialSuccess<Data>, ResultHelpers<Data, unknown> {}

export interface Failure<Error> extends PartialFailure<Error>, ResultHelpers<unknown, Error> {}

export type Result<Data, Error> = Success<Data> | Failure<Error>;

export type Response<Data, Error> = Promise<Result<Data, Error>>;

export interface Err {
  type: string;
  message?: string;
}
