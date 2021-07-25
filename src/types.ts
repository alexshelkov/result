interface CompareResult {
  status: 'success' | 'error';
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

export interface Success<Data> extends PartialSuccess<Data> {
  ok(): Data;
  isOk(): this is Success<Data>;
  isErr(): false;
  err(): never;
  onOk(): never;
  onErr(): never;
}

export interface Failure<Fail> extends PartialFailure<Fail> {
  isOk(): false;
  ok(): never;
  isErr(): this is Failure<Fail>;
  err(): Fail;
  onOk(): never;
  onErr(): never;
}

export interface Transform<Data, Fail> {
  onOk<Data2, Fail2>(
    cb: (data: Data, res: Result<Data, never>) => Result<Data2, Fail2>
  ): Result<Data2, Fail | Fail2>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onErr<Res extends string | Err | PartialSuccess<any> | PartialFailure<any>>(
    cb: (err: Fail, res: Result<never, Fail>) => Res
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): this extends PartialFailure<any>
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Res extends Result<any, infer Fail2>
      ? Failure<Fail2> & Transform<Data, Fail2>
      : Failure<ErrUtil<Res>> & Transform<Data, ErrUtil<Res>>
    : never;

  onErr<Fail2>(
    cb: (err: Fail, res: Result<never, Fail>) => Result<never, Fail2>
  ): Result<Data, Fail2>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onErr<Res extends string | Err | PartialSuccess<any> | PartialFailure<any>>(
    cb: (err: Fail, res: Result<never, Fail>) => Res
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Res extends Result<any, infer Fail2> ? Result<Data, Fail2> : Result<Data, ErrUtil<Res>>;
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
} as const;

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

export type Result<Data, Fail> = (
  | (Data | true extends true ? never : Success<Data>)
  | (Fail | true extends true ? never : Failure<Fail>)
) &
  Transform<Data, Fail>;

export type Response<Data, Fail> = Promise<Result<Data, Fail>>;
