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
  readonly type: string;
  message?: string;
  level?: number;
  retry?: boolean;
  notify?: boolean;
  fatal?: boolean;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type ErrUtil<T = unknown, A = {}> = T extends string
  ? { [k in keyof ({ type: T } & A)]: ({ type: T } & A)[k] } & Err
  : T extends { type: string }
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
