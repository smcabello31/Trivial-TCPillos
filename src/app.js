// Configuration constants
const SUBJECTS_ICONS = ['❤️', '🩷', '💛', '🧡', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶', '🤍']
const AVATARS = {
  WHITE: 'white_avatar.png',
  GREEN: 'white_avatar.png',
  RED: 'white_avatar.png',
  PINK: 'white_avatar.png',
  PURPLE: 'white_avatar.png',
  BLUE: 'white_avatar.png',
  BLACK: 'white_avatar.png'
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

// Global variables
let questionsBatteryRaw = ''

// Events
$questionsBattery.addEventListener('change', (event) => {
  const file = event.target.files[0]
  const reader = new FileReader()
  reader.addEventListener('load', (event) => {
    questionsBatteryRaw = event.target.result
  })
  reader.readAsText(file)
  loadQuestionsBattery()
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
}

// Button handlers
const handleOpenConfigurationScreen = () => {
  hideChildrenDivElements($body)
  $configurationScreen.classList.remove('hidden')
}

const handleOpenTitleScreen = () => {
  hideChildrenDivElements($body)
  $titleScreen.classList.remove('hidden')
}