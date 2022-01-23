import { Err } from './err';
import { Failure, Success } from './result';

export const isUnknownErr = (input: unknown): input is Err => {
  return typeof input === 'object' && input !== null && 'type' in input;
};

export const isErr = <Error = Err>(input: Error): input is Error extends Err ? Error : never => {
  return isUnknownErr(input);
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

export const isHaveStatus = (input: unknown): input is { status: 'error' | 'success' } => {
  if (!(typeof input === 'object' && input !== null)) {
    return false;
  }

  return 'status' in input;
};

export const isSuccessLike = <Data>(input: unknown): input is Success<Data> => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPromise = <Data>(data: Data): data is Data extends Promise<any> ? Data : never => {
  return data !== null && typeof data === 'object' && 'then' in data;
};
