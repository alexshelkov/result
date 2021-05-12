interface CompareResult {
  status: 'success' | 'error';
  order?: number;
  code?: number;
}

export interface PartialSuccess<Data> extends CompareResult {
  status: 'success';
  data: Data;
}

export interface PartialFailure<Fail> extends Error, CompareResult {
  status: 'error';
  error: Fail;
}

export interface Success<Data> extends PartialSuccess<Data> {
  ok(): Data;
  isOk(): this is Success<Data>;
  onOk<Res>(cb: (data: Data) => Res): Res;
  isErr(): false;
  err(): never;
  onAnyErr(cb: unknown): never;
  onErr(type: unknown, cb: unknown): never;
}

export interface Failure<Fail> extends PartialFailure<Fail> {
  onOk(): never;
  isOk(): false;
  ok(): never;
  isErr(): this is Failure<Fail>;
  err(): Fail;
  onAnyErr<Res>(cb: (err: Fail) => Res): Res;
  onErr<Type extends string, Res>(
    type: Type,
    cb: (err: Fail extends { type: Type } ? Fail : never) => Res
  ): Res;
}

export const ErrLevel = {
  Emerg: 0,
  Alert: 1,
  Crit: 2,
  Error: 3,
  Warning: 4,
  Notice: 5,
  Info: 6,
  Debug: 7,
};

export type Err = {
  type: string;
  message?: string;
  level?: number;
  retry?: boolean;
  notify?: boolean;
  fatal?: boolean;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type ErrUtil<T = unknown, A = {}> = T extends string
  ? { [k in keyof ({ type: T } & A)]: ({ type: T } & A)[k] } & Err
  : // eslint-disable-next-line @typescript-eslint/ban-types
  T extends {}
  ? { [k in keyof (T & A)]: (T & A)[k] } & Err
  : Err;

export type Errs<Errors> = Errors[keyof Errors] extends Err
  ? Errors[keyof Errors]
  : {
      [Type in Exclude<keyof Errors, 'name'>]: ErrUtil<
        Type extends string
          ? Errors extends { name: string }
            ? `${Errors['name']}${Type}`
            : Type
          : never,
        // eslint-disable-next-line @typescript-eslint/ban-types
        Errors[Type] extends string ? {} : Exclude<Errors[Type], 'type'>
      >;
    };

export type Result<Data, Error> = Success<Data> | Failure<Error>;

export type Response<Data, Error> = Promise<Result<Data, Error>>;
