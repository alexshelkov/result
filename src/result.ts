import { ErrUtil } from './err';

interface CompareResult {
  status: 'success' | 'error';
  toString: () => string;
  order?: number;
  code?: number;
}

export interface PartialSuccess<Data> extends CompareResult {
  status: 'success';
  data: Data;
  message: never;
  stack: never;
}

export interface PartialFailure<Fail> extends Error, CompareResult {
  status: 'error';
  error: Fail;
}

export interface Transform<Data, Fail> {
  res(): Response<Data, Fail>;

  onOk<Data2 = never, Fail2 = never>(
    cb: (data: Data, result: Result<Data, never>) => Result<Data2, Fail2> | Response<Data2, Fail2>
  ): Transform<Data2, Fail | Fail2>;

  onFail<Fail2 = never>(
    cb: (err: Fail, result: Result<never, Fail>) => Result<never, Fail2> | Response<never, Fail2>
  ): Transform<Data, Fail2>;

  onErr<Type extends string, Res extends ({ type: Type } | Type) | Promise<{ type: Type } | Type>>(
    cb: (err: Fail, result: Result<never, Fail>) => Res
  ): Res extends Promise<infer WholeRes>
    ? Transform<Data, ErrUtil<WholeRes>>
    : Transform<Data, ErrUtil<Res>>;
}

export interface Success<Data> extends PartialSuccess<Data> {
  ok(): Data;
  isOk(): this is Success<Data>;
  isErr(): boolean;
  err(): never;

  // on methods

  onOk<
    Res extends Result<Data2, Fail2> | Response<Data2, Fail2>,
    Fail = never,
    Data2 = never,
    Fail2 = never
  >(
    this: Result<Data, Fail>,
    cb: (
      data: Data,
      result: Result<Data, never>
    ) => Result<Data2, Fail2> | Response<Data2, Fail2> | Res
  ): Res extends Response<Data2, Fail2>
    ? Transform<Data2, Fail | Fail2>
    : Result<Data2, Fail | Fail2>;

  onFail(): never;

  onErr(): never;

  res(): never;
}

export interface Failure<Fail> extends PartialFailure<Fail> {
  ok(): never;
  isOk(): never;
  isErr(): this is Failure<Fail>;
  err(): Fail;

  // on methods

  onOk(): never;

  // onFail<Res1 extends Result<never, Fail2>, Res2 extends Response<never, Fail2>, Res extends Res1  | Res2, Data = never, Fail2 = never>(
  //   this: Result<Data, Fail>,
  //   cb: (
  //     err: Fail,
  //     result: Result<never, Fail>
  //   ) => Res
  // ): Res extends Response<never, Fail2> ? Transform<Data, Fail2> : Result<Data, Fail2>;

  onFail<Data = never, Fail2 = never>(
    this: Result<Data, Fail>,
    cb: (err: Fail, result: Result<never, Fail>) => Result<never, Fail2>
  ): Result<Data, Fail2>;

  onFail<Data = never, Fail2 = never>(
    this: Result<Data, Fail>,
    cb: (err: Fail, result: Result<never, Fail>) => Response<never, Fail2>
  ): Transform<Data, Fail2>;

  // onErr<
  //   Type extends string,
  //   Res extends ({ type: Type } | Type) | Promise<{ type: Type } | Type>,
  //   Data = never
  //   >(
  //   this: Result<Data, Fail>,
  //   cb: (err: Fail, result: Result<never, Fail>) => Res
  // ): Res extends Promise<infer WholeRes>
  //   ? Transform<Data, ErrUtil<WholeRes>>
  //   : Result<Data, ErrUtil<Res>>;

  onErr<Type extends string, Res extends { type: Type } | Type, Data = never>(
    this: Result<Data, Fail>,
    cb: (err: Fail, result: Result<never, Fail>) => Res
  ): Result<Data, ErrUtil<Res>>;

  onErr<Type extends string, Res extends Promise<{ type: Type } | Type>, Data = never>(
    this: Result<Data, Fail>,
    cb: (err: Fail, result: Result<never, Fail>) => Res
  ): Res extends Promise<infer WholeRes> ? Transform<Data, ErrUtil<WholeRes>> : never;

  res(): never;
}

export type PartialResult<Data, Fail> = PartialSuccess<Data> | PartialFailure<Fail>;

export type Result<Data, Fail> = Success<Data> | Failure<Fail>;

export type Response<Data, Fail> = Promise<Result<Data, Fail>>;
