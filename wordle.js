export class Wordle {
    constructor() {
    }

    /** @param {String} word */
    exists(word) {
        return Wordle.dictionary.has(word.toUpperCase()) || Wordle.dictionary.has(word.toUpperCase());
    }

    /** @param {Number} length */
    getRandomWord(length) {
        let words = [...Wordle.words.get(length)];
        if (words.length === 0) throw new Error("No words with this length exist in my word bank!");
        return words[~~(words.length * Math.random())];
    }

    /** @type {Set<String>} */
    static dictionary = new Set();
    /** @type {Map<Number, Set<String>>} */
    static words = new Map();

    /**
     * @param {Number} wordLength
     * @param {String[]} words
     */
    static loadWords(wordLength, words) {
        let uppercaseWords = words.map(i => i.toUpperCase());

        if (Wordle.words.has(wordLength)) {
            Wordle.words.set(wordLength, new Set([...Wordle.words.get(wordLength), ...uppercaseWords]));
        } else {
            Wordle.words.set(wordLength, new Set(uppercaseWords));
        }

        Wordle.updateDictionary(words);
    }

    /** @param {String[]} words */
    static updateDictionary(words) {
        Wordle.dictionary = new Set([...Wordle.dictionary, ...words.map(i => i.toUpperCase())]);
    }
}

/** @typedef {WordleResult.CORRECT | WordleResult.MISPLACED | WordleResult.INCORRECT} WordleCharacterResult */
export class WordleResult {
    static CORRECT = {};
    static MISPLACED = {};
    static INCORRECT = {};

    /** @type {number} */
    wordLength;
    /** @type {string} */
    guess;
    /** @type {string} */
    target;
    /** @type {WordleCharacterResult[]} */
    results;
    /** @type {boolean} */
    success;

    /**
     * @param {Number} wordLength
     *      The length of the wordle
     * @param {String} target
     *      The target word. Must match wordLength
     * @param {String} guess
     *      The guessed word. Must match wordLength
     */
    constructor(wordLength, target, guess) {
        this.wordLength = wordLength;
        this.guess = guess;
        this.target = target;

        /** @type {Number[]} */
        this.results = new Array(wordLength).fill(WordleResult.INCORRECT);

        this.success = guess === target;

        if (this.success) this.results.fill(WordleResult.CORRECT); else this.generateResults();
    }

    /** @private */
    generateResults() {
        /** @type {Map<String, Number>}} */
        let charCounts = new Map();

        // First pass - find correct chars, get char counts
        for (let i = 0; i < this.wordLength; i++) {
            let targetChar = this.target[i];
            if (this.guess[i] === targetChar) {
                this.results[i] = WordleResult.CORRECT;
            } else {
                charCounts.set(targetChar, (charCounts.get(targetChar) || 0) + 1);
            }
        }

        // Second pass - determine misplaced/incorrect chars
        for (let i = 0; i < this.wordLength; i++) {
            if (this.results[i] === WordleResult.CORRECT) continue;

            let guessedChar = this.guess[i];
            if (charCounts.get(guessedChar) > 0) {
                charCounts.set(guessedChar, charCounts.get(guessedChar) - 1);
                this.results[i] = WordleResult.MISPLACED;
            } else {
                this.results[i] = WordleResult.INCORRECT;
            }
        }
    }

    /** @param {String} word */
    matches(word) {
        if (word.length !== this.wordLength) return false;
        let charMap = new Map();
        for (let i = 0; i < this.wordLength; i++) {
            let c = word[i];
            if (this.guess[i] === c) {
                if (this.results[i] !== WordleResult.CORRECT) return false;
            } else {
                if (this.results[i] === WordleResult.CORRECT) return false;
                charMap.set(c, (charMap.get(c) || 0) + 1)
            }
        }
        for (let i = 0; i < this.wordLength; i++) {
            if (this.results[i] === WordleResult.CORRECT) continue;
            let c = this.guess[i];
            if (charMap.get(c) > 0) {
                if (this.results[i] !== WordleResult.MISPLACED) return true
                charMap.set(c, charMap.get(c) - 1);
            } else if (this.results[i] !== WordleResult.INCORRECT) return true
        }
        return true;
    }
}