import Hangman from "typescript-functional-hangman";
import { HangmanState, IHangman } from "typescript-functional-hangman/dist/Hangman";

export interface IStorage<T> {
    Save(acct: string): (state: HangmanState) => any;
    Load(acct: string): Promise<{found: boolean, state: T}>;
}

export class HangmanFactory {
    private readonly storage: IStorage<HangmanState>;

    constructor(storage: IStorage<HangmanState>) {
        this.storage = storage
    }

    public async LoadGame(acct: string): Promise<{found: boolean, hangman: IHangman}> {
        var result = await this.storage.Load(acct)
        return {found: result.found, hangman: Hangman(result.state)}
    }
}
