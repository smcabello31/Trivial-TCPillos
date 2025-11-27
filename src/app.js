// Configuration constants
const SUBJECTS_ICONS = ['❤️', '🩷', '💛', '🧡', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶', '🤍']

const AVATARS = {
  WHITE: '../assets/white.jpg',
  GREEN: '../assets/green.jpg',
  RED: '../assets/red.jpg',
  PINK: '../assets/pink.jpg',
  PURPLE: '../assets/purple.jpg',
  BLUE: '../assets/blue.jpg',
  BLACK: '../assets/black.jpg'
}

const configuration = {
  subjects: [],
  questions: [],
  answers: [],
  players: []
}

// Main elements of the page
const $body = document.getElementById('body')
const $questionsBattery = document.getElementById('questions-battery-file')
const $titleScreen = document.getElementById('title-screen')
const $configurationScreen = document.getElementById('configuration-screen')
const $createPlayerScreen = document.getElementById('create-player-screen')
const $questionsBatteryContainer = document.getElementById('questions-battery-container')
const $configurationPlayers = document.getElementById('configuration-players')

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

const ltrim = (str) => {
  return str.replace(/^\s+/, '')
}

// Subjects API
const createSubject = ({ name }, subjectsCounter) => {
  return {
    id: crypto.randomUUID(),
    name: name,
    icon: SUBJECTS_ICONS[subjectsCounter]
  }
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
const createPlayer = ({ name, avatar }) => {
  return {
    id: crypto.randomUUID(),
    name: name,
    avatar: AVATARS[avatar]
  }
}

const drawPlayer = ({ name, avatar }) => {
  return `
<div style="display: flex; align-items: center; gap: 8px;">
  <img src="${avatar}" alt="Player Icon" width="48" height="48" />
  <span style="font-size: 18px; font-weight: bold;">${name}</span>
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

  player = createPlayer({ name: name, avatar: avatar })
  configuration.players.push(player)

  $name.value = null
  $avatar.value = null
  handleOpenConfigurationScreen()
}

const handleDeletePlayer = (playerId) => {
  configuration.players = configuration.players.filter(player => player.id !== playerId)
}