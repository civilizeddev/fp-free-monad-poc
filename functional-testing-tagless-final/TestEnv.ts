import * as array from 'fp-ts/lib/Array'
import * as map from 'fp-ts/lib/Map'
import { eqUserId, UserId, UserProfile, OrderId, Order } from './package'
import { pipe } from 'fp-ts/lib/pipeable'
import * as option from 'fp-ts/lib/Option'

export const insertAtUserId = map.insertAt(eqUserId)
export const lookupWithUserId = map.lookup(eqUserId)

export class TestEnv {
  public static readonly empty: TestEnv = new TestEnv(
    map.empty,
    map.empty,
    array.empty,
  )

  constructor(
    public readonly profiles: Map<UserId, UserProfile>,
    public readonly orders: Map<OrderId, Array<Order>>,
    public readonly loggedErrors: Error[],
  ) {}

  public withProfile(profile: UserProfile): TestEnv {
    return new TestEnv(
      pipe(this.profiles, insertAtUserId(profile.userId, profile)),
      this.orders,
      this.loggedErrors,
    )
  }

  public withOrder(order: Order): TestEnv {
    return new TestEnv(
      this.profiles,
      pipe(
        this.orders,
        insertAtUserId(order.userId, [order, ...this.userOrders(order.userId)]),
      ),
      this.loggedErrors,
    )
  }

  public userOrders(userId: UserId): Array<Order> {
    return pipe(
      lookupWithUserId(userId, this.orders),
      option.getOrElse<Array<Order>>(() => array.empty),
    )
  }

  public logError(e: Error): TestEnv {
    return new TestEnv(this.profiles, this.orders, [e, ...this.loggedErrors])
  }
}
