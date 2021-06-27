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
  isErr(): false;
  err(): never;
  onOk(cb: never): never;
  onErr(cb: never): never;
}

export interface Failure<Fail> extends PartialFailure<Fail> {
  isOk(): false;
  ok(): never;
  isErr(): this is Failure<Fail>;
  err(): Fail;
  onOk(cb: never): never;
  onErr(cb: never): never;
}

export interface Transform<Data, Fail> {
  onOk<Data2, Fail2>(cb: (data: Data) => Response<Data2, Fail2>): Response<Data2, Fail | Fail2>;
  onErr<Fail2>(cb: (err: Fail) => Promise<Failure<Fail2>>): Response<Data, Fail2>;
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
  T extends { type: string }
  ? { [k in keyof (T & A)]: (T & A)[k] } & Err
  : A extends { type: string }
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

export type PartialResult<Data, Fail> = PartialSuccess<Data> | PartialFailure<Fail>;

export type Result<Data, Fail> =
  | (Success<Data> & Transform<Data, Fail>)
  | (Failure<Fail> & Transform<Data, Fail>);

export type Response<Data, Fail> = Promise<Result<Data, Fail>>;
