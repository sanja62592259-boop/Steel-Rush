let data = null
let tournament = { rounds: { quarterfinals: [], semifinals: [], final: [] } }
const tooltipEl = document.getElementById('tooltip')

function loadData() {
  return fetch('tournament.json').then(r => r.json()).then(json => { data = json })
}

function buildTournament() {
  tournament.rounds.quarterfinals = data.scores.quarterfinals.map(m => ({
    id: m.id,
    team1: m.team1,
    team2: m.team2,
    score1: m.score1,
    score2: m.score2,
    time: m.time,
    winner: getWinner(m.team1, m.team2, m.score1, m.score2)
  }))
  const sf1Teams = getWinnerTeams(['qf1', 'qf2'], 'quarterfinals')
  const sf2Teams = getWinnerTeams(['qf3', 'qf4'], 'quarterfinals')
  tournament.rounds.semifinals = [
    {
      id: 'sf1',
      team1: sf1Teams[0],
      team2: sf1Teams[1],
      score1: data.scores.semifinals[0].score1,
      score2: data.scores.semifinals[0].score2,
      time: data.scores.semifinals[0].time,
      winner: getWinner(sf1Teams[0], sf1Teams[1], data.scores.semifinals[0].score1, data.scores.semifinals[0].score2)
    },
    {
      id: 'sf2',
      team1: sf2Teams[0],
      team2: sf2Teams[1],
      score1: data.scores.semifinals[1].score1,
      score2: data.scores.semifinals[1].score2,
      time: data.scores.semifinals[1].time,
      winner: getWinner(sf2Teams[0], sf2Teams[1], data.scores.semifinals[1].score1, data.scores.semifinals[1].score2)
    }
  ]
  const finalTeams = getWinnerTeams(['sf1', 'sf2'], 'semifinals')
  tournament.rounds.final = [
    {
      id: 'final',
      team1: finalTeams[0],
      team2: finalTeams[1],
      score1: data.scores.final[0].score1,
      score2: data.scores.final[0].score2,
      time: data.scores.final[0].time,
      winner: getWinner(finalTeams[0], finalTeams[1], data.scores.final[0].score1, data.scores.final[0].score2)
    }
  ]
}

function getWinner(team1, team2, score1, score2) {
  if (!team1 || !team2) return null
  if (score1 === null || score2 === null) return null
  if (score1 > score2) return team1
  if (score2 > score1) return team2
  return null
}

function getWinnerTeams(ids, roundKey) {
  const winners = []
  ids.forEach(id => {
    const match = tournament.rounds[roundKey].find(m => m.id === id)
    winners.push(match ? match.winner : null)
  })
  return winners
}

function renderBracket() {
  const bracket = document.getElementById('bracket')
  bracket.innerHTML = ''
  const rounds = [
    { key: 'quarterfinals', title: 'ЧВЕРТЬФІНАЛИ', side: 'left' },
    { key: 'semifinals', title: 'ПІВФІНАЛИ', side: 'middle' },
    { key: 'final', title: 'ФІНАЛ', side: 'right' }
  ]
  const matchHeight = 155
  const spacing = 100
  const titleOffset = 140
  rounds.forEach(r => {
    const roundDiv = document.createElement('div')
    roundDiv.className = 'round ' + r.key
    roundDiv.style.position = 'relative'
    const roundTitle = document.createElement('div')
    roundTitle.className = 'round-title'
    roundTitle.textContent = r.title
    roundDiv.appendChild(roundTitle)
    
    if (data.roundFormats && data.roundFormats[r.key]) {
      const formatSubtitle = document.createElement('div')
      formatSubtitle.className = 'round-format'
      formatSubtitle.textContent = data.roundFormats[r.key]
      roundDiv.appendChild(formatSubtitle)
    }
    
    tournament.rounds[r.key].forEach((match, i) => {
      const mEl = createMatchElement(match, r.side)
      mEl.style.position = 'absolute'
      mEl.style.width = '100%'
      mEl.style.top = (titleOffset + calcMatchTop(r.key, i, matchHeight, spacing)) + 'px'
      roundDiv.appendChild(mEl)
    })
    roundDiv.style.height = (titleOffset + getRoundHeight(r.key, matchHeight, spacing)) + 'px'
    bracket.appendChild(roundDiv)
  })
  const finalMatch = tournament.rounds.final[0]
  if (finalMatch && finalMatch.winner) showChampion(finalMatch.winner)
  else hideChampion()
}

function calcMatchTop(round, index, h, s) {
  const qfBlock = h + s
  if (round === 'quarterfinals') return index * qfBlock
  if (round === 'semifinals') {
    const pairStart = index * 2
    const top1 = calcMatchTop('quarterfinals', pairStart, h, s)
    const top2 = calcMatchTop('quarterfinals', pairStart + 1, h, s)
    return (top1 + top2 + h) / 2 - h / 2
  }
  if (round === 'final') {
    const sfTop1 = calcMatchTop('semifinals', 0, h, s)
    const sfTop2 = calcMatchTop('semifinals', 1, h, s)
    return (sfTop1 + sfTop2 + h) / 2 - h / 2
  }
  return 0
}

function getRoundHeight(round, h, s) {
  if (round === 'quarterfinals') return 4 * (h + s)
  if (round === 'semifinals') return 4 * (h + s)
  if (round === 'final') return 4 * (h + s)
  return 0
}

function createMatchElement(match, side) {
  const matchDiv = document.createElement('div')
  matchDiv.className = 'match'
  
  if (match.time) {
    const timeDiv = document.createElement('div')
    timeDiv.className = 'match-time'
    timeDiv.textContent = match.time
    matchDiv.appendChild(timeDiv)
  }
  
  const t1 = createTeamElement(match.team1, match.score1, match.winner, side)
  const vs = document.createElement('div')
  vs.className = 'vs-indicator'
  vs.textContent = 'VS'
  const t2 = createTeamElement(match.team2, match.score2, match.winner, side)
  matchDiv.appendChild(t1)
  matchDiv.appendChild(vs)
  matchDiv.appendChild(t2)
  return matchDiv
}

function createTeamElement(teamName, score, winner, side) {
  const teamDiv = document.createElement('div')
  teamDiv.className = 'team'
  if (!teamName) {
    teamDiv.classList.add('empty')
    teamDiv.innerHTML = '<span class="team-name">Очікування...</span><span class="score"></span>'
    return teamDiv
  }
  if (winner === teamName) teamDiv.classList.add('winner')
  const nameSpan = document.createElement('span')
  nameSpan.className = 'team-name'
  nameSpan.textContent = teamName
  const scoreSpan = document.createElement('span')
  scoreSpan.className = 'score'
  scoreSpan.textContent = score !== null ? String(score) : ''
  teamDiv.appendChild(nameSpan)
  teamDiv.appendChild(scoreSpan)
  teamDiv.addEventListener('mouseenter', e => {
    const members = data.teams[teamName]
    if (!members) return
    tooltipEl.innerHTML = ''
    const header = document.createElement('div')
    header.className = 'tooltip-header'
    header.textContent = teamName
    tooltipEl.appendChild(header)
    members.forEach(m => {
      const mDiv = document.createElement('div')
      mDiv.className = 'tooltip-member'
      mDiv.textContent = m
      tooltipEl.appendChild(mDiv)
    })
    tooltipEl.style.display = 'block'
    positionTooltip(e.currentTarget, side)
  })
  teamDiv.addEventListener('mousemove', () => {
    positionTooltip(teamDiv, side)
  })
  teamDiv.addEventListener('mouseleave', () => {
    tooltipEl.style.display = 'none'
  })
  return teamDiv
}

function positionTooltip(anchor, side) {
  const rect = anchor.getBoundingClientRect()
  const top = rect.top + rect.height / 2 - tooltipEl.offsetHeight / 2
  let left = rect.right + 20
  if (side === 'right') left = rect.left - tooltipEl.offsetWidth - 20
  tooltipEl.style.top = Math.max(8, top) + 'px'
  tooltipEl.style.left = Math.max(8, left) + 'px'
}

function showChampion(name) {
  const c = document.getElementById('champion')
  const n = document.getElementById('championName')
  n.textContent = name
  c.classList.add('show')
}

function hideChampion() {
  const c = document.getElementById('champion')
  const n = document.getElementById('championName')
  n.textContent = ''
  c.classList.remove('show')
}

function updateScores(id, score1, score2) {
  let match = tournament.rounds.quarterfinals.find(m => m.id === id)
  if (!match) match = tournament.rounds.semifinals.find(m => m.id === id)
  if (!match) match = tournament.rounds.final.find(m => m.id === id)
  if (!match) return
  match.score1 = score1
  match.score2 = score2
  match.winner = getWinner(match.team1, match.team2, score1, score2)
  if (id.startsWith('qf')) {
    const sf1Teams = getWinnerTeams(['qf1', 'qf2'], 'quarterfinals')
    const sf2Teams = getWinnerTeams(['qf3', 'qf4'], 'quarterfinals')
    const sf1 = tournament.rounds.semifinals.find(m => m.id === 'sf1')
    const sf2 = tournament.rounds.semifinals.find(m => m.id === 'sf2')
    if (sf1) {
      sf1.team1 = sf1Teams[0]
      sf1.team2 = sf1Teams[1]
      sf1.winner = getWinner(sf1.team1, sf1.team2, sf1.score1, sf1.score2)
    }
    if (sf2) {
      sf2.team1 = sf2Teams[0]
      sf2.team2 = sf2Teams[1]
      sf2.winner = getWinner(sf2.team1, sf2.team2, sf2.score1, sf2.score2)
    }
  }
  if (id.startsWith('sf')) {
    const finalTeams = getWinnerTeams(['sf1', 'sf2'], 'semifinals')
    const f = tournament.rounds.final[0]
    if (f) {
      f.team1 = finalTeams[0]
      f.team2 = finalTeams[1]
      f.winner = getWinner(f.team1, f.team2, f.score1, f.score2)
    }
  }
  renderBracket()
}

function init() {
  loadData().then(() => {
    buildTournament()
    renderBracket()
  })
}

init()
