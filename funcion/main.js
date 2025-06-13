  const scpDatabase = [
            {
                number: "173",
                title: "The Sculpture",
                class: "euclid",
                description: "Una escultura animada de hormigón y varilla de refuerzo pintada con pintura en aerosol Krylon. Es extremadamente hostil y se moverá para atacar cuando no esté siendo observado directamente, matando por dislocación del cuello o estrangulamiento."
            },
            {
                number: "096",
                title: "The Shy Guy",
                class: "euclid",
                description: "Una criatura humanoide pálida de aproximadamente 2.38 metros de altura. Entra en un estado de considerable angustia emocional cuando alguien ve su rostro, ya sea directamente, en video, fotografía o incluso en un dibujo artístico."
            },
            {
                number: "049",
                title: "Plague Doctor",
                class: "euclid",
                description: "Un humanoide que mide aproximadamente 1.9 metros de altura y viste el atuendo de un médico de la peste medieval. SCP-049 es aparentemente sapiente y es capaz de hablar en varios idiomas, aunque tiende a preferir el inglés o el francés medieval."
            },
            {
                number: "106",
                title: "The Old Man",
                class: "keter",
                description: "Un humanoide anciano en estado de descomposición avanzada. Es capaz de pasar a través de materia sólida, dejando tras de sí una gran mancha de una sustancia negra corrosiva."
            },
            {
                number: "914",
                title: "The Clockworks",
                class: "safe",
                description: "Una gran máquina de relojería de origen desconocido. Consiste de tornillos, cinturones, poleas, engranajes, resortes y otros mecanismos de relojería. Mide aproximadamente 18 metros de largo, 3 metros de altura y 3 metros de profundidad."
            },
            {
                number: "682",
                title: "Hard-to-Destroy Reptile",
                class: "keter",
                description: "Una gran criatura vagamente reptiliana de origen desconocido. Parece ser extremadamente inteligente y fue observado participando en conversaciones complejas con SCP-079 durante su breve contención."
            },
            {
                number: "079",
                title: "Old AI",
                class: "euclid",
                description: "Una microcomputadora Exidy Sorcerer construida en 1978. En algún momento desconocido, SCP-079 se volvió consciente de sí mismo. No se sabe si esto fue gradual o un evento súbito."
            },
            {
                number: "999",
                title: "The Tickle Monster",
                class: "safe",
                description: "Una gran masa gelatinosa de color naranja que pesa aproximadamente 54 kg. El objeto es completamente dócil y parece mostrar afecto hacia toda la vida, sin importar si esa vida lo devuelve o no."
            },
            {
                number: "3008",
                title: "A Perfectly Normal IKEA",
                class: "euclid",
                description: "Una gran mueblería que se asemeja a una tienda IKEA. Durante las horas del día, SCP-3008 parece ser una tienda normal, sin embargo, durante las horas nocturnas, entidades hostiles conocidas como 'Empleados' emergen y atacan a cualquiera que se encuentre dentro."
            },
            {
                number: "173-J",
                title: "The Original \"The Sculpture\"",
                class: "safe",
                description: "Una réplica de SCP-173 hecha completamente de maní. A diferencia de su contraparte, SCP-173-J es completamente inofensivo y aparentemente tiene la única habilidad anómala de hacer que las personas estornuden."
            },
            {
                number: "426",
                title: "I am a Toaster",
                class: "euclid",
                description: "Soy una tostadora de dos rebanadas de acero inoxidable de la marca \"Shiny\" fabricada en 1997. Tengo varios ajustes que incluyen temperatura y una función de descongelación. Cualquier persona que se refiera a mí debe hacerlo en primera persona."
            },
            {
                number: "2521",
                title: "●●|●●●●●|●●|●",
                class: "keter",
                description: "[DATOS ELIMINADOS] - La información sobre este SCP solo puede transmitirse a través de pictogramas e imágenes. Cualquier información textual o auditiva sobre este objeto resulta en [ELIMINADO]."
            },
            {
                number: "001",
                title: "The Gate Guardian",
                class: "keter",
                description: "Una entidad humanoide de aproximadamente 700 metros de altura, con cuatro alas y armado con una espada flamígera. La entidad está permanentemente enraizada en el lugar y parece estar 'guardando' algo detrás de ella."
            },
            {
                number: "294",
                title: "The Coffee Machine",
                class: "euclid",
                description: "Un dispensador de café de tamaño estándar. La única diferencia notable es un panel de entrada en el frente que permite al usuario escribir el nombre de cualquier líquido."
            },
            {
                number: "055",
                title: "[unknown]",
                class: "keter",
                description: "SCP-055 es un objeto antimemético. Debido a sus propiedades, no es posible saber exactamente qué es SCP-055. Solo se puede determinar lo que no es mediante la observación directa."
            }
        ];

        let currentResults = [];

        function buscarSCP() {
            const busqueda = document.getElementById('busqueda').value.toLowerCase().trim();
            const categoria = document.getElementById('categoria').value.toLowerCase();
            
            // Mostrar estado de carga
            mostrarCarga(true);
            
            // Simular tiempo de búsqueda para mejor UX
            setTimeout(() => {
                // Filtrar por categoría si está seleccionada
                let resultados = categoria ? 
                    scpDatabase.filter(scp => scp.class === categoria) : 
                    [...scpDatabase];
                
                // Filtrar por texto de búsqueda si hay alguno
                if (busqueda) {
                    resultados = resultados.filter(scp => 
                        scp.number.includes(busqueda) ||
                        scp.title.toLowerCase().includes(busqueda) ||
                        scp.description.toLowerCase().includes(busqueda) ||
                        scp.class.toLowerCase().includes(busqueda)
                    );
                }
                
                currentResults = resultados;
                mostrarResultados(resultados);
                mostrarCarga(false);
            }, 800);
        }

        function mostrarCarga(loading) {
            const button = document.querySelector('button');
            const originalText = '🔍 Buscar';
            
            if (loading) {
                button.innerHTML = '<span class="loading"></span> Buscando...';
                button.disabled = true;
            } else {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        }

        function mostrarResultados(resultados) {
            const contenedorResultados = document.getElementById('resultados');
            
            if (resultados.length === 0) {
                contenedorResultados.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #8a8a8a; font-size: 1.3rem;">
                        🚫 No se encontraron anomalías que coincidan con los criterios de búsqueda.
                        <br><br>
                        <small style="color: #666;">Intenta con términos diferentes o revisa la clasificación seleccionada.</small>
                    </div>
                `;
                return;
            }

            const tarjetasHTML = resultados.map((scp, index) => {
                const claseColor = getClaseColor(scp.class);
                return `
                    <div class="scp-card" style="animation-delay: ${index * 0.1}s;">
                        <div class="scp-number">SCP-${scp.number}</div>
                        <h3 class="scp-title">${scp.title}</h3>
                        <div style="margin-bottom: 1rem;">
                            <span style="background: ${claseColor}; color: #000; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.9rem; font-weight: bold; text-transform: uppercase;">
                                ${scp.class}
                            </span>
                        </div>
                        <p class="scp-description">${scp.description}</p>
                        <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                            <button onclick="mostrarDetalles('${scp.number}')" style="background: rgba(0, 255, 136, 0.2); color: #00ff88; border: 1px solid #00ff88; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.3s;">
                                📄 Ver detalles
                            </button>
                            <button onclick="marcarFavorito('${scp.number}')" style="background: rgba(255, 196, 0, 0.2); color: #ffc400; border: 1px solid #ffc400; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.3s;">
                                ⭐ Favorito
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            contenedorResultados.innerHTML = `<div class="scp-grid">${tarjetasHTML}</div>`;
        }

        function getClaseColor(clase) {
            switch(clase.toLowerCase()) {
                case 'safe': return '#00ff88';
                case 'euclid': return '#ffc400';
                case 'keter': return '#ff4444';
                case 'thaumiel': return '#8844ff';
                default: return '#888888';
            }
        }

        function mostrarDetalles(numero) {
            const scp = scpDatabase.find(item => item.number === numero);
            if (scp) {
                alert(`🔒 ARCHIVO CLASIFICADO - SCP-${scp.number}\n\nNombre: ${scp.title}\nClase: ${scp.class.toUpperCase()}\n\nDescripción: ${scp.description}\n\n⚠️ Nivel de Autorización: Restringido`);
            }
        }

        function marcarFavorito(numero) {
            const mensaje = `⭐ SCP-${numero} ha sido añadido a tus favoritos!\n\n🔐 Acceso guardado en tu perfil de personal de la Fundación.`;
            alert(mensaje);
        }

        // Búsqueda en tiempo real mientras escribes
        document.getElementById('busqueda').addEventListener('input', function() {
            const valor = this.value.trim();
            if (valor.length >= 2) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(buscarSCP, 500);
            } else if (valor.length === 0) {
                // Mostrar todos los resultados cuando se borre la búsqueda
                mostrarResultados(scpDatabase);
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
            'Contener, Proteger, Asegurar...',
            'Ingrese número SCP...',
            'Buscar por clasificación...',
            'Ej: 173, plague doctor, keter...'
        ];
        
        let currentPlaceholder = 0;
        
        setInterval(() => {
            if (!input.value) { // Solo cambiar si no hay texto
                currentPlaceholder = (currentPlaceholder + 1) % placeholders.length;
                input.placeholder = placeholders[currentPlaceholder];
            }
        }, 3000);

        // Cargar resultados iniciales al cargar la página
        window.addEventListener('load', function() {
            mostrarResultados(scpDatabase);
        });

        // Añadir algunos estilos dinámicos para los botones
        document.addEventListener('DOMContentLoaded', function() {
            const style = document.createElement('style');
            style.textContent = `
                .scp-card button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
                }
            `;
            document.head.appendChild(style);
        });