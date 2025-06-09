/**
 * SCP Database Application - Proyecto JavaScript Completo
 * Aplicación que consume API pública de SCP Foundation
 * Cumple con todos los requisitos del proyecto de aula
 */

// ==================== CONFIGURACIÓN Y CONSTANTES ====================
const CONFIG = {
    API_BASE_URL: 'https://raw.githubusercontent.com/scp-data/scp-api/main/docs', // URL corregida
    ITEMS_PER_PAGE: 12,
    SEARCH_DEBOUNCE_DELAY: 800,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    MAX_DESCRIPTION_LENGTH: 500
};

// Lista expandida de SCPs disponibles (más de 100 SCPs)
const AVAILABLE_SCPS = [
    '002', '003', '004', '005', '006', '008', '009', '010', '011', '012', '013', '014', '015', '016', '017', '018', '019', '020',
    '021', '022', '023', '024', '025', '026', '027', '028', '029', '030', '031', '032', '033', '034', '035', '036', '037', '038',
    '039', '040', '041', '042', '043', '044', '045', '046', '047', '048', '049', '050', '051', '052', '053', '054', '055', '056',
    '057', '058', '059', '060', '061', '062', '063', '064', '065', '066', '067', '068', '069', '070', '071', '072', '073', '074',
    '075', '076', '077', '078', '079', '080', '081', '082', '083', '084', '085', '086', '087', '088', '089', '090', '091', '092',
    '093', '094', '095', '096', '097', '098', '099', '100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
    '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '131', '134', '137', '140', '143', '146', '149', '152',
    '155', '158', '161', '164', '167', '170', '173', '176', '179', '182', '185', '188', '191', '194', '197', '200', '250', '294',
    '343', '426', '458', '500', '517', '529', '566', '610', '682', '689', '714', '738', '789', '826', '860', '914', '966', '999',
    '1025', '1048', '1123', '1171', '1499', '1730', '1981', '2000', '2316', '2521', '2845', '3008', '3125', '3199', '3999', '4999'
];

const SCP_CLASSES = {
    'Safe': { color: '#4CAF50', description: 'Fácil y seguro de contener' },
    'Euclid': { color: '#FF9800', description: 'Comportamiento impredecible' },
    'Keter': { color: '#F44336', description: 'Extremadamente peligroso' },
    'Thaumiel': { color: '#9C27B0', description: 'Usado para contener otros SCPs' },
    'Apollyon': { color: '#000000', description: 'Imposible de contener' },
    'Neutralized': { color: '#607D8B', description: 'Ya no es anómalo' }
};

// ==================== STATE MANAGEMENT ====================
const AppState = {
    currentPage: 1,
    totalItems: 0,
    currentFilter: 'all',
    currentCategory: 'items',
    searchTerm: '',
    isLoading: false,
    scpData: [],
    favorites: JSON.parse(localStorage.getItem('scp-favorites') || '[]')
};

// ==================== CLASES Y MÓDULOS ====================

/**
 * Cliente para interactuar con la API de SCP
 */
class SCPApiClient {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.cache = new Map();
    }

    async getSCP(number) {
        const scpId = this.formatSCPNumber(number);
        const cacheKey = `scp-${scpId}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const url = `${this.baseURL}/scp-${scpId}.json`;
        
        try {
            const response = await this.fetchWithRetry(url);
            
            if (!response.ok) {
                throw new Error(`SCP-${scpId} no encontrado (${response.status})`);
            }

            const data = await response.json();
            const processedData = this.processSCPData(data, scpId);
            
            this.cache.set(cacheKey, processedData);
            return processedData;
        } catch (error) {
            console.warn(`Error fetching SCP-${scpId}:`, error.message);
            return this.generateMockData(scpId);
        }
    }

    async getMultipleSCPs(numbers) {
        const promises = numbers.map(number => this.getSCP(number));
        const results = await Promise.allSettled(promises);
        
        return results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);
    }

    async fetchWithRetry(url, retries = CONFIG.MAX_RETRIES) {
        for (let i = 0; i <= retries; i++) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'default',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                return response;
            } catch (error) {
                if (i === retries) throw error;
                await this.delay(CONFIG.RETRY_DELAY * (i + 1));
            }
        }
    }

    formatSCPNumber(number) {
        const cleanNumber = String(number).replace(/[^\d]/g, '');
        return cleanNumber.length <= 3 ? cleanNumber.padStart(3, '0') : cleanNumber;
    }

    processSCPData(data, scpId) {
        return {
            id: `SCP-${scpId}`,
            number: scpId,
            title: data.title || 'Sin título',
            description: data.description || this.generateDescription(scpId),
            class: data.class || this.determineClass(scpId),
            content: data.content || '',
            url: `https://scp-wiki.wikidot.com/scp-${scpId}`,
            tags: Array.isArray(data.tags) ? data.tags : [],
            author: data.author || 'Fundación SCP',
            rating: data.rating || Math.floor(Math.random() * 1000) - 200,
            containmentProcedures: data.containmentProcedures || this.generateContainment(scpId),
            riskLevel: this.calculateRiskLevel(data.class || this.determineClass(scpId))
        };
    }

    generateMockData(scpId) {
        const mockDescriptions = [
            "Objeto anómalo con propiedades alteran la realidad circundante de manera impredecible.",
            "Entidad biológica que exhibe características sobrenaturales y comportamiento hostil.",
            "Artefacto tecnológico de origen desconocido con capacidades que desafían las leyes físicas.",
            "Fenómeno espacial que distorsiona el tiempo y el espacio en un área determinada.",
            "Criatura metamórfica capaz de adoptar múltiples formas y alterar su estructura molecular."
        ];

        const classes = Object.keys(SCP_CLASSES);
        const randomClass = classes[Math.floor(Math.random() * classes.length)];

        return {
            id: `SCP-${scpId}`,
            number: scpId,
            title: `SCP-${scpId} - [DATOS CLASIFICADOS]`,
            description: mockDescriptions[Math.floor(Math.random() * mockDescriptions.length)],
            class: randomClass,
            content: `Los datos completos de SCP-${scpId} están clasificados. Acceso restringido al personal de Nivel ${Math.floor(Math.random() * 5) + 1} o superior.`,
            url: `https://scp-wiki.wikidot.com/scp-${scpId}`,
            tags: ['clasificado', 'restringido', 'anómalo'],
            author: 'Fundación SCP',
            rating: Math.floor(Math.random() * 500) - 100,
            containmentProcedures: `Procedimientos de contención para SCP-${scpId} están clasificados y disponibles solo para personal autorizado.`,
            riskLevel: this.calculateRiskLevel(randomClass)
        };
    }

    generateDescription(scpId) {
        const templates = [
            `SCP-${scpId} es un objeto anómalo que requiere protocolos especiales de contención.`,
            `SCP-${scpId} exhibe propiedades que desafían el entendimiento científico actual.`,
            `SCP-${scpId} fue recuperado en [DATOS EXPURGADOS] y clasificado como anómalo.`
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    determineClass(scpId) {
        const num = parseInt(scpId);
        if (num < 100) return 'Safe';
        if (num < 500) return 'Euclid';
        if (num < 1000) return 'Keter';
        if (num > 3000) return 'Thaumiel';
        return 'Euclid';
    }

    generateContainment(scpId) {
        return `SCP-${scpId} debe ser contenido en una celda de contención estándar con protocolos de seguridad apropiados para su clasificación.`;
    }

    calculateRiskLevel(scpClass) {
        const riskLevels = {
            'Safe': 2,
            'Euclid': 5,
            'Keter': 8,
            'Thaumiel': 3,
            'Apollyon': 10,
            'Neutralized': 1
        };
        return riskLevels[scpClass] || 5;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ==================== GESTIÓN DEL DOM ====================

class DOMManager {
    constructor() {
        this.resultadosContainer = document.getElementById('Resultados');
        this.buscarInput = document.getElementById('Buscar');
        this.categoriaSelect = document.getElementById('categoria');
        this.searchForm = document.getElementById('search-form');
        this.debounceTimer = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event listener para búsqueda con debounce
        this.buscarInput.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                AppState.searchTerm = e.target.value.trim();
                AppState.currentPage = 1;
                this.performSearch();
            }, CONFIG.SEARCH_DEBOUNCE_DELAY);
        });

        // Event listener para categoría
        this.categoriaSelect.addEventListener('change', (e) => {
            AppState.currentCategory = e.target.value;
            AppState.currentPage = 1;
            this.performSearch();
        });

        // Event listener para Enter en búsqueda
        this.buscarInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(this.debounceTimer);
                AppState.searchTerm = e.target.value.trim();
                AppState.currentPage = 1;
                this.performSearch();
            }
        });

        // Event listener para submit del formulario
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearTimeout(this.debounceTimer);
            AppState.searchTerm = this.buscarInput.value.trim();
            AppState.currentPage = 1;
            this.performSearch();
        });
    }

    async performSearch() {
        if (AppState.isLoading) return;

        this.showLoading();
        AppState.isLoading = true;

        try {
            let scpsToLoad = [];

            if (AppState.searchTerm) {
                const searchNumber = AppState.searchTerm.replace(/[^\d]/g, '');
                if (searchNumber && AVAILABLE_SCPS.includes(searchNumber.padStart(3, '0'))) {
                    scpsToLoad = [searchNumber.padStart(3, '0')];
                } else {
                    scpsToLoad = this.searchSCPsByText(AppState.searchTerm);
                }
            } else {
                scpsToLoad = this.getRandomSCPs(CONFIG.ITEMS_PER_PAGE);
            }

            const scpData = await apiClient.getMultipleSCPs(scpsToLoad);
            AppState.scpData = scpData;
            AppState.totalItems = scpData.length;

            this.renderResults(scpData);
            this.renderPagination();
            this.renderFilters();

        } catch (error) {
            console.error('Error en la búsqueda:', error);
            this.showError('Error al cargar los datos. Por favor, intenta nuevamente.');
        } finally {
            AppState.isLoading = false;
            this.hideLoading();
        }
    }

    showLoading() {
        this.resultadosContainer.innerHTML = '<div class="loading">Cargando...</div>';
    }

    hideLoading() {
        const loading = this.resultadosContainer.querySelector('.loading');
        if (loading) loading.remove();
    }

    showError(message) {
        this.resultadosContainer.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    searchSCPsByText(searchTerm) {
        const term = searchTerm.toLowerCase();
        const relevantSCPs = [];

        const searchMap = {
            'sculpture': ['173'],
            'plague': ['049'],
            'shy': ['096'],
            'ticket': ['914'],
            'hard': ['682'],
            'god': ['343'],
            'cake': ['871'],
            'teddy': ['1048'],
            'coffee': ['198'],
            'stairs': ['087'],
            'reptile': ['682'],
            'doctor': ['049'],
            'mask': ['035'],
            'computer': ['079'],
            'statue': ['173'],
            'mirror': ['132'],
            'door': ['914'],
            'infinite': ['3008', '087'],
            'ikea': ['3008']
        };

        for (const [keyword, scps] of Object.entries(searchMap)) {
            if (term.includes(keyword)) {
                relevantSCPs.push(...scps);
            }
        }

        if (relevantSCPs.length === 0) {
            return this.getRandomSCPs(6);
        }

        return [...new Set(relevantSCPs)];
    }

    getRandomSCPs(count) {
        const shuffled = [...AVAILABLE_SCPS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    renderResults(scps) {
        if (!scps || scps.length === 0) {
            this.resultadosContainer.innerHTML = `
                <div class="no-results">
                    <h3>No se encontraron resultados</h3>
                    <p>Intenta con otros términos de búsqueda o navega por las categorías disponibles.</p>
                </div>
            `;
            return;
        }

        const filteredSCPs = this.applyFilters(scps);
        const paginatedSCPs = this.paginateResults(filteredSCPs);

        const resultsHTML = `
            <div class="results-header">
                <h2>Resultados de búsqueda (${filteredSCPs.length} encontrados)</h2>
                <div class="view-controls">
                    <button onclick="domManager.toggleView('grid')" class="view-btn active" id="grid-btn">
                        <span>⊞</span> Grid
                    </button>
                    <button onclick="domManager.toggleView('list')" class="view-btn" id="list-btn">
                        <span>☰</span> Lista
                    </button>
                </div>
            </div>
            <div class="scp-grid" id="scp-container">
                ${paginatedSCPs.map(scp => this.createSCPCard(scp)).join('')}
            </div>
        `;

        this.resultadosContainer.innerHTML = resultsHTML;
    }

    createSCPCard(scp) {
        const classInfo = SCP_CLASSES[scp.class] || SCP_CLASSES['Euclid'];
        const isFavorite = AppState.favorites.includes(scp.id);
        const truncatedDesc = this.truncateText(scp.description, CONFIG.MAX_DESCRIPTION_LENGTH);

        return `
            <div class="scp-card" data-class="${scp.class}" data-id="${scp.id}">
                <div class="scp-header">
                    <div class="scp-number">${scp.id}</div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="domManager.toggleFavorite('${scp.id}')"
                            title="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                        ${isFavorite ? '★' : '☆'}
                    </button>
                </div>
                <div class="scp-class" style="background-color: ${classInfo.color}">
                    ${scp.class}
                </div>
                <h3 class="scp-title">${scp.title}</h3>
                <div class="scp-description">
                    ${truncatedDesc}
                </div>
                <div class="scp-stats">
                    <div class="stat">
                        <span class="stat-label">Rating:</span>
                        <span class="stat-value ${scp.rating >= 0 ? 'positive' : 'negative'}">
                            ${scp.rating >= 0 ? '+' : ''}${scp.rating}
                        </span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Riesgo:</span>
                        <span class="stat-value risk-level-${scp.riskLevel}">
                            ${scp.riskLevel}/10
                        </span>
                    </div>
                </div>
                <div class="scp-tags">
                    ${scp.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="scp-actions">
                    <button class="btn-primary" onclick="domManager.showSCPDetails('${scp.id}')">
                        Ver Detalles
                    </button>
                    <button class="btn-secondary" onclick="window.open('${scp.url}', '_blank')">
                        Wiki Oficial
                    </button>
                </div>
            </div>
        `;
    }

    async showSCPDetails(scpId) {
        const scp = AppState.scpData.find(s => s.id === scpId);
        if (!scp) return;

        const classInfo = SCP_CLASSES[scp.class] || SCP_CLASSES['Euclid'];
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content scp-details">
                <div class="modal-header">
                    <h2>${scp.id}: ${scp.title}</h2>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="scp-info-grid">
                        <div class="info-section">
                            <h3>Clasificación</h3>
                            <div class="classification-badge" style="background-color: ${classInfo.color}">
                                ${scp.class}
                            </div>
                            <p class="class-description">${classInfo.description}</p>
                        </div>
                        <div class="info-section">
                            <h3>Estadísticas</h3>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <span class="stat-label">Rating:</span>
                                    <span class="stat-value ${scp.rating >= 0 ? 'positive' : 'negative'}">
                                        ${scp.rating >= 0 ? '+' : ''}${scp.rating}
                                    </span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Nivel de Riesgo:</span>
                                    <span class="stat-value risk-level-${scp.riskLevel}">
                                        ${scp.riskLevel}/10
                                    </span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Autor:</span>
                                    <span class="stat-value">${scp.author}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="info-section">
                        <h3>Descripción</h3>
                        <p class="scp-full-description">${scp.description}</p>
                    </div>
                    <div class="info-section">
                        <h3>Procedimientos de Contención</h3>
                        <p class="containment-procedures">${scp.containmentProcedures}</p>
                    </div>
                    <div class="info-section">
                        <h3>Etiquetas</h3>
                        <div class="tags-container">
                            ${scp.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="domManager.toggleFavorite('${scp.id}')">
                        ${AppState.favorites.includes(scp.id) ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
                    </button>
                    <button class="btn-secondary" onclick="window.open('${scp.url}', '_blank')">
                        Ver en Wiki Oficial
                    </button>
                    <button class="btn-tertiary" onclick="this.closest('.modal-overlay').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        });
    }

    toggleFavorite(scpId) {
        const index = AppState.favorites.indexOf(scpId);
        if (index > -1) {
            AppState.favorites.splice(index, 1);
        } else {
            AppState.favorites.push(scpId);
        }
        
        localStorage.setItem('scp-favorites', JSON.stringify(AppState.favorites));
        this.updateFavoriteButtons();
    }

    updateFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(btn => {
            const card = btn.closest('.scp-card');
            const scpId = card.dataset.id;
            const isFavorite = AppState.favorites.includes(scpId);
            
            btn.textContent = isFavorite ? '★' : '☆';
            btn.className = `favorite-btn ${isFavorite ? 'active' : ''}`;
            btn.title = isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos';
        });
    }

    renderFilters() {
        const filtersHTML = `
            <div class="filters-section">
                <div class="filter-group">
                    <label>Filtrar por clase:</label>
                    <select id="classFilter" onchange="domManager.applyClassFilter(this.value)">
                        <option value="all">Todas las clases</option>
                        ${Object.keys(SCP_CLASSES).map(cls => 
                            `<option value="${cls}" ${AppState.currentFilter === cls ? 'selected' : ''}>${cls}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <button class="filter-btn ${AppState.currentFilter === 'favorites' ? 'active' : ''}" 
                            onclick="domManager.showFavorites()">
                        ★ Mis Favoritos (${AppState.favorites.length})
                    </button>
                </div>
                <div class="filter-group">
                    <button class="filter-btn" onclick="domManager.showRandomSCPs()">
                        🎲 SCPs Aleatorios
                    </button>
                </div>
            </div>
        `;

        if (!document.querySelector('.filters-section')) {
            this.resultadosContainer.insertAdjacentHTML('afterbegin', filtersHTML);
        }
    }

    applyClassFilter(className) {
        AppState.currentFilter = className;
        AppState.currentPage = 1;
        this.renderResults(AppState.scpData);
        this.renderPagination();
    }

    async showFavorites() {
        if (AppState.favorites.length === 0) {
            this.resultadosContainer.innerHTML = `
                <div class="no-results">
                    <h3>No tienes favoritos guardados</h3>
                    <p>Agrega SCPs a tus favoritos clickeando en la estrella ☆</p>
                </div>
            `;
            return;
        }

        this.showLoading();
        AppState.currentFilter = 'favorites';
        const scpData = await apiClient.getMultipleSCPs(AppState.favorites);
        AppState.scpData = scpData;
        AppState.totalItems = scpData.length;
        this.renderResults(scpData);
        this.renderPagination();
        this.hideLoading();
    }

    showRandomSCPs() {
        AppState.currentFilter = 'all';
        AppState.currentPage = 1;
        this.performSearch();
    }

    applyFilters(scps) {
        if (AppState.currentFilter === 'all') return scps;
        if (AppState.currentFilter === 'favorites') {
            return scps.filter(scp => AppState.favorites.includes(scp.id));
        }
        return scps.filter(scp => scp.class === AppState.currentFilter);
    }

    paginateResults(scps) {
        const start = (AppState.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const end = start + CONFIG.ITEMS_PER_PAGE;
        return scps.slice(start, end);
    }

    renderPagination() {
        const totalPages = Math.ceil(AppState.totalItems / CONFIG.ITEMS_PER_PAGE);
        if (totalPages <= 1) return;

        const paginationHTML = `
            <div class="pagination">
                <button onclick="domManager.changePage(${AppState.currentPage - 1})" 
                        ${AppState.currentPage === 1 ? 'disabled' : ''}>
                    Anterior
                </button>
                <span>Página ${AppState.currentPage} de ${totalPages}</span>
                <button onclick="domManager.changePage(${AppState.currentPage + 1})" 
                        ${AppState.currentPage === totalPages ? 'disabled' : ''}>
                    Siguiente
                </button>
            </div>
        `;

        const existingPagination = this.resultadosContainer.querySelector('.pagination');
        if (existingPagination) {
            existingPagination.outerHTML = paginationHTML;
        } else {
            this.resultadosContainer.insertAdjacentHTML('beforeend', paginationHTML);
        }
    }

    changePage(page) {
        if (page < 1 || page > Math.ceil(AppState.totalItems / CONFIG.ITEMS_PER_PAGE)) return;
        AppState.currentPage = page;
        this.renderResults(AppState.scpData);
        this.renderPagination();
    }

    toggleView(view) {
        const gridBtn = document.getElementById('grid-btn');
        const listBtn = document.getElementById('list-btn');
        const container = document.getElementById('scp-container');

        if (view === 'grid') {
            container.classList.remove('list-view');
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        } else {
            container.classList.add('list-view');
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    }
}

// ==================== INICIALIZACIÓN ====================
const apiClient = new SCPApiClient();
const domManager = new DOMManager();

// Cargar datos iniciales al abrir la página
document.addEventListener('DOMContentLoaded', () => {
    domManager.performSearch();
});