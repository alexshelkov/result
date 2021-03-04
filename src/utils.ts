import { Success, Failure, Result, Err, PartialSuccess, PartialFailure } from './types';

export class FailureException<Fail> extends Error implements Failure<Fail> {
  status: 'error';

  error: Fail;

  code?: number;

  order?: number;

  constructor(t: string, e: Fail, o?: number, m?: string, c?: number) {
    super(m || t);

    Object.setPrototypeOf(this, FailureException.prototype);

    this.status = 'error';
    this.order = o;
    this.error = e;
    this.code = c;
    this.name = 'FailureException';
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

  err(): this extends PartialFailure<Fail> ? Fail : never {
    return this.error as this extends PartialFailure<Fail> ? Fail : never;
  }
}

type OkMessage = {
  code?: number;
  order?: number;
  skip?: boolean;
};

type ErrorMessage<Error> = {
  code?: number;
  message?: string;
  order?: number;
  skip?: boolean;
} & Omit<Error, 'type' | 'message'>;

export const ok = <Data>(data: Data, { code, order, skip }: OkMessage = {}): Success<Data> => {
  if (skip) {
    order = -Infinity;
  }

  const partial = {
    status: 'success',
    data,
    code,
    order,
  } as PartialSuccess<Data>;

  return {
    ...partial,

    isOk() {
      return true;
    },
    isErr() {
      return false;
    },
    ok() {
      return this.data;
    },
    err(): never {
      throw new Error("Can't access error on data");
    },
  };
};

export const isErr = (input: unknown): input is Err =>
  typeof input === 'object' && input !== null && 'type' in input;

export const fail = <Error extends Err | undefined = never>(
  type: Error extends Err ? Error['type'] : undefined,
  { message, code, order, skip, ...error }: ErrorMessage<Error> = {} as ErrorMessage<Error>
): Failure<Error> => {
  const failure = ((typeof type !== 'undefined'
    ? {
        ...error,
        type,
        message,
      }
    : undefined) as unknown) as Error;

  if (skip) {
    order = -Infinity;
  }

  const exception = new FailureException(
    message || (type as string) || 'Unknown',
    failure,
    order,
    message,
    code
  );

  if (exception.code === undefined) {
    delete exception.code;
  }

  if (exception.order === undefined) {
    delete exception.order;
  }

  if (isErr(exception.error)) {
    if (exception.error.message === undefined) {
      delete exception.error.message;
    }
  }

  return exception;
};

export const compare = <Data1, Error1, Data2, Error2>(
  r1: Result<Data1, Error1>,
  r2: Result<Data2, Error2>
): Result<Data1 | Data2, Error1 | Error2> => {
  if ((r1.order || 0) > (r2.order || 0)) {
    return r1;
  }

  if ((r2.order || 0) > (r1.order || 0)) {
    return r2;
  }

  if (r1.isErr()) {
    return r1;
  }

  return r2;
};

export function nope(p: never): never;
export function nope(_p: unknown): never {
  throw new Error(`Unreachable`);
}
