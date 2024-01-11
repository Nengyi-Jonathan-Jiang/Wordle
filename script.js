import {Wordle, WordleResult, WordleGame} from "./wordle.js";

function changeScreenTo(screen) {
    document.getElementById('screens-container').style.setProperty('--active-screen', `${screen}`)
}

// Load words

for (let wordLength = 4; wordLength <= 8; wordLength++) {
    console.log(`Loading ${wordLength} letter words`)
    let allWords = await (await fetch(`res/dictionary/allWords${wordLength}.txt`)).text();
    Wordle.updateDictionary(allWords.split(/\s+/g));
    let guessableWords = await (await fetch(`res/dictionary/commonWords${wordLength}.txt`)).text();
    Wordle.loadWords(wordLength, guessableWords.split(/\s+/g));
}

console.log("Loaded " + Wordle.dictionary.size + " words into dictionary");

/** @type {WordleGame} */
let currentGame = null;

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
    }

    currentGame = new WordleGame(wordLength, document.getElementById('only-real-words').checked);

    // Populate wordle guessers


    // document.getElementById('guess-input').setAttribute('maxlength', `${wordLength}`);

    changeScreenTo(2);

    console.log(currentGame);
}