import { Err, ErrUtil } from './err';

interface CompareResult {
  status: 'success' | 'error';
  toString: () => string;
  order?: number;
  code?: number;
}

export interface PartialSuccess<Data> extends CompareResult {
  status: 'success';
  data: Data;
  message: never;
  stack: never;
}

export interface PartialFailure<Fail> extends Error, CompareResult {
  status: 'error';
  error: Fail;
}

export type Cont<Data, Fail> = {
  _d: Data;
  _f: Fail;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetData<C> = C extends Cont<infer Data, any> ? Data : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetFail<C> = C extends Cont<any, infer Fail> ? Fail : never;

/* prettier-ignore */
export interface Transform<Data, Fail, Chain extends boolean = false> {
  res(): Response<Data, Fail>;

  onOk<Data2,
       Fail2,
       Res extends Response<Data2, Fail2> | Result<Data2, Fail2>>
  (
    cb: (data: Data, res: Result<Data, never>) => Response<Data2, Fail2> | Result<Data2, Fail2> | Res
  ): Chain extends true ?

      // chain true

      Transform<Data2, Fail | Fail2> :

      // chain false

      Res extends Response<Data2, Fail2> ? Transform<Data2, Fail | Fail2, true> :

      Result<Data2, Fail | Fail2>;

  // ----------------------------------------------------------------------------------

  onErr<Fail2,
        Type extends string,
        Res extends Response<never, Fail2> | Promise<{ type: Type }> | Result<never, Fail2> | { type: Type }>
  (
    cb: (
      err: Fail,
      res: Result<never, Fail>
    ) => Response<never, Fail2> | Promise<{ type: Type }> | Result<never, Fail2> | { type: Type } | Res
  ): Chain extends true ?

      // chain true

      Res extends { type: string } ? Transform<Data, ErrUtil<Res>, true> :
      Res extends Promise<{ type: string }> ? Res extends Promise<infer WholeRes> ? Transform<Data, ErrUtil<WholeRes>> : never :

      Transform<Data, Fail2, true> :

      // chain false

      Res extends { type: string } ? Result<Data, ErrUtil<Res>> :
      Res extends Promise<{ type: string }> ? Res extends Promise<infer WholeRes> ? Transform<Data, ErrUtil<WholeRes>> : never :
      Res extends Response<never, Fail2> ? Transform<Data, Fail2, true> :

      Result<Data, Fail2>;

  // ----------------------------------------------------------------------------------

  onErr<Name extends string,
        Fail2, Type extends string,
        Res extends Response<never, Fail2> | Promise<{ type: Type }> | Result<never, Fail2> | { type: Type }>
  (
    name: Name,
    cb: (err: Fail, res: Result<never, Fail>) => Response<never, Fail2> | Promise<{ type: Type }> | Result<never, Fail2> | { type: Type } | Res
  ): Chain extends true ?

      // chain true

      Res extends { type: string } ? Transform<Data, ErrUtil<{ type: `${Name}${Res['type']}` }, Omit<Res, 'type' | keyof Err>>, true> :

      Res extends Promise<{ type: string }> ? Res extends Promise<infer WholeRes> ?
        Transform<
          Data,
          WholeRes extends Err ?
            ErrUtil<{ type: `${Name}${WholeRes['type']}` }, Omit<WholeRes, 'type' | keyof Err>> :
            WholeRes,
          true
        > : never :

      Transform<
        Data,
        Fail2 extends Err ?
          ErrUtil<{ type: `${Name}${Fail2['type']}` }, Omit<Fail2, 'type' | keyof Err>> :
          Fail2,
        true
      > :

      // chain false

      Res extends { type: string } ? Result<Data, ErrUtil<{ type: `${Name}${Res['type']}` }, Omit<Res, 'type' | keyof Err>>> :

      Res extends Response<never, Fail2> ? Transform<
        Data,
        Fail2 extends Err
          ? ErrUtil<{ type: `${Name}${Fail2['type']}` }, Omit<Fail2, 'type' | keyof Err>>
          : Fail2,
        true> :

    Res extends Promise<{ type: string }> ? Res extends Promise<infer WholeRes> ? Transform<Data,

        WholeRes extends Err
          ? ErrUtil<{ type: `${Name}${WholeRes['type']}` }, Omit<WholeRes, 'type' | keyof Err>>
          : WholeRes

        , true> : never :

    Result<
        Data,
        Fail2 extends Err
          ? ErrUtil<{ type: `${Name}${Fail2['type']}` }, Omit<Fail2, 'type' | keyof Err>>
          : Fail2
      >;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Success<Data> extends SuccessCont<Cont<Data, never>> {}

export interface SuccessCont<DataCont>
  extends PartialSuccess<GetData<DataCont>>,
    Transform<GetData<DataCont>, GetFail<DataCont>> {
  _c: DataCont;
  ok(): GetData<DataCont>;
  isOk(): this is Success<GetData<DataCont>>;
  isErr(): boolean;
  err(): never;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Failure<Fail> extends FailureCont<Cont<never, Fail>> {}

export interface FailureCont<FailCont>
  extends PartialFailure<GetFail<FailCont>>,
    Transform<GetData<FailCont>, GetFail<FailCont>> {
  _c: FailCont;
  ok(): never;
  isOk(): never;
  isErr(): this is Failure<GetFail<FailCont>>;
  err(): GetFail<FailCont>;
}

export type PartialResult<Data, Fail> = PartialSuccess<Data> | PartialFailure<Fail>;

export type Result<Data, Fail> = SuccessCont<Cont<Data, Fail>> | FailureCont<Cont<Data, Fail>>;

export type Response<Data, Fail> = Promise<Result<Data, Fail>>;
