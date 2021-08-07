import { Err, isErr, isErrType } from '../index';

// eslint-disable-next-line @typescript-eslint/ban-types
type TestErr<T, A = {}> = {
  type: T;
  message?: string;
  level?: number;
  retry?: boolean;
  notify?: boolean;
  fatal?: boolean;
} & A;

describe('error type', () => {
  it('string as type', () => {
    expect.assertions(1);

    const e1: TestErr<'e1'> = {
      type: 'e1',
    } as Err<'e1'>;

    expect(e1.type).toStrictEqual('e1');
  });

  it('object as type', () => {
    expect.assertions(2);

    const e1: TestErr<'e1'> = {
      type: 'e1',
    } as Err<{ type: 'e1' }>;

    expect(e1.type).toStrictEqual('e1');

    const e2 = {
      type: 'e1',
      // eslint-disable-next-line @typescript-eslint/ban-types
    } as Err<{}, { type: 'e1' }>;

    expect(e2.type).toStrictEqual('e1');
  });

  it('adds other parans to err', () => {
    expect.assertions(1);

    const e1: TestErr<'e1', { test: string }> = {
      type: 'e1',
    } as Err<'e1', { test: string }>;

    expect(e1.type).toStrictEqual('e1');
  });

  it('two objects', () => {
    expect.assertions(1);

    const e1: TestErr<'e1', { test1: number; test2: string }> = {
      type: 'e1',
    } as Err<{ type: 'e1'; test1: number }, { test2: string }>;

    expect(e1.type).toStrictEqual('e1');
  });
});

describe('error utils', () => {
  it('is an error', () => {
    expect.assertions(3);

    expect(isErr({ type: 'test' })).toBeTruthy();

    expect(isErr({})).toBeFalsy();

    expect(isErr(null)).toBeFalsy();
  });

  it('is an error of type', () => {
    expect.assertions(2);

    const o1 = { type: 'test' as const };

    // eslint-disable-next-line jest/no-if
    if (isErrType('test', o1)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      o1 as { type: 'test' };
      expect(o1.type).toStrictEqual('test');
    }

    // eslint-disable-next-line jest/no-if
    if (isErrType('test2', o1)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      o1 as never;
      expect(o1).toBeFalsy(); // this must be unreachable
    }

    expect(isErrType('test', {})).toBeFalsy();
  });
});
