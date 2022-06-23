import dotenv from 'dotenv'
import HtmlToText from 'html-to-text'
import { FillInGaps } from 'typescript-functional-hangman'
import { HangmanOutput, HangmanState } from 'typescript-functional-hangman/dist/Hangman'
import Bot from 'typescript-mastodon-bot-framework'
import { HangmanFactory } from './HangmanStorage'
import { GetStorage } from './MongoDB'

dotenv.config()

const {
    API_URL,
    ACCESS_TOKEN
} = process.env

if (API_URL == undefined || ACCESS_TOKEN == undefined) {
    throw new Error('URL or Access Token is undefined!')
}

GetStorage().then(async (hangmanStorage) => {
    const hangmanFactory = new HangmanFactory(hangmanStorage)

    var bot = new Bot()
    await bot.listen(API_URL, ACCESS_TOKEN)

    bot.OnMention(async (notification) => {
        const content = HtmlToText.convert(notification.status.content, { ignoreHref: true }).replace(/\s+/g, ' ').trim()
        const tokens = content.split(' ')
        var result = await hangmanFactory.LoadGame(notification.account.acct)
        const game = result.hangman

        if (result.found == false) {
            game.report(reportNewGame(bot.SendReply(notification)))
            return
        }

        try {
            game
                .play(tokens[1])
                .report(handleOutput(bot.SendReply(notification)))
                .save(saveState(hangmanStorage.Save(notification.account.acct)))
        } catch (err) {
            bot.SendReply(notification)(err)
        }
    })

    console.log('Bot is listening...')
})

function generateMessage(output: HangmanOutput): string {
    if (output.won) {
        return `You win! The word was ${output.target}`
    }

    if (output.mistakes > 5) {
        return `You lose! The word was ${output.target}`
    }

    return `${output.progress} (${output.mistakes} mistakes so far)`
}

type ISendFunc = (message: string) => Promise<void>

function handleOutput(sendFunc: ISendFunc): (output: HangmanOutput) => any {
    return async (output: HangmanOutput) => {
        const message = generateMessage(output)
        await sendFunc(message)
    }
}

function reportNewGame(sendFunc: ISendFunc): (output: HangmanOutput) => any {
    return async (output: HangmanOutput) => {
        const message = generateMessage(output)
        await sendFunc(message)
    }
}

function saveState(saveFunc: (state: HangmanState) => any): (state: HangmanState) => any {
    return async (state: HangmanState) => {
        if (FillInGaps(state.word, state.guesses) === state.word || state.mistakes > 5) {
            await saveFunc(null)
        } else {
            await saveFunc(state)
        }
    }
}

