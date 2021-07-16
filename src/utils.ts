import {
  Result,
  PartialResult,
  Err,
  Success,
  Failure,
  PartialSuccess,
  PartialFailure,
  Transform,
  Response,
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

  (result as Transform<Data, Fail>).onOk = async <Data2, Fail2>(
    cb: (data: Data) => Response<Data2, Fail2>
  ): Response<Data2, Fail | Fail2> => {
    if (result.status === 'error') {
      return result;
    }

    const data = await cb(result.data);

    return complete(data);
  };

  (result as Transform<Data, Fail>).onErr = async <Fail2>(
    cb: (err: Fail) => Promise<Failure<Fail2>>
  ): Response<Data, Fail2> => {
    if (result.status === 'success') {
      return result;
    }

    const error = await cb(result.error);

    return complete(error);
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

  return complete(partial) as Success<Data>;
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

export function nope(p: never): never;
export function nope(_p: unknown): never {
  throw new Error('Unreachable');
}
