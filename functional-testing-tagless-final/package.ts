import { Eq, eqString, contramap } from 'fp-ts/lib/Eq'
import { pipe } from 'fp-ts/lib/pipeable'

export interface UserId {
  readonly id: string
}

export const UserId = (id: string): UserId => {
  return {
    id,
  }
}

export const eqUserId: Eq<UserId> = pipe(
  eqString,
  contramap(_ => _.id),
)

export interface OrderId {
  readonly id: string
}

export const OrderId = (id: string): OrderId => {
  return {
    id,
  }
}

export interface UserProfile {
  readonly userId: UserId
  readonly userName: string
}

export const UserProfile = (userId: UserId, userName: string) => {
  return {
    userId,
    userName,
  }
}

export interface Order {
  readonly userId: UserId
  readonly orderId: OrderId
}

export const Order = (userId: UserId, orderId: OrderId) => {
  return {
    orderId,
    userId,
  }
}

export interface UserInformation {
  readonly userName: string
  readonly orders: Array<Order>
}

export const UserInformation = (
  userName: string,
  orders: Array<Order> = [],
) => {
  return {
    orders,
    userName,
  }
}
