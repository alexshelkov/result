/* eslint-disable @typescript-eslint/require-await */
import { Errs, fail, ok, Response, Result } from '../index';

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
  const onOk = async () => {
    return ok(true) as Result<boolean, E2['e21']>;
  };

  it('success', async () => {
    expect.assertions(2);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    const transformed = await rOk.onOk(onOk);

    expect(transformed.ok()).toStrictEqual(true);
  });

  it('fail', async () => {
    expect.assertions(2);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    // correct: because rErr is failure,
    // but if it was success transformed
    // type was Result<boolean, e11 | e21>
    const transformed = await rErr.onOk(onOk);

    expect(transformed.err().type).toStrictEqual('e11');
  });
});

describe('onErr', () => {
  const onErr = async () => {
    return fail<E2['e21']>('e21');
  };

  it('success', async () => {
    expect.assertions(2);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    const transformed = await rOk.onErr(onErr);

    expect(transformed.ok()).toStrictEqual('r1');
  });

  it('fail', async () => {
    expect.assertions(2);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    const transformed = await rErr.onErr(onErr);

    expect(transformed.err().type).toStrictEqual('e21');
  });
});

describe('chaining onOk and onErr', () => {
  it('success then error', async () => {
    expect.assertions(6);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    const trOk = await rOk.onOk(async () => {
      return ok(3) as Result<number, E2['e21']>;
    });

    expect(trOk.ok()).toStrictEqual(3);

    const trErr = await rOk.onOk(async () => {
      return fail('e21') as Result<boolean, E2['e21']>;
    });

    expect(trErr.err().type).toStrictEqual('e21');

    const tr1 = await trErr.onOk(async () => {
      return ok({ tr1: true }) as Result<{ tr1: true }, E3['e31']>;
    });

    expect(tr1.err().type).toStrictEqual('e21');

    const tr2 = await trErr.onOk(async () => {
      return fail('e31') as Result<{ tr1: true }, E3['e31']>;
    });

    expect(tr2.err().type).toStrictEqual('e21');

    const tr3 = await trErr.onErr(async () => {
      return fail<E3['e31']>('e31');
    });

    expect(tr3.err().type).toStrictEqual('e31');
  });

  it('two results', async () => {
    expect.assertions(8);

    const chainOnOkOnErr = async (
      s1: boolean,
      s2: boolean
    ): Response<{ r2: boolean }, E3['e31']> => {
      const r1: Result<{ r1: true }, E1['e11']> = s1 ? ok({ r1: true }) : fail('e11');

      const r2 = await r1.onOk(async () => {
        return s2 ? ok({ r2: true }) : (fail('e21') as Result<{ r2: boolean }, E2['e21']>);
      });

      const r3 = r2.onErr(async () => {
        return fail<E3['e31']>('e31');
      });

      return r3;
    };

    expect((await chainOnOkOnErr(true, true)).ok()).toStrictEqual({ r2: true });
    expect((await chainOnOkOnErr(true, false)).err().type).toStrictEqual('e31');
    expect((await chainOnOkOnErr(false, true)).err().type).toStrictEqual('e31');
    expect((await chainOnOkOnErr(false, false)).err().type).toStrictEqual('e31');

    const chainOnErrOnOk = async (
      s1: boolean,
      s2: boolean
    ): Response<{ r2: boolean }, E3['e31']> => {
      const r1: Result<{ r1: true }, E1['e11']> = s1 ? ok({ r1: true }) : fail('e11');

      const r2 = await r1.onErr(async () => {
        return fail<E3['e31']>('e31');
      });

      const r3 = r2.onOk(async () => {
        return s2 ? ok({ r2: true }) : (fail('e31') as Result<{ r2: boolean }, E3['e31']>);
      });

      return r3;
    };

    expect((await chainOnErrOnOk(true, true)).ok()).toStrictEqual({ r2: true });
    expect((await chainOnErrOnOk(true, false)).err().type).toStrictEqual('e31');
    expect((await chainOnErrOnOk(false, true)).err().type).toStrictEqual('e31');
    expect((await chainOnErrOnOk(false, false)).err().type).toStrictEqual('e31');
  });
});
