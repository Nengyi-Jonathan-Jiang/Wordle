import {Wordle, WordleResult} from "../wordle.js";

class Constraint {
    /** @param {string} word */
    matches(word) { return false; }
    delete(){}
}


function createRemoveButton(constraint) {
    const removeBtn = document.createElement('button');
    removeBtn.innerText = '-';
    removeBtn.onclick = _ => {
        constraints.splice(constraints.indexOf(constraint), 1);
        removeBtn.parentElement.remove();
        updateWords();
    }
    return removeBtn;
}

class GuessResult extends Constraint {
    /** @param {string} input */
    constructor(input) {
        super();
        this.guess = "";
        this.results = [];
        for (let i = 0; i < input.length;) {
            /** @type {string} */
            let char = input[i++];

            if (char === ".") {
                this.results.push(WordleResult.MISPLACED);
                if(!input[i]?.match(/[a-zA-Z]/)) throw new Error();
                this.guess += input[i++].toUpperCase();
            } else if (char === "-") {
                this.results.push(WordleResult.INCORRECT);
                this.guess += '-';
            } else if (char.match(/[a-z\-]/)) {
                this.results.push(WordleResult.INCORRECT);
                this.guess += char.toUpperCase();
            } else if (char.match(/[A-Z]/)) {
                this.results.push(WordleResult.CORRECT);
                this.guess += char;
            }
            else throw new Error();
        }

        this.result = new WordleResult(this.guess.length, this.guess, this.results, false);

        const el = document.createElement('div');
        el.classList.add('constraint');

        for (let i = 0; i < this.guess.length; i++) {
            const letter = document.createElement('span');
            letter.classList.add('wordle-letter');
            letter.classList.add(this.results[i]);
            letter.innerText = this.guess[i];
            el.appendChild(letter);
        }

        el.appendChild(createRemoveButton(this));

        document.getElementById('constraints-display').appendChild(el);
    }

    matches(e) {
        return this.result.matches(e);
    }
}

class LetterCount extends Constraint {
    constructor(letter, operation, number) {
        super();
        this.letter = letter.toUpperCase();
        this.operation = operation;
        this.number = number;

        if(!'<>='.includes(operation)) throw new Error();
        if(number !== ~~number || +number < 0) throw new Error();

        const el = document.createElement('div');
        el.classList.add('letter-query');

        const s = document.createElement('span');
        s.innerText = `count('${letter}') ${operation} ${number}`
        el.appendChild(s)
        el.appendChild(createRemoveButton(this));
        
        document.getElementById('constraints-display').appendChild(el);
    }

    matches(word) {
        let count = 0;
        for(let i = 0; i < word.length; i++) {
            if(word[i] === this.letter) count++;
        }
        switch (this.operation) {
            case '<': return count < this.number
            case '>': return count > this.number
            case '=': return count === this.number
        }
    }
}

class CommonOnly extends Constraint {
    constructor() {
        super();

        const el = document.createElement('div');
        el.classList.add('letter-query');

        const s = document.createElement('span');
        s.innerText = 'Common only';
        el.appendChild(s)
        el.appendChild(createRemoveButton(this));

        document.getElementById('constraints-display').appendChild(el);
    }
    matches(word) {
        return Wordle.words.get(word.length)?.has(word)
    }
}

await Promise.all([4, 5, 6, 7, 8, 9, 10, 11, 12].map(wordLength => (async () => {
    console.log(`Loading ${wordLength} letter words`)
    let allWords = await (await fetch(`../res/dictionary/allWords${wordLength}.txt`)).text();
    Wordle.updateDictionary(allWords.split(/\s+/g));
    let guessableWords = await (await fetch(`../res/dictionary/commonWords${wordLength}.txt`)).text();
    Wordle.loadWords(wordLength, guessableWords.split(/\s+/g));
})()));
console.log('done loading dictionary');

/** @type {Constraint[]} */
let constraints = [];

let activeConstraints = [];

function updateWords() {
    let out = document.getElementById('output-words');
    [...out.children].forEach(i => i.remove());

    if(constraints.filter(i => i instanceof GuessResult).length === 0) {
        out.previousElementSibling.innerText = ""
        return;
    }

    for(let word of getAllMatchingWords()) {
        let s = document.createElement('span');
        s.innerText = word;
        if(Wordle.words.get(word.length).has(word)) {
            s.classList.add('common')
        }
        out.appendChild(s);
    }
    out.previousElementSibling.innerText = `Matching words: (${out.children.length} entries)`
}

function createNewConstraint(str) {
    let res;
    if(str.match(/^(?:-|\.?[a-zA-Z])+$/)) {
        res = new GuessResult(str);
    }
    else if(str.match(/^[a-zA-Z][>=<]\d+$/)) {
        res = new LetterCount(str[0], str[1], +str.slice(2));
    }
    else if(str === '_common') {
        res = new CommonOnly();
    }
    else throw new Error();

    constraints.push(res);

    updateWords();
}

window.activeGuesses = constraints;

document.getElementById('guess-input').onkeydown = e => {
    if (e.key === 'Enter') {
        try {
            createNewConstraint(e.target.value.replaceAll(/\s+/g, ''));
            e.target.value = '';
        } catch (ex) {
            console.error(ex);
            console.log(e.target.value);
        }

        e.preventDefault();
        return;
    }
    if(e.key === 'Backspace' && e.shiftKey) {
        document.getElementById('constraints-display').lastChild?.remove();
        constraints.pop();
        updateWords();
        e.preventDefault();
    }
    if(e.key === 'Backspace' && e.altKey) {
        [...document.getElementById('constraints-display').children].forEach(i => i.remove());
        constraints.length = 0;
        updateWords();
        e.preventDefault();
    }
}

function getAllMatchingWords() {
    if (constraints.length === 0) return new Set;

    let res = new Set;

    for (let word of Wordle.dictionary) {
        if (constraints.every(x => x.matches(word))) {
            res.add(word)
        }
    }

    return res;
}

window.getAllMatchingWords = getAllMatchingWords;