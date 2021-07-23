import {
  Result,
  PartialResult,
  Err,
  PartialSuccess,
  PartialFailure,
  Transform,
  ErrUtil,
  Success,
  Failure,
} from './types';

export const isErr = (input: unknown): input is Err => {
  return typeof input === 'object' && input !== null && 'type' in input;
};

export const isErrType = <
  Type extends string,
  Fail,
  Error extends Fail = Fail extends { type: Type } ? Fail : never
>(
  type: Type,
  input: Fail
): input is Error => {
  if (isErr(input)) {
    return input.type === type;
  }

  return false;
};

const isHaveStatus = (input: unknown): input is { status: 'error' | 'success' } => {
  if (!(typeof input === 'object' && input !== null)) {
    return false;
  }

  return 'status' in input;
};

export const isOkLike = <Data>(input: unknown): input is Success<Data> => {
  if (!isHaveStatus(input)) {
    return false;
  }

  return input.status === 'success';
};

export const isFailureLike = <Error>(input: unknown): input is Failure<Error> => {
  if (!isHaveStatus(input)) {
    return false;
  }

  if (input.status !== 'error') {
    return false;
  }

  return input.status === 'error';
};

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

type OkMessage = {
  code?: number;
  order?: number;
  skip?: boolean;
};

type FailMessage = {
  code?: number;
  message?: string;
  order?: number;
  skip?: boolean;
};

type ErrorMessage<Error> = FailMessage & Omit<Error, 'type' | 'message'>;

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
  };

  if (partial.order === undefined) {
    delete partial.order;
  }

  if (partial.code === undefined) {
    delete partial.code;
  }

  const result = partial as Result<Data, Fail>;

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

  (result as Transform<Data, Fail>).onOk = (cb) => {
    if (result.status === 'error') {
      return result;
    }

    const data = cb(result.data, result as Result<Data, never>);

    return complete(data);
  };

  type OnErrRes<Res> = Res extends Result<never, infer Fail2>
    ? Failure<Fail2> & Transform<never, Fail2>
    : Failure<ErrUtil<Res>> & Transform<never, ErrUtil<Res>>;

  (result as Transform<Data, Fail>).onErr = <Res>(
    cb: (err: Fail, _: Result<never, Fail>) => Res
  ): OnErrRes<Res> => {
    if (result.status === 'success') {
      return (result as unknown) as OnErrRes<Res>;
    }

    const error = cb(result.error, result);

    if (!isFailureLike<Res>(error)) {
      if (typeof error === 'string') {
        const exception = new FailureException(
          error,
          { ...result.error, type: error },
          result.order,
          result.message,
          result.code
        );
        exception.stack = result.stack;
        return complete(exception) as OnErrRes<Res>;
      }

      if (isErr(error)) {
        const exception = new FailureException(
          error.type,
          error,
          result.order,
          result.message,
          result.code
        );
        exception.stack = result.stack;
        return complete(exception) as OnErrRes<Res>;
      }

      throw new Error("Can't convert to error");
    }

    return complete(error) as OnErrRes<Res>;
  };

  return Object.defineProperties(result, propsDefs) as Result<Data, Fail>;
};

export const ok = <Data = never, Fail = never>(
  data: Data,
  { code, order, skip }: OkMessage = {}
): Result<Data, Fail> => {
  if (skip) {
    order = -Infinity;
  }

  const partial = {
    status: 'success',
    data,
    code,
    order,
  } as PartialSuccess<Data>;

  return complete(partial);
};

export const err = <Fail = never, Data = never>(
  failure: Fail,
  { message, code, order, skip }: FailMessage = {}
): Result<Data, Fail> => {
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

  return complete(exception);
};

export const fail = <Fail extends Err | undefined = never, Data = never>(
  type: Fail extends Err ? Fail['type'] : undefined,
  { message, code, order, skip, ...error }: ErrorMessage<Fail> = {} as ErrorMessage<Fail>
): Result<Data, Fail> => {
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
  if (isOkLike<Data>(input)) {
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
