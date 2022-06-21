import dotenv from 'dotenv'
import Bot from 'ts_bot'
import { HangmanFactory, HangmanMemoryStorage } from './Hangman'

dotenv.config()

const {
    URL,
    ACCESS_TOKEN
} = process.env

var bot = new Bot()
bot.listen(URL, ACCESS_TOKEN)

console.log('listening')

const hangmanStorage = new HangmanMemoryStorage()
const hangmanFactory = new HangmanFactory(hangmanStorage)

bot.OnMention(async (data) => {
    var game = await hangmanFactory.LoadGame(data.account.acct)
    game.play(data.status.content).respond(bot.SendReply(data))
})
