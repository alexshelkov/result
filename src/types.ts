interface CompareResult {
  status: 'success' | 'error';
  order?: number;
  code?: number;
}

export interface ResultHelpers<Data, Fail> {
  isOk(): this is PartialSuccess<Data>;

  isErr(): this is PartialFailure<Fail>;

  ok(): this extends PartialSuccess<Data> ? Data : never;

  err(): this extends PartialFailure<Fail> ? Fail : never;
}

export interface PartialSuccess<Data> extends CompareResult {
  status: 'success';
  data: Data;
}

export interface PartialFailure<Fail> extends Error, CompareResult {
  status: 'error';
  error: Fail;
}

export interface Success<Data> extends PartialSuccess<Data>, ResultHelpers<Data, unknown> {}

export interface Failure<Error> extends PartialFailure<Error>, ResultHelpers<unknown, Error> {}

export type Result<Data, Error> = Success<Data> | Failure<Error>;

export type Response<Data, Error> = Promise<Result<Data, Error>>;

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

// eslint-disable-next-line @typescript-eslint/ban-types
export type Errs<Errors extends {}> = Omit<
  {
    [Type in keyof Errors]: ErrUtil<
      Type extends string
        ? Errors extends { name: string }
          ? `${Errors['name']}${Type}`
          : Type
        : never,
      // eslint-disable-next-line @typescript-eslint/ban-types
      Errors[Type] extends string | null ? {} : Exclude<Errors[Type], 'type'>
    >;
  },
  'name'
>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type Dis<Errors extends {}> = Errors[keyof Errors];
