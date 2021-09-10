# Type-safe error handling without exceptions

Flexible and explicit error handling with a small flavor of functional languages.

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)
[![Test](https://github.com/alexshelkov/result/actions/workflows/test.yml/badge.svg)](https://github.com/alexshelkov/result/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/alexshelkov/result/badge.svg?branch=master)](https://coveralls.io/github/alexshelkov/result?branch=master)

Result type allows you go from this:

```javascript
const user = getUser(email);

if (!user) {
  throw new Error("Can't get user"); 
  // but what happens, why email is invalid?
  // and who will catch this error?
}
```

to this:

```javascript
const userResult = getUser(email);

if (userResult.isErr()) {
  const err = userResult.err();

  switch (err.type) {
    case 'InvalidEmail':
      console.log('User email is invalid');
      break;
    case 'UserNotExists':
      console.log("Can't find the user");
      break;
    case 'UserBannded':
      console.log(`User was bannded: ${err.ban}`);
      break;
  }
}
```

# Usage:

### Creating result

There are two main function for creating results `ok` and `fail`.

```typescript
import { Err, Result, ok, fail } from 'lambda-res';

const success = ok('good'); // inferred as Success<string>

const error = fail<Err>('bad'); // inferred as Failure<string>

const result: Result<string, Err> = Math.random() ? success : error;
```

###  The `Err` and `Errs` type

`Err` used for creating errors of given type.

```typescript
import { Failure, Err, fail, nope } from 'lambda-res';

// same as: { type: 'AppDatabaseError' } & Err
type DatabaseError = Err<'AppDatabaseError'>; 
type ConnectionError = Err<'AppConnectionError'>;

type AppErrors = DatabaseError | ConnectionError; // | Err<'NotHandled'>;

const check = (err: AppErrors): string => {
  if (err.type === 'AppDatabaseError') {
    return 'Database error';
  }

  if (err.type === 'AppConnectionError') {
    return 'Connection error';
  }

  // try unncoment NotHandled error and typescript will show a problem here!
  // that ensures that all error types are checked exhaustively
  nope(err);
};

// must match the types or Typescript will show an error
const failure: Failure<AppErrors> = fail<DatabaseError>('AppDatabaseError');

check(failure.err()); // get en error from failure
```

`Errs` type can be used to create multiple errors of a given kind, which may be
useful in order not to pollute your exports with multiple individual errors
(like: `DatabaseError, ConnectionError`).

```typescript
import { Failure, Errs, fail } from 'lambda-res';

// only AppError needs to be exported
type AppError = Errs<{
  name: 'App';
  DatabaseError: string;
  ConnectionError: string;
}>;

// note an Errs here (inside Failure): 
// it transform AppError into Err<'AppDatabaseError'> | Err<'AppConnectionError'>
const failure: Failure<Errs<AppError>> = fail<AppError['DatabaseError']>('AppDatabaseError');
```

### Using result

Once you created result it have a bunch of useful methods:

#### `isOk`, `isErr`, `ok`, `err`

```typescript
import { Err, Result, ok, fail } from 'lambda-res';

const result: Result<string, Err> = Math.random() ? ok('ok') : fail<Err<'Error1'>>('Error1');

// isOk method allows to narrow result type to Success<string>
if (result.isOk()) {
  // once type is narrowed you can safely access the data
  console.log(result.ok()); // will outputs 'ok'
}

// isErr method allows to narrow result type to Failure<Err<'Error1'>>
if (result.isErr()) {
  console.log(result.err().type);
}

// result.err();
// ^
// this will throw an exception because result is not a Failure
// that is why isErr check used first
```

### Mapping result with `onOk` and `onErr` (`onFail`)

```typescript
import { Response, Errs, ok, fail, nope } from 'lambda-res';

type GetUserEmailError = Errs<{
  name: 'GetUserEmail';
  NotFound: string;
  Deleted: string;
}>;

const getUserName = async (id: string): Response<string, Errs<GetUserEmailError>> => {
  if (id === 'id1') {
    return ok('email@example.com');
  } else if (id === 'id2') {
    return fail('GetUserEmailDeleted');
  }
  return fail('GetUserEmailNotFound');
};

type SendEmailError = Errs<{
  name: 'SendEmail';
  DeliveryError: string;
}>;

const sendEmail = async (email: string): Response<{ sentCount: number }, Errs<SendEmailError>> => {
  if (email === 'email@example.com') {
    return ok({ sentCount: 3 })
  }
  return fail('SendEmailDeliveryError')
}

const sendEmailToUser = async () /*: Response<{ sentCount: number }, Err<'DeliveryError'> | Err<'LoadingUserError'>> */ => {
  const userNameRes = await getUserName('id1');

  return userNameRes.onOk(async (email) => {
    const sendRes = await sendEmail(email); 

    return sendRes;
  }).onErr((err) => {
    if (err.type === 'SendEmailDeliveryError') {
      return { type: 'DeliveryError' }
    } else if (err.type === 'GetUserEmailDeleted' || err.type === 'GetUserEmailNotFound') {
      return { type: 'LoadingUserError'  }
    }
    nope(err);
  }).res();
}
```

------------------------------------------------------------------------

#### `Result<Data, Fail>`.`onOk`

On success return new `Data2` and collects all errors. Used to sequentially run multiple functions 
which returns result. In the end `onErr` can map errors to desired error type.

Params:

- `cb`: callback which receives
    - `data`: `Data`
    - `res`: `Result<Data, never>`

- `name` _(optional)_ : common error name, it will prepend all errors types

Returns:

- `Result<Data2, Fail | Fail2>` or `Response<Data2, Fail | Fail2>` (for async functions)

------------------------------------------------------------------------

#### `Result<Data, Fail>`.`onErr`, `Result<Data, Fail>`.`onFail`

Doesn't change `Data` and returns new `Fail2` — used to map one type of errors to another.

Params:

- `cb`: callback which receives
    - `err`: `Fail`
    - `res`: `Result<never, Fail>`

Returns:

- `onErr`: `string`, `{ type: string }` or `Promise<string>`, `Promise<{ type: string }>`
- `onFail`: `Result<never, Fail2>` or `Response<never, Fail2>`

