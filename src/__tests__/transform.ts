import { Errs, Result, ok, fail } from '../index';
import { Transform } from '../result';
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

  // eslint-disable-next-line @typescript-eslint/require-await
  const onOkAsync = async () => {
    return ok(true) as Result<boolean, E2['e21']>;
  };

  it('onOk success', async () => {
    expect.assertions(3);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    const transformed = rOk.onOk(onOk);

    type Expected = Assert<true, Equal<typeof transformed, Result<boolean, E1['e11'] | E2['e21']>>>;
    expect(transformed.ok()).toStrictEqual(true);

    const transformedAsync = rOk.onOk(onOkAsync);

    type ExpectedAsync = Assert<
      true,
      Equal<typeof transformedAsync, Transform<boolean, E1['e11'] | E2['e21']>>
    >;
    expect((await transformedAsync.res()).ok()).toStrictEqual(true);
  });

  it('onOk fail', async () => {
    expect.assertions(3);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    // correct: because rErr is failure,
    // but if it was success transformed
    // type was Result<boolean, e11 | e21>
    const r1 = rErr.onOk(onOk);

    type Expected = Assert<true, Equal<typeof r1, Result<boolean, E1['e11'] | E2['e21']>>>;
    expect(r1.err().type).toStrictEqual('e11');

    const r1Async = rErr.onOk(onOkAsync);

    type ExpectedAsync = Assert<
      true,
      Equal<typeof r1Async, Transform<boolean, E1['e11'] | E2['e21']>>
    >;
    expect((await r1Async.res()).err().type).toStrictEqual('e11');
  });

  it('onOk and isOk', async () => {
    expect.assertions(6);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    if (rOk.isOk()) {
      const r1 = rOk.onOk(() => {
        return ok('r11');
      });

      type ExpectedR1 = Assert<true, Equal<typeof r1, Result<string, never>>>;
      expect(r1.ok()).toStrictEqual('r11');

      // eslint-disable-next-line @typescript-eslint/require-await
      const r1Async = rOk.onOk(async () => {
        return ok('r11');
      });

      type ExpectedR1Async = Assert<true, Equal<typeof r1Async, Transform<string, never>>>;
      expect((await r1Async.res()).ok()).toStrictEqual('r11');

      const r2 = rOk.onOk(() => {
        return fail<E2['e21']>('e21');
      });

      type ExpectedR2 = Assert<true, Equal<typeof r2, Result<never, E2['e21']>>>;
      expect(r2.err().type).toStrictEqual('e21');

      const r3 = rOk.onOk(() => {
        return Math.random() !== -1 ? ok(1) : fail<E2['e21']>('e21');
      });

      type ExpectedR3 = Assert<true, Equal<typeof r3, Result<number, E2['e21']>>>;
      expect(r3.ok()).toStrictEqual(1);

      const r4 = r2.onOk(() => {
        return Math.random() !== -1 ? ok(false) : fail<E3['e31']>('e31');
      });

      type ExpectedR4 = Assert<true, Equal<typeof r4, Result<boolean, E2['e21'] | E3['e31']>>>;
      expect(r4.err().type).toStrictEqual('e21');
    }
  });
});

describe('onFail', () => {
  const onFail = () => {
    return fail<E2['e21']>('e21');
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  const onFailAsync = async () => {
    return fail<E2['e21']>('e21');
  };

  it('onFail success', async () => {
    expect.assertions(4);

    const rOk = rnd(true);

    expect(rOk.ok()).toStrictEqual('r1');

    const r1 = rOk.onFail(onFail);

    type ExpectedR1 = Assert<true, Equal<typeof r1, Result<string, E2['e21']>>>;
    expect(r1.ok()).toStrictEqual('r1');

    const r1Async = rOk.onFail(onFailAsync);

    type ExpectedR1Async = Assert<true, Equal<typeof r1Async, Transform<string, E2['e21']>>>;
    expect((await r1Async.res()).ok()).toStrictEqual('r1');
    expect((await r1Async.res()).ok()).toStrictEqual('r1'); // can call res twice
  });

  it('onFail failure', async () => {
    expect.assertions(4);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    const r1 = rErr.onFail(onFail);

    type ExpectedR1 = Assert<true, Equal<typeof r1, Result<string, E2['e21']>>>;
    expect(r1.err().type).toStrictEqual('e21');

    const r1Async = rErr.onFail(onFailAsync);

    type ExpectedR1Async = Assert<true, Equal<typeof r1Async, Transform<string, E2['e21']>>>;
    expect((await r1Async.res()).err().type).toStrictEqual('e21');
    expect((await r1Async.res()).err().type).toStrictEqual('e21'); // can call res twice
  });

  it('onFail and isErr', async () => {
    expect.assertions(3);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    if (rErr.isErr()) {
      const r1 = rErr.onFail(() => {
        return fail<E1['e11']>('e11');
      });

      type ExpectedR1 = Assert<true, Equal<typeof r1, Result<never, E1['e11']>>>;
      expect(r1.err().type).toStrictEqual('e11');

      // eslint-disable-next-line @typescript-eslint/require-await
      const r1Async = rErr.onFail(async () => {
        return fail<E1['e11']>('e11');
      });

      type ExpectedR1Async = Assert<true, Equal<typeof r1Async, Transform<never, E1['e11']>>>;
      expect((await r1Async.res()).err().type).toStrictEqual('e11');
    }
  });
});

describe('result and transform compatibility', () => {
  it('can assign transform to result', async () => {
    expect.assertions(1);

    const t1 = {} as Transform<string, E1['e11']>;

    // eslint-disable-next-line jest/no-if
    const r1 = Math.random() ? rnd(true) : t1;

    type ExpectedR1 = Assert<
      true,
      Equal<typeof r1, Transform<string, E1['e11']> | Result<string, E1['e11']>>
    >;
    expect((await r1.res()).ok()).toStrictEqual('r1');
  });

  it('can assign result to transform', async () => {
    expect.assertions(1);

    let t1: Transform<string, E1['e11']>;

    const r1 = rnd(true);

    // eslint-disable-next-line prefer-const
    t1 = r1;

    type ExpectedT1 = Assert<true, Equal<typeof t1, Transform<string, E1['e11']>>>;
    expect((await t1.res()).ok()).toStrictEqual('r1');
  });
});

describe('infer type from result', () => {
  it('onOk infer type from result', () => {
    expect.assertions(1);

    const rOk = rnd(true);

    // if E1['e11'] or E1['e12'] removed there must be an error
    const r1: Result<number, E1['e11'] | E1['e12']> = rOk.onOk(() => {
      if (Math.random() === -1) {
        return fail('e12'); // must only allow e12 type here
      }

      return ok(1);
    });

    expect(r1.ok()).toStrictEqual(1);
  });

  it('onFail infer type from result', () => {
    expect.assertions(1);

    const rErr = rnd(false);

    const r1: Result<string, E2['e21']> = rErr.onFail(() => {
      return fail('e21'); // must only allow e21 type here
    });

    expect(r1.err().type).toStrictEqual('e21');
  });

  it('onFail from function', () => {
    expect.assertions(2);

    const r1: Result<string, E1['e11']> = rnd(false);

    expect(r1.err().type).toStrictEqual('e11');

    const r2 = (): Result<number, Errs<E2>> => {
      if (r1.isErr()) {
        return r1.onFail(() => {
          return fail<E2['e21']>('e21');
        });
      }

      return ok(1);
    };

    expect(r2().err().type).toStrictEqual('e21');
  });

  it('onErr from function', () => {
    expect.assertions(2);

    const r1: Result<string, E1['e11']> = rnd(false);

    expect(r1.err().type).toStrictEqual('e11');

    const r2 = (): Result<number, Errs<E2>> => {
      if (r1.isErr()) {
        return r1.onErr(() => {
          return 'e21';
        });
      }

      return ok(1);
    };

    expect(r2().err().type).toStrictEqual('e21');
  });
});

describe('onErr', () => {
  it('onErr works with raw object type', () => {
    expect.assertions(2);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    const r1 = rErr.onErr(() => {
      return { type: 'e12' };
    });

    expect(r1.err().type).toStrictEqual('e12');
  });

  it('onErr works with string type', () => {
    expect.assertions(2);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    const r1 = rErr.onErr(() => {
      return 'e12';
    });

    expect(r1.err().type).toStrictEqual('e12');
  });

  it('onErr type compatability between string and object', () => {
    expect.assertions(2);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    const r1 = rErr.onErr(() => {
      if (Math.random()) {
        return 'e21';
      }

      return { type: 'e22' };
    });

    type ExpectedR1 = Assert<true, Equal<typeof r1, Result<string, E2['e21'] | E2['e22']>>>;
    expect(r1.err().type).toStrictEqual('e21');
  });

  it('onErr type compatability between result', () => {
    expect.assertions(2);

    const rErr = rnd(false);

    expect(rErr.err().type).toStrictEqual('e11');

    const r1: Result<string, Errs<E2>> = rErr.onErr(() => {
      if (Math.random()) {
        return 'e21';
      }

      return { type: 'e22' };
    });

    expect(r1.err().type).toStrictEqual('e21');
  });
});

describe('chaining sync', () => {
  it('success then error', () => {
    expect.assertions(6);

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

    const tr3 = trErr.onFail(() => {
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

      const r3 = r2.onFail(() => {
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

      const r2 = r1.onFail(() => {
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

describe('chaining async', () => {
  it('async onOk chains', async () => {
    expect.assertions(14);

    const r1 = rnd(true);

    const r2 = r1.onOk(() => {
      return ok({ r2: true });
    });

    expect(r2.ok()).toStrictEqual({ r2: true });

    // eslint-disable-next-line @typescript-eslint/require-await
    const r3 = r2.onOk(async (res) => {
      expect(res).toStrictEqual({ r2: true });

      return ok({ r3: true });
    });

    expect((await r3.res()).ok()).toStrictEqual({ r3: true });

    // eslint-disable-next-line @typescript-eslint/require-await
    const r4 = r2.onOk(async (res) => {
      expect(res).toStrictEqual({ r2: true });

      return ok({ r4: true });
    });

    // eslint-disable-next-line @typescript-eslint/require-await
    const r5 = r3.onOk(async (res) => {
      expect(res).toStrictEqual({ r3: true });

      return ok({ r5: true });
    });

    expect((await r3.res()).ok()).toStrictEqual({ r3: true });
    expect((await r4.res()).ok()).toStrictEqual({ r4: true });
    expect((await r5.res()).ok()).toStrictEqual({ r5: true });

    const r6 = r3.onOk(() => {
      return fail<E2['e22']>('e22');
    });

    expect((await r6.res()).err().type).toStrictEqual('e22');

    const r7 = r6.onOk(() => {
      return ok({ r7: true });
    });

    // ensure that we didn't mess up with prev results
    expect((await r3.res()).ok()).toStrictEqual({ r3: true });
    expect((await r4.res()).ok()).toStrictEqual({ r4: true });
    expect((await r5.res()).ok()).toStrictEqual({ r5: true });

    expect((await r6.res()).err().type).toStrictEqual('e22');
    expect((await r7.res()).err().type).toStrictEqual('e22');
  });

  it('async onErr chains', async () => {
    expect.assertions(12);

    const r1 = rnd(false);

    const r2 = r1.onFail(() => {
      return fail<E1['e12']>('e12');
    });

    expect(r2.err().type).toStrictEqual('e12');

    // eslint-disable-next-line @typescript-eslint/require-await
    const r3 = r2.onFail(async (res) => {
      expect(res.type).toStrictEqual('e12');

      return fail<E2['e21']>('e21');
    });

    expect((await r3.res()).err().type).toStrictEqual('e21');

    // eslint-disable-next-line @typescript-eslint/require-await
    const r4 = r2.onFail(async (res) => {
      expect(res.type).toStrictEqual('e12');

      return fail<E2['e22']>('e22');
    });

    // eslint-disable-next-line @typescript-eslint/require-await
    const r5 = r3.onFail(async (res) => {
      expect(res.type).toStrictEqual('e21');

      return fail<E3['e31']>('e31');
    });

    expect((await r3.res()).err().type).toStrictEqual('e21');
    expect((await r4.res()).err().type).toStrictEqual('e22');
    expect((await r5.res()).err().type).toStrictEqual('e31');

    const r6 = r3.onOk(() => {
      return ok({ r7: true });
    });

    expect((await r6.res()).err().type).toStrictEqual('e21');

    const r7 = r3.onFail(() => {
      return fail<undefined>(undefined);
    });

    expect((await r7.res()).err()).toStrictEqual({ type: undefined });

    const r8 = rnd(true);

    // eslint-disable-next-line @typescript-eslint/require-await
    const r9 = r8.onOk(async () => {
      return ok({ r9: true });
    });

    expect((await r9.res()).ok()).toStrictEqual({ r9: true });

    // eslint-disable-next-line @typescript-eslint/require-await
    const r10 = r9.onFail(async () => {
      return fail<E2['e21']>('e21');
    });

    expect((await r10.res()).ok()).toStrictEqual({ r9: true });
  });
});

/* eslint-disable @typescript-eslint/require-await,jest/no-if */
describe('chaining async and sync', () => {
  describe('onOk', () => {
    it('onOk start with success', async () => {
      expect.assertions(16);

      const chain = async (err: boolean) => {
        const r0 = rnd(true);
        expect(r0.ok()).toStrictEqual('r1');

        const r1 = r0.onOk(() => {
          return ok(true);
        });
        expect(r1.ok()).toStrictEqual(true);

        const r21 = r1.onOk(() => {
          return ok(1);
        });
        expect(r21.ok()).toStrictEqual(1);

        const r22 = r1.onOk(async () => {
          return ok(2);
        });
        expect((await r22.res()).ok()).toStrictEqual(2);

        const r31 = r22.onOk(() => {
          return ok('r31');
        });
        expect((await r31.res()).ok()).toStrictEqual('r31');

        const r32 = r22.onOk(async () => {
          return ok('r32');
        });
        expect((await r32.res()).ok()).toStrictEqual('r32');

        const r41 = err
          ? r32.onFail(() => {
              return fail<E3['e31']>('e31');
            })
          : r32.onErr(() => {
              return 'e31';
            });
        expect((await r41.res()).ok()).toStrictEqual('r32');

        const r42 = err
          ? r32.onFail(async () => {
              return fail<E3['e31']>('e31');
            })
          : r32.onErr(() => {
              return 'e31' as const;
            });
        expect((await r42.res()).ok()).toStrictEqual('r32');
      };

      await chain(false);
      await chain(true);
    });

    it('onOk start with error', async () => {
      expect.assertions(5);

      const r1 = rnd(false);
      expect(r1.err().type).toStrictEqual('e11');

      const r21 = r1.onOk(() => {
        return ok(1);
      });
      expect(r21.err().type).toStrictEqual('e11');

      const r22 = r1.onOk(async () => {
        return ok(2);
      });
      expect((await r22.res()).err().type).toStrictEqual('e11');

      const r31 = r21.onOk(async () => {
        return ok(true);
      });
      expect((await r31.res()).err().type).toStrictEqual('e11');

      const r32 = r22.onOk(async () => {
        return ok(true);
      });
      expect((await r32.res()).err().type).toStrictEqual('e11');
    });
  });

  describe('onFail', () => {
    it('onFail start with success', async () => {
      expect.assertions(20);

      const chain = async (err: boolean) => {
        const r0 = rnd(true);
        expect(r0.ok()).toStrictEqual('r1');

        const r1 = err
          ? r0.onFail(() => {
              return fail<E1['e12']>('e12');
            })
          : r0.onErr(() => {
              return 'e12' as const;
            });
        expect(r1.ok()).toStrictEqual('r1');

        const r2 = err
          ? r1.onFail(async () => {
              return fail<E2['e21']>('e21');
            })
          : r1.onErr(async () => {
              return 'e21' as const;
            });
        expect((await r2.res()).ok()).toStrictEqual('r1');

        const r3 = r2.onOk(() => {
          return ok(4);
        });
        expect((await r3.res()).ok()).toStrictEqual(4);

        const r41 = err
          ? r3.onFail(() => {
              return fail<E2['e22']>('e22');
            })
          : r3.onErr(() => {
              return 'e22' as const;
            });
        expect((await r41.res()).ok()).toStrictEqual(4);

        const r42 = err
          ? r3.onFail(async () => {
              return fail<E3['e31']>('e31');
            })
          : r3.onErr(async () => {
              return 'e31' as const;
            });
        expect((await r42.res()).ok()).toStrictEqual(4);

        const r51 = r41.onOk(() => {
          return ok(true);
        });
        expect((await r51.res()).ok()).toStrictEqual(true);

        const r52 = r41.onOk(async () => {
          return ok(true);
        });
        expect((await r52.res()).ok()).toStrictEqual(true);

        const r61 = r42.onOk(() => {
          return ok(true);
        });
        expect((await r61.res()).ok()).toStrictEqual(true);

        const r62 = r42.onOk(async () => {
          return ok(true);
        });
        expect((await r62.res()).ok()).toStrictEqual(true);
      };

      await chain(false);
      await chain(true);
    });

    it('onFail start with error', async () => {
      expect.assertions(20);

      const chain = async (err: boolean) => {
        const r0 = rnd(false);
        expect(r0.err().type).toStrictEqual('e11');

        const r1 = err
          ? r0.onFail(() => {
              return fail<E1['e12']>('e12');
            })
          : r0.onErr(() => {
              return 'e12' as const;
            });
        expect(r1.err().type).toStrictEqual('e12');

        const r2 = err
          ? r1.onFail(async () => {
              return fail<E2['e21']>('e21');
            })
          : r1.onErr(async () => {
              return 'e21' as const;
            });
        expect((await r2.res()).err().type).toStrictEqual('e21');

        const r3 = r2.onOk(() => {
          return ok(4);
        });
        expect((await r3.res()).err().type).toStrictEqual('e21');

        const r41 = err
          ? r3.onFail(() => {
              return fail<E2['e22']>('e22');
            })
          : r3.onErr(() => {
              return 'e22' as const;
            });
        expect((await r41.res()).err().type).toStrictEqual('e22');

        const r42 = err
          ? r3.onFail(async () => {
              return fail<E3['e31']>('e31');
            })
          : r3.onErr(async () => {
              return 'e31' as const;
            });
        expect((await r42.res()).err().type).toStrictEqual('e31');

        const r51 = r41.onOk(() => {
          return ok(true);
        });
        expect((await r51.res()).err().type).toStrictEqual('e22');

        const r52 = r41.onOk(async () => {
          return ok(true);
        });
        expect((await r52.res()).err().type).toStrictEqual('e22');

        const r61 = r42.onOk(() => {
          return ok(true);
        });
        expect((await r61.res()).err().type).toStrictEqual('e31');

        const r62 = r42.onOk(async () => {
          return ok(true);
        });
        expect((await r62.res()).err().type).toStrictEqual('e31');
      };

      await chain(false);
      await chain(true);
    });
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
        .onFail(() => {
          return fail<Errs<E2>>('e21');
        })
        .ok()
    ).toStrictEqual(1);
  });
});
/* eslint-enable @typescript-eslint/require-await,jest/no-if */

describe('onErr and onFail exceptions', () => {
  it('throws error for invalid err type', async () => {
    expect.assertions(5);

    const r = rnd(false);

    const badResult = (): string | { type: string } => {
      return 5 as never;
    };

    // eslint-disable-next-line @typescript-eslint/require-await
    const badResultAsync = async () => {
      return badResult();
    };

    expect(() => {
      r.onErr(badResult);
    }).toThrow("Can't convert to error");

    await expect(async () => {
      await r.onErr(badResultAsync).res();
    }).rejects.toThrow("Can't convert to error");

    // eslint-disable-next-line @typescript-eslint/require-await
    const r1 = r.onErr(async () => {
      return { type: 'e1' };
    });

    expect((await r1.res()).err().type).toStrictEqual('e1');

    await expect(async () => {
      await r1.onErr(badResult).res();
    }).rejects.toThrow("Can't convert to error");

    await expect(async () => {
      await r1.onErr(badResultAsync).res();
    }).rejects.toThrow("Can't convert to error");
  });
});
