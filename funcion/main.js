// Base URL de la API de SCP
const SCP_API_BASE = 'https://scp-data.tedivm.com';

// Cache para almacenar los SCPs ya obtenidos
let scpCache = new Map();
let allScpsList = [];
let currentResults = [];
let isLoading = false;

// Lista de SCPs populares para cargar inicialmente
const popularScps = [
    '173', '096', '049', '106', '914', '682', '079', '999', 
    '3008', '426', '294', '055', '001', '939', '457', '035'
];

// Función para obtener información de un SCP específico
async function obtenerScpPorNumero(numero) {
    try {
        // Verificar si ya está en cache
        if (scpCache.has(numero)) {
            return scpCache.get(numero);
        }

        const response = await fetch(`${SCP_API_BASE}/scp/${numero}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Procesar y normalizar los datos
        const scpData = {
            number: numero,
            title: data.title || `SCP-${numero}`,
            class: data.object_class || 'unknown',
            description: data.description || 'Descripción no disponible',
            procedures: data.special_containment_procedures || 'Procedimientos no disponibles',
            url: data.url || '',
            rating: data.rating || 0,
            tags: data.tags || []
        };
        
        // Guardar en cache
        scpCache.set(numero, scpData);
        
        return scpData;
    } catch (error) {
        console.error(`Error obteniendo SCP-${numero}:`, error);
        
        // Retornar datos de fallback
        return {
            number: numero,
            title: `SCP-${numero}`,
            class: 'unknown',
            description: 'Error al cargar la información. Intenta de nuevo más tarde.',
            procedures: 'No disponible',
            url: '',
            rating: 0,
            tags: []
        };
    }
}

// Función para obtener múltiples SCPs
async function obtenerMultiplesScps(numeros) {
    const promesas = numeros.map(numero => obtenerScpPorNumero(numero));
    return Promise.all(promesas);
}

// Función para buscar SCPs
async function buscarSCP() {
    if (isLoading) return;
    
    const busqueda = document.getElementById('busqueda').value.toLowerCase().trim();
    const categoria = document.getElementById('categoria').value.toLowerCase();
    
    mostrarCarga(true);
    isLoading = true;
    
    try {
        let resultados = [];
        
        // Si hay búsqueda específica por número
        if (busqueda && /^\d+$/.test(busqueda)) {
            const scpData = await obtenerScpPorNumero(busqueda);
            if (scpData && (!categoria || scpData.class.toLowerCase() === categoria)) {
                resultados = [scpData];
            }
        } else {
            // Cargar SCPs populares si no hay datos cargados
            if (allScpsList.length === 0) {
                allScpsList = await obtenerMultiplesScps(popularScps);
            }
            
            // Filtrar por categoría
            resultados = categoria ? 
                allScpsList.filter(scp => scp.class.toLowerCase() === categoria) : 
                [...allScpsList];
            
            // Filtrar por texto de búsqueda
            if (busqueda) {
                resultados = resultados.filter(scp => 
                    scp.number.includes(busqueda) ||
                    scp.title.toLowerCase().includes(busqueda) ||
                    scp.description.toLowerCase().includes(busqueda) ||
                    scp.class.toLowerCase().includes(busqueda) ||
                    (scp.tags && scp.tags.some(tag => tag.toLowerCase().includes(busqueda)))
                );
            }
        }
        
        currentResults = resultados;
        mostrarResultados(resultados);
        
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        mostrarError('Error al realizar la búsqueda. Verifica tu conexión a internet.');
    } finally {
        mostrarCarga(false);
        isLoading = false;
    }
}

// Función para mostrar estado de carga
function mostrarCarga(loading) {
    const button = document.querySelector('button');
    const originalText = '🔍 Buscar';
    
    if (loading) {
        button.innerHTML = '<span class="loading"></span> Conectando con la base de datos...';
        button.disabled = true;
    } else {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Función para mostrar error
function mostrarError(mensaje) {
    const contenedorResultados = document.getElementById('resultados');
    contenedorResultados.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #ff4444; font-size: 1.3rem;">
            ⚠️ ${mensaje}
            <br><br>
            <button onclick="cargarScpsIniciales()" style="background: #ff4444; color: white; border: none; padding: 1rem 2rem; border-radius: 6px; cursor: pointer;">
                🔄 Reintentar
            </button>
        </div>
    `;
}

// Función para mostrar resultados
function mostrarResultados(resultados) {
    const contenedorResultados = document.getElementById('resultados');
    
    if (resultados.length === 0) {
        contenedorResultados.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #8a8a8a; font-size: 1.3rem;">
                🚫 No se encontraron anomalías que coincidan con los criterios de búsqueda.
                <br><br>
                <small style="color: #666;">
                    Intenta con términos diferentes o busca por número específico (ej: 173, 049, 096)
                </small>
                <br><br>
                <button onclick="cargarScpsIniciales()" style="background: rgba(0, 255, 136, 0.2); color: #00ff88; border: 1px solid #00ff88; padding: 0.8rem 1.5rem; border-radius: 6px; cursor: pointer;">
                    📋 Mostrar SCPs populares
                </button>
            </div>
        `;
        return;
    }

    const tarjetasHTML = resultados.map((scp, index) => {
        const claseColor = getClaseColor(scp.class);
        const descripcionRecortada = scp.description.length > 200 ? 
            scp.description.substring(0, 200) + '...' : 
            scp.description;
        
        return `
            <div class="scp-card" style="animation-delay: ${index * 0.1}s;">
                <div class="scp-number">SCP-${scp.number}</div>
                <h3 class="scp-title">${scp.title}</h3>
                <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <span style="background: ${claseColor}; color: #000; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.9rem; font-weight: bold; text-transform: uppercase;">
                        ${scp.class}
                    </span>
                    ${scp.rating !== undefined ? `<span style="color: #888; font-size: 0.9rem;">👍 ${scp.rating}</span>` : ''}
                </div>
                <p class="scp-description">${descripcionRecortada}</p>
                ${scp.tags && scp.tags.length > 0 ? `
                    <div style="margin: 1rem 0; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${scp.tags.slice(0, 3).map(tag => `
                            <span style="background: rgba(136, 136, 136, 0.2); color: #888; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">
                                #${tag}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button onclick="mostrarDetalles('${scp.number}')" style="background: rgba(0, 255, 136, 0.2); color: #00ff88; border: 1px solid #00ff88; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.3s;">
                        📄 Ver detalles
                    </button>
                    ${scp.url ? `
                        <button onclick="abrirUrl('${scp.url}')" style="background: rgba(68, 136, 255, 0.2); color: #4488ff; border: 1px solid #4488ff; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.3s;">
                            🌐 Página oficial
                        </button>
                    ` : ''}
                    <button onclick="marcarFavorito('${scp.number}')" style="background: rgba(255, 196, 0, 0.2); color: #ffc400; border: 1px solid #ffc400; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.3s;">
                        ⭐ Favorito
                    </button>
                </div>
            </div>
        `;
    }).join('');

    contenedorResultados.innerHTML = `<div class="scp-grid">${tarjetasHTML}</div>`;
}

// Función para obtener color de la clase
function getClaseColor(clase) {
    switch(clase.toLowerCase()) {
        case 'safe': return '#00ff88';
        case 'euclid': return '#ffc400';
        case 'keter': return '#ff4444';
        case 'thaumiel': return '#8844ff';
        case 'apollyon': return '#ff0066';
        case 'archon': return '#00ffff';
        default: return '#888888';
    }
}

// Función para mostrar detalles
function mostrarDetalles(numero) {
    const scp = scpCache.get(numero) || currentResults.find(item => item.number === numero);
    if (scp) {
        const procedimientos = scp.procedures && scp.procedures !== 'Procedimientos no disponibles' ? 
            `\n\nProcedimientos de Contención:\n${scp.procedures.substring(0, 300)}...` : '';
        
        const tags = scp.tags && scp.tags.length > 0 ? 
            `\n\nEtiquetas: ${scp.tags.slice(0, 5).join(', ')}` : '';
            
        alert(`🔒 ARCHIVO CLASIFICADO - SCP-${scp.number}\n\nNombre: ${scp.title}\nClase: ${scp.class.toUpperCase()}\nRating: ${scp.rating || 'N/A'}\n\nDescripción:\n${scp.description.substring(0, 400)}...${procedimientos}${tags}\n\n⚠️ Nivel de Autorización: Restringido`);
    }
}

// Función para abrir URL
function abrirUrl(url) {
    window.open(url, '_blank');
}

// Función para marcar favorito
function marcarFavorito(numero) {
    const mensaje = `⭐ SCP-${numero} ha sido añadido a tus favoritos!\n\n🔐 Acceso guardado en tu perfil de personal de la Fundación.`;
    alert(mensaje);
}

// Función para cargar SCPs iniciales
async function cargarScpsIniciales() {
    mostrarCarga(true);
    try {
        allScpsList = await obtenerMultiplesScps(popularScps);
        mostrarResultados(allScpsList);
    } catch (error) {
        mostrarError('Error al cargar los datos iniciales.');
    } finally {
        mostrarCarga(false);
    }
}

// Función de búsqueda con debounce mejorada
let searchTimeout;
function busquedaConDebounce() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(buscarSCP, 800);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Búsqueda en tiempo real
    document.getElementById('busqueda').addEventListener('input', function() {
        const valor = this.value.trim();
        if (valor.length >= 2) {
            busquedaConDebounce();
        } else if (valor.length === 0) {
            mostrarResultados(allScpsList);
        }
    });

    // Búsqueda al cambiar categoría
    document.getElementById('categoria').addEventListener('change', buscarSCP);

    // Permitir búsqueda con Enter
    document.getElementById('busqueda').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarSCP();
        }
    });

    // Efecto de escritura para el placeholder
    const input = document.getElementById('busqueda');
    const placeholders = [
        'Buscar anomalías SCP...',
        'Ej: 173, 049, 096...',
        'Buscar por número...',
        'Contener, Proteger, Asegurar...',
        'Ingrese clasificación...'
    ];
    
    let currentPlaceholder = 0;
    
    setInterval(() => {
        if (!input.value) {
            currentPlaceholder = (currentPlaceholder + 1) % placeholders.length;
            input.placeholder = placeholders[currentPlaceholder];
        }
    }, 3000);

    // Añadir estilos dinámicos
    const style = document.createElement('style');
    style.textContent = `
        .scp-card button:hover {
            transform: scale(1.05);
            filter: brightness(1.2);
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Cargar datos iniciales
    cargarScpsIniciales();
});