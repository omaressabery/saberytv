// Configuration de l'API
const API_CONFIG = {
    baseUrl: 'https://api.football-data.org/v4',
    apiKey: 'fc17965e481c9db3c293544f72c6402b', // Clé API Football-Data
    fallbackBaseUrl: 'https://v3.football.api-sports.io',
    fallbackApiKey: 'VOTRE_CLÉ_API_SPORTS_ICI' // Clé API-Sports (optionnel)
};

// État global
let currentSection = 'live';
let matches = [];
let liveMatches = [];
let standings = [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupFilters();
    setupModal();
    loadInitialData();
    
    // Auto-rafraîchissement des matchs en direct
    setInterval(() => {
        if (currentSection === 'live') {
            loadLiveMatches();
        }
    }, 30000); // Toutes les 30 secondes
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.dataset.section;
            
            // Mettre à jour les boutons actifs
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Afficher la section correspondante
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
            
            currentSection = targetSection;
            
            // Charger les données appropriées
            switch(targetSection) {
                case 'live':
                    loadLiveMatches();
                    break;
                case 'matches':
                    loadMatches();
                    break;
                case 'stats':
                    loadStatistics();
                    break;
            }
        });
    });
}

// Filtres
function setupFilters() {
    // Filtre pour matchs en direct
    const liveLeagueFilter = document.getElementById('live-league-filter');
    if (liveLeagueFilter) {
        liveLeagueFilter.addEventListener('change', () => {
            filterLiveMatches();
        });
    }
    
    // Filtre pour matchs
    const matchDate = document.getElementById('match-date');
    const leagueFilter = document.getElementById('league-filter');
    
    if (matchDate) {
        // Définir la date du jour par défaut
        matchDate.valueAsDate = new Date();
        matchDate.addEventListener('change', () => {
            loadMatches();
        });
    }
    
    if (leagueFilter) {
        leagueFilter.addEventListener('change', () => {
            loadMatches();
        });
    }
    
    // Filtres pour statistiques
    const statsLeagueFilter = document.getElementById('stats-league-filter');
    const statsSeasonFilter = document.getElementById('stats-season-filter');
    
    if (statsLeagueFilter) {
        statsLeagueFilter.addEventListener('change', () => {
            loadStatistics();
        });
    }
    
    if (statsSeasonFilter) {
        statsSeasonFilter.addEventListener('change', () => {
            loadStatistics();
        });
    }
}

// Modal
function setupModal() {
    const modal = document.getElementById('match-modal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Chargement des données initiales
async function loadInitialData() {
    // Charger les matchs en direct par défaut
    await loadLiveMatches();
}

// Fonction utilitaire pour les appels API
async function apiCall(endpoint, useFallback = false) {
    const config = useFallback ? 
        { baseUrl: API_CONFIG.fallbackBaseUrl, apiKey: API_CONFIG.fallbackApiKey } :
        { baseUrl: API_CONFIG.baseUrl, apiKey: API_CONFIG.apiKey };
    
    try {
        const response = await fetch(`${config.baseUrl}${endpoint}`, {
            headers: {
                'X-Auth-Token': config.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        
        // Si l'API principale échoue avec une erreur 403/429, ne pas essayer le fallback
        if (error.message.includes('403') || error.message.includes('429')) {
            console.log('API limit reached or invalid key, using mock data');
            return getMockData(endpoint);
        }
        
        // Essayer l'API fallback si la première échoue
        if (!useFallback && API_CONFIG.fallbackApiKey !== 'VOTRE_CLÉ_API_SPORTS_ICI') {
            console.log('Trying fallback API...');
            return await apiCall(endpoint, true);
        }
        
        // Retourner des données mock si les deux APIs échouent
        console.log('Using mock data for:', endpoint);
        return getMockData(endpoint);
    }
}

// Données mock pour démonstration
function getMockData(endpoint) {
    console.log('Using mock data for:', endpoint);
    
    if (endpoint.includes('matches')) {
        return {
            matches: generateMockMatches()
        };
    }
    
    if (endpoint.includes('standings')) {
        return {
            standings: [{
                table: generateMockStandings()
            }]
        };
    }
    
    return {};
}

// Générer des matchs mock
function generateMockMatches() {
    const teams = [
        'PSG', 'OM', 'Lyon', 'Monaco', 'Lille', 'Bordeaux',
        'Manchester City', 'Liverpool', 'Chelsea', 'Arsenal',
        'Real Madrid', 'Barcelona', 'Atletico', 'Sevilla',
        'Bayern Munich', 'Dortmund', 'Leipzig', 'Leverkusen'
    ];
    
    const mockMatches = [];
    
    for (let i = 0; i < 10; i++) {
        const homeTeam = teams[Math.floor(Math.random() * teams.length)];
        let awayTeam = teams[Math.floor(Math.random() * teams.length)];
        while (awayTeam === homeTeam) {
            awayTeam = teams[Math.floor(Math.random() * teams.length)];
        }
        
        const isLive = Math.random() > 0.7;
        const homeScore = isLive ? Math.floor(Math.random() * 4) : 0;
        const awayScore = isLive ? Math.floor(Math.random() * 4) : 0;
        
        mockMatches.push({
            id: i + 1,
            homeTeam: { name: homeTeam, crest: `https://via.placeholder.com/50` },
            awayTeam: { name: awayTeam, crest: `https://via.placeholder.com/50` },
            score: { fullTime: { home: homeScore, away: awayScore } },
            status: isLive ? 'IN_PLAY' : 'SCHEDULED',
            utcDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            competition: { name: 'Premier League', id: 61 },
            matchday: Math.floor(Math.random() * 38) + 1
        });
    }
    
    return mockMatches;
}

// Générer des classements mock
function generateMockStandings() {
    const teams = [
        'Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United',
        'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham',
        'Crystal Palace', 'Wolves', 'Leicester', 'Everton', 'Nottingham Forest',
        'Brentford', 'Fulham', 'Leeds', 'Southampton', 'Bournemouth'
    ];
    
    return teams.map((team, index) => ({
        position: index + 1,
        team: { name: team, crest: `https://via.placeholder.com/30` },
        playedGames: Math.floor(Math.random() * 10) + 25,
        won: Math.floor(Math.random() * 15),
        draw: Math.floor(Math.random() * 10),
        lost: Math.floor(Math.random() * 10),
        goalsFor: Math.floor(Math.random() * 40) + 20,
        goalsAgainst: Math.floor(Math.random() * 30) + 15,
        goalDifference: Math.floor(Math.random() * 20) - 10,
        points: (index + 1) * 3 - Math.floor(Math.random() * 10)
    })).sort((a, b) => b.points - a.points);
}

// Charger les matchs en direct
async function loadLiveMatches() {
    const container = document.getElementById('live-matches');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Chargement des matchs en direct...</p></div>';
    
    try {
        // Utiliser l'API Football-Data pour les matchs en direct
        const data = await apiCall('/matches?status=IN_PLAY');
        liveMatches = data.matches || [];
        
        console.log('Live matches loaded:', liveMatches.length);
        
        if (liveMatches.length === 0) {
            container.innerHTML = '<div class="no-matches"><p>Aucun match en direct pour le moment</p><p>Essayez plus tard ou consultez le calendrier des matchs</p></div>';
            return;
        }
        
        displayLiveMatches(liveMatches);
    } catch (error) {
        console.error('Error loading live matches:', error);
        container.innerHTML = '<div class="error"><p>Erreur lors du chargement des matchs en direct</p><p>Vérifiez votre connexion ou réessayez plus tard</p></div>';
    }
}

// Afficher les matchs en direct
function displayLiveMatches(matches) {
    const container = document.getElementById('live-matches');
    const leagueFilter = document.getElementById('live-league-filter').value;
    
    const filteredMatches = leagueFilter ? 
        matches.filter(match => match.competition.id == leagueFilter) : 
        matches;
    
    container.innerHTML = filteredMatches.map(match => createMatchCard(match, true)).join('');
    
    // Ajouter les écouteurs d'événements
    container.querySelectorAll('.match-card').forEach(card => {
        card.addEventListener('click', () => {
            showMatchDetails(card.dataset.matchId);
        });
    });
}

// Filtrer les matchs en direct
function filterLiveMatches() {
    displayLiveMatches(liveMatches);
}

// Charger les matchs
async function loadMatches() {
    const container = document.getElementById('match-list');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Chargement des matchs...</p></div>';
    
    try {
        const date = document.getElementById('match-date').value;
        const leagueFilter = document.getElementById('league-filter').value;
        
        let endpoint = `/matches?date=${date}`;
        if (leagueFilter) {
            endpoint += `&competitions=${leagueFilter}`;
        }
        
        console.log('Loading matches from:', endpoint);
        const data = await apiCall(endpoint);
        matches = data.matches || [];
        
        console.log('Matches loaded:', matches.length);
        
        if (matches.length === 0) {
            container.innerHTML = '<div class="no-matches"><p>Aucun match trouvé pour cette date</p><p>Essayez une autre date ou ligue</p></div>';
            return;
        }
        
        displayMatches(matches);
    } catch (error) {
        console.error('Error loading matches:', error);
        container.innerHTML = '<div class="error"><p>Erreur lors du chargement des matchs</p><p>Vérifiez votre connexion ou réessayez</p></div>';
    }
}

// Afficher les matchs
function displayMatches(matches) {
    const container = document.getElementById('match-list');
    
    container.innerHTML = matches.map(match => createMatchItem(match)).join('');
    
    // Ajouter les écouteurs d'événements
    container.querySelectorAll('.match-item').forEach(item => {
        item.addEventListener('click', () => {
            showMatchDetails(item.dataset.matchId);
        });
    });
}

// Charger les statistiques
async function loadStatistics() {
    const container = document.getElementById('stats-content');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Chargement des statistiques...</p></div>';
    
    try {
        const leagueFilter = document.getElementById('stats-league-filter').value;
        const seasonFilter = document.getElementById('stats-season-filter').value;
        
        if (!leagueFilter) {
            container.innerHTML = '<div class="no-stats"><p>Veuillez sélectionner une ligue</p></div>';
            return;
        }
        
        const endpoint = `/competitions/${leagueFilter}/standings?season=${seasonFilter}`;
        console.log('Loading statistics from:', endpoint);
        
        const data = await apiCall(endpoint);
        standings = data.standings || [];
        
        console.log('Standings loaded:', standings.length);
        
        if (!standings || standings.length === 0) {
            container.innerHTML = '<div class="no-stats"><p>Aucune statistique disponible pour cette ligue/saison</p></div>';
            return;
        }
        
        displayStatistics(standings);
    } catch (error) {
        console.error('Error loading statistics:', error);
        container.innerHTML = '<div class="error"><p>Erreur lors du chargement des statistiques</p><p>Réessayez avec une autre ligue ou saison</p></div>';
    }
}

// Afficher les statistiques
function displayStatistics(standings) {
    const container = document.getElementById('stats-content');
    
    if (!standings || standings.length === 0) {
        container.innerHTML = '<div class="no-stats"><p>Aucune statistique disponible</p></div>';
        return;
    }
    
    const table = standings[0].table;
    
    container.innerHTML = `
        <div class="stats-overview">
            <h3>Classement de la saison</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${table.length}</div>
                    <div class="stat-label">Équipes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${table[0].playedGames}</div>
                    <div class="stat-label">Matchs joués</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${table.reduce((sum, team) => sum + team.goalsFor, 0)}</div>
                    <div class="stat-label">Buts marqués</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${table.reduce((sum, team) => sum + team.goalsAgainst, 0)}</div>
                    <div class="stat-label">Buts encaissés</div>
                </div>
            </div>
        </div>
        
        <table class="standings-table">
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Équipe</th>
                    <th>MJ</th>
                    <th>V</th>
                    <th>N</th>
                    <th>D</th>
                    <th>BP</th>
                    <th>BC</th>
                    <th>Diff</th>
                    <th>Pts</th>
                </tr>
            </thead>
            <tbody>
                ${table.map(team => createStandingsRow(team)).join('')}
            </tbody>
        </table>
    `;
}

// Créer une carte de match
function createMatchCard(match, isLive = false) {
    const homeTeam = match.homeTeam;
    const awayTeam = match.awayTeam;
    const score = match.score.fullTime;
    const status = match.status;
    const competition = match.competition;
    
    const statusText = status === 'IN_PLAY' ? 'EN DIRECT' : 
                      status === 'FINISHED' ? 'TERMINÉ' : 
                      new Date(match.utcDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div class="match-card ${isLive ? 'live' : ''}" data-match-id="${match.id}">
            <div class="match-header">
                <span class="league-name">${competition.name}</span>
                ${status === 'IN_PLAY' ? '<span class="live-badge">LIVE</span>' : ''}
            </div>
            
            <div class="teams">
                <div class="team">
                    <img src="${homeTeam.crest}" alt="${homeTeam.name}" class="team-logo">
                    <span class="team-name">${homeTeam.name}</span>
                </div>
                
                <div class="score">
                    <div class="score-display">
                        ${score.home} - ${score.away}
                    </div>
                    <div class="match-time">${statusText}</div>
                </div>
                
                <div class="team">
                    <img src="${awayTeam.crest}" alt="${awayTeam.name}" class="team-logo">
                    <span class="team-name">${awayTeam.name}</span>
                </div>
            </div>
            
            <div class="match-footer">
                <span class="match-status">Journée ${match.matchday || '-'}</span>
                <span class="match-venue">${new Date(match.utcDate).toLocaleDateString('fr-FR')}</span>
            </div>
        </div>
    `;
}

// Créer un élément de match pour la liste
function createMatchItem(match) {
    const homeTeam = match.homeTeam;
    const awayTeam = match.awayTeam;
    const score = match.score.fullTime;
    const status = match.status;
    
    const statusText = status === 'IN_PLAY' ? 'EN DIRECT' : 
                      status === 'FINISHED' ? 'TERMINÉ' : 
                      new Date(match.utcDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div class="match-item" data-match-id="${match.id}">
            <div class="match-item-left">
                <div class="match-date">${new Date(match.utcDate).toLocaleDateString('fr-FR')}</div>
                <div class="match-teams">
                    <span>${homeTeam.name}</span>
                    <span>vs</span>
                    <span>${awayTeam.name}</span>
                </div>
            </div>
            
            <div class="match-item-right">
                <div class="score-display">
                    ${status === 'SCHEDULED' ? statusText : `${score.home} - ${score.away}`}
                </div>
                ${status === 'IN_PLAY' ? '<span class="live-badge">LIVE</span>' : ''}
            </div>
        </div>
    `;
}

// Créer une ligne de classement
function createStandingsRow(team) {
    return `
        <tr>
            <td class="team-position">${team.position}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${team.team.crest}" alt="${team.team.name}" style="width: 20px; height: 20px;">
                    <span>${team.team.name}</span>
                </div>
            </td>
            <td>${team.playedGames}</td>
            <td>${team.won}</td>
            <td>${team.draw}</td>
            <td>${team.lost}</td>
            <td>${team.goalsFor}</td>
            <td>${team.goalsAgainst}</td>
            <td>${team.goalDifference}</td>
            <td><strong>${team.points}</strong></td>
        </tr>
    `;
}

// Afficher les détails d'un match
function showMatchDetails(matchId) {
    const modal = document.getElementById('match-modal');
    const detailsContainer = document.getElementById('match-details');
    
    // Trouver le match dans les données
    const match = [...liveMatches, ...matches].find(m => m.id == matchId);
    
    if (!match) {
        detailsContainer.innerHTML = '<p>Détails du match non disponibles</p>';
        modal.style.display = 'block';
        return;
    }
    
    detailsContainer.innerHTML = `
        <h2>Détails du match</h2>
        <div class="match-detail">
            <div class="teams-detail">
                <div class="team-detail">
                    <img src="${match.homeTeam.crest}" alt="${match.homeTeam.name}" style="width: 80px; height: 80px;">
                    <h3>${match.homeTeam.name}</h3>
                </div>
                
                <div class="score-detail">
                    <div class="score-display" style="font-size: 3rem;">
                        ${match.score.fullTime.home} - ${match.score.fullTime.away}
                    </div>
                    <div class="match-status">${match.status === 'IN_PLAY' ? 'EN DIRECT' : 'TERMINÉ'}</div>
                </div>
                
                <div class="team-detail">
                    <img src="${match.awayTeam.crest}" alt="${match.awayTeam.name}" style="width: 80px; height: 80px;">
                    <h3>${match.awayTeam.name}</h3>
                </div>
            </div>
            
            <div class="match-info">
                <p><strong>Compétition:</strong> ${match.competition.name}</p>
                <p><strong>Date:</strong> ${new Date(match.utcDate).toLocaleString('fr-FR')}</p>
                <p><strong>Journée:</strong> ${match.matchday || '-'}</p>
                ${match.score.halfTime ? `<p><strong>Mi-temps:</strong> ${match.score.halfTime.home} - ${match.score.halfTime.away}</p>` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Styles supplémentaires pour le modal
const modalStyles = `
<style>
.match-detail {
    text-align: center;
    padding: 2rem 0;
}

.teams-detail {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 2rem;
}

.team-detail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.score-detail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.match-info {
    text-align: left;
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 10px;
    margin-top: 2rem;
}

.match-info p {
    margin-bottom: 0.5rem;
}
</style>
`;

// Ajouter les styles du modal
document.head.insertAdjacentHTML('beforeend', modalStyles);
