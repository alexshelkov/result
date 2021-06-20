import {
  Result,
  PartialResult,
  Err,
  Success,
  Failure,
  PartialSuccess,
  PartialFailure,
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
  };

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

  return Object.defineProperties(result, propsDefs) as Result<Data, Fail>;
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

  return complete(exception) as Failure<Fail>;
};

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
