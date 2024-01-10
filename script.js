import {Wordle} from "./wordle.js";

for(let wordLength = 4; wordLength <= 8; wordLength++) {
    console.log(`Loading ${wordLength} letter words`)
    let allWords = await (await fetch(`/res/dictionary/allWords${wordLength}.txt`)).text();
    Wordle.updateDictionary(allWords.split(/\s+/g));
    let guessableWords = await (await fetch(`/res/dictionary/guessableWords${wordLength}.txt`)).text();
    Wordle.loadWords(wordLength, guessableWords.split(/\s+/g));
}

console.log("Loaded " + Wordle.dictionary.size + " words into dictionary");

function changeScreenTo(screen) {
    document.getElementById('screens-container').style.setProperty(
        '--active-screen', `${screen}`
    )
}

document.getElementById('play-button').onclick = _ => {
    changeScreenTo(1);
}