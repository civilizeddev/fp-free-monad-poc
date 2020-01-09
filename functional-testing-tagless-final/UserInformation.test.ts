import { Either, either } from 'fp-ts/lib/Either'
import { StateT1, getStateM, StateM1 } from 'fp-ts/lib/StateT'
import {
  MonadThrowable1,
  Users1,
  Logging1,
  Orders1,
  UserNotFound,
} from './algebras'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { TestEnv, lookupWithUserId } from './TestEnv'
import { OrderId, UserId } from './package'
import { pipe } from 'fp-ts/lib/pipeable'

type EitherThrowableOr<A> = Either<Error, A>

const eitherThrowableOr: MonadThrowable1<'EitherThrowableOr'> = {
  ...either,
  URI: 'EitherThrowableOr',
  onError(fa, f) {
    if (E.isLeft(fa)) {
      f(fa.left)
    }
    return fa
  },
  throwError(e) {
    return E.left(E.toError(e))
  },
}

type Test<A> = StateT1<'EitherThrowableOr', TestEnv, A>

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    EitherThrowableOr: EitherThrowableOr<A>
    Test: Test<A>
  }
}

const test: StateM1<'EitherThrowableOr'> &
  MonadThrowable1<'Test'> &
  Users1<'Test'> &
  Orders1<'Test'> &
  Logging1<'Test'> = {
  URI: 'Test',
  ...getStateM(eitherThrowableOr),
  error(e: Error) {
    return test.modify(_ => _.logError(e))
  },
  onError(fa, f) {
    return env => {
      const e = fa(env)
      if (E.isLeft(e)) {
        f(e.left)
      }
      return e
    }
  },
  ordersFor(orderId: OrderId) {
    return test.gets(_ => _.userOrders(orderId))
  },
  profileFor(userId: UserId) {
    return (env: TestEnv) =>
      pipe(
        lookupWithUserId(userId, env.profiles),
        O.fold(
          () => E.left(new UserNotFound(userId)),
          user => E.right(user),
        ),
        E.map(_ => [_, env]),
      )
  },
  throwError(e) {
    return test.fromM(eitherThrowableOr.throwError(e))
  },
}
