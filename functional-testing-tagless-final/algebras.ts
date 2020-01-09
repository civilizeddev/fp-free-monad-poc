import { UserId, UserProfile, OrderId, Order } from './package'
import { HKT, URIS, Kind } from 'fp-ts/lib/HKT'
import { MonadThrow, MonadThrow1 } from 'fp-ts/lib/MonadThrow'

export class UserNotFound extends Error {
  constructor(userId: UserId) {
    super(`User with ID ${userId.id} does not exist`)
  }
}

export interface Users<F> {
  profileFor(userId: UserId): HKT<F, UserProfile>
}
export interface Users1<F extends URIS> {
  profileFor(userId: UserId): Kind<F, UserProfile>
}

export interface Orders<F> {
  ordersFor(orderId: OrderId): HKT<F, Array<Order>>
}
export interface Orders1<F extends URIS> {
  ordersFor(orderId: OrderId): Kind<F, Array<Order>>
}

export interface Logging<F> {
  error(e: Error): HKT<F, void>
}
export interface Logging1<F extends URIS> {
  error(e: Error): Kind<F, void>
}

export interface MonadThrowable<F> extends MonadThrow<F> {
  onError<A>(fa: HKT<F, A>, f: (e: Error) => HKT<F, void>): HKT<F, A>
}
export interface MonadThrowable1<F extends URIS> extends MonadThrow1<F> {
  onError<A>(fa: Kind<F, A>, f: (e: Error) => Kind<F, void>): Kind<F, A>
}
