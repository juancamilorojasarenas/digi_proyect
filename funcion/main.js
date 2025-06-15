class DigimonExplorer {
    constructor() {
        // Inicialización de propiedades
        this.allDigimon = []; // Lista completa de Digimon
        this.filteredDigimon = []; // Lista de Digimon filtrados
        this.currentPage = 1; // Página actual
        this.itemsPerPage = 6; // Número de items por página (reducido de 12 a 6)
        this.currentSort = 'default'; // Orden actual ('default', 'asc', 'desc')
        this.currentLevel = ''; // Nivel seleccionado para filtrar
        this.currentSearch = ''; // Búsqueda actual
        this.totalPages = 1; // Total de páginas
        this.stats = {
            total: 0, // Total de Digimon
            levels: {}, // Estadísticas de niveles
            favorites: this.loadFavorites() // Lista de favoritos
        };
        
        // Inicializar la aplicación
        this.init();
    }

    // Cargar favoritos (usando una variable global en lugar de localStorage)
    loadFavorites() {
        if (!window.digimonFavorites) {
            window.digimonFavorites = [];
        }
        return window.digimonFavorites;
    }

    // Guardar favoritos
    saveFavorites() {
        window.digimonFavorites = this.stats.favorites;
    }

    // Inicializar la aplicación
    async init() {
        this.bindEvents(); // Vincular eventos
        await this.loadDigimon(); // Cargar datos de Digimon
        // Verificar niveles únicos en los datos cargados
        console.log("Niveles reales:", [...new Set(this.allDigimon.map(d => d.level))]);
        this.populateLevelFilterFromDigimon(); // Llenar el filtro de niveles
        this.updateStats(); // Actualizar estadísticas
        this.renderDigimon(); // Renderizar la lista de Digimon
        this.renderPagination(); // Renderizar la paginación
    }

    // Vincular eventos a los elementos del DOM
    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const levelFilter = document.getElementById('levelFilter');
        const sortBtn = document.getElementById('sortBtn');
        const randomBtn = document.getElementById('randomBtn');
        const closeBtn = document.querySelector('.close');
        const modal = document.getElementById('modal');
        const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');

        if (searchInput) {
            // Evento de input para búsqueda en tiempo real
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value.toLowerCase();
                this.currentPage = 1; // Reiniciar a la primera página
                this.filterAndRender();
            });

            // Evento de tecla para búsqueda con Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.currentPage = 1;
                    this.filterAndRender();
                }
            });
        }

        if (searchBtn) {
            // Evento de clic para búsqueda
            searchBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.filterAndRender();
            });
        }

        if (levelFilter) {
            // Evento de cambio para filtro de nivel
            levelFilter.addEventListener('change', (e) => {
                this.currentLevel = e.target.value;
                this.currentPage = 1;
                this.filterAndRender();
            });
        }

        if (sortBtn) {
            // Evento de clic para cambiar el orden
            sortBtn.addEventListener('click', () => {
                this.toggleSort();
            });
        }

        if (randomBtn) {
            // Evento de clic para mostrar un Digimon aleatorio
            randomBtn.addEventListener('click', () => {
                this.showRandomDigimon();
            });
        }

        if (closeBtn) {
            // Evento de clic para cerrar el modal
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (modal) {
            // Cerrar modal al hacer clic fuera del contenido
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        if (itemsPerPageSelect) {
            // Evento de cambio para ajustar items por página
            itemsPerPageSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1; // Vuelve a la primera página
                this.filterAndRender();
            });
        }

        // Cerrar modal con la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Cargar datos de Digimon desde la API
   async loadDigimon() {
    this.showLoading(true);
    try {
        const response = await fetch(`https://digi-api.com/api/v1/digimon?pageSize=1000`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Datos completos de la API:', data);
        this.allDigimon = data.content.map(d => {
            console.log('Datos de un Digimon (incluyendo levels):', d.levels);
            let level = 'Unknown';
            if (d.levels && Array.isArray(d.levels) && d.levels.length > 0) {
                level = d.levels[0].level || 'Unknown'; // Usar nivel real si está disponible
            } else {
                // Simulación temporal solo si no hay niveles
                const levels = ['Baby', 'In-Training', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Armor', 'Hybrid'];
                level = levels[Math.floor(Math.random() * levels.length)];
                console.log(`Simulación aplicada para ${d.name}: ${level}`);
            }
            return {
                name: d.name || 'Sin nombre',
                level: level,
                img: d.images && d.images.length > 0 ? d.images[0].href : ''
            };
        });
        this.filteredDigimon = [...this.allDigimon];
        console.log("Niveles reales:", [...new Set(this.allDigimon.map(d => d.level))]);
        this.showError(false);
    } catch (error) {
        console.error('Error loading Digimon:', error);
        this.showError(true, 'Error al cargar los datos de Digimon. Por favor, intenta de nuevo más tarde.');
        this.allDigimon = [];
        this.filteredDigimon = [];
    } finally {
        this.showLoading(false);
    }
}

    // Llenar el filtro de niveles a partir de los datos de Digimon
    populateLevelFilterFromDigimon() {
        // Crear un mapa de niveles normalizados a etiquetas "bonitas"
        const mapLevels = this.allDigimon.reduce((acc, d) => {
            if (!d.level) return acc;
            const raw = String(d.level);
            const norm = raw.trim().toLowerCase();
            if (!acc.has(norm)) {
                acc.set(norm, raw.trim());
            }
            return acc;
        }, new Map());

        // Ordenar los niveles por la etiqueta "bonita"
        const nivelesNorm = Array.from(mapLevels.keys()).sort((a, b) => {
            const ta = mapLevels.get(a).toLowerCase();
            const tb = mapLevels.get(b).toLowerCase();
            return ta.localeCompare(tb);
        });

        const select = document.getElementById('levelFilter');
        if (!select) return;
        select.innerHTML = '<option value="">Todos los niveles</option>';
        nivelesNorm.forEach(norm => {
            const label = mapLevels.get(norm);
            const option = document.createElement('option');
            option.value = norm; // Valor normalizado
            option.textContent = label; // Etiqueta "bonita"
            select.appendChild(option);
        });
    }

    // Aplicar filtros y renderizar
    async filterAndRender() {
        await this.applyFilters();
        this.renderDigimon();
        this.renderPagination();
        this.updateStats();
    }

    // Aplicar filtros localmente sobre allDigimon
    async applyFilters() {
        this.showLoading(true);
        try {
            const cs = this.currentSearch.trim().toLowerCase();
            const cl = this.currentLevel; // Valor normalizado

            // Filtrar Digimon basado en búsqueda y nivel
            const todosFiltrados = this.allDigimon.filter(d => {
                const nameMatch = !cs || d.name.toLowerCase().includes(cs);
                let levelNorm = '';
                if (d.level) {
                    levelNorm = String(d.level).trim().toLowerCase();
                }
                const levelMatch = !cl || levelNorm === cl;
                return nameMatch && levelMatch;
            });

            // Calcular total de páginas
            const total = todosFiltrados.length;
            this.totalPages = Math.ceil(total / this.itemsPerPage) || 1;

            // Ordenar los Digimon filtrados
            if (this.currentSort === 'asc') {
                todosFiltrados.sort((a, b) => a.name.localeCompare(b.name));
            } else if (this.currentSort === 'desc') {
                todosFiltrados.sort((a, b) => b.name.localeCompare(a.name));
            }

            // Obtener la página actual
            const start = (this.currentPage - 1) * this.itemsPerPage;
            this.filteredDigimon = todosFiltrados.slice(start, start + this.itemsPerPage);

            this.showError(false);
        } catch (error) {
            console.error('Error filtering Digimon:', error);
            this.showError(true, 'Error al filtrar Digimon. Por favor, intenta de nuevo.');
            this.filteredDigimon = [];
            this.totalPages = 1;
        } finally {
            this.showLoading(false);
        }
    }

    // Cambiar el orden de los Digimon
    toggleSort() {
        const btn = document.getElementById('sortBtn');
        if (!btn) return;

        if (this.currentSort === 'default') {
            this.currentSort = 'asc';
            btn.innerHTML = '<i class="fas fa-sort-alpha-down"></i> A-Z';
        } else if (this.currentSort === 'asc') {
            this.currentSort = 'desc';
            btn.innerHTML = '<i class="fas fa-sort-alpha-up"></i> Z-A';
        } else {
            this.currentSort = 'default';
            btn.innerHTML = '<i class="fas fa-sort"></i> Por defecto';
        }
        
        this.filterAndRender();
    }

    // Renderizar la lista de Digimon en el grid
    renderDigimon() {
        const grid = document.getElementById('digimonGrid');
        const noResults = document.getElementById('noResults');
        
        if (!grid) return;

        if (this.filteredDigimon.length === 0) {
            grid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        } else {
            if (noResults) noResults.style.display = 'none';
        }

        grid.innerHTML = this.filteredDigimon.map(digimon => `
            <div class="card" onclick="digimonExplorer.showDigimonDetails('${this.escapeHtml(digimon.name)}')">
                <img class="card-image" src="${digimon.img || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDMwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjUwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+CjxwYXRoIGQ9Ik0xNTAgMTI1bTAgMzBhMzAgMzAgMCAxIDAgMC02MCAzMCAzMCAwIDEgMCAwIDYweiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNSIvPgo8dGV4dCB4PSIxNTAiIHk9IjEzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEycHgiIGZpbGw9IndoaXRlIj5EaWdpbW9uPC90ZXh0Pgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyIiB4MT0iMCIgeTE9IjAiIHgyPSIzMDAiIHkyPSIyNTAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K'}" alt="${this.escapeHtml(digimon.name)}">
                <div class="card-content">
                    <h3 class="card-title">${this.escapeHtml(digimon.name)}</h3>
                    <div class="card-level">${this.escapeHtml(digimon.level)}</div>
                </div>
            </div>
        `).join('');
    }

    // Escapar HTML para prevenir XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    // Mostrar detalles de un Digimon en un modal
    async showDigimonDetails(name) {
        try {
            const response = await fetch(`https://digi-api.com/api/v1/digimon/${encodeURIComponent(name)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const digimon = await response.json();
            const isFavorite = this.stats.favorites.includes(digimon.name);
            const modalContent = document.getElementById('modalContent');
            const modal = document.getElementById('modal');
            
            if (!modalContent || !modal) return;

            modalContent.innerHTML = `
                <div style="text-align: center;">
                    <img class="modal-image" src="${digimon.images && digimon.images.length > 0 ? digimon.images[0].href : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjUiLz4KPHRleHQgeD0iMTAwIiB5PSIxMDUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMnB4IiBmaWxsPSJ3aGl0ZSI+RGlnaW1vbjwvdGV4dD4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhciIgeDE9IjAiIHkxPSIwIiB4Mj0iMjAwIiB5Mj0iMjAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY4YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg=='}" alt="${this.escapeHtml(digimon.name)}">
                    <h2 style="margin: 1rem 0; font-size: 2rem; background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${this.escapeHtml(digimon.name)}</h2>
                    <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 0.8rem 1.5rem; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 1.1rem; margin-bottom: 1.5rem;">
                        ${this.escapeHtml(digimon.levels && digimon.levels.length > 0 ? digimon.levels[0].level : 'Unknown')}
                    </div>
                    <div style="background: rgba(102, 126, 234, 0.1); padding: 1.5rem; border-radius: 15px; margin: 1rem 0;">
                        <p style="font-size: 1rem; line-height: 1.6; color: #333;">
                            <strong>Nivel:</strong> ${this.escapeHtml(digimon.levels && digimon.levels.length > 0 ? digimon.levels[0].level : 'Unknown')}<br>
                            <strong>Nombre:</strong> ${this.escapeHtml(digimon.name)}
                        </p>
                    </div>
                    <button onclick="digimonExplorer.toggleFavorite('${this.escapeHtml(digimon.name)}')" 
                            style="background: ${isFavorite ? '#ff4444' : 'rgba(255, 196, 0, 0.2)'}; color: ${isFavorite ? 'white' : '#ffc400'}; border: 1px solid ${isFavorite ? '#ff4444' : '#ffc400'}; padding: 0.8rem 1.5rem; border-radius: 10px; cursor: pointer; margin-top: 1rem;">
                        <i class="fas ${isFavorite ? 'fa-heart-broken' : 'fa-heart'}"></i> ${isFavorite ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}
                    </button>
                </div>
            `;
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error loading Digimon details:', error);
            this.showError(true, 'Error al cargar los detalles del Digimon.');
        }
    }

    // Alternar favorito
    toggleFavorite(name) {
        const index = this.stats.favorites.indexOf(name);
        if (index === -1) {
            this.stats.favorites.push(name);
        } else {
            this.stats.favorites.splice(index, 1);
        }
        this.saveFavorites();
        this.showDigimonDetails(name); // Refrescar modal
        this.updateStats();
    }

    // Cerrar el modal
    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Mostrar un Digimon aleatorio
    showRandomDigimon() {
        if (this.allDigimon.length === 0) return;
        const randomIndex = Math.floor(Math.random() * this.allDigimon.length);
        const randomDigimon = this.allDigimon[randomIndex];
        this.showDigimonDetails(randomDigimon.name);
    }

    // Actualizar estadísticas
    async updateStats() {
        try {
            const response = await fetch('https://digi-api.com/api/v1/digimon?pageSize=1');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const totalData = await response.json();
            this.stats.total = totalData.pageable.totalElements || 0;

            const levelResponse = await fetch('https://digi-api.com/api/v1/level');
            if (!levelResponse.ok) {
                throw new Error(`HTTP error! status: ${levelResponse.status}`);
            }
            const levelData = await levelResponse.json();
            console.log('Datos de niveles desde API:', levelData);
            this.stats.levels = Array.isArray(levelData.content) ? levelData.content.reduce((acc, level) => {
                if (level.name && level.count) {
                    acc[level.name] = level.count;
                }
                return acc;
            }, {}) : {};

            const statsGrid = document.getElementById('statsGrid');
            if (statsGrid) {
                statsGrid.innerHTML = `
                    <div class="stat-item">
                        <span class="stat-number">${this.stats.total}</span>
                        Total Digimon
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${Object.keys(this.stats.levels).length}</span>
                        Niveles Únicos
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.stats.favorites.length}</span>
                        Favoritos
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.filteredDigimon.length}</span>
                        Digimon Filtrados
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Renderizar la paginación
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="digimonExplorer.goToPage(${this.currentPage - 1})" aria-label="Página anterior">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="digimonExplorer.goToPage(1)" aria-label="Página 1">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="page-btn" style="cursor: default;">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                onclick="digimonExplorer.goToPage(${i})" aria-label="Página ${i}">${i}</button>`;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML += `<span class="page-btn" style="cursor: default;">...</span>`;
            }
            paginationHTML += `<button class="page-btn" onclick="digimonExplorer.goToPage(${this.totalPages})" aria-label="Página ${this.totalPages}">${this.totalPages}</button>`;
        }

        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="page-btn" onclick="digimonExplorer.goToPage(${this.currentPage + 1})" aria-label="Página siguiente">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }

        pagination.innerHTML = paginationHTML;
    }

    // Ir a una página específica
    async goToPage(page) {
        this.currentPage = page;
        await this.applyFilters();
        this.renderDigimon();
        this.renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Mostrar u ocultar el loader
    showLoading(show) {
        const loading = document.getElementById('loading');
        const grid = document.getElementById('digimonGrid');
        
        if (loading) loading.style.display = show ? 'flex' : 'none';
        if (grid) grid.style.display = show ? 'none' : 'grid';
    }

    // Mostrar u ocultar errores
    showError(show, message = '') {
        const errorDiv = document.getElementById('error');
        if (!errorDiv) return;

        errorDiv.style.display = show ? 'block' : 'none';
        if (show) {
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>${message}</p>
                <button class="page-btn" onclick="digimonExplorer.loadDigimon()" style="margin-top: 1rem;">
                    Reintentar
                </button>
            `;
        }
    }
}

// Inicializar la aplicación
const digimonExplorer = new DigimonExplorer();