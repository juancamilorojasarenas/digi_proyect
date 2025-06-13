// Base URL de la API de SCP con fallback
const SCP_API_BASE = 'https://scp-data.tedivm.com';
const SCP_API_FALLBACK = 'https://scpapi.koll.ai';

// Cache para almacenar los SCPs ya obtenidos
let scpCache = new Map();
let allScpsList = [];
let currentResults = [];
let isLoading = false;

// Lista de SCPs populares para cargar inicialmente con datos de respaldo
const popularScps = [
    '173', '096', '049', '106', '914', '682', '079', '999', 
    '3008', '426', '294', '055', '001', '939', '457', '035'
];

// Datos de respaldo para SCPs populares
const scpFallbackData = {
    '173': {
        number: '173',
        title: 'The Sculpture',
        class: 'euclid',
        description: 'Una escultura animada de hormigón y varilla de refuerzo pintada con pintura en aerosol Krylon. Es extremadamente hostil y se moverá para atacar cuando no esté siendo observado directamente, matando por dislocación del cuello o estrangulamiento.',
        procedures: 'SCP-173 debe mantenerse en un contenedor sellado en todo momento. Cuando el personal debe entrar al contenedor de SCP-173, no menos de 2 personas pueden entrar a la vez y deben mantener contacto visual con SCP-173 en todo momento.',
        url: 'https://scp-wiki.wikidot.com/scp-173',
        rating: 2000,
        tags: ['sculpture', 'hostile', 'concrete', 'autonomous']
    },
    '096': {
        number: '096',
        title: 'The Shy Guy',
        class: 'euclid',
        description: 'Una criatura humanoide pálida de aproximadamente 2.38 metros de altura. Entra en un estado de considerable angustia emocional cuando alguien ve su rostro, ya sea directamente, en video, fotografía o incluso en un dibujo artístico.',
        procedures: 'SCP-096 debe ser contenido en su celda todo el tiempo. SCP-096 puede ser dejado sin restricciones dentro de su celda. Se debe tener cuidado para asegurar que ningún humano o grabación de SCP-096 salga de SCP-096.',
        url: 'https://scp-wiki.wikidot.com/scp-096',
        rating: 1800,
        tags: ['humanoid', 'hostile', 'cognitohazard', 'predator']
    },
    '049': {
        number: '049',
        title: 'Plague Doctor',
        class: 'euclid',
        description: 'Una entidad humanoide, aproximadamente 1.9 metros de altura, que se asemeja a un médico de la peste medieval. SCP-049 es capaz de matar a cualquier ser humano con un solo toque de su mano, después de lo cual se convierte en una instancia de SCP-049-2.',
        procedures: 'SCP-049 está contenido dentro de una celda humanoidea estándar en el Sector de Investigación-██ del Sitio-19. SCP-049 debe ser sedado antes de cualquier tentativa de transporte.',
        url: 'https://scp-wiki.wikidot.com/scp-049',
        rating: 1600,
        tags: ['humanoid', 'historical', 'doctor', 'plague']
    },
    '106': {
        number: '106',
        title: 'The Old Man',
        class: 'keter',
        description: 'La apariencia de SCP-106 es la de un humanoide mayor y parcialmente descompuesto con un aspecto "corroído" general. SCP-106 causa un efecto de "corrosión" en toda la materia sólida que toca, ejerciendo un efecto extremadamente destructivo.',
        procedures: 'SCP-106 debe ser contenido en una celda sellada, suspendida en el centro de la habitación. SCP-106 es capaz de pasar a través de la materia sólida, dejando grandes huellas de corrosión.',
        url: 'https://scp-wiki.wikidot.com/scp-106',
        rating: 1900,
        tags: ['humanoid', 'predator', 'corrosive', 'teleportation']
    },
    '999': {
        number: '999',
        title: 'The Tickle Monster',
        class: 'safe',
        description: 'SCP-999 es una gran masa gelatinosa de color naranja que pesa aproximadamente 54 kg. SCP-999 parece ser amigable y extrovertido, y activamente busca el contacto con el personal. Su efecto anómalo principal es inducir estados de felicidad intensa.',
        procedures: 'SCP-999 está contenido libremente en el Sitio-19. Se le permite vagar por el sitio bajo supervisión básica. El personal puede interactuar con SCP-999 sin restricciones especiales.',
        url: 'https://scp-wiki.wikidot.com/scp-999',
        rating: 2500,
        tags: ['friendly', 'orange', 'gelatinous', 'safe']
    }
};

// Función para obtener información de un SCP específico con manejo mejorado de errores
async function obtenerScpPorNumero(numero) {
    try {
        // Verificar si ya está en cache
        if (scpCache.has(numero)) {
            return scpCache.get(numero);
        }

        let scpData = null;
        let lastError = null;

        // Intentar con la API principal
        try {
            const response = await fetch(`${SCP_API_BASE}/scp/${numero}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 segundos timeout
            });
            
            if (response.ok) {
                const data = await response.json();
                scpData = {
                    number: numero,
                    title: data.title || `SCP-${numero}`,
                    class: data.object_class || 'unknown',
                    description: data.description || 'Descripción no disponible',
                    procedures: data.special_containment_procedures || 'Procedimientos no disponibles',
                    url: data.url || `https://scp-wiki.wikidot.com/scp-${numero}`,
                    rating: data.rating || 0,
                    tags: data.tags || []
                };
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            lastError = error;
            console.warn(`API principal falló para SCP-${numero}:`, error.message);
        }

        // Si la API principal falla, intentar con API de respaldo
        if (!scpData) {
            try {
                const fallbackResponse = await fetch(`${SCP_API_FALLBACK}/scp/${numero}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    timeout: 8000
                });
                
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    scpData = {
                        number: numero,
                        title: fallbackData.title || `SCP-${numero}`,
                        class: fallbackData.class || 'unknown',
                        description: fallbackData.description || 'Descripción no disponible',
                        procedures: fallbackData.containment || 'Procedimientos no disponibles',
                        url: fallbackData.url || `https://scp-wiki.wikidot.com/scp-${numero}`,
                        rating: fallbackData.rating || 0,
                        tags: fallbackData.tags || []
                    };
                }
            } catch (fallbackError) {
                console.warn(`API de respaldo también falló para SCP-${numero}:`, fallbackError.message);
            }
        }

        // Si ambas APIs fallan, usar datos de respaldo locales
        if (!scpData) {
            if (scpFallbackData[numero]) {
                scpData = { ...scpFallbackData[numero] };
                console.info(`Usando datos de respaldo local para SCP-${numero}`);
            } else {
                // Crear datos básicos de emergencia
                scpData = {
                    number: numero,
                    title: `SCP-${numero}`,
                    class: 'unknown',
                    description: 'Información temporalmente no disponible. Los servicios de la base de datos de la Fundación están experimentando dificultades técnicas. Por favor, inténtalo de nuevo más tarde.',
                    procedures: 'Procedimientos de contención: Acceso restringido temporalmente',
                    url: `https://scp-wiki.wikidot.com/scp-${numero}`,
                    rating: 0,
                    tags: ['database-error', 'temporary']
                };
                console.warn(`Creando datos de emergencia para SCP-${numero}`);
            }
        }
        
        // Guardar en cache
        scpCache.set(numero, scpData);
        
        return scpData;
        
    } catch (error) {
        console.error(`Error crítico obteniendo SCP-${numero}:`, error);
        
        // Retornar datos de emergencia mejorados
        const emergencyData = {
            number: numero,
            title: `SCP-${numero}`,
            class: 'unknown',
            description: '⚠️ ERROR DE CONEXIÓN: No se pudo establecer conexión con la base de datos de la Fundación SCP. Esto puede deberse a problemas de red, mantenimiento del servidor o restricciones de acceso. Verifica tu conexión a internet e intenta nuevamente.',
            procedures: 'Estado: Información no disponible debido a errores de conectividad',
            url: `https://scp-wiki.wikidot.com/scp-${numero}`,
            rating: 0,
            tags: ['connection-error', 'retry-later']
        };
        
        // Guardar datos de emergencia en cache temporalmente
        scpCache.set(numero, emergencyData);
        
        return emergencyData;
    }
}

// Función para obtener múltiples SCPs con manejo paralelo mejorado
async function obtenerMultiplesScps(numeros) {
    const resultados = [];
    const batchSize = 3; // Procesar en lotes de 3 para evitar sobrecarga
    
    for (let i = 0; i < numeros.length; i += batchSize) {
        const lote = numeros.slice(i, i + batchSize);
        const promesasLote = lote.map(numero => obtenerScpPorNumero(numero));
        
        try {
            const resultadosLote = await Promise.allSettled(promesasLote);
            resultadosLote.forEach((resultado, index) => {
                if (resultado.status === 'fulfilled') {
                    resultados.push(resultado.value);
                } else {
                    console.error(`Error en lote para SCP-${lote[index]}:`, resultado.reason);
                    // Añadir datos de emergencia para SCPs fallidos
                    resultados.push({
                        number: lote[index],
                        title: `SCP-${lote[index]}`,
                        class: 'unknown',
                        description: 'Error al cargar este SCP específico. Intenta buscarlo individualmente.',
                        procedures: 'No disponible',
                        url: `https://scp-wiki.wikidot.com/scp-${lote[index]}`,
                        rating: 0,
                        tags: ['load-error']
                    });
                }
            });
        } catch (error) {
            console.error(`Error en lote completo:`, error);
        }
        
        // Pequeña pausa entre lotes para evitar rate limiting
        if (i + batchSize < numeros.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    return resultados;
}

// Función para buscar SCPs con manejo mejorado de errores
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
            try {
                const scpData = await obtenerScpPorNumero(busqueda);
                if (scpData && (!categoria || scpData.class.toLowerCase() === categoria)) {
                    resultados = [scpData];
                }
            } catch (error) {
                console.error(`Error buscando SCP-${busqueda}:`, error);
                mostrarError(`Error al buscar SCP-${busqueda}. Verifica el número e intenta nuevamente.`);
                return;
            }
        } else {
            // Cargar SCPs populares si no hay datos cargados
            if (allScpsList.length === 0) {
                try {
                    allScpsList = await obtenerMultiplesScps(popularScps);
                } catch (error) {
                    console.error('Error cargando SCPs populares:', error);
                    // Usar solo datos de respaldo si todo falla
                    allScpsList = Object.values(scpFallbackData);
                    mostrarAdvertencia('Conectado a base de datos de respaldo. Funcionalidad limitada.');
                }
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
        console.error('Error crítico en la búsqueda:', error);
        mostrarError('Error crítico del sistema. Reiniciando conexión con la base de datos...');
        
        // Intentar recuperación automática
        setTimeout(() => {
            cargarScpsIniciales();
        }, 3000);
        
    } finally {
        mostrarCarga(false);
        isLoading = false;
    }
}

// Función para mostrar estado de carga mejorada
function mostrarCarga(loading) {
    const button = document.querySelector('button');
    const originalText = '🔍 Buscar';
    
    if (loading) {
        button.innerHTML = '<span class="loading"></span> Accediendo a la base de datos SCP...';
        button.disabled = true;
        button.style.opacity = '0.7';
    } else {
        button.innerHTML = originalText;
        button.disabled = false;
        button.style.opacity = '1';
    }
}

// Función para mostrar advertencias
function mostrarAdvertencia(mensaje) {
    const contenedorResultados = document.getElementById('resultados');
    const advertencia = document.createElement('div');
    advertencia.innerHTML = `
        <div style="background: rgba(255, 196, 0, 0.1); border: 2px solid #ffc400; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; color: #ffc400; text-align: center;">
            ⚠️ ${mensaje}
        </div>
    `;
    contenedorResultados.insertBefore(advertencia, contenedorResultados.firstChild);
    
    // Remover advertencia después de 5 segundos
    setTimeout(() => {
        if (advertencia.parentNode) {
            advertencia.parentNode.removeChild(advertencia);
        }
    }, 5000);
}

// Función para mostrar error mejorada
function mostrarError(mensaje) {
    const contenedorResultados = document.getElementById('resultados');
    contenedorResultados.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #ff4444; font-size: 1.3rem; background: rgba(255, 68, 68, 0.1); border: 2px solid #ff4444; border-radius: 12px;">
            🚨 ALERTA DEL SISTEMA SCP
            <br><br>
            <strong>${mensaje}</strong>
            <br><br>
            <div style="font-size: 1rem; color: #ffaaaa; margin: 1rem 0;">
                • Verifica tu conexión a internet<br>
                • Los servidores pueden estar en mantenimiento<br>
                • Intenta buscar SCPs específicos por número
            </div>
            <button onclick="cargarScpsIniciales()" style="background: #ff4444; color: white; border: none; padding: 1rem 2rem; border-radius: 6px; cursor: pointer; margin: 0.5rem;">
                🔄 Reintentar Conexión
            </button>
            <button onclick="cargarDatosRespaldo()" style="background: rgba(255, 196, 0, 0.8); color: #000; border: none; padding: 1rem 2rem; border-radius: 6px; cursor: pointer; margin: 0.5rem;">
                📚 Usar Datos de Respaldo
            </button>
        </div>
    `;
}

// Función para cargar datos de respaldo
function cargarDatosRespaldo() {
    allScpsList = Object.values(scpFallbackData);
    mostrarResultados(allScpsList);
    mostrarAdvertencia('Usando base de datos de respaldo local. Datos limitados disponibles.');
}

// Función para mostrar resultados (sin cambios)
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

// Función para obtener color de la clase (sin cambios)
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

// Función para mostrar detalles (sin cambios)
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

// Función para abrir URL (sin cambios)
function abrirUrl(url) {
    window.open(url, '_blank');
}

// Función para marcar favorito (sin cambios)
function marcarFavorito(numero) {
    const mensaje = `⭐ SCP-${numero} ha sido añadido a tus favoritos!\n\n🔐 Acceso guardado en tu perfil de personal de la Fundación.`;
    alert(mensaje);
}

// Función para cargar SCPs iniciales mejorada
async function cargarScpsIniciales() {
    mostrarCarga(true);
    try {
        allScpsList = await obtenerMultiplesScps(popularScps);
        if (allScpsList.length === 0) {
            throw new Error('No se pudieron cargar datos iniciales');
        }
        mostrarResultados(allScpsList);
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        // Intentar con datos de respaldo
        cargarDatosRespaldo();
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

// Event listeners (sin cambios significativos)
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