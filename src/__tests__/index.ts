import { Err, Errs, Result, ErrLevel, ok, nope, fail, err, Failure, Success } from '../index';
import { Assert, Equal, E1, E2, E3, AppErr } from '../__stubs__/helpers';

describe('result types compatability', () => {
  it('not allow to assign results with not different error type to each other', () => {
    expect.assertions(2);

    const r1: Result<string, Err<'e1'> | Err<'e2'>> = fail('e1');

    let r2: Result<string, Err<'e2'>> = fail('e2');

    expect(r1.err().type).toStrictEqual('e1');

    type Expected = Assert<false, Equal<typeof r2, typeof r1>>;

    if (Math.random()) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      r2 = r1; // this must be a TS error, need to be tested better
    }

    expect(r1.err().type).toStrictEqual('e1');
  });
});

describe('result and success/failure types compatability', () => {
  it('success assignable to result', () => {
    expect.assertions(2);

    const r1: Success<string> = ok('ok1');

    expect(r1.ok()).toStrictEqual('ok1');

    const r2: Result<string, never> = ({
      status: 'success',
      data: 'ok2',
    } as unknown) as Success<string>;

    expect(r2.data).toStrictEqual('ok2');
  });

  it('failure assignable to result', () => {
    expect.assertions(2);

    const r1: Failure<AppErr> = fail<E1>('e1');

    expect(r1.err().type).toStrictEqual('e1');

    const r2: Result<never, E1> = ({
      status: 'error',
      error: { type: 'e1' },
    } as unknown) as Failure<E1>;

    expect(r2.error.type).toStrictEqual('e1');
  });

  it('result is assignable to result with never as success or error', () => {
    expect.assertions(2);

    const r1: Result<string, E1> = ({ status: 'success', data: 'ok1' } as unknown) as Result<
      string,
      never
    >;

    // eslint-disable-next-line jest/no-if
    expect(r1.status === 'success' ? r1.data : undefined).toStrictEqual('ok1');

    const r2: Result<string, E1> = ({
      status: 'error',
      error: { type: 'e1' },
    } as unknown) as Result<never, E1>;

    // eslint-disable-next-line jest/no-if
    expect(r2.status === 'error' ? r2.error.type : undefined).toStrictEqual('e1');
  });

  it('narrowing success type', () => {
    expect.assertions(0);

    const r1 = ok('ok1');

    type ExpectedR1 = Assert<true, Equal<Success<string>, typeof r1>>;
    type ExpectedR2 = Assert<false, Equal<Result<string, never>, typeof r1>>;

    if (r1.isOk()) {
      type ExpectedR3 = Assert<true, Equal<Success<string>, typeof r1>>;
      type ExpectedR4 = Assert<false, Equal<Result<string, never>, typeof r1>>;
    }

    if (r1.isErr()) {
      type ExpectedR5 = Assert<true, Equal<Success<string>, typeof r1>>;
    }
  });

  it('narrowing error type', () => {
    expect.assertions(0);

    const r1 = fail<E1>('e1');

    type ExpectedR1 = Assert<true, Equal<Failure<E1>, typeof r1>>;
    type ExpectedR2 = Assert<false, Equal<Result<never, E1>, typeof r1>>;

    if (r1.isErr()) {
      type ExpectedR3 = Assert<true, Equal<Failure<E1>, typeof r1>>;
      type ExpectedR4 = Assert<false, Equal<Result<never, E1>, typeof r1>>;
    }

    if (r1.isOk()) {
      type ExpectedR5 = Assert<true, Equal<Failure<E1>, typeof r1>>;
    }
  });

  it('narrowing result to error or success type', () => {
    expect.assertions(0);

    // eslint-disable-next-line jest/no-if
    const r1: Result<string, E1> = Math.random() ? ok('1') : fail('e1');

    if (r1.isOk()) {
      type ExpectedR1 = Assert<true, Equal<Success<string>, typeof r1>>;
    }

    if (r1.isErr()) {
      type ExpectedR2 = Assert<true, Equal<Failure<E1>, typeof r1>>;
    }

    type ExpectedR3 = Assert<true, Equal<Result<string, E1>, typeof r1>>;
  });

  it('combines two results into one', () => {
    expect.assertions(2);

    type R1 = { r1: string };
    type R2 = { r2: number };

    // eslint-disable-next-line jest/no-if
    const r1: Result<R1, E1 | E2> = Math.random() ? ok({ r1: '1' }) : fail('e2');
    // eslint-disable-next-line jest/no-if
    const r2: Result<R2, E3<string>> = Math.random() ? ok({ r2: 2 }) : fail('e3');

    let r3: Result<{ ra: R1; rb: R2 }, AppErr>;

    r3 = ok({
      ra: r1.ok(),
      rb: r2.ok(),
    });

    expect(r3.ok()).toMatchObject({ ra: { r1: '1' }, rb: { r2: 2 } });

    r3 = fail('e1');

    expect(r3.err().type).toStrictEqual('e1');
  });
});

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

    const result: Result<string, Err<'e1'>> = fail('e1', { message: 'Some error' });

    expect(result.message).toStrictEqual('Some error');
    expect(result.err().message).toStrictEqual('Some error');
  });

  it('sets the empty string message correctly', () => {
    expect.assertions(3);

    const result: Result<string, Err> = fail('');

    expect(result.message).toStrictEqual('Unknown');
    expect(result.err().message).toBeUndefined();

    const result2: Result<string, undefined> = err(undefined);

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
      Math.random() !== -1 ? err(undefined) : ok('');

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
      Math.random() !== -1 ? fail<E2>('e2', { stringAdded: 'e2data' }) : ok('');

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(() => {
      return result.ok();
    }).toThrow("Can't access data on error");
    expect(result.err().type).toStrictEqual('e2');
    expect(result.err().stringAdded).toStrictEqual('e2data');
  });

  it('will check errors exhaustively', () => {
    expect.assertions(1);

    const test1 = (r: Result<never, AppErr>) => {
      const e = r.err();

      // eslint-disable-next-line jest/no-if
      switch (e.type) {
        case 'e1':
          return 1;
        case 'e2':
          return 2;
        case 'e3':
          return 3;
        default:
          nope(e);

          return 0;
      }
    };

    const e1 = fail<E1>('e1');

    expect(test1(e1)).toStrictEqual(1);
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

    const e1 = fail<Err>('test1', { type: 'test2' } as Err);

    expect(e1.err().type).toStrictEqual('test1');
  });

  it('works with errors groups', () => {
    expect.assertions(4);

    type Group1 = Errs<{
      name: 'Errs';
      Err1: string;
      Err2: string;
      Err3: {
        addedString: string;
      };
    }>;

    type Group1Errs = Errs<Group1>;

    const err1 = fail<Group1['Err3']>('ErrsErr3', { addedString: 'str' });

    expect(err1.err().type).toStrictEqual('ErrsErr3');

    const err2 = fail<Group1Errs>('ErrsErr2');

    const check = (e: Group1Errs) => {
      if (e.type === 'ErrsErr1') {
        return 1;
      }
      if (e.type === 'ErrsErr2') {
        return 2;
      }
      if (e.type === 'ErrsErr3') {
        return 3;
      }

      nope(e);

      return 0;
    };

    expect(check(err2.err())).toStrictEqual(2);

    type Group2 = Errs<{
      Err4: string;
      Err5: {
        addedNumber: number;
      };
      Err6: string;
    }>;

    const err3 = fail<Errs<Group2>>('Err5', { addedNumber: 5 } as Group2['Err5']);

    expect(err3.err().type).toStrictEqual('Err5');
    expect(
      // eslint-disable-next-line no-nested-ternary
      err3.isErr() ? (err3.error.type === 'Err5' ? err3.error.addedNumber : undefined) : undefined
    ).toStrictEqual(5);
  });

  describe('infer error based on its type', () => {
    it('type inferred from common result', () => {
      expect.assertions(4);

      let r1: Result<string, AppErr> = ok('1');

      expect.assertions(1);

      expect(r1.ok()).toStrictEqual('1');

      r1 = fail<E1>('e1');

      expect(r1.err().type).toStrictEqual('e1');

      r1 = fail<E2>('e2', { stringAdded: 'e2data' });

      expect.assertions(4);

      expect(
        // eslint-disable-next-line no-nested-ternary
        r1.isErr() ? (r1.error.type === 'e2' ? r1.error.stringAdded : null) : null
      ).toStrictEqual('e2data');

      r1 = fail<E3<number>>('e3', { numberAdded: 100 });

      expect(
        // eslint-disable-next-line no-nested-ternary
        r1.isErr() ? (r1.error.type === 'e3' ? r1.error.numberAdded : null) : null
      ).toStrictEqual(100);
    });

    it('types inferred from different fails and oks', () => {
      expect.assertions(4);

      // eslint-disable-next-line jest/no-if
      const r1 = Math.random() !== -1 ? ok(1) : fail<Err<'e1' | 'e3'>>('e1');

      expect(r1.ok()).toStrictEqual(1);

      type R2 = Failure<Err<'e1' | 'e3'>> | Failure<E2> | Success<number>;

      const e1 = fail<E2>('e2', { stringAdded: 'e2data' });
      const r2 = Math.random() !== -1 ? e1 : r1;

      type ExpectedR2 = Assert<true, Equal<R2, typeof r2>>;

      expect(r2.err().type).toStrictEqual('e2');

      const r3 = Math.random() !== -1 ? r2 : r1;

      expect(
        // eslint-disable-next-line no-nested-ternary
        r3.isErr() ? (r3.error.type === 'e2' ? r3.error.stringAdded : undefined) : undefined
      ).toStrictEqual('e2data');

      const res3: Result<number, Err<'e1' | 'e3'> | E2> = r3;

      expect(res3.isErr()).toBeTruthy();
    });
  });
});
