import { Errs, Failure, Result, ok, fail, Err } from '../index';
import { Transform } from '../types';
import { Assert, Equal } from '../__stubs__/helpers';

type E1 = Errs<{
  e11: string;
  e12: string;
}>;

type E2 = Errs<{
  e21: string;
  e22: string;
}>;

type E3 = Errs<{
  e31: string;
  e32: string;
}>;

type E4 = Errs<{
  e41: { test1: number };
  e42: { test2: string };
}>;

const rnd = (success: boolean): Result<string, E1['e11']> => {
  return success ? ok('r1') : fail<E1['e11']>('e11');
};

describe('onOk', () => {
  const onOk = () => {
    return ok(true) as Result<boolean, E2['e21']>;
  };

  it('success', () => {
    expect.assertions(2);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    const transformed = rOk.onOk(onOk);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Expected = Assert<true, Equal<typeof transformed, Result<boolean, E1['e11'] | E2['e21']>>>;
    expect(transformed.ok()).toStrictEqual(true);
  });

  it('fail', () => {
    expect.assertions(2);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    // correct: because rErr is failure,
    // but if it was success transformed
    // type was Result<boolean, e11 | e21>
    const transformed = rErr.onOk(onOk);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Expected = Assert<true, Equal<typeof transformed, Result<boolean, E1['e11'] | E2['e21']>>>;
    expect(transformed.err().type).toStrictEqual('e11');
  });
});

describe('onErr', () => {
  const onErr = () => {
    return fail<E2['e21']>('e21');
  };

  it('success', () => {
    expect.assertions(2);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    const transformed = rOk.onErr(onErr);

    expect(transformed.ok()).toStrictEqual('r1');
  });

  it('success isOk and onOk', () => {
    expect.assertions(4);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    if (rOk.isOk()) {
      const r0 = rOk.onErr();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type ExpectedR0 = Assert<true, Equal<typeof r0, never>>;

      const r1 = rOk.onOk(() => {
        return ok('r11');
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type ExpectedR1 = Assert<true, Equal<typeof r1, Result<string, E1['e11']>>>;
      // eslint-disable-next-line jest/no-conditional-expect
      expect(r1.ok()).toStrictEqual('r11');

      const r2 = rOk.onOk(() => {
        return fail<E2['e21']>('e21');
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type ExpectedR2 = Assert<true, Equal<typeof r2, Result<never, E1['e11'] | E2['e21']>>>;
      // eslint-disable-next-line jest/no-conditional-expect
      expect(r2.err().type).toStrictEqual('e21');

      const r3 = rOk.onOk(() => {
        return Math.random() !== -1 ? ok(1) : fail<E2['e21']>('e21');
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type ExpectedR3 = Assert<true, Equal<typeof r3, Result<number, E1['e11'] | E2['e21']>>>;
      // eslint-disable-next-line jest/no-conditional-expect
      expect(r3.ok()).toStrictEqual(1);
    }
  });

  it('fail', () => {
    expect.assertions(2);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    const transformed = rErr.onErr(onErr);

    expect(transformed.err().type).toStrictEqual('e21');
  });

  it('fail isErr and onErr', () => {
    expect.assertions(5);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    if (rErr.isErr()) {
      const r0 = rErr.onOk();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type ExpectedR = Assert<true, Equal<typeof r0, never>>;

      const r1 = rErr.onErr(() => {
        return fail<E1['e11']>('e11');
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type ExpectedR1 = Assert<
        true,
        Equal<typeof r1, Failure<E1['e11']> & Transform<string, E1['e11']>>
      >;
      // eslint-disable-next-line jest/no-conditional-expect
      expect(r1.err().type).toStrictEqual('e11');

      const r2 = rErr.onErr(() => {
        return 'e12' as const;
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type ExpectedR2 = Assert<
        true,
        Equal<typeof r2, Failure<E1['e12']> & Transform<string, E1['e12']>>
      >;
      // eslint-disable-next-line jest/no-conditional-expect
      expect(r2.err().type).toStrictEqual('e12');

      const r3 = r2.onErr(() => {
        return 'e31' as const;
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type ExpectedR3 = Assert<
        true,
        Equal<typeof r3, Failure<E3['e31']> & Transform<string, E3['e31']>>
      >;
      // eslint-disable-next-line jest/no-conditional-expect
      expect(r3.err().type).toStrictEqual('e31');

      const r4 = r3.onErr(() => {
        return { type: 'e41' as const, test1: 5 };
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type ExpectedR4 = Assert<
        true,
        Equal<typeof r4, Failure<E4['e41']> & Transform<string, E4['e41']>>
      >;
      // eslint-disable-next-line jest/no-conditional-expect
      expect(r4.err().type).toStrictEqual('e41');
    }
  });
});

describe('chaining onOk and onErr', () => {
  it('success then error', () => {
    expect.assertions(8);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    const trOk = rOk.onOk(() => {
      return ok(3);
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ExpectedTrOk = Assert<true, Equal<typeof trOk, Result<number, E1['e11']>>>;
    expect(trOk.ok()).toStrictEqual(3);

    const trErr = rOk.onOk(() => {
      if (Math.random() === -1) {
        return ok('1');
      }

      return fail<E2['e21']>('e21');
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ExpectedTrErr = Assert<true, Equal<typeof trErr, Result<string, E1['e11'] | E2['e21']>>>;
    expect(trErr.err().type).toStrictEqual('e21');

    const tr1 = trErr.onOk(() => {
      return ok({ tr1: true });
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ExpectedTr1 = Assert<
      true,
      Equal<typeof tr1, Result<{ tr1: boolean }, E1['e11'] | E2['e21']>>
    >;
    expect(tr1.err().type).toStrictEqual('e21');

    const tr2 = trErr.onOk(() => {
      return fail<E3['e31']>('e31');
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ExpectedTr2 = Assert<
      true,
      Equal<typeof tr2, Result<never, E1['e11'] | E2['e21'] | E3['e31']>>
    >;
    expect(tr2.err().type).toStrictEqual('e21');

    const tr3 = trErr.onErr(() => {
      return fail<E4['e41']>('e41');
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ExpectedTr3 = Assert<true, Equal<typeof tr3, Result<string, E4['e41']>>>;
    expect(tr3.err().type).toStrictEqual('e41');
  });

  it('two results', () => {
    expect.assertions(8);

    const chainOnOkOnErr = (s1: boolean, s2: boolean): Result<{ r2: boolean }, E3['e31']> => {
      const r1: Result<{ r1: true }, E1['e11']> = s1 ? ok({ r1: true }) : fail('e11');

      const r2 = r1.onOk(() => {
        return (s2 ? ok({ r2: true }) : fail('e21')) as Result<{ r2: boolean }, E2['e21']>;
      });

      const r3 = r2.onErr(() => {
        return fail<E3['e31']>('e31');
      });

      return r3;
    };

    expect(chainOnOkOnErr(true, true).ok()).toStrictEqual({ r2: true });
    expect(chainOnOkOnErr(true, false).err().type).toStrictEqual('e31');
    expect(chainOnOkOnErr(false, true).err().type).toStrictEqual('e31');
    expect(chainOnOkOnErr(false, false).err().type).toStrictEqual('e31');

    const chainOnErrOnOk = (s1: boolean, s2: boolean): Result<{ r2: boolean }, E3['e31']> => {
      const r1: Result<{ r1: true }, E1['e11']> = s1 ? ok({ r1: true }) : fail('e11');

      const r2 = r1.onErr(() => {
        return fail<E3['e31']>('e31');
      });

      const r3 = r2.onOk(() => {
        return (s2 ? ok({ r2: true }) : fail('e31')) as Result<{ r2: boolean }, E3['e31']>;
      });

      return r3;
    };

    expect(chainOnErrOnOk(true, true).ok()).toStrictEqual({ r2: true });
    expect(chainOnErrOnOk(true, false).err().type).toStrictEqual('e31');
    expect(chainOnErrOnOk(false, true).err().type).toStrictEqual('e31');
    expect(chainOnErrOnOk(false, false).err().type).toStrictEqual('e31');
  });

  it('dot chaining', () => {
    expect.assertions(1);

    // eslint-disable-next-line jest/no-if
    const r: Result<string, Errs<E1>> = Math.random() ? ok('ok') : fail('e11');

    expect(
      r
        .onOk(() => {
          return ok(1);
        })
        .onErr(() => {
          return fail<Errs<E2>>('e21');
        })
        .ok()
    ).toStrictEqual(1);
  });
});

describe('different onErr return types', () => {
  it('works with string type', () => {
    expect.assertions(3);

    // eslint-disable-next-line jest/no-if
    const r: Result<string, E1['e11']> = Math.random() ? fail('e11') : ok('ok');

    expect(r.err().type).toStrictEqual('e11');

    expect(
      r
        .onErr(() => {
          return 'e12';
        })
        .err().type
    ).toStrictEqual('e12');

    const r2: Result<string, Errs<E2>> = r.onErr(() => {
      if (Math.random() === -1) {
        return fail('e21');
      }

      return Math.random() ? 'e21' : { type: 'e22' as const }; // checking type compatability
    });

    expect(r2.err().type).toStrictEqual('e21');
  });

  it('works with raw object type', () => {
    expect.assertions(4);

    // eslint-disable-next-line jest/no-if
    const r: Result<string, Errs<E1>> = Math.random() ? fail('e11') : ok('ok');

    expect(r.err().type).toStrictEqual('e11');

    expect(
      r
        .onErr(() => {
          return { type: 'e12' };
        })
        .err().type
    ).toStrictEqual('e12');

    const r2: Result<string, Errs<E2>> = r.onErr(() => {
      if (Math.random() === -1) {
        return fail('e22');
      }

      return Math.random() ? { type: 'e21' as const } : 'e22'; // checking type compatability
    });

    expect(r2.err().type).toStrictEqual('e21');

    const r3: Result<string, Errs<E4>> = r.onErr(() => {
      if (Math.random() === -1) {
        // will not works if type of test2 is not string
        return { type: 'e42' as const, test2: '1' }; // checking type compatability
      }

      return { type: 'e41' as const, test1: 1 }; // checking type compatability
    });

    const err = r3.err();
    expect(err.type === 'e41' ? err.test1 : undefined).toStrictEqual(1);
  });

  it('throws error for invalid err type', () => {
    expect.assertions(2);

    // eslint-disable-next-line jest/no-if
    const r: Result<string, Errs<E1>> = Math.random() ? fail('e11') : ok('ok');

    expect(() => {
      r.onErr(() => {
        return ({ a: 'e12' } as unknown) as Err;
      });
    }).toThrow("Can't convert to error");

    expect(() => {
      r.onErr(() => {
        return 5 as never;
      });
    }).toThrow("Can't convert to error");
  });
});
