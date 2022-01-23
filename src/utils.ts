import {
  Result,
  Failure,
  Success,
  PartialResult,
  PartialSuccess,
  PartialFailure,
  Transform,
  Response,
} from './result';

import {
  isPromise,
  isHaveStatus,
  isSuccessLike,
  isFailureLike,
  isErr,
  isUnknownErr,
} from './checks';

import { Err, ErrUtil } from './err';

export class FailureException<Fail> extends Error implements PartialFailure<Fail> {
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
}

const maybeFailToResult = <Data, Fail>(
  result: unknown,
  prevResult: PartialResult<unknown, unknown>
): PartialResult<Data, Fail> => {
  if (isSuccessLike(result)) {
    return result as PartialResult<Data, Fail>;
  }

  let failure = result as PartialFailure<Fail>;

  if (!isHaveStatus(result)) {
    let exception;

    if (typeof result === 'string') {
      exception = new FailureException(
        result,
        { type: result } as unknown as Fail,
        prevResult.order,
        prevResult.message,
        prevResult.code
      );
    } else if (isUnknownErr(result)) {
      exception = new FailureException(
        result.type,
        result as unknown as Fail,
        prevResult.order,
        prevResult.message,
        prevResult.code
      );
    } else {
      throw new Error("Can't convert to error");
    }

    failure = exception;
  }

  return failure;
};

type OkCb<Data, Data2, Fail2> = (
  data: Data,
  result: Result<Data, never>
) => Response<Data2, Fail2> | Result<Data2, Fail2>;

type OkRes<Res, Fail, Data2, Fail2> = Res extends Response<Data2, Fail2>
  ? Transform<Data2, Fail | Fail2>
  : Result<Data2, Fail | Fail2>;

type FailCb<Fail, Fail2> = (
  err: Fail,
  result: Result<never, Fail>
) => Response<never, Fail2> | Result<never, Fail2>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type FailRes<Res, Data, Fail2> = Result<Data, Fail2>;

type ErrCb<Res, Fail> = (err: Fail, result: Result<never, Fail>) => Res;

type ErrRes<Res, Data> = Result<Data, ErrUtil<Res>>;

type FutureResult<Data, Fail, Data2, Fail2, Res extends string | { type: string }> = {
  current: PartialSuccess<Data2> | PartialFailure<Fail2> | Res;
  prev: PartialResult<Data, Fail>;
};

const transform = <Data, Fail, Data2, Fail2, Res extends string | { type: string }>(
  future: Promise<FutureResult<Data, Fail, Data2, Fail2, Res>>
): Transform<Data | Data2, Fail | Fail2> => {
  const onErr = (cb: FailCb<Fail, Fail2>) => {
    return transform(
      future.then(({ current, prev }) => {
        const currentRes = maybeFailToResult<Data, Fail>(current, prev);

        if (currentRes.status === 'success') {
          return { current: currentRes as unknown as PartialSuccess<Data2>, prev: currentRes };
        }

        const nextRes = cb(currentRes.error, currentRes as Result<never, Fail>);

        return Promise.resolve(nextRes).then((next) => {
          return {
            current: next,
            prev: currentRes,
          } as FutureResult<Data, Fail, Data2, Fail2, Res>;
        });
      })
    );
  };

  const onOk = (cb: OkCb<Data, Data2, Fail2>) => {
    return transform(
      future.then(({ current, prev }) => {
        const currentRes = maybeFailToResult<Data, Fail>(current, prev);

        if (currentRes.status === 'error') {
          return { current: currentRes as unknown as PartialFailure<Fail2>, prev: currentRes };
        }

        const nextRes = cb(currentRes.data, currentRes as Result<Data, never>);

        return Promise.resolve(nextRes).then((next) => {
          return {
            current: next,
            prev: currentRes,
          } as FutureResult<Data, Fail, Data2, Fail2, Res>;
        });
      })
    );
  };

  const helper = {
    onOk,

    onFail: onErr,

    onErr,

    async res() {
      const { current, prev } = await future;

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return complete(maybeFailToResult<Data, Fail>(current, prev));
    },
  };

  return helper as unknown as Transform<Data, Fail>;
};

export const complete = <Data, Fail>(partial: PartialResult<Data, Fail>): Result<Data, Fail> => {
  const propsDefs = {
    isOk: {
      enumerable: false,
    },
    isErr: {
      enumerable: false,
    },
    ok: {
      enumerable: false,
    },
    err: {
      enumerable: false,
    },
    onOk: {
      enumerable: false,
    },
    onFail: {
      enumerable: false,
    },
    onErr: {
      enumerable: false,
    },
    res: {
      enumerable: false,
    },
    toString: {
      enumerable: false,
    },
  };

  if (partial.order === undefined) {
    delete partial.order;
  }

  if (partial.code === undefined) {
    delete partial.code;
  }

  const result = partial as Result<Data, Fail>;

  result.toString = () => {
    if (result.status === 'success') {
      return `Success<${JSON.stringify(result.data)}>`;
    }
    if (result.status === 'error') {
      return `Failure<${JSON.stringify(result.error)}>`;
    }

    throw new Error('Unknown status');
  };

  result.isOk = () => {
    return result.status === 'success';
  };

  result.isErr = () => {
    return result.status === 'error';
  };

  result.ok = () => {
    if (result.status === 'success') {
      return result.data;
    }

    throw new Error("Can't access data on error");
  };

  result.err = () => {
    if (result.status === 'error') {
      return result.error;
    }

    throw new Error("Can't access error on data");
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  result.res = (async () => {
    return result;
  }) as never;

  (result as Success<Data>).onOk = <Res, Fail0, Data2, Fail2>(
    cb: OkCb<Data, Data2, Fail2>
  ): OkRes<Res, Fail0, Data2, Fail2> => {
    if (result.status === 'error') {
      return result as unknown as OkRes<Res, Fail0, Data2, Fail2>;
    }

    const nextRes = cb(result.data, result);

    if (isPromise(nextRes)) {
      const transformed = nextRes.then((current) => {
        return { current, prev: result };
      });

      return transform(transformed) as OkRes<Res, Fail0, Data2, Fail2>;
    }

    return complete(nextRes) as OkRes<Res, Fail0, Data2, Fail2>;
  };

  (result as Failure<Fail>).onFail = <Res, Data0, Fail2>(
    cb: FailCb<Fail, Fail2>
  ): FailRes<Res, Data0, Fail2> => {
    if (result.status === 'success') {
      return result as unknown as FailRes<Res, Data0, Fail2>;
    }

    const nextRes = cb(result.error, result);

    if (isPromise(nextRes)) {
      const transformed = nextRes.then((current) => {
        return { current, prev: result };
      });

      return transform(transformed) as FailRes<Res, Data0, Fail2>;
    }

    return complete(nextRes) as FailRes<Res, Data0, Fail2>;
  };

  (result as Failure<Fail>).onErr = <
    Res extends ({ type: string } | string) | Promise<{ type: string } | string>,
    Data0
  >(
    cb: ErrCb<Res, Fail>
  ): ErrRes<Res, Data0> => {
    if (result.status === 'success') {
      return result as unknown as ErrRes<Res, Data0>;
    }

    const nextRes = cb(result.error, result);

    if (isPromise(nextRes)) {
      const transformed = nextRes.then((current) => {
        return { current, prev: result };
      });

      return transform(transformed) as ErrRes<Res, Data0>;
    }

    return complete(maybeFailToResult(nextRes, result)) as ErrRes<Res, Data0>;
  };

  return Object.defineProperties(result, propsDefs);
};

type OkMessage = {
  code?: number;
  order?: number;
  skip?: boolean;
};

export type OkFn = <Data = never>(data: Data, params?: OkMessage) => Success<Data>;

export const ok: OkFn = <Data = never>(
  data: Data,
  { code, order, skip }: OkMessage = {}
): Success<Data> => {
  if (skip) {
    order = -Infinity;
  }

  const partial = {
    status: 'success',
    data,
    code,
    order,
  } as PartialSuccess<Data>;

  return complete(partial) as Success<Data>;
};

type FailMessage = {
  code?: number;
  message?: string;
  order?: number;
  skip?: boolean;
};

export const err = <Fail = never>(
  failure: Fail,
  { message, code, order, skip }: FailMessage = {}
): Failure<Fail> => {
  if (skip) {
    order = -Infinity;
  }

  let type;

  if (isErr(failure)) {
    type = failure.type;
  }

  if (!type) {
    type = message || 'Unknown';
  }

  const exception = new FailureException(type, failure, order, message, code);

  if (isErr(exception.error)) {
    if (exception.error.message === undefined) {
      delete exception.error.message;
    }
  }

  return complete(exception) as Failure<Fail>;
};

type ErrorMessage<Error> = FailMessage & Omit<Error, 'type' | 'message'>;

export type FailFn = <Fail extends Err | undefined = never>(
  type: Fail extends Err ? Fail['type'] : undefined,
  params?: ErrorMessage<Fail>
) => Failure<Fail>;

export const fail: FailFn = <Fail extends Err | undefined = never>(
  type: Fail extends Err ? Fail['type'] : undefined,
  { message, code, order, skip, ...error }: ErrorMessage<Fail> = {} as ErrorMessage<Fail>
): Failure<Fail> => {
  const failure = {
    ...error,
    type,
    message,
  } as unknown as Fail;

  return err(failure, { message, code, order, skip });
};

export type ThrowFailFn = <Fail extends Err | undefined = never>(
  type: Fail extends Err ? Fail['type'] : undefined,
  params?: ErrorMessage<Fail>
) => never;

export const throwFail: ThrowFailFn = <Fail extends Err | undefined = never>(
  type: Fail extends Err ? Fail['type'] : undefined,
  params: ErrorMessage<Fail> = {} as ErrorMessage<Fail>
): never => {
  throw fail(type, params);
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

export const toResult = <Data, Error>(input: unknown): Result<Data, Error> => {
  if (isSuccessLike<Data>(input)) {
    return ok(input.data);
  }

  if (isFailureLike<Error>(input)) {
    return err<Error>(input.error);
  }

  throw new Error('Unexpected input');
};

export function nope(p: never): never;
export function nope(_p: unknown): never {
  throw new Error('Unreachable');
}
