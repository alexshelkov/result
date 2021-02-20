Type-safe error handling without exceptions
===========================================
Flexible and explicit error handling with a small flavor of functional languages.

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)
[![Build Status](https://travis-ci.org/alexshelkov/result.svg?branch=master)](https://travis-ci.org/alexshelkov/result)
[![Coverage Status](https://coveralls.io/repos/github/alexshelkov/result/badge.svg?branch=master)](https://coveralls.io/github/alexshelkov/result?branch=master)

Result type allows you go from this:

```typescript
const user = getUser(email);

if (!user) {
    throw new Error("Can't get user") // but what happens, why email is invalid? 
                                      // and who will catch this error?
}
```
to this:
```typescript
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

