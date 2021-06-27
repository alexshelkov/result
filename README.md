Type-safe error handling without exceptions
===========================================
Flexible and explicit error handling with a small flavor of functional languages.

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)
[![Test](https://github.com/alexshelkov/result/actions/workflows/test.yml/badge.svg)](https://github.com/alexshelkov/result/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/alexshelkov/result/badge.svg?branch=master)](https://coveralls.io/github/alexshelkov/result?branch=master)

Result type allows you go from this:

```javascript
const user = getUser(email);

if (!user) {
    throw new Error("Can't get user") // but what happens, why email is invalid? 
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
      console.log('User email is invalid'); break;
    case 'UserNotExists':
      console.log("Can't find the user"); break;
    case 'UserBannded':
      console.log(`User was bannded: ${err.ban}`); break;
  }
}
```

Usage:
======

### Creating result

There are two main function for creating results `ok` and `fail`. 

```typescript
import { Err, Result, ok, fail } from 'lambda-res';

const success = ok('good'); // inferred as Success<string>

const error = fail<Err>('bad'); // inferred as Failure<string>

const result: Result<string, Err> = Math.random() ? success : error;
```

### The `Err` type

`Err` used for creating errors of given type.

```typescript
import { Failure, Err, fail, nope }  from 'lambda-res';

type DatabaseError = Err<'DatabaseError'>; // same as: { type: 'DatabaseError' }
type ConnectionError = Err<'ConnectionError'>;

type AppError = DatabaseError | ConnectionError // | Err<'NotHandled'>;

const check = (err: AppError): string => {
  if (err.type === 'DatabaseError') {
    return 'Database error';
  }

  if (err.type === 'ConnectionError') {
    return 'Connection error';
  }

  // try unncoment NotHandled error and typescript will show a problem here!
  // that ensures that all error types are checked exhaustively
  nope(err); 
};

// must match the types or Typescript will show an error
const failure: Failure<AppError> = fail<DatabaseError>('DatabaseError');

check(failure.err()); // get en error from failure
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
