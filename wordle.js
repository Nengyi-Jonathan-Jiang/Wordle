export class Wordle {
    static get DEFAULT_LENGTH(){return 5}
    static get DEFAULT_LENIENCY(){return false}

    constructor(){
        this.defaultLength = Wordle.DEFAULT_LENGTH;
        this.lenient = Wordle.DEFAULT_LENIENCY;

        /** @type {WordleResult[]} */
        this.guesses = [];

        /** @type {Set<String>} */
        this.dictionary = new Set();
        /** @type {Map<Number, Set<String>>} */
        this.words = new Map();

        this.target = this.randomWord();
    }

    generate(length){
        if(length === undefined) length = this.defaultLength;

        this.target = this.randomWord(length);
        this.guesses = [];
    }

    abandon(){
        this.target = "";
    }

    get abandoned(){
        return this.target === "";
    }

    /** @param {String} guess */
    guess(guess){
        if(this.abandoned){
            throw new Error(`No wordle generated`);
        }
        if(!/[a-zA-Z]+/.test(guess)){
            throw new Error(`"${guess}" contains non-alphabetic characters.`);
        }
        if(guess.length !== this.target.length){
            throw new Error(`expected word of length (${this.target.length}) but got "${guess}" which has ${guess.length} letters`);
        }
        guess = guess.toUpperCase();
        if(!this.lenient && !this.exists(guess)){
            throw new Error(`could not find word "${guess}" in dictionary`);
        }

        let result = new WordleResult(this.target.length, this.target, guess);
        this.guesses.push(result);
        return result.success;
    }

    /** @param {String} word */
    addWord(word){
        this.words.set(word.length, new Set([...(this.words.get(word.length) || new Set()), word]));
        this.addToDictionary(word);
    }
    /** @param {String} word */
    addToDictionary(word){
        this.dictionary.add(word);
    }

    /** @param {String} word */
    removeWord(word){
        if(Wordle.dictionary.has(word)) throw new Error("Could not remove built in word");
        if(!this.dictionary.has(word)) throw new Error("Word not in dictionary");
        this.words.get(word.length).delete(word);
        this.dictionary.delete(word);
    }

    /** @param {String} word */
    exists(word){
        return Wordle.dictionary.has(word) || this.dictionary.has(word);
    }

    /** @param {Number} length */
    randomWord(length){
        length ||= this.defaultLength;
        let words = [...(Wordle.words.get(length) || []), ...(this.words.get(length) || [])];
        if(words.length === 0) throw new Error("No words with this length exist in my word bank!");
        return words[~~(words.length * Math.random())];
    }

    /** @param {Boolean} lenient */
    setLeniency(lenient){
        this.lenient = lenient;
    }

    set length(length){
        if(!Wordle.words.has(length) && !this.words.has(length)){
            throw new Error("Invalid length - no words with this length exist in my word bank.");
        }
    }

    get lastGuess(){return this.guesses[this.guesses.length - 1]}

    get success(){return this.lastGuess?.success || false}

    get history() {
        return this.guesses;
    }

    toString(){
        return JSON.stringify({
            defaultLength: this.defaultLength,
            lenient: this.lenient,
            guesses: this.guesses.map(i => i.guess),
            target: this.target,
            dictionary: [...this.dictionary],
            words: [...this.words.entries()].map(([length, words])=>({length:length,words:[...words]})),
        })
    }

    /** @param {String} str */
    fromString(str){
        let data = JSON.parse(str);

        this.defaultLength = data.defaultLength;
        this.lenient = data.lenient;
        this.target = data.target;

        this.dictionary = new Set(data.dictionary);
        this.words = new Map(data.words.map(i=>[i.length, new Set(i.words)]));

        this.guesses = data.guesses.map(guess => new WordleResult(this.target.length, this.target, guess));

        return this;
    }

    /** @type {Set<String>} */
    static dictionary = new Set();
    /** @type {Map<Number, Set<String>>} */
    static words = new Map();

    /**
     * @param {Number} wordLength
     * @param {String[]} words
     */
    static loadWords(wordLength, words){
        if(!Wordle.words.has(wordLength)) Wordle.words.set(wordLength, new Set(words));
        else Wordle.words.set(wordLength, new Set([...Wordle.words.get(wordLength), ...words]));
        // We need to update the dictionary as well because all guessable words must also
        // be present in the dictionary
        Wordle.updateDictionary(words);
    }

    /** @param {String[]} words */
    static updateDictionary(words){
        Wordle.dictionary = new Set([...Wordle.dictionary, ...words.filter(i => /^[a-zA-Z]+$/.test(i))]);
    }
}

export class WordleResult {
    static CORRECT = 0;
    static MISPLACED = 1;
    static INCORRECT = 2;

    static COLORS = new Map([
        [WordleResult.CORRECT, "#2D2"],
        [WordleResult.MISPLACED, "#FC0"],
        [WordleResult.INCORRECT, "#888"],
    ]);

    /** @param {Number} length @param {String} target @param {String} guess */
    constructor(length, target, guess){
        this.length = length;
        this.guess = guess;
        this.target = target;

        /** @type {Number[]} */
        this.results = new Array(length).fill(WordleResult.INCORRECT);

        this.success = guess === target;

        if(this.success) this.results.fill(WordleResult.CORRECT);
        else this.generateResults();
    }

    /** @private */
    generateResults(){
        /** @type {Map<String, Number>}} */
        let charCounts = new Map();

        // First pass - find correct chars, get char counts
        for(let i = 0; i < this.length; i++){
            let targetChar = this.target[i];
            if(this.guess[i] === targetChar){
                this.results[i] = WordleResult.CORRECT;
            }
            else{
                charCounts.set(targetChar, (charCounts.get(targetChar) || 0) + 1);
            }
        }
        // Second pass - determine misplaced/incorrect chars
        for(let i = 0; i < this.length; i++){
            if(this.results[i] === WordleResult.CORRECT) continue;

            let guessedChar = this.guess[i];
            if(charCounts.get(guessedChar) > 0){
                charCounts.set(guessedChar, charCounts.get(guessedChar) - 1);
                this.results[i] = WordleResult.MISPLACED;
            }
            else{
                this.results[i] = WordleResult.INCORRECT;
            }
        }
    }


    /** @param {String} word */
    matches(word){
        if (word.length !== this.length) return false;
        let charMap = new Map();
        for (let i = 0; i < this.length; i++) {
            let c = word[i];
            if (this.guess[i] === c) {
                if (this.results[i] !== WordleResult.CORRECT) return false;
            } else {
                if (this.results[i] === WordleResult.CORRECT) return false;
                charMap.set(c, (charMap.get(c) || 0) + 1)
            }
        }
        for (let i = 0; i < this.length; i++) {
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