// Configuration constants
const SUBJECTS_ICONS = ['❤️', '🩷', '💛', '🧡', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶', '🤍']
const SUBJECT_COLORS = ['#fe3260', '#ff41a0', '#ffda47', '#ff865b', '#36c280', '#3980f9', '#5fc2fa', '#9f3af5', '#a6655b', '#2d2c2e', '#9f99a8', '#e6e0ed']

const AVATARS = {
  WHITE: '../assets/white.jpg',
  GREEN: '../assets/green.jpg',
  RED: '../assets/red.jpg',
  PINK: '../assets/pink.jpg',
  PURPLE: '../assets/purple.jpg',
  BLUE: '../assets/blue.jpg',
  BLACK: '../assets/black.jpg'
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
    .forEach(div => div.classList.add('hidden'))
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
    .difficulty = difficulty;
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

const drawPlayer = ({ name, avatar, score }) => {
  let playerScore = ''
  if (score) {
    score.forEach(s => {
      playerScore += `<span>${getSubjectIcon(s.subjectId).repeat(s.points)}</span>`
    })
  }
  return `
<div style="display: flex; align-items: center; gap: 15px;">
  <div style="display: flex; flex-direction: column">
    <img src="${avatar}" alt="Avatar de ${name}" width="64" height="64" />
    <span style="font-size: 24px; font-weight: bold; text-align:center;">${name}</span>
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
    playersBoard += drawPlayer({ name: p.name, avatar: p.avatar, score: p.score })
  })

  if (playersBoard) {
    $boardPlayers.innerHTML = playersBoard
  }
}

const drawSubjectCard = ({ subjectId, name, color }) => {
  return `
<div id="subject-card-${subjectId}" class="subject-card" style="background:linear-gradient(135deg, ${color} 0%, ${lightenColor(color, 20)} 100%);">
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

// Button handlers
const handleOpenConfigurationScreen = () => {
  hideChildrenDivElements($body)
  renderPlayersConfiguration()
  $configurationScreen.classList.remove('hidden')
}

const handleOpenTitleScreen = () => {
  hideChildrenDivElements($body)
  $titleScreen.classList.remove('hidden')
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
  $avatar.value = null
  handleOpenConfigurationScreen()
}

const handleDeletePlayer = (playerId) => {
  configuration.players = configuration.players.filter(player => player.id !== playerId)
}

const handleStartGame = () => {
  hideChildrenDivElements($body)
  renderPlayersBoard()
  renderBoard()
  $playingBoardScreen.classList.remove('hidden')
}