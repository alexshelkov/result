import { Err, Failure, Result, Status, Success } from './types';
import { ok, fail } from './utils';

const isHaveStatus = (input: unknown): input is { status: Status } => {
  if (!(typeof input === 'object' && input !== null)) {
    return false;
  }

  return 'status' in input;
};

export const isOkLike = <Data>(input: unknown): input is Success<Data> => {
  if (!isHaveStatus(input)) {
    return false;
  }

  return input.status === Status.Success;
};

export const isFailureLike = <Error>(input: unknown): input is Failure<Error & Err> => {
  if (!isHaveStatus(input)) {
    return false;
  }

  if (input.status !== Status.Error) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  const isHaveError = (param: object): param is { error: unknown } => 'error' in param;

  // eslint-disable-next-line @typescript-eslint/ban-types
  const isError = (param: unknown): param is object => typeof param === 'object' && param !== null;

  // eslint-disable-next-line @typescript-eslint/ban-types
  const isHaveType = (param: object): param is { type: unknown } => 'type' in param;

  return (
    isHaveError(input) &&
    isError(input.error) &&
    isHaveType(input.error) &&
    typeof input.error.type === 'string'
  );
};

export const toResult = <Data, Error>(input: unknown): Result<Data, Error> => {
  if (isOkLike<Data>(input)) {
    return ok(input.data);
  } if (isFailureLike<Error>(input)) {
    return fail(input.error.type as typeof input['error']['type'], input.error);
  }

  throw new Error('Unexpected input');
};
