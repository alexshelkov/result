export const enum Status {
  Success = 'success',
  Error = 'error',
}

interface CompareResult {
  status: Status;
  order?: number;
  code?: number;
}

interface ResultHelpers<Data, Fail> {
  isOk(): this is Success<Data>;

  isErr(): this is Failure<Fail>;

  ok(): this extends Success<Data> ? this['data'] : never;

  err(): this extends Failure<Fail> ? this['error'] : never;
}

export interface Success<Data> extends CompareResult, ResultHelpers<Data, unknown> {
  status: Status.Success;
  data: Data;
}

export interface Failure<Fail> extends Error, CompareResult, ResultHelpers<unknown, Fail> {
  status: Status.Error;
  error: Fail;
}

export class FailureException<Fail> extends Error implements Failure<Fail> {
  status: Status.Error;

  error: Fail;

  code?: number;

  order?: number;

  constructor(t: string, e: Fail, o?: number, m?: string, c?: number) {
    super(m || t);

    Object.setPrototypeOf(this, FailureException.prototype);

    this.status = Status.Error;
    this.order = o;
    this.error = e;
    this.code = c;
  }

  // eslint-disable-next-line class-methods-use-this
  isOk(): false {
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  isErr(): true {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  ok(): never {
    throw new Error("Can't access data on error");
  }

  err(): this extends Failure<Fail> ? this['error'] : never {
    return this.error as never;
  }
}

export type Result<Data, Error> = Success<Data> | Failure<Error>;

export type Response<Data, Error> = Promise<Result<Data, Error>>;

export interface Err {
  type: string;
  message?: string;
}
