import * as T from 'fp-ts/lib/Task'
import { Task } from 'fp-ts/lib/Task'
import * as C from 'fp-ts/lib/Console'
import { createInterface } from 'readline'
import * as O from 'fp-ts/lib/Option'
import { Option } from 'fp-ts/lib/Option'
import * as R from 'fp-ts/lib/Random'
import { Do } from 'fp-ts-contrib/lib/Do'

// Helpers

const getStrLn: Task<string> = () =>
  new Promise(resolve => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question('> ', answer => {
      rl.close()
      resolve(answer)
    })
  })

const putStrLn = (message: string): Task<void> => T.fromIO(C.log(message))

const random = T.fromIO(R.randomInt(1, 5))

const parse = (s: string): Option<number> => {
  const i = +s
  return isNaN(i) || i % 1 !== 0 ? O.none : O.some(i)
}

// Game

const checkContinue = (name: string): Task<boolean> =>
  Do(T.task)
    .do(putStrLn(`Do you want to continue, ${name}?`))
    .bind('answer', getStrLn)
    .bindL('result', ({ answer }) => {
      switch (answer.toLowerCase()) {
        case 'y':
          return T.of(true)
        case 'n':
          return T.of(false)
        default:
          return checkContinue(name)
      }
    })
    .return(({ result }) => result)

const parseFailureMessage = putStrLn('You did not enter an integer!')

const gameLoop = (name: string): Task<void> =>
  Do(T.task)
    .bind('secret', random)
    .do(putStrLn(`Dear ${name}, please guess a number from 1 to 5`))
    .bind('guess', getStrLn)
    .doL(({ secret, guess }) =>
      O.fold(
        () => parseFailureMessage,
        (x: number) =>
          x === secret
            ? putStrLn(`You guessed right, ${name}!`)
            : putStrLn(`You guessed wrong, ${name}! The number was: ${secret}`),
      )(parse(guess)),
    )
    .bind('shouldContinue', checkContinue(name))
    .doL(({ shouldContinue }) =>
      shouldContinue ? gameLoop(name) : T.of(undefined),
    )
    .return(_ => undefined)

const nameMessage = putStrLn('What is your name?')

const askName = Do(T.task)
  .do(nameMessage)
  .bind('name', getStrLn)
  .return(({ name }) => name)

const main: Task<void> = Do(T.task)
  .bind('name', askName)
  .doL(({ name }) => putStrLn(`Hello, ${name} welcome to the game!`))
  .doL(({ name }) => gameLoop(name))
  .return(_ => undefined)

main()
