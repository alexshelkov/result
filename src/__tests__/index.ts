import { Err, fail, Failure, ok, Result } from '../index';

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
  it('returns data with ok method', () => {
    expect.assertions(2);

    // eslint-disable-next-line jest/no-if
    const result: Result<string, Err> = Math.random() !== -1 ? ok('data') : fail('');

    expect(result.ok()).toStrictEqual('data');
    expect(() => result.err()).toThrow("Can't access error on data");
  });

  it('returns error with err method', () => {
    expect.assertions(3);

    const result: Result<string, E2> =
      // eslint-disable-next-line jest/no-if
      Math.random() !== -1 ? fail('e2', { stringAdded: 'e2data' }) : ok('');

    expect(() => result.ok()).toThrow("Can't access data on error");
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

    function badAppError(p: never): never;
    function badAppError(p: AppErr): never {
      throw new Error(`Bad app error: ${p.type}`);
    }

    const test1 = (e: Failure<AppErr>) => {
      switch (e.error.type) {
        case 'e1':
          return 1;
        case 'e2':
          return 2;
        case 'e3':
          return 3;
        default:
          badAppError(e.error);
      }

      return 0;
    };

    const err = fail<E1>('e1');

    expect(test1(err)).toStrictEqual(1);
  });
});
