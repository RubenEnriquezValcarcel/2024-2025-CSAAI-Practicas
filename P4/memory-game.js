const selectors = {
    gridContainer: document.querySelector('.game'),
    movimientos: document.querySelector('.movimientos'),
    timer: document.querySelector('.timer'),
    comenzar: document.querySelector('#comenzar'),
    reiniciar: document.querySelector('#reiniciar'),
    win: document.querySelector('.win'),
    tamanio: document.querySelector('#tamanio')
}

const state = {
    gameStarted: false,
    flippedCards: 0,
    totalFlips: 0,
    totalTime: 0,
    loop: null
}

const pickRandom = (array, items) => {
    const clonedArray = [...array]
    const randomPicks = []
    for (let i = 0; i < items; i++) {
        const index = Math.floor(Math.random() * clonedArray.length)
        randomPicks.push(clonedArray[index])
        clonedArray.splice(index, 1)
    }
    return randomPicks
}

const shuffle = array => {
    const clonedArray = [...array]
    for (let i = clonedArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = clonedArray[i]
        clonedArray[i] = clonedArray[j]
        clonedArray[j] = temp
    }
    return clonedArray
}

const generateGame = () => {
    const tablero = document.querySelector('.tablero')
    const dimensions = parseInt(selectors.tamanio.value)
    tablero.setAttribute('grid-dimension', dimensions)
    
    if (dimensions % 2 !== 0) throw new Error("Las dimensiones deben ser pares.")
    
    const emojis = Array.from({length: 18}, (_, i) => `${i + 1}.webp`);
    const neededPairs = (dimensions * dimensions) / 2
    const picks = pickRandom(emojis, neededPairs)
    const items = shuffle([...picks, ...picks])

    tablero.style.gridTemplateColumns = `repeat(${dimensions}, minmax(60px, 100px))`; 
    tablero.innerHTML = items.map(item => `
        <div class="card">
            <div class="card-front"></div>
            <div class="card-back">
                <img src="images/${item}" alt="Carta ${item.split('.')[0]}">
            </div>
        </div>
    `).join('');

    attachCardListeners()
}

const startGame = () => {
    if (state.gameStarted) return

    state.gameStarted = true
    selectors.comenzar.classList.add('disabled')
    selectors.tamanio.disabled = true
    state.loop = setInterval(() => {
        state.totalTime++
        selectors.movimientos.innerText = `${state.totalFlips} movimientos`
        selectors.timer.innerText = `tiempo: ${state.totalTime} sec`
    }, 1000)
}

const flipBackCards = () => {
    document.querySelectorAll('.card:not(.matched)').forEach(card => card.classList.remove('flipped'))
    state.flippedCards = 0
}

const checkForWin = () => {
    if (!document.querySelectorAll('.card:not(.matched)').length) {
        clearInterval(state.loop)
        selectors.win.innerHTML = `
            <div class="win-overlay">
                <span class="win-text">
                    ¡Has ganado!<br/>
                    Intentos: <span class="highlight">${state.totalFlips}</span><br/>
                    Tiempo: <span class="highlight">${state.totalTime}</span>s
                </span>
            </div>`
    }
}

const flipCard = card => {
    if (!state.gameStarted) startGame()
    if (!card.classList.contains('flipped') && !card.classList.contains('matched')) {
        state.flippedCards++
        state.totalFlips++
        card.classList.add('flipped')

        if (state.flippedCards === 2) {
            const flipped = document.querySelectorAll('.card.flipped:not(.matched)')
            if (flipped[0].querySelector('img').src === flipped[1].querySelector('img').src) {
                flipped[0].classList.add('matched')
                flipped[1].classList.add('matched')
            }
            setTimeout(() => {
                flipBackCards()
                checkForWin()
            }, 1000)
        }
    }
}

const attachCardListeners = () => {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => flipCard(card))
    })
}

const resetGame = () => {
    clearInterval(state.loop)
    selectors.comenzar.classList.remove('disabled')
    selectors.tamanio.disabled = false
    selectors.win.innerHTML = ''

    state.gameStarted = false
    state.flippedCards = 0
    state.totalFlips = 0
    state.totalTime = 0

    selectors.movimientos.innerText = '0 movimientos'
    selectors.timer.innerText = 'tiempo: 0 sec'

    generateGame()
}

// Event Listeners
selectors.comenzar.addEventListener('click', () => {
    if (!selectors.comenzar.classList.contains('disabled')) {
        generateGame()
        startGame()
    }
})

selectors.reiniciar.addEventListener('click', resetGame)
selectors.tamanio.addEventListener('change', resetGame)

// Inicialización
generateGame()