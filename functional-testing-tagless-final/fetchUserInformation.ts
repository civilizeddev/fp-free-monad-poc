import { URIS, Kind, HKT } from 'fp-ts/lib/HKT'
import {
  MonadThrowable1,
  Users1,
  Orders1,
  Logging1,
  MonadThrowable,
  Users,
  Orders,
  Logging,
} from './algebras'
import { UserId, UserInformation } from './package'
import { Do } from 'fp-ts-contrib/lib/Do'
import { pipe } from 'fp-ts/lib/pipeable'

export function fetchUserInformation<M extends URIS>(
  M: MonadThrowable1<M> & Users1<M> & Orders1<M> & Logging1<M>,
): (userId: UserId) => Kind<M, UserInformation>

export function fetchUserInformation<M>(
  M: MonadThrowable<M> & Users<M> & Orders<M> & Logging<M>,
): (userId: UserId) => HKT<M, UserInformation>

export function fetchUserInformation<M>(
  M: MonadThrowable<M> & Users<M> & Orders<M> & Logging<M>,
): (userId: UserId) => HKT<M, UserInformation> {
  return (userId: UserId) =>
    pipe(
      Do(M)
        .bind('profile', M.profileFor(userId))
        .bind('orders', M.ordersFor(userId))
        .return(({ profile, orders }) =>
          UserInformation(profile.userName, orders),
        ),
      _ => M.onError(_, M.error),
    )
}
