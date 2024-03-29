export { ErrUtil as Err, Err as ErrInfo, ErrLevel, Errs } from './err';

export { Success, Failure, Result, Response } from './result';

export { isErr, isErrType, isSuccessLike, isFailureLike } from './checks';

export {
  ok,
  fail,
  throwFail,
  err,
  compare,
  nope,
  toResult,
  FailureException,
  OkFn,
  FailFn,
  ThrowFailFn,
} from './utils';

export { GetData, GetError } from './infer';
