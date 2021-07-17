import { Errs, fail, ok, Result } from '../index';

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

  it('fail', () => {
    expect.assertions(2);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    const transformed = rErr.onErr(onErr);

    expect(transformed.err().type).toStrictEqual('e21');
  });
});

describe('chaining onOk and onErr', () => {
  it('success then error', () => {
    expect.assertions(6);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    const trOk = rOk.onOk(() => {
      return ok(3);
    });

    expect(trOk.ok()).toStrictEqual(3);

    const trErr = rOk.onOk(() => {
      return fail<E2['e21']>('e21');
    });

    expect(trErr.err().type).toStrictEqual('e21');

    const tr1 = trErr.onOk(() => {
      return ok({ tr1: true });
    });

    expect(tr1.err().type).toStrictEqual('e21');

    const tr2 = trErr.onOk(() => {
      return fail<E3['e31']>('e31');
    });

    expect(tr2.err().type).toStrictEqual('e21');

    const tr3 = trErr.onErr(() => {
      return fail<E3['e31']>('e31');
    });

    expect(tr3.err().type).toStrictEqual('e31');
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
});
