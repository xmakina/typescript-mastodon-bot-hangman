import dotenv from 'dotenv'
import Mongo from 'mongodb'
import { HangmanState, } from 'typescript-functional-hangman';
import { IStorage } from './HangmanStorage';

export async function GetStorage(): Promise<IStorage<HangmanState>> {
    dotenv.config()
    const {
        MONGO_USERNAME,
        MONGO_PASSWORD,
        MONGO_HOSTNAME
    } = process.env;

    const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}/?authSource=admin`;

    const client = new Mongo.MongoClient(url);
    console.log(`Connecting to ${url}`)

    try {
        // Connect the client to the server
        await client.connect();
        // Establish and verify connection
        await client.db("admin").command({ ping: 1 });
        console.log("Connected successfully to server");

        return new HangmanMongoStorage(client)
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

export class HangmanMongoStorage implements IStorage<HangmanState> {
    constructor(readonly client: Mongo.MongoClient) { }

    Save(acct: string) {
        return async function (state: HangmanState) {
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
        }
    }

    async Load(acct: string): Promise<HangmanState> {
        const database = this.client.db("hangman");
        const games = database.collection("games");
        const game = await games.findOne<HangmanState>({ acct })

        return game
    }

}