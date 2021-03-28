import { Err, fail, Failure, ok, nope, Result, ErrLevel } from '../index';

interface E1 extends Err {
  type: 'e1';
}

interface E2 extends Err {
  type: 'e2';
  stringAdded: 'e2data';
}

interface E3<T> extends Err {
  type: 'e3';
  numberAdded: T;
}

type AppErr = E1 | E2 | E3<number>;

describe('result', () => {
  it('sets the code correctly', () => {
    expect.assertions(1);

    const result: Result<string, Err> = fail('', { code: 400 });

    expect(result.code).toStrictEqual(400);
  });

  it('error is an exception', () => {
    expect.assertions(1);

    const result: Result<string, undefined> = fail<undefined>(undefined);

    expect(result).toBeInstanceOf(Error);
  });

  it('sets the message correctly', () => {
    expect.assertions(2);

    const result: Result<string, Err> = fail('', { message: 'Some error' });

    expect(result.message).toStrictEqual('Some error');
    expect(result.err().message).toStrictEqual('Some error');
  });

  it('sets the empty string message correctly', () => {
    expect.assertions(3);

    const result: Result<string, Err> = fail('');

    expect(result.message).toStrictEqual('Unknown');
    expect(result.err().message).toBeUndefined();

    const result2: Result<string, undefined> = fail<undefined>(undefined);

    expect(result2.message).toStrictEqual('Unknown');
  });

  it('sets the type message correctly', () => {
    expect.assertions(2);

    const result: Result<string, Err> = fail('Err type');

    expect(result.message).toStrictEqual('Err type');
    expect(result.err().message).toBeUndefined();
  });

  it('returns data with ok method', () => {
    expect.assertions(4);

    // eslint-disable-next-line jest/no-if
    const result: Result<string, Err> = Math.random() !== -1 ? ok('data') : fail('');

    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
    expect(result.ok()).toStrictEqual('data');
    expect(() => {
      return result.err();
    }).toThrow("Can't access error on data");
  });

  it('works when fail called with undefined', () => {
    expect.assertions(4);

    // eslint-disable-next-line operator-linebreak
    const result: Result<string, undefined> =
      // eslint-disable-next-line jest/no-if
      Math.random() !== -1 ? fail(undefined) : ok('');

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(() => {
      return result.ok();
    }).toThrow("Can't access data on error");
    expect(result.err()).toBeUndefined();
  });

  it('returns error with err method', () => {
    expect.assertions(5);

    // eslint-disable-next-line operator-linebreak
    const result: Result<string, E2> =
      // eslint-disable-next-line jest/no-if
      Math.random() !== -1 ? fail('e2', { stringAdded: 'e2data' }) : ok('');

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(() => {
      return result.ok();
    }).toThrow("Can't access data on error");
    expect(result.err().type).toStrictEqual('e2');
    expect(result.err().stringAdded).toStrictEqual('e2data');
  });

  it('fail will create typesafe errors', () => {
    expect.assertions(4);

    let result: Result<string, AppErr> = ok('1');

    expect(result.ok()).toStrictEqual('1');

    result = fail<E1>('e1');

    expect(result.err().type).toStrictEqual('e1');

    result = fail<E2>('e2', { stringAdded: 'e2data' });

    expect(
      // eslint-disable-next-line no-nested-ternary
      result.isErr() ? (result.error.type === 'e2' ? result.error.stringAdded : null) : null
    ).toStrictEqual('e2data');

    result = fail<E3<number>>('e3', { numberAdded: 100 });

    expect(
      // eslint-disable-next-line no-nested-ternary
      result.isErr() ? (result.error.type === 'e3' ? result.error.numberAdded : null) : null
    ).toStrictEqual(100);
  });

  it('will check errors exhaustively', () => {
    expect.assertions(1);

    const test1 = (e: Failure<AppErr>) => {
      switch (e.error.type) {
        case 'e1':
          return 1;
        case 'e2':
          return 2;
        case 'e3':
          return 3;
        default:
          nope(e.error);

          return 0;
      }
    };

    const err = fail<E1>('e1');

    expect(test1(err)).toStrictEqual(1);
  });

  it('different options passed correctly', () => {
    expect.assertions(8);

    const e1 = fail<E1>('e1', { fatal: true, level: ErrLevel.Crit });

    expect(e1.err().fatal).toStrictEqual(true);
    expect(e1.err().notify).toBeUndefined();
    expect(e1.err().retry).toBeUndefined();
    expect(e1.err().level).toStrictEqual(ErrLevel.Crit);

    const e2 = fail<E1>('e1', { retry: true, notify: true });

    expect(e2.err().fatal).toBeUndefined();
    expect(e2.err().notify).toStrictEqual(true);
    expect(e2.err().retry).toStrictEqual(true);
    expect(e2.err().level).toBeUndefined();
  });

  it('type overwrite', () => {
    expect.assertions(1);

    const err = fail<Err>('test1', { type: 'test2' } as Err);

    expect(err.error.type).toStrictEqual('test1');
  });
});
