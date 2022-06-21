export class HangmanState {
    word: string
    mistakes: number
}

export interface IStorage<T> {
    Load(acct: string): Promise<T>;
}

interface HangmanStateStore {
    [key: string]: HangmanState;
}

export class HangmanMemoryStorage implements IStorage<HangmanState>{
    private states: HangmanStateStore = { "xmakina@mastodon.technology": { mistakes: 1, word: "something" } }

    async Load(acct: string): Promise<HangmanState> {
        console.log({acct})
        const state = this.states[acct]
        if (state === null) {
            return { mistakes: 0, word: 'new word' }
        }

        return state
    }
}

export class HangmanFactory {
    private readonly storage: IStorage<HangmanState>;

    constructor(storage: IStorage<HangmanState>) {
        this.storage = storage
    }

    public async LoadGame(acct: string): Promise<Hangman> {
        var state = await this.storage.Load(acct)
        return new Hangman(state)
    }
}

export class Hangman {
    private state: HangmanState;

    constructor(state: HangmanState) {
        this.state = state
    }

    respond(SendReply: (message: string) => any): Hangman {
        SendReply(`your word is ${this.state.word} and you have made ${this.state.mistakes} mistakes`)
        return new Hangman(this.state);
    }

    play(content: string): Hangman {
        this.state.mistakes
        return new Hangman(this.state);
    }
}
