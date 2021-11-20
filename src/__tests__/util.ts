import { Err, Result, ok, fail, throwFail, err, compare, nope } from '../index';

describe('util', () => {
  it('works with skip option', () => {
    expect.assertions(2);

    const r1: Result<string, Err> = ok('', { skip: true });
    const r2: Result<string, Err> = fail('', { skip: true });

    expect(r1.order).toStrictEqual(-Infinity);
    expect(r2.order).toStrictEqual(-Infinity);
  });

  it('compare equal results', () => {
    expect.assertions(2);

    const r1: Result<string, Err> = ok('');
    const r2: Result<string, Err> = fail<Err>('');

    expect(compare(r1, r2)).toStrictEqual(r2);

    const r3: Result<string, Err> = fail('');
    const r4: Result<string, Err> = fail('');

    expect(compare(r3, r4)).toStrictEqual(r3);
  });

  it('compare not equal results', () => {
    expect.assertions(2);

    const r1: Result<string, Err> = fail('', { order: 1 });
    const r2: Result<string, Err> = fail('', { order: 2 });

    expect(compare(r1, r2)).toStrictEqual(r2);

    const r3: Result<string, Err> = fail('', { order: 2 });
    const r4: Result<string, Err> = fail('', { order: 1 });

    expect(compare(r3, r4)).toStrictEqual(r3);
  });

  it('undefined error type must not have error object', () => {
    expect.assertions(1);

    const r: Result<never, undefined> = err(undefined);

    expect(r.err()).toBeUndefined();
  });

  it('converting result to string', () => {
    expect.assertions(3);

    const r1 = ok('1');

    expect(r1.toString()).toStrictEqual('Success<"1">');

    const r2 = fail<Err>('1');

    expect(r2.toString()).toStrictEqual('Failure<{"type":"1"}>');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    (r2 as any).status = 'any';

    expect(() => {
      r2.toString();
    }).toThrow('Unknown status');
  });

  it('throw fail', () => {
    expect.assertions(2);

    expect(() => {
      throwFail<Err>('Thrown');
    }).toThrow('Thrown');

    expect(() => {
      const a: string | undefined = Math.random() === -1 ? 'never' : undefined;

      if (!a) {
        throwFail<Err>('Thrown');
      }

      // undefined is removed because
      // throwFail returns never
      const b: string = a;

      expect(b).toStrictEqual('never');
    }).toThrow('Thrown');
  });

  it('never will throw exception if called', () => {
    expect.assertions(1);

    expect(() => {
      nope(undefined as never);
    }).toThrow('Unreachable');
  });
});
