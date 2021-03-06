import { Err, Result, ok, fail, err, compare, nope } from '../index';

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

  it('never will throw exception if called', () => {
    expect.assertions(1);

    expect(() => {
      return nope(undefined as never);
    }).toThrow('Unreachable');
  });
});
