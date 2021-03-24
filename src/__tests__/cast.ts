import { Result, toResult, Err } from '../index';

describe('to result', () => {
  it('not an object throws an error', () => {
    expect.assertions(2);

    expect(() => {
      return toResult(null);
    }).toThrow('Unexpected input');

    expect(() => {
      return toResult('123');
    }).toThrow('Unexpected input');
  });

  it('no status will throws an error', () => {
    expect.assertions(1);

    expect(() => {
      return toResult({ data: 1 });
    }).toThrow('Unexpected input');
  });

  it('will cast to success', () => {
    expect.assertions(1);

    const result = toResult({ status: 'success', data: 1 });

    expect(result.ok()).toStrictEqual(1);
  });

  it('will cast to error', () => {
    expect.assertions(1);

    const result = toResult({ status: 'error', error: { type: '' } });

    expect(result.err()).toStrictEqual({ type: '' });
  });

  it('extra error data is added correctly', () => {
    expect.assertions(1);

    const result = toResult({
      status: 'error',
      error: { type: 'error added', someErrorData: 'err' },
    });

    expect(result.err()).toStrictEqual({ type: 'error added', someErrorData: 'err' });
  });

  it('will fail to unexpected status', () => {
    expect.assertions(1);

    expect(() => {
      return toResult({ status: 'wrong', data: 1, error: { type: '' } });
    }).toThrow('Unexpected input');
  });

  it('will fail cast to error if no error', () => {
    expect.assertions(4);

    expect(() => {
      return toResult({ status: 'error' });
    }).toThrow('Unexpected input');

    expect(() => {
      return toResult({ status: 'error', error: null });
    }).toThrow('Unexpected input');

    expect(() => {
      return toResult({ status: 'error', error: 1 });
    }).toThrow('Unexpected input');

    expect(() => {
      return toResult({ status: 'error', error: {} });
    }).toThrow('Unexpected input');
  });

  it('handle success types', () => {
    expect.assertions(1);

    const result: Result<{ output: string }, unknown> = toResult({
      status: 'success',
      data: { output: 'output' },
    });

    expect(result.ok().output).toStrictEqual('output');
  });

  it('handle error types', () => {
    expect.assertions(2);

    type E1 = { type: 'e1'; someErrorData: string } & Err;

    const result: Result<unknown, E1> = toResult({
      status: 'error',
      error: { type: 'e1', someErrorData: 'err' },
    });

    expect(result.err().type).toStrictEqual('e1');
    expect(result.err().someErrorData).toStrictEqual('err');
  });
});
