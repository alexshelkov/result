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

import { isPromise, isHaveStatus, isSuccessLike, isFailureLike, isErr } from './checks';

import { Err } from './err';

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
  prevResult: PartialResult<unknown, unknown>,
  name?: string
): PartialResult<Data, Fail> => {
  if (isSuccessLike(result)) {
    return result as PartialResult<Data, Fail>;
  }

  let failure = result as PartialFailure<Fail>;

  if (!isHaveStatus(result)) {
    if (isErr(result)) {
      const exception = new FailureException(
        result.type,
        (result as unknown) as Fail,
        prevResult.order,
        prevResult.message,
        prevResult.code
      );
      exception.stack = prevResult.stack;

      failure = exception;
    } else {
      throw new Error("Can't convert to error");
    }
  }

  if (typeof name === 'string') {
    const { error } = failure;

    if (isErr(error) && error.type !== undefined) {
      const type = `${name}${error.type}`;

      failure.error = { ...error, type };
    }
  }

  return failure;
};

type OkCb<Data, Data2, Fail2> = (
  data: Data,
  result: Result<Data, never>
) => Response<Data2, Fail2> | Result<Data2, Fail2>;

type ErrCb<Fail, Fail2> = (
  err: Fail,
  result: Result<never, Fail>
) => Response<never, Fail2> | Result<never, Fail2>;

const getCb = <Fail, Fail2>(
  name: ErrCb<Fail, Fail2> | string,
  optCb?: ErrCb<Fail, Fail2>
): ErrCb<Fail, Fail2> => {
  if (optCb) {
    return optCb;
  }
  if (typeof name === 'function') {
    return name;
  }
  throw new Error('Invalid arguments');
};

type FutureResult<Data, Fail, Data2, Fail2, Type extends string> = {
  current: PartialSuccess<Data2> | PartialFailure<Fail2> | { type: Type };
  prev: PartialResult<Data, Fail>;
  name?: string;
};

const transform = <Data, Fail, Data2, Fail2, Type extends string>(
  future: Promise<FutureResult<Data, Fail, Data2, Fail2, Type>>
): Transform<Data | Data2, Fail | Fail2, true> => {
  const helper = {
    onOk(cb: OkCb<Data, Data2, Fail2>) {
      return transform(
        future.then(({ current, prev }) => {
          const currentRes = maybeFailToResult<Data, Fail>(current, prev);

          if (currentRes.status === 'error') {
            return { current: (currentRes as unknown) as PartialFailure<Fail2>, prev: currentRes };
          }

          const nextRes = cb(currentRes.data, currentRes as Result<Data, never>);

          return Promise.resolve(nextRes).then((next) => {
            return { current: next, prev: currentRes } as FutureResult<
              Data,
              Fail,
              Data2,
              Fail2,
              Type
            >;
          });
        })
      );
    },
    onErr(name: ErrCb<Fail, Fail2> | string, optCb?: ErrCb<Fail, Fail2>) {
      const cb = getCb(name, optCb);

      return transform(
        future.then(({ current, prev }) => {
          const currentRes = maybeFailToResult<Data, Fail>(
            current,
            prev,
            typeof name === 'string' ? name : undefined
          );

          if (currentRes.status === 'success') {
            return { current: (currentRes as unknown) as PartialSuccess<Data2>, prev: currentRes };
          }

          const nextRes = cb(currentRes.error, currentRes as Result<never, Fail>);

          return Promise.resolve(nextRes).then((next) => {
            return {
              current: next,
              prev: currentRes,
              name: typeof name === 'string' ? name : undefined,
            } as FutureResult<Data, Fail, Data2, Fail2, Type>;
          });
        })
      );
    },
    async res() {
      const { current, prev, name } = await future;

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return complete(maybeFailToResult<Data, Fail>(current, prev, name));
    },
  };

  return (helper as unknown) as Transform<Data, Fail, true>;
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
  (result as Transform<Data, Fail>).res = async () => {
    return result;
  };

  type CbOkRes<Res, Data2, Fail2> = Res extends Response<Data2, Fail2>
    ? Transform<Data2, Fail | Fail2, true>
    : Result<Data2, Fail | Fail2>;

  (result as Transform<Data, Fail>).onOk = <Data2, Fail2, Res>(
    cb: (data: Data, res: Result<Data, never>) => Response<Data2, Fail2> | Result<Data2, Fail2>
  ): CbOkRes<Res, Data2, Fail2> => {
    if (result.status === 'error') {
      return (result as unknown) as CbOkRes<Res, Data2, Fail2>;
    }

    const nextRes = cb(result.data, result as Result<Data, never>);

    if (isPromise(nextRes)) {
      const transformed = nextRes.then((current) => {
        return { current, prev: result };
      });

      return transform(transformed) as CbOkRes<Res, Data2, Fail2>;
    }

    return complete(nextRes) as CbOkRes<Res, Data2, Fail2>;
  };

  (result as Transform<Data, Fail>).onErr = <Fail2>(
    name: ErrCb<Fail, Fail2> | string,
    optCb?: ErrCb<Fail, Fail2>
  ): Result<Data, Fail2> | Result<Data, Fail> | Transform<Data, Fail | Fail2, true> => {
    if (result.status === 'success') {
      return result;
    }

    const cb = getCb(name, optCb);

    const nextRes = cb(result.error, result as Failure<Fail>);

    if (isPromise(nextRes)) {
      const transformed = nextRes.then((current) => {
        return { current, prev: result, name: typeof name === 'string' ? name : undefined };
      });

      return transform(transformed);
    }

    return complete(
      maybeFailToResult(nextRes, result, typeof name === 'string' ? name : undefined)
    );
  };

  return Object.defineProperties(result, propsDefs) as Result<Data, Fail>;
};

type OkMessage = {
  code?: number;
  order?: number;
  skip?: boolean;
};

export const ok = <Data = never>(
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

export const fail = <Fail extends Err | undefined = never>(
  type: Fail extends Err ? Fail['type'] : undefined,
  { message, code, order, skip, ...error }: ErrorMessage<Fail> = {} as ErrorMessage<Fail>
): Failure<Fail> => {
  const failure = ({
    ...error,
    type,
    message,
  } as unknown) as Fail;

  return err(failure, { message, code, order, skip });
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
