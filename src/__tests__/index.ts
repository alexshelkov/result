import { Err, Errs, Success, Failure, Result, ErrLevel, ok, nope, fail } from '../index';

type E1 = Err<'e1'>;

type E2 = Err<'e2', { stringAdded: 'e2data' }>;

interface E3<T> extends Err {
  type: 'e3';
  numberAdded: T;
}

type AppErr = E1 | E2 | E3<number>;

type Expect<T extends true> = T;

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

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

    const check = (err: Group1Errs) => {
      if (err.type === 'ErrsErr1') {
        return 1;
      }
      if (err.type === 'ErrsErr2') {
        return 2;
      }
      if (err.type === 'ErrsErr3') {
        return 3;
      }

      nope(err);

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
      expect.assertions(3);

      // eslint-disable-next-line jest/no-if
      const r1 = Math.random() !== -1 ? ok(1) : fail<Err<'e1' | 'e3'>>('e1');

      expect(r1.ok()).toStrictEqual(1);

      type R2 = Failure<Err<'e1' | 'e3'>> | Failure<E2> | Success<number>;

      const e1 = fail<E2>('e2', { stringAdded: 'e2data' });
      const r2 = Math.random() !== -1 ? e1 : r1;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type ExpextedR2 = Expect<Equal<R2, typeof r2>>;

      expect(r2.err().type).toStrictEqual('e2');

      const r3 = Math.random() !== -1 ? r2 : r1;

      expect(
        // eslint-disable-next-line no-nested-ternary
        r3.isErr() ? (r3.error.type === 'e2' ? r3.error.stringAdded : undefined) : undefined
      ).toStrictEqual('e2data');
    });
  });
});

describe('result on methods', () => {
  it('error is undefined', () => {
    expect.assertions(2);

    const err1 = fail<undefined>(undefined);

    expect(
      err1.onAnyErr((err) => {
        return err;
      })
    ).toBeUndefined();

    expect(
      err1.onErr('Err', ({ type }) => {
        const t: never = type;
        return t;
      })
    ).toBeUndefined();
  });

  describe('errors types', () => {
    type Group = Errs<{
      name: null;
      Err1: string;
      Err2: {
        addedString: string;
      };
      Err3: string;
      Err4: string;
    }>;

    const err1 =
      // eslint-disable-next-line jest/no-if
      Math.random() !== -1
        ? fail<Group['Err1'] | Group['Err2'] | Group['Err3']>('Err2', {
            addedString: 'str',
          } as Group['Err2'])
        : ok('ok1');

    it('err1', () => {
      expect.assertions(6);

      expect(err1.err().type).toStrictEqual('Err2');

      expect(
        err1.onAnyErr((err) => {
          return err.type;
        })
      ).toStrictEqual('Err2');

      expect(
        err1.onErr('Err2', (err) => {
          return err.type;
        })
      ).toStrictEqual('Err2');

      expect(
        err1.onErr('Err1', (err) => {
          return err.type;
        })
      ).toBeUndefined();

      expect(
        err1.onErr('Err', (err) => {
          const e: never = err;
          return e;
        })
      ).toBeUndefined();

      expect(
        err1.onOk((data) => {
          return data;
        })
      ).toBeUndefined();
    });

    const res1 = Math.random() !== -1 ? ok('ok2') : err1;

    it('res1', () => {
      expect.assertions(3);

      expect(
        res1.onOk((data) => {
          return data;
        })
      ).toStrictEqual('ok2');

      expect(
        res1.onAnyErr(({ type }) => {
          const t: 'Err1' | 'Err2' | 'Err3' = type;
          return t;
        })
      ).toBeUndefined();

      expect(
        res1.onErr('Err1', ({ type }) => {
          const t: 'Err1' = type;
          return t;
        })
      ).toBeUndefined();
    });

    const res2: Result<string, Errs<Group>> =
      Math.random() !== -1 ? fail<Group['Err4']>('Err4') : res1;

    it('res2', () => {
      expect.assertions(3);

      expect(
        res2.onOk((data) => {
          return data;
        })
      ).toBeUndefined();

      expect(
        res2.onErr('Err4', (err) => {
          return err.type;
        })
      ).toStrictEqual('Err4');

      expect(
        res2.onErr('Err', (err) => {
          const e: never = err;
          return e;
        })
      ).toBeUndefined();
    });

    const err2 =
      Math.random() !== -1
        ? fail<Errs<Group>>('Err2', { addedString: 'str' } as Group['Err2'])
        : ok(undefined);

    it('err2', () => {
      expect.assertions(1);

      expect(
        err2.onErr('Err2', (err) => {
          return err.addedString;
        })
      ).toStrictEqual('str');
    });

    const res3 = Math.random() !== -1 ? fail<Err<'e1'>>('e1') : fail<Err<'e2'>>('e2');

    it('res3', () => {
      expect.assertions(3);

      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res3.onAnyErr((err: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return err;
        })
      ).toStrictEqual({ type: 'e1' });

      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res3.onErr('e1', (err: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return err;
        })
      ).toStrictEqual({ type: 'e1' });

      type Res3 = Failure<Err<'e1' | 'e2'>>;

      expect(
        (res3 as Res3).onErr('e1', (err) => {
          return err.type;
        })
      ).toStrictEqual('e1');
    });
  });
});
