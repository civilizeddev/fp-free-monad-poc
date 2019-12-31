import { URIS, Kind } from 'fp-ts/lib/HKT'
import { EitherT } from 'fp-ts/lib/EitherT'
import { Do } from 'fp-ts-contrib/lib/Do'
import {} from 'fp-ts/lib/function'
import { boundMethod } from 'autobind-decorator'
import * as ST from 'fp-ts/lib/State'

// https://github.com/amitayh/functional-testing-tagless-final

// algebras

type UserId = string

class UserInformation {
  public static from(
    profile: UserProfile,
    orders: Array<Order>,
  ): UserInformation {
    return new UserInformation(profile, orders)
  }

  constructor(
    public readonly profile: UserProfile,
    public readonly orders: Array<Order>,
  ) {}
}

class UserProfile {
  constructor(public readonly userId: UserId) {}
}

class Order {
  constructor(public readonly userId: UserId) {}
}

/**
 * ```scala
 * trait Users[F[_]] {
 *   def profileFor(userId: UserId): F[UserProfile]
 * }
 * ```
 */
interface Users<F extends URIS> {
  profileFor(userId: UserId): Kind<F, UserProfile>
}

/**
 * ```scala
 * trait Orders[F[_]] {
 *   def ordersFor(userId: UserId): F[List[Order]]
 * }
 * ```
 */
interface Orders<F extends URIS> {
  ordersFor(userId: UserId): Kind<F, Array<Order>>
}

/**
 * ```scala
 * trait Logging[F[_]] {
 *   def error(e: Throwable): F[Unit]
 * }
 * ```
 */
interface Logging<F extends URIS> {
  error(e: Error): Kind<F, void>
}

type MonadThrowable<F extends URIS> = EitherT<F, Error>

function main<F extends URIS>(
  F: MonadThrowable<F> & Users<F> & Orders<F> & Logging<F>,
): Kind<F, void> {
  const fetchUserInformation = (userId: UserId): Kind<F, UserInformation> => {
    const result = Do(F)
      .sequenceS({
        orders: F.ordersFor(userId),
        profile: F.profileFor(userId),
      })
      .return(({ orders, profile }) => UserInformation.from(profile, orders))
  }
  throw new Error('umimplemented')
}

class TestEnv {
  public static Empty = new TestEnv({}, {}, [])

  constructor(
    public readonly profiles: Record<UserId, UserProfile>,
    public readonly orders: Record<UserId, Array<Order>>,
    public readonly loggedErrors: Array<Error>,
  ) {}

  @boundMethod
  public withProfile(profile: UserProfile): TestEnv {
    return new TestEnv(
      { ...this.profiles, [profile.userId]: profile },
      this.orders,
      this.loggedErrors,
    )
  }

  @boundMethod
  public withOrder(order: Order): TestEnv {
    return new TestEnv(
      this.profiles,
      {
        ...this.orders,
        [order.userId]: [...this.userOrders(order.userId), order],
      },
      this.loggedErrors,
    )
  }

  @boundMethod
  public logError(e: Error): TestEnv {
    return new TestEnv(this.profiles, this.orders, [e, ...this.loggedErrors])
  }

  @boundMethod
  public userOrders(userId: UserId): Array<Order> {
    return this.orders[userId] || []
  }
}

const URI = 'Test'

type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    Test: Test<A>
  }
}

/**
 * ```scala
 * type Test[A] = State[TestEnv, A]
 * ```
 */
type Test<A> = ST.State<TestEnv, A>

// type-class instances

/**
 * ```scala
 * implicit val usersTest: Users[Test] = new Users[Test] {
 *   override def profileFor(userId: UserId): Test[UserProfile] =
 *     State.inspect(_.profiles(userId))
 * }
 * ```
 */
const usersTest: Users<URI> = {
  profileFor(userId: UserId): Test<UserProfile> {
    return ST.gets(_ => _.profiles[userId])
  },
}

/**
 * ```scala
 * implicit val ordersTest: Orders[Test] = new Orders[Test] {
 *   override def ordersFor(userId: UserId): Test[List[Order]] =
 *     State.inspect(_.userOrders(userId))
 * }
 * ```
 */
const ordersTest: Orders<URI> = {
  ordersFor(userId: UserId): Test<Array<Order>> {
    return ST.gets(_ => _.userOrders(userId))
  },
}

/**
 * ```scala
 * implicit val loggingTest: Logging[Test] = new Logging[Test] {
 *   override def error(e: Throwable): Test[Unit] =
 *     State.modify(_.logError(e))
 * }
 * ```
 */
const loggingTest: Logging<URI> = {
  error(e: Error): Test<void> {
    return ST.modify(_ => _.logError(e))
  },
}
