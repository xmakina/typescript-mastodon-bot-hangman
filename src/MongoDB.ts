import randomWord from 'random-word'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb';
import { IStorage } from './HangmanStorage';
import { HangmanState } from 'typescript-functional-hangman/dist/Hangman';

export async function GetStorage(): Promise<IStorage<HangmanState>> {
    dotenv.config()
    const {
        MONGO_USERNAME,
        MONGO_PASSWORD,
        MONGO_HOSTNAME
    } = process.env;

    const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}/?authSource=admin`;

    const client = new MongoClient(url);
    console.log(`Connecting to ${url}`)

    try {
        // Connect the client to the server
        await client.connect();
        // Establish and verify connection
        await client.db("admin").command({ ping: 1 });
        console.log("Connected successfully to MongoDB Server");

        return new HangmanMongoStorage(client)
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

export class HangmanMongoStorage implements IStorage<HangmanState> {
    constructor(readonly client: MongoClient) {
    }

    Save(acct: string) {
        return async (state: HangmanState) => {
            try {
                await this.client.connect()

                const database = this.client.db("hangman");
                const games = database.collection("games");

                const updateDoc = {
                    $set: state
                };

                if (state === null) {
                    await games.deleteOne({ acct })
                } else {
                    await games.updateOne({ acct }, updateDoc, { upsert: true });
                }
            } finally {
                await this.client.close()
            }
        }
    }

    async Load(acct: string): Promise<{ found: boolean, state: HangmanState }> {
        try {
            await this.client.connect()

            const database = this.client.db("hangman");
            const games = database.collection("games");
            const state = await games.findOne<HangmanState>({ acct })

            if (state === null || state === undefined) {
                const target = randomWord()
                const state: HangmanState = { guesses: [], mistakes: 0, word: target }
                await this.Save(acct)(state)
                return { found: false, state: state }
            } else {
                return { found: true, state: state }
            }
        } finally {
            await this.client.close()
        }
    }

}