class DigimonExplorer {
    constructor() {
        this.allDigimon = [];
        this.filteredDigimon = [];
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.currentSort = 'default';
        this.currentLevel = '';
        this.currentSearch = '';
        this.currentAttribute = '';
        this.currentField = '';
        this.totalPages = 1;
        this.stats = {
            total: 0,
            levels: {},
            attributes: {},
            fields: {},
            favorites: this.loadFavorites()
        };
        
        this.init();
    }

    loadFavorites() {
        if (!window.digimonFavorites) {
            window.digimonFavorites = [];
        }
        return window.digimonFavorites;
    }

    saveFavorites() {
        window.digimonFavorites = this.stats.favorites;
    }

    async init() {
        this.bindEvents();
        await this.loadDigimon();
        this.populateFiltersFromDigimon();
        this.updateStats();
        this.renderDigimon();
        this.renderPagination();
    }

    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const levelFilter = document.getElementById('levelFilter');
        const attributeFilter = document.getElementById('attributeFilter');
        const fieldFilter = document.getElementById('fieldFilter');
        const sortBtn = document.getElementById('sortBtn');
        const randomBtn = document.getElementById('randomBtn');
        const closeBtn = document.querySelector('.close');
        const modal = document.getElementById('modal');
        const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.filterAndRender();
            });
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.currentPage = 1;
                    this.filterAndRender();
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.filterAndRender();
            });
        }

        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.currentLevel = e.target.value;
                this.currentPage = 1;
                this.filterAndRender();
            });
        }

        if (attributeFilter) {
            attributeFilter.addEventListener('change', (e) => {
                this.currentAttribute = e.target.value;
                this.currentPage = 1;
                this.filterAndRender();
            });
        }

        if (fieldFilter) {
            fieldFilter.addEventListener('change', (e) => {
                this.currentField = e.target.value;
                this.currentPage = 1;
                this.filterAndRender();
            });
        }

        if (sortBtn) {
            sortBtn.addEventListener('click', () => {
                this.toggleSort();
            });
        }

        if (randomBtn) {
            randomBtn.addEventListener('click', () => {
                this.showRandomDigimon();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.filterAndRender();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async loadDigimon() {
        this.showLoading(true);
        try {
            let allDigimonData = [];
            let page = 0;
            const pageSize = 100;
            let hasMoreData = true;

            while (hasMoreData) {
                const response = await fetch(`https://digi-api.com/api/v1/digimon?page=${page}&pageSize=${pageSize}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (!data.content || data.content.length === 0) {
                    hasMoreData = false;
                } else {
                    allDigimonData = allDigimonData.concat(data.content);
                    page++;
                }
            }

            console.log('Total Digimon fetched:', allDigimonData.length);

            this.allDigimon = await Promise.all(allDigimonData.map(async (d) => {
                let level = 'Unknown';
                let imageUrl = '';
                let attributes = [];
                let fields = [];
                let types = [];

                try {
                    const detailResponse = await fetch(`https://digi-api.com/api/v1/digimon/${encodeURIComponent(d.name)}`);
                    if (detailResponse.ok) {
                        const detailData = await detailResponse.json();
                        if (detailData.levels && detailData.levels.length > 0) {
                            level = this.mapLevel(detailData.levels[0].level) || 'Unknown';
                        }
                        if (detailData.images && detailData.images.length > 0) {
                            const validImage = detailData.images.find(img => img.href && img.href.trim() !== '');
                            imageUrl = validImage ? validImage.href : '';
                        }
                        if (detailData.attributes && detailData.attributes.length > 0) {
                            attributes = detailData.attributes.map(a => a.attribute);
                        }
                        if (detailData.fields && detailData.fields.length > 0) {
                            fields = detailData.fields.map(f => f.field);
                        }
                        if (detailData.types && detailData.types.length > 0) {
                            types = detailData.types.map(t => t.type);
                        }
                    }
                } catch (detailError) {
                    console.error(`Error al cargar detalles de ${d.name}:`, detailError);
                }

                if (level === 'Unknown') {
                    const knownLevels = {
                        'Agumon': 'Child', 'Aegisdramon': 'Ultimate', 'AeroV-dramon': 'Adult',
                        'Angemon': 'Adult', 'Gabumon': 'Child', 'Greymon': 'Adult',
                        'Wargreymon': 'Ultimate', 'MetalGarurumon': 'Ultimate'
                    };
                    level = knownLevels[d.name] || level;
                }

                if (!imageUrl && d.href) {
                    const idMatch = d.href.match(/\/digimon\/(\d+)$/);
                    if (idMatch) {
                        imageUrl = `https://digi-api.com/images/digimon/w/${idMatch[1]}.png`;
                    }
                }

                return {
                    id: d.id,
                    name: d.name || 'Sin nombre',
                    level: level,
                    img: imageUrl,
                    href: d.href,
                    attributes: attributes,
                    fields: fields,
                    types: types
                };
            }));

            this.filteredDigimon = [...this.allDigimon];
            console.log("Digimon cargados:", this.allDigimon.length);
            console.log("Niveles únicos encontrados:", [...new Set(this.allDigimon.map(d => d.level))]);
            console.log("Atributos únicos encontrados:", [...new Set(this.allDigimon.flatMap(d => d.attributes))]);
            console.log("Campos únicos encontrados:", [...new Set(this.allDigimon.flatMap(d => d.fields))]);
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

    mapLevel(apiLevel) {
        const levelMap = {
            'Baby': 'Baby I',
            'In-Training': 'Baby II',
            'Rookie': 'Child',
            'Champion': 'Adult',
            'Perfect': 'Perfect',
            'Ultimate': 'Ultimate',
            'Mega': 'Ultimate',
            'Armor': 'Armor',
            'Hybrid': 'Hybrid'
        };
        return levelMap[apiLevel] || apiLevel;
    }

    populateFiltersFromDigimon() {
        const levelSelect = document.getElementById('levelFilter');
        const attributeSelect = document.getElementById('attributeFilter');
        const fieldSelect = document.getElementById('fieldFilter');

        if (levelSelect) {
            const uniqueLevels = [...new Set(this.allDigimon.map(d => d.level))]
                .filter(level => level && level !== 'Unknown')
                .sort();
            levelSelect.innerHTML = '<option value="">Todos los niveles</option>';
            ['Baby I', 'Baby II', 'Child', 'Adult', 'Perfect', 'Ultimate', 'Armor', 'Hybrid'].forEach(level => {
                if (uniqueLevels.includes(level)) {
                    const option = document.createElement('option');
                    option.value = level;
                    option.textContent = level;
                    levelSelect.appendChild(option);
                }
            });
            if (this.allDigimon.some(d => d.level === 'Unknown')) {
                const option = document.createElement('option');
                option.value = 'Unknown';
                option.textContent = 'Desconocido';
                levelSelect.appendChild(option);
            }
        }

        if (attributeSelect) {
            const uniqueAttributes = [...new Set(this.allDigimon.flatMap(d => d.attributes))]
                .filter(attr => attr)
                .sort();
            attributeSelect.innerHTML = '<option value="">Todos los atributos</option>';
            uniqueAttributes.forEach(attr => {
                const option = document.createElement('option');
                option.value = attr;
                option.textContent = attr;
                attributeSelect.appendChild(option);
            });
        }

        if (fieldSelect) {
            const uniqueFields = [...new Set(this.allDigimon.flatMap(d => d.fields))]
                .filter(field => field)
                .sort();
            fieldSelect.innerHTML = '<option value="">Todos los campos</option>';
            uniqueFields.forEach(field => {
                const option = document.createElement('option');
                option.value = field;
                option.textContent = field;
                fieldSelect.appendChild(option);
            });
        }
    }

    async filterAndRender() {
        await this.applyFilters();
        this.renderDigimon();
        this.renderPagination();
        this.updateStats();
    }

    async applyFilters() {
        this.showLoading(true);
        try {
            const searchTerm = this.currentSearch.trim().toLowerCase();
            const selectedLevel = this.currentLevel;
            const selectedAttribute = this.currentAttribute;
            const selectedField = this.currentField;

            const filteredResults = this.allDigimon.filter(d => {
                const nameMatch = !searchTerm || d.name.toLowerCase().includes(searchTerm);
                const levelMatch = !selectedLevel || d.level === selectedLevel;
                const attributeMatch = !selectedAttribute || d.attributes.includes(selectedAttribute);
                const fieldMatch = !selectedField || d.fields.includes(selectedField);
                return nameMatch && levelMatch && attributeMatch && fieldMatch;
            });

            this.totalPages = Math.ceil(filteredResults.length / this.itemsPerPage) || 1;

            if (this.currentSort === 'asc') {
                filteredResults.sort((a, b) => a.name.localeCompare(b.name));
            } else if (this.currentSort === 'desc') {
                filteredResults.sort((a, b) => b.name.localeCompare(a.name));
            }

            const start = (this.currentPage - 1) * this.itemsPerPage;
            this.filteredDigimon = filteredResults.slice(start, start + this.itemsPerPage);

            this.showError(false);
        } catch (error) {
            console.error(' [Grok3] Error filtering Digimon:', error);
            this.showError(true, 'Error al filtrar Digimon. Por favor, intenta de nuevo.');
            this.filteredDigimon = [];
            this.totalPages = 1;
        } finally {
            this.showLoading(false);
        }
    }

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

        const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDMwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjUwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyNSIgcj0iNDAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiLz4KPHN2ZyB4PSIxMzAiIHk9IjEwNSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IndoaXRlIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJ6Ii8+Cjwvc3ZnPgo8dGV4dCB4PSIxNTAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0cHgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC44Ij5EaWdpbW9uPC90ZXh0Pgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyIiB4MT0iMCIgeTE9IjAiIHgyPSIzMDAiIHkyPSIyNTAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=';

        grid.innerHTML = this.filteredDigimon.map(digimon => `
            <div class="card" onclick="digimonExplorer.showDigimonDetails('${this.escapeHtml(digimon.name)}')">
                <img class="card-image" 
                     src="${digimon.img || placeholderImage}" 
                     alt="${this.escapeHtml(digimon.name)}"
                     onerror="this.src='${placeholderImage}'"
                     style="width: 100%; height: auto; object-fit: cover;">
                <div class="card-content">
                    <h3 class="card-title">${this.escapeHtml(digimon.name)}</h3>
                    <div class="card-level">${this.escapeHtml(digimon.level)}</div>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    async showDigimonDetails(name) {
        try {
            this.showLoading(true);
            const response = await fetch(`https://digi-api.com/api/v1/digimon/${encodeURIComponent(name)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const digimon = await response.json();
            const isFavorite = this.stats.favorites.includes(digimon.name);
            const modalContent = document.getElementById('modalContent');
            const modal = document.getElementById('modal');
            
            if (!modalContent || !modal) return;

            let bestImage = '';
            if (digimon.images && digimon.images.length > 0) {
                const validImage = digimon.images.find(img => img.href && img.href.trim() !== '');
                bestImage = validImage ? validImage.href : '';
            }

            let realLevel = 'Unknown';
            if (digimon.levels && digimon.levels.length > 0) {
                realLevel = this.mapLevel(digimon.levels[0].level) || 'Unknown';
            }

            const fields = digimon.fields || [];
            const types = digimon.types || [];
            const attributes = digimon.attributes || [];

            const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiLz4KPHN2ZyB4PSI4MCIgeT0iODAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyTDEzLjA5IDguMjZMMjAgOUwxMy4wOSAxNS43NEwxMiAyMkwxMC45MSAxNS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyeiIvPgo8L3N2Zz4KPHRleHQgeD0iMTAwIiB5PSIxNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMnB4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOCI+RGlnaW1vbjwvdGV4dD4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhciIgeDE9IjAiIHkxPSIwIiB4Mj0iMjAwIiB5Mj0iMjAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg==';

            modalContent.innerHTML = `
                <div style="text-align: center;">
                    <img class="modal-image" 
                         src="${bestImage || placeholderImage}" 
                         alt="${this.escapeHtml(digimon.name)}"
                         onerror="this.src='${placeholderImage}'"
                         style="max-width: 200px; max-height: 200px; border-radius: 10px; margin-bottom: 1rem;">
                    <h2 style="margin: 1rem 0; font-size: 2rem; background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${this.escapeHtml(digimon.name)}</h2>
                    <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 0.8rem 1.5rem; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 1.1rem; margin-bottom: 1.5rem;">
                        ${this.escapeHtml(realLevel)}
                    </div>
                    <div style="background: rgba(102, 126, 234, 0.1); padding: 1.5rem; border-radius: 15px; margin: 1rem 0; text-align: left;">
                        <p style="font-size: 1rem; line-height: 1.6; color: #333; margin: 0;">
                            <strong>Nivel:</strong> ${this.escapeHtml(realLevel)}<br>
                            <strong>Nombre:</strong> ${this.escapeHtml(digimon.name)}
                            ${types.length > 0 ? `<br><strong>Tipo:</strong> ${types.map(t => t.type).join(', ')}` : ''}
                            ${attributes.length > 0 ? `<br><strong>Atributo:</strong> ${attributes.map(a => a.attribute).join(', ')}` : ''}
                            ${fields.length > 0 ? `<br><strong>Campo:</strong> ${fields.map(f => f.field).join(', ')}` : ''}
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
        } finally {
            this.showLoading(false);
        }
    }

    toggleFavorite(name) {
        const index = this.stats.favorites.indexOf(name);
        if (index === -1) {
            this.stats.favorites.push(name);
        } else {
            this.stats.favorites.splice(index, 1);
        }
        this.saveFavorites();
        this.showDigimonDetails(name);
        this.updateStats();
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showRandomDigimon() {
        if (this.allDigimon.length === 0) return;
        const randomIndex = Math.floor(Math.random() * this.allDigimon.length);
        const randomDigimon = this.allDigimon[randomIndex];
        this.showDigimonDetails(randomDigimon.name);
    }

    async updateStats() {
        try {
            this.stats.total = this.allDigimon.length;
            
            const levelCounts = {};
            const attributeCounts = {};
            const fieldCounts = {};

            this.allDigimon.forEach(digimon => {
                const level = digimon.level;
                levelCounts[level] = (levelCounts[level] || 0) + 1;

                digimon.attributes.forEach(attr => {
                    attributeCounts[attr] = (attributeCounts[attr] || 0) + 1;
                });

                digimon.fields.forEach(field => {
                    fieldCounts[field] = (fieldCounts[field] || 0) + 1;
                });
            });

            this.stats.levels = levelCounts;
            this.stats.attributes = attributeCounts;
            this.stats.fields = fieldCounts;

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
                        <span class="stat-number">${Object.keys(this.stats.attributes).length}</span>
                        Atributos Únicos
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${Object.keys(this.stats.fields).length}</span>
                        Campos Únicos
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.stats.favorites.length}</span>
                        Favoritos
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.filteredDigimon.length}</span>
                        Resultados Actuales
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

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

    async goToPage(page) {
        this.currentPage = page;
        await this.applyFilters();
        this.renderDigimon();
        this.renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const grid = document.getElementById('digimonGrid');
        
        if (loading) loading.style.display = show ? 'flex' : 'none';
        if (grid) grid.style.display = show ? 'none' : 'grid';
    }

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

document.addEventListener('DOMContentLoaded', () => {
    window.digimonExplorer = new DigimonExplorer();
});
