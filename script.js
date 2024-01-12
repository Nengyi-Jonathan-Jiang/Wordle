import {Wordle, WordleResult} from "./wordle.js";

function changeScreenTo(screen) {
    document.getElementById('screens-container').style.setProperty('--active-screen', `${screen}`)
}

// Load words

for (let wordLength = 4; wordLength <= 12; wordLength++) {
    console.log(`Loading ${wordLength} letter words`)
    let allWords = await (await fetch(`res/dictionary/allWords${wordLength}.txt`)).text();
    Wordle.updateDictionary(allWords.split(/\s+/g));
    let guessableWords = await (await fetch(`res/dictionary/commonWords${wordLength}.txt`)).text();
    Wordle.loadWords(wordLength, guessableWords.split(/\s+/g));
}

console.log("Loaded " + Wordle.dictionary.size + " words into dictionary");

/** @type {string | null} */
let targetWord = null;
/** @type {WordleResult[]} */
let previousGuesses = [];
/** @type {(key:string) => boolean} */
let onKeyPress = _ => {};
/** @type {()=>any} */
let onRestart = () => {};

document.getElementById('restart-game-button').onclick = () => onRestart()
document.getElementById('give-up-button').onclick = () => {
    for(let i = 0; i < targetWord.length; i++) onKeyPress('backspace');
    for(let char of targetWord) onKeyPress(char);
    onKeyPress('enter');
}

window.onkeydown = e => {
    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        if (onKeyPress(e.key.toLowerCase())) {
            e.preventDefault();
        }
    }
}

document.getElementById('play-button').onclick = _ => {
    changeScreenTo(1);
}

document.getElementById('start-game-button').onclick = _ => {
    let wordLength = 5;
    if (document.getElementById('word-length-4').checked) {
        wordLength = 4;
    } else if (document.getElementById('word-length-5').checked) {
        wordLength = 5;
    } else if (document.getElementById('word-length-6').checked) {
        wordLength = 6;
    } else if (document.getElementById('word-length-7').checked) {
        wordLength = 7;
    } else if (document.getElementById('word-length-8').checked) {
        wordLength = 8;
    } else if (document.getElementById('word-length-9').checked) {
        wordLength = 9;
    } else if (document.getElementById('word-length-10').checked) {
        wordLength = 10;
    } else if (document.getElementById('word-length-11').checked) {
        wordLength = 11;
    } else if (document.getElementById('word-length-12').checked) {
        wordLength = 12;
    }

    startGame(
        wordLength,
        !document.getElementById('input-real-words').checked,
        document.getElementById('guess-real-words').checked
    );

    changeScreenTo(2);
}

const keyboard = (function populateKeyboard(container) {
    /** @type {Map<string, HTMLButtonElement>} */
    let letters = new Map;
    for (let row of 'QWERTYUIOP ASDFGHJKL ZXCVBNM'.split(' ')) {
        let rowElement = document.createElement('div');
        for (let letter of row) {
            let l = document.createElement('button');
            l.className = 'wordle-keyboard-letter';
            l.innerText = letter;
            letters.set(letter, l);
            rowElement.appendChild(l);
            l.onclick = _ => onKeyPress(letter);
        }
        container.appendChild(rowElement);
    }

    {
        let enterKey = document.createElement('button');
        enterKey.className = 'wordle-keyboard-letter';
        enterKey.innerText = '↵';
        enterKey.onclick = _ => onKeyPress('Enter');
        container.lastChild.appendChild(enterKey);
    }

    return letters;
})(document.getElementById('wordle-keyboard'));

/**
 * @param {number} wordLength
 * @param {boolean} allowAnyWord
 * @param {boolean} guessAnyWord
 */
function startGame(wordLength, allowAnyWord, guessAnyWord) {
    onRestart = () => {
        startGame(wordLength, allowAnyWord, guessAnyWord);
    }

    targetWord = guessAnyWord ? Wordle.getRandomObscureWord(wordLength) : Wordle.getRandomCommonWord(wordLength);

    console.log(`started new wordle ${wordLength} ${allowAnyWord} ${guessAnyWord} ${targetWord}`)
    previousGuesses = [];
    let wordleInput = document.getElementById('wordle-input');
    let wordleInputBackground = document.getElementById('wordle-input-background');
    let history = document.getElementById('history')
    let container = document.getElementById('wordle-container');

    delete container.dataset.finished;

    while (wordleInputBackground.firstChild) wordleInputBackground.firstChild.remove();
    while (wordleInput.firstChild) wordleInput.firstChild.remove();
    while (history.firstChild) history.firstChild.remove();

    history.style.setProperty('width', `${72 * wordLength}px`);

    [...keyboard.values()].forEach(i => i.className = 'wordle-keyboard-letter');

    /** @type {HTMLSpanElement[]} */
    const letterNodes = [];
    for (let i = 0; i < wordLength; i++) {
        const letterNode = document.createElement('span');
        letterNodes.push(letterNode);
        wordleInput.appendChild(letterNode);
        wordleInputBackground.appendChild(
            document.createElement('span')
        );
    }

    wordleInput.onclick = _ => onKeyPress('backspace');

    onKeyPress = (key) => {
        if (key.toLowerCase() === 'enter') {
            let guess = '';
            for (let letterNode of letterNodes) {
                if ('letter' in letterNode.dataset) {
                    guess += letterNode.dataset.letter.toUpperCase();
                } else break;
            }
            if (guess.length === wordLength && (allowAnyWord || Wordle.dictionaryContains(guess))) {
                let result = WordleResult.generate(wordLength, targetWord, guess);

                for(let i = 0; i < wordLength; i++){
                    keyboard.get(guess[i]).classList.add(`${result.results[i]}`)
                }

                addToHistory(result);
                letterNodes.forEach(i => delete i.dataset.letter);
                if (result.success) {
                    document.querySelectorAll('#wordle-input-background>span').forEach(i => {
                        i.classList.add('hidden');
                    })
                    document.getElementById('wordle-container').dataset.finished = '';
                }
            }
            return true;
        }

        if (key.match(/^[a-zA-Z]$/)) {
            const letter = key.toUpperCase();

            let targetLetterNode = letterNodes[wordLength - 1];
            for (const letterNode of letterNodes) {
                if (!('letter' in letterNode.dataset)) {
                    targetLetterNode = letterNode;
                    break;
                }
            }

            targetLetterNode.dataset.letter = letter;
            return true;
        }

        if (key === 'backspace') {
            let targetLetterNode = null;
            for (const letterNode of letterNodes) {
                if (('letter' in letterNode.dataset)) {
                    targetLetterNode = letterNode;
                }
            }

            delete targetLetterNode?.dataset?.letter;
            return true;
        }
    }
}

/** @param {WordleResult} result */
function addToHistory(result) {
    previousGuesses.push(result);
    let entry = document.createElement('div');
    entry.className = 'wordle-result';
    for (let i = 0; i < result.wordLength; i++) {
        let s = document.createElement('span');
        s.className = `wordle-letter ${result.results[i]}`
        s.innerText = result.guess[i];
        entry.appendChild(s);
    }
    document.getElementById('history').appendChild(entry);

    for (let c of document.getElementById('wordle-input-background').children) {
        c.classList.toggle('hidden');
    }
    document.body.clientHeight;
    for (let c of document.getElementById('wordle-input-background').children) {
        c.classList.toggle('hidden');
    }
}

document.getElementById('game-back-button').onclick = _ => {
    targetWord = null;
    changeScreenTo(1);
};
document.getElementById('start-back-button').onclick = _ => {
    changeScreenTo(0);
};