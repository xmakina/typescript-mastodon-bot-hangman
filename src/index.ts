import dotenv from 'dotenv'
import Bot from 'typescript-mastodon-bot-framework'
import { HangmanOutput, HangmanState } from 'typescript-functional-hangman/dist/Hangman'
import { HangmanFactory } from './HangmanStorage'
import { GetStorage, HangmanMongoStorage } from './MongoDB'

dotenv.config()

const {
    URL,
    ACCESS_TOKEN
} = process.env

GetStorage().then((hangmanStorage) => {
    const hangmanFactory = new HangmanFactory(hangmanStorage)

    var bot = new Bot()
    bot.listen(URL, ACCESS_TOKEN)

    bot.OnMention(async (notification) => {
        var game = await hangmanFactory.LoadGame(notification.account.acct)
        game
            .play(notification.status.content)
            .report(sendReport(bot.SendReply(notification)))
            .save(hangmanStorage.Save(notification.account.acct))
    })

    console.log('listening')
})

function sendReport(replyFunction: (message: string) => Promise<void>) {
    return async (output: HangmanOutput) => {
        const message = generateMessage(output)
        await replyFunction(message);
    }
}

function generateMessage(output: HangmanOutput): string {
    if (output.won) {
        return `You win! The word was ${output.progress}`
    }

    if (output.mistakes > 6) {
        return `You lose! The word was ${output.target}`
    }

    return `${output.progress} (${output.mistakes} mistakes so far)`
}