import { URIS, Kind } from 'fp-ts/lib/HKT'
import { createInterface } from 'readline'
import { flow, constVoid } from 'fp-ts/lib/function'
import * as C from 'fp-ts/lib/Console'
import * as M from 'fp-ts/lib/Monad'
import * as O from 'fp-ts/lib/Option'
import * as R from 'fp-ts/lib/Random'
import * as T from 'fp-ts/lib/Task'
import { Do } from 'fp-ts-contrib/lib/Do'

// type classes

interface Program<F extends URIS> extends M.Monad1<F> {
  finish: <A>(a: A) => Kind<F, A>
}

interface Console<F extends URIS> {
  putStrLn: (message: string) => Kind<F, void>
  getStrLn: Kind<F, string>
}

interface Random<F extends URIS> {
  nextInt: (upper: number) => Kind<F, number>
}

interface Main<F extends URIS> extends Program<F>, Console<F>, Random<F> {}

// instances

const programTask: Program<T.URI> = {
  ...T.task,
  finish: T.of,
}

/**
 * read from standard input
 */
const getStrLn: T.Task<string> = () =>
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

/**
 * write to standard output
 */
const putStrLn = flow(C.log, T.fromIO)

const consoleTask: Console<T.URI> = {
  getStrLn,
  putStrLn,
}

const randomTask: Random<T.URI> = {
  nextInt: upper => T.fromIO(R.randomInt(1, upper)),
}

// game

/**
 * parse a string to an integer
 */
function parse(s: string): O.Option<number> {
  const i = +s
  return isNaN(i) || i % 1 !== 0 ? O.none : O.some(i)
}

function main<F extends URIS>(F: Main<F>): Kind<F, void> {
  // ask something and get the answer
  const ask = (question: string): Kind<F, string> =>
    Do(F)
      .do(F.putStrLn(question))
      .bind('answer', F.getStrLn)
      .return(({ answer }) => answer)

  const shouldContinue = (name: string): Kind<F, boolean> =>
    Do(F)
      .bind('answer', ask(`Do you want to continue, ${name} (y/n)?`))
      .bindL('result', ({ answer }) => {
        switch (answer.toLowerCase()) {
          case 'y':
            return F.of(true)
          case 'n':
            return F.of(false)
          default:
            return shouldContinue(name)
        }
      })
      .return(({ result }) => result)

  const gameLoop = (name: string): Kind<F, void> =>
    Do(F)
      // run `n` tasks in parallel
      .sequenceS({
        guess: ask(`Dear ${name}, please guess a number from 1 to 5`),
        secret: F.nextInt(5),
      })
      .doL(({ guess, secret }) =>
        O.fold(
          () => F.putStrLn('You did not enter an integer!'),
          (x: number) =>
            x === secret
              ? F.putStrLn(`You guessed right, ${name}!`)
              : F.putStrLn(
                  `You guessed wrong, ${name}! The number was: ${secret}`,
                ),
        )(parse(guess)),
      )
      .bind('shouldContinue', shouldContinue(name))
      .bindL('result', ({ shouldContinue }) =>
        shouldContinue ? gameLoop(name) : F.of<void>(undefined),
      )
      .return(({ result }) => result)

  return Do(F)
    .bind('name', ask('What is your name?'))
    .doL(({ name }) => F.putStrLn(`Hello, ${name} welcome to the game!`))
    .doL(({ name }) => gameLoop(name))
    .return(constVoid)
}

export const mainTask = main({
  ...programTask,
  ...consoleTask,
  ...randomTask,
})

mainTask()
