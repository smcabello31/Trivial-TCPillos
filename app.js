// Configuration constants
const SUBJECTS_ICONS = ['🧡', '🩷', '💛', '❤️', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶', '🤍']
const SUBJECT_COLORS = ['#ff865b', '#ff41a0', '#ffda47', '#fe3260', '#36c280', '#3980f9', '#5fc2fa', '#9f3af5', '#a6655b', '#2d2c2e', '#9f99a8', '#e6e0ed']

const AVATARS = {
  WHITE: '✈️',
  GREEN: '👨🏼‍✈️',
  RED: '👩🏼‍✈️',
  PINK: '📱',
  PURPLE: '🪪',
  BLUE: '🛩️',
  BLACK: '💺'
}

const SOUNDS = {
  CORRECT: 'assets/correct.mp3',
  INCORRECT: 'assets/incorrect.mp3'
}

const configurationLocalStorage = window.localStorage.configuration
const configuration =
  configurationLocalStorage
    ? JSON.parse(configurationLocalStorage)
    : {
      subjects: [],
      questions: [],
      answers: [],
      players: []
    }

setInterval(() => {
  window.localStorage.setItem('configuration', JSON.stringify(configuration))
}, 2500)

// Main elements of the page
const $body = document.getElementById('body')
const $questionsBattery = document.getElementById('questions-battery-file')
const $titleScreen = document.getElementById('title-screen')
const $configurationScreen = document.getElementById('configuration-screen')
const $createPlayerScreen = document.getElementById('create-player-screen')
const $questionsBatteryContainer = document.getElementById('questions-battery-container')
const $configurationPlayers = document.getElementById('configuration-players')
const $playingBoardScreen = document.getElementById('playing-board-screen')
const $boardPlayers = document.getElementById('board-players')
const $playingBoard = document.getElementById('playing-board')

// Global variables
let questionsBatteryRaw = ''
let countdownInterval

// Events
$questionsBattery.addEventListener('change', (event) => {
  const file = event.target.files[0]
  const reader = new FileReader()
  reader.addEventListener('load', (event) => {
    questionsBatteryRaw = event.target.result
    loadQuestionsBattery()
  })
  reader.readAsText(file)
})

// Utils
const hideChildrenDivElements = (element) => {
  Array.from(element.children)
    .filter(child => child.tagName === 'DIV')
    .forEach(div => {
      div.classList.add('hidden')
      if (div.classList.contains('title-screen-open')) div.classList.remove('title-screen-open')
    })
}

function lightenColor(hex, percent) {
  // Remove the # if present
  hex = hex.replace('#', '');

  // Parse RGB values
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Increase each value by percent (0-100)
  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

  // Convert back to hex
  const rr = r.toString(16).padStart(2, '0');
  const gg = g.toString(16).padStart(2, '0');
  const bb = b.toString(16).padStart(2, '0');

  return `#${rr}${gg}${bb}`;
}

function getRandomIndexes(arr) {
  const n = arr.length
  const result = Array.from({ length: n }, (_, i) => i + 1)

  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

const playSound = (src) => {
  const audio = new Audio(src)
  audio.volume = 0.1
  audio.play()
}

// Subjects API
const createSubject = ({ name }, subjectsCounter) => {
  return {
    id: crypto.randomUUID(),
    name: name,
    icon: SUBJECTS_ICONS[subjectsCounter],
    color: SUBJECT_COLORS[subjectsCounter]
  }
}

const getSubjectIcon = (subjectId) => {
  return configuration.subjects.filter(s => s.id === subjectId)[0]?.icon
}

const getSubject = (subjectId) => {
  return configuration.subjects.find(s => s.id === subjectId)
}

// Questions API
const createQuestion = ({ subjectId, text }) => {
  return {
    id: crypto.randomUUID(),
    subjectId: subjectId,
    text: text,
    isAnswered: false
  }
}

const setQuestionDifficulty = (questionId, difficulty) => {
  configuration.questions
    .find(q => q.id === questionId)
    .difficulty = Number(difficulty);
}

const setQuestionIsAnswered = (questionId) => {
  configuration.questions
    .find(q => q.id === questionId)
    .isAnswered = true;
}

const getRandomQuestion = (subjectId, difficulty) => {
  const matchQuestions = configuration.questions.filter(q => q.subjectId === subjectId && Number(q.difficulty) === Number(difficulty) && !q.isAnswered)
  if (matchQuestions.length === 0) {
    alert('No quedan más preguntas para esta asignatura :(')
    return
  }
  const randomNumber = Math.floor(Math.random() * matchQuestions.length)
  return matchQuestions[randomNumber]
}

const getQuestion = (questionId) => {
  return configuration.questions.find(q => q.id === questionId)
}

const renderQuestion = (questionId) => {
  const question = getQuestion(questionId)
  const answers = getAnswers(questionId)
  const subject = getSubject(question.subjectId)

  const isHardQuestion = Number(question.difficulty) === 2

  const $questionModal = document.createElement('div')
  $questionModal.classList.add('question-modal')
  $questionModal.style = `background-color:${subject.color}`
  const questionModalBody =
    `<span style="position:absolute;top:10px;right:10px;font-size:24px;" id="question-timer"></span>
    <h2>${question.text}</h2>
    <ul>
      ${answers.map((answer, index) => {
      const letter = String.fromCharCode(97 + index) // 97 = 'a'
      return `<li data-question-id="${question.id}" data-answer-id="${answer.id}" onclick="handleRespondQuestion(this)">${letter}) ${answer.text}</li>`
    }).join('')}
    </ul>
    ${isHardQuestion ? '<p>Pregunta especial! Si aciertas ganarás un super corazón</p>' : ''}
    `
  $questionModal.innerHTML = questionModalBody
  $body.prepend($questionModal)
  clearInterval(countdownInterval)
  let timeLeft = 60
  const $questionTimer = document.getElementById('question-timer')
  $questionTimer.textContent = `⌛${timeLeft}s`
  countdownInterval = setInterval(() => {
    timeLeft--
    $questionTimer.textContent = `⌛${timeLeft}s`

    if (timeLeft <= 0) {
      clearInterval(countdownInterval)
      handleRespondQuestion()
    }
  }, 1000);
}

// Answers API
const createAnswer = ({ questionId, isCorrect, text }) => {
  return {
    id: crypto.randomUUID(),
    questionId: questionId,
    isCorrect: isCorrect,
    text: text
  }
}

const getAnswers = (questionId) => {
  return configuration.answers.filter(a => a.questionId === questionId)
}

const getAnswer = (answerId) => {
  return configuration.answers.find(a => a.id === answerId)
}

const playCorrectSound = () => {
  playSound(SOUNDS.CORRECT)
}

const playIncorrectSound = () => {
  playSound(SOUNDS.INCORRECT)
}

// Questions Battery API
const loadQuestionsBattery = () => {
  let subjectsCounter = -1
  let currentSubject = {}
  let currentQuestion = {}
  let currentAnswer = {}

  configuration.subjects = []
  configuration.questions = []
  configuration.answers = []
  configuration.answers = []

  questionsBatteryRaw
    .replaceAll('\r', '')
    .split('\n')
    .filter(line => line.trim() !== '')
    .forEach((line) => {
      const [lineType, lineText] = line.split(': ')
      switch (lineType) {
        case 'S':
          subjectsCounter++
          currentSubject = createSubject({
            name: lineText
          }, subjectsCounter)
          configuration.subjects.push(currentSubject)
          break
        case 'Q':
          currentQuestion = createQuestion({
            subjectId: currentSubject.id,
            text: lineText
          })
          configuration.questions.push(currentQuestion)
          break
        case 'D':
          setQuestionDifficulty(currentQuestion.id, lineText)
          break
        case 'T':
          currentAnswer = createAnswer({
            questionId: currentQuestion.id,
            isCorrect: Boolean(true),
            text: lineText
          })
          configuration.answers.push(currentAnswer)
          break
        case 'F':
          currentAnswer = createAnswer({
            questionId: currentQuestion.id,
            isCorrect: Boolean(false),
            text: lineText
          })
          configuration.answers.push(currentAnswer)
          break
        default:
          console.error('Esta línea no se puede leer bien:', lineType, lineText)
      }
    })

  $questionsBatteryContainer.classList.add('hidden')
}

// Players API
const createPlayer = ({ name, avatar, score }) => {
  return {
    id: crypto.randomUUID(),
    name: name,
    avatar: AVATARS[avatar],
    score: score
  }
}

const drawPlayer = ({ name, avatar, score, playerId }) => {
  let playerScore = ''
  if (score) {
    score.forEach(s => {
      playerScore += `<span>${getSubjectIcon(s.subjectId).repeat(s.points)}</span>`
    })
  }
  return `
<div ${playerScore ? 'id="' : ''}${playerScore ? 'board-player-' : ''}${playerScore ? playerId : ''}${playerScore ? '"' : ''} style="display: flex; align-items: center; gap: 15px;">
  <div style="display: flex; flex-direction: column; gap:3px">
    <span class="gaming-board-avatar">${avatar}<span/>
    <span class="gaming-board-name">${name}</span>
  </div>
  <div style="display:flex; flex-direction:column;justify-content:space-around;gap:0px;">
  ${playerScore}
  </div>
</div>`.trim()
}

const renderPlayersConfiguration = () => {
  let playersConfiguration = ''
  configuration.players.forEach(p => {
    playersConfiguration += drawPlayer({ name: p.name, avatar: p.avatar })
  })

  if (playersConfiguration) {
    $configurationPlayers.innerHTML = playersConfiguration
    $configurationPlayers.classList.remove('hidden')
  }
}

const getPlayer = (playerId) => {
  return configuration.players.find(p => p.id === playerId)
}

const addSubjectPoints = (playerId, subjectId) => {
  configuration.players.find(p => p.id === playerId).score.find(s => s.subjectId === subjectId).points++
}

// Score API
const createScore = ({ subjectId, points }) => {
  return {
    subjectId: subjectId,
    points: points ? points : 0
  }
}

// Playing Board
const renderPlayersBoard = () => {
  let playersBoard = ''
  configuration.players.forEach(p => {
    playersBoard += drawPlayer({ name: p.name, avatar: p.avatar, score: p.score, playerId: p.id })
  })

  if (playersBoard) {
    $boardPlayers.innerHTML = playersBoard
  }
}

const drawSubjectCard = ({ subjectId, name, color }) => {
  return `
<div id="subject-card-${subjectId}" onclick="handleSelectSubjectCard('${subjectId}')" class="subject-card" style="background:linear-gradient(135deg, ${color} 0%, ${lightenColor(color, 20)} 100%);">
   <span>${name}</span>
</div>
  `.trim()
}

const renderBoard = () => {
  let subjectsCards = ''
  configuration.subjects.forEach(s => {
    subjectsCards += drawSubjectCard({ subjectId: s.id, name: s.name, color: s.color })
  })
  $playingBoard.innerHTML = subjectsCards
}

// Turns
function generateTurns(players, randomOrder, totalTurns = 1000) {
  const result = []

  for (let turn = 1; turn <= totalTurns; turn++) {
    const cycleIndex = (turn - 1) % randomOrder.length

    const playerIndex = randomOrder[cycleIndex] - 1

    result.push({
      turn,
      playerId: players[playerIndex],
      isPlayed: false
    })
  }

  return result
}

const createTurns = () => {
  if (configuration.turns) return
  configuration.turns = []
  playerIds = configuration.players.map(p => p.id)
  const randomIndexes = getRandomIndexes(playerIds)
  const turns = generateTurns(playerIds, randomIndexes)
  configuration.turns = turns
}

const getCurrentTurn = () => {
  return configuration.turns.find(t => t.isPlayed === false)
}

updatePlayersTurn = () => {
  const t = getCurrentTurn()
  if (!document.getElementById('turn-banner')) {
    const $turnBanner = document.createElement('p')
    $turnBanner.id = 'turn-banner'
    $turnBanner.innerText = `Turno ${t.turn}`
    $boardPlayers.prepend($turnBanner)
  }
  const $turnPlayer = document.getElementById(`board-player-${t.playerId}`)
  document.querySelectorAll('[id^=board-player-]').forEach(div => {
    div.classList.remove('highlight-player')
  })
  $turnPlayer.classList.add('highlight-player')
}

const passTurn = () => {
  configuration.turns.find(t => t.isPlayed === false).isPlayed = true
}

// Button handlers
const handleOpenConfigurationScreen = () => {
  hideChildrenDivElements($body)
  renderPlayersConfiguration()
  $configurationScreen.classList.remove('hidden')
}

const handleOpenTitleScreen = () => {
  hideChildrenDivElements($body)
  $titleScreen.classList.remove('hidden')
  $titleScreen.classList.add('title-screen-open')
}

const handleOpenCreatePlayerScreen = () => {
  hideChildrenDivElements($body)
  $createPlayerScreen.classList.remove('hidden')
}

const handleCreatePlayer = () => {
  const $name = document.querySelector('input[name="player-name"]')
  const $avatar = document.querySelector('input[name="player-avatar"]:checked')

  const name = $name.value
  const avatar = $avatar.value

  let scoreArr = []
  configuration.subjects.forEach(s => {
    const subjectScore = createScore({ subjectId: s.id, points: 0 })
    scoreArr.push(subjectScore)
  })

  player = createPlayer({ name: name, avatar: avatar, score: scoreArr })
  configuration.players.push(player)

  $name.value = null
  handleOpenConfigurationScreen()
}

const handleDeletePlayer = (playerId) => {
  configuration.players = configuration.players.filter(player => player.id !== playerId)
}

const handleStartGame = () => {
  if (configuration.answers.length < 1 || configuration.questions.length < 1 || configuration.subjects.length < 1  || configuration.players.length < 1) {
    alert('No se puede iniciar el juego. Asegúrate de haber cargado una batería de preguntas y de haber creado al menos un jugador.')
    return
  }
  hideChildrenDivElements($body)
  renderPlayersBoard()
  renderBoard()
  createTurns()
  updatePlayersTurn()
  $playingBoardScreen.classList.remove('hidden')
}

const handleSelectSubjectCard = (subjectId) => {
  const playerTurn = getCurrentTurn()
  const player = getPlayer(playerTurn.playerId)
  const subject = getSubject(subjectId)
  const subjectPoints = player.score.find(s => s.subjectId === subjectId).points
  let question
  if (subjectPoints <= 3) {
    // Open normal question
    question = getRandomQuestion(subject.id, 1)
  } else if (subjectPoints === 4) {
    // Open hard question
    question = getRandomQuestion(subject.id, 2)
  } else {
    alert(`El jugador ${player.name} ya ha conseguido los puntos máximos para ${subject.name}`)
  }

  if (question) renderQuestion(question.id)
}

const handleRespondQuestion = (element) => {
  const correctQuestion = () => {
    playCorrectSound()
    setQuestionIsAnswered(questionId)
    addSubjectPoints(turn.playerId, question.subjectId)
    passTurn()
    document.querySelector('.question-modal').remove()
    renderPlayersBoard()
    updatePlayersTurn()
  }

  const incorrectQuestion = () => {
    playIncorrectSound()
    passTurn()
    document.querySelector('.question-modal').remove()
    renderPlayersBoard()
    updatePlayersTurn()
  }
  
  if (!element) {
    incorrectQuestion()
    return
  }

  const { questionId, answerId } = element.dataset

  const answer = getAnswer(answerId)
  const question = getQuestion(questionId)
  const turn = getCurrentTurn()

  answer.isCorrect ? correctQuestion() : incorrectQuestion()
}

const handleDeleteConfiguration = () => {
  localStorage.removeItem('configuration')
  location.reload()
}