import { Failure, Result, Success } from './types';
import { err, ok } from './utils';

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

export const toResult = <Data, Error>(input: unknown): Result<Data, Error> => {
  if (isOkLike<Data>(input)) {
    return ok(input.data);
  }

  if (isFailureLike<Error>(input)) {
    return err<Error>(input.error);
  }

  throw new Error('Unexpected input');
};
