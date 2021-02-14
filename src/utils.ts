import { Status, Success, Failure, FailureException, Result, Err } from './types';

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

  return {
    status: Status.Success,
    data,
    code,
    order,
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

export const fail = <Error extends Err = never>(
  type: Error['type'],
  { message, code, order, skip, ...error }: ErrorMessage<Error> = {} as ErrorMessage<Error>
): Failure<Error> => {
  const failure: Error = {
    type,
    message,
    ...error,
  } as Error;

  if (skip) {
    order = -Infinity;
  }

  const exception = new FailureException(type, failure, order, message, code);

  if (exception.code === undefined) {
    delete exception.code;
  }

  if (exception.error.message === undefined) {
    delete exception.error.message;
  }

  if (exception.order === undefined) {
    delete exception.order;
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
