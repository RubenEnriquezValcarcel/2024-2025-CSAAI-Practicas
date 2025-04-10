const canvas = document.getElementById("canvas");
canvas.width = 1200;
canvas.height = 650;
const ctx = canvas.getContext("2d");

// Cargar imágenes
const imgAlien = new Image();
imgAlien.src = 'aliens.png';
const imgNave = new Image();
imgNave.src = 'nave.png';
const imgExplosion = new Image();
imgExplosion.src = 'explosion.png';

// Cargar audios únicos
const audioWin = new Audio('win.mp3');
const audioDefeat = new Audio('defeat.mp3');
audioDefeat.volume = 0.25;

// Funciones para superponer audios
function reproducirAudioDisparo() {
    const a = new Audio('disparo.mp3');
    a.volume = 0.25;
    a.play();
}

function reproducirAudioExplosion() {
    const a = new Audio('explosion.mp3');
    a.volume = 0.2;
    a.play();
}

// Config
const CONFIG = {
    LADRILLOS: {
        FILAS: 3,
        COLUMNAS: 8,
        ANCHO: 55,
        ALTO: 65,
        PADDING: 25,
        VELOCIDAD: 5
    },
    JUGADOR: {
        ANCHO: 70,
        ALTO: 70,
        VELOCIDAD: 8,
        COLOR: '#2ecc71'
    },
    DISPARO: {
        VELOCIDAD: -9,
        ANCHO: 4,
        ALTO: 10,
        COLOR: '#e74c3c'
    }
};

// Estado
const estado = {
    jugador: {
        x: canvas.width / 2 - CONFIG.JUGADOR.ANCHO / 2,
        y: canvas.height - 70,
        direccion: 0
    },
    ladrillos: [],
    disparos: [],
    explosiones: [],
    puedeDisparar: true,
    ladrillosDireccion: 1,
    terminado: false,
    mensaje: "",
    colorMensaje: "",
    puntos: 0
};

function inicializarLadrillos() {
    for (let i = 0; i < CONFIG.LADRILLOS.FILAS; i++) {
        estado.ladrillos[i] = [];
        for (let j = 0; j < CONFIG.LADRILLOS.COLUMNAS; j++) {
            estado.ladrillos[i][j] = {
                x: 100 + (CONFIG.LADRILLOS.ANCHO + CONFIG.LADRILLOS.PADDING) * j,
                y: 20 + (CONFIG.LADRILLOS.ALTO + CONFIG.LADRILLOS.PADDING) * i,
                visible: true
            };
        }
    }
}

function configurarControles() {
    const manejarMovimiento = (direccion) => (e) => {
        if (e.key === `Arrow${direccion}`) {
            estado.jugador.direccion = e.type === 'keydown'
                ? (direccion === 'Left' ? -1 : 1)
                : 0;
        }
    };

    document.addEventListener('keydown', manejarMovimiento('Left'));
    document.addEventListener('keydown', manejarMovimiento('Right'));
    document.addEventListener('keyup', manejarMovimiento('Left'));
    document.addEventListener('keyup', manejarMovimiento('Right'));

    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' && estado.puedeDisparar && !estado.terminado) {
            estado.disparos.push({
                x: estado.jugador.x + CONFIG.JUGADOR.ANCHO / 2 - CONFIG.DISPARO.ANCHO / 2,
                y: estado.jugador.y
            });
            reproducirAudioDisparo();
            estado.puedeDisparar = false;
            setTimeout(() => estado.puedeDisparar = true, 200);
        }
    });
}

function actualizarPosiciones() {
    if (estado.terminado) return;

    estado.jugador.x += CONFIG.JUGADOR.VELOCIDAD * estado.jugador.direccion;
    estado.jugador.x = Math.max(0,
        Math.min(canvas.width - CONFIG.JUGADOR.ANCHO, estado.jugador.x));

    estado.disparos.forEach(disparo => {
        disparo.y += CONFIG.DISPARO.VELOCIDAD;
    });

    estado.disparos = estado.disparos.filter(disparo =>
        disparo.y + CONFIG.DISPARO.ALTO > 0
    );

    let cambiarDireccion = false;

    estado.ladrillos.forEach(fila => {
        fila.forEach(ladrillo => {
            if (ladrillo.visible) {
                ladrillo.x += CONFIG.LADRILLOS.VELOCIDAD * estado.ladrillosDireccion;

                if (
                    ladrillo.x <= 0 ||
                    ladrillo.x + CONFIG.LADRILLOS.ANCHO >= canvas.width
                ) {
                    cambiarDireccion = true;
                }
            }
        });
    });

    if (cambiarDireccion) {
        estado.ladrillosDireccion *= -1;
        estado.ladrillos.forEach(fila => {
            fila.forEach(ladrillo => {
                ladrillo.y += CONFIG.LADRILLOS.ALTO / 2;

                if (ladrillo.visible && ladrillo.y + CONFIG.LADRILLOS.ALTO >= estado.jugador.y) {
                    estado.terminado = true;
                    estado.mensaje = "DEFEAT";
                    estado.colorMensaje = "red";
                    audioDefeat.play();
                }
            });
        });
    }
}

function detectarColisiones() {
    if (estado.terminado) return;

    estado.disparos.forEach((disparo, index) => {
        estado.ladrillos.forEach((fila, i) => {
            fila.forEach((ladrillo, j) => {
                if (ladrillo.visible &&
                    disparo.x < ladrillo.x + CONFIG.LADRILLOS.ANCHO &&
                    disparo.x + CONFIG.DISPARO.ANCHO > ladrillo.x &&
                    disparo.y < ladrillo.y + CONFIG.LADRILLOS.ALTO &&
                    disparo.y + CONFIG.DISPARO.ALTO > ladrillo.y) {

                    ladrillo.visible = false;
                    estado.disparos.splice(index, 1);
                    estado.puntos += 10;
                    reproducirAudioExplosion();

                    // Añadir explosión visual
                    estado.explosiones.push({
                        x: ladrillo.x,
                        y: ladrillo.y,
                        tiempo: Date.now()
                    });
                }
            });
        });
    });

    const todosEliminados = estado.ladrillos.flat().every(l => !l.visible);
    if (todosEliminados && !estado.terminado) {
        estado.terminado = true;
        estado.mensaje = "WIN";
        estado.colorMensaje = "green";
        audioWin.play();
    }
}

function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    estado.ladrillos.forEach(fila => {
        fila.forEach(ladrillo => {
            if (ladrillo.visible) {
                ctx.drawImage(
                    imgAlien,
                    ladrillo.x,
                    ladrillo.y,
                    CONFIG.LADRILLOS.ANCHO,
                    CONFIG.LADRILLOS.ALTO
                );
            }
        });
    });

    ctx.drawImage(
        imgNave,
        estado.jugador.x,
        estado.jugador.y,
        CONFIG.JUGADOR.ANCHO,
        CONFIG.JUGADOR.ALTO
    );

    ctx.fillStyle = CONFIG.DISPARO.COLOR;
    estado.disparos.forEach(disparo => {
        ctx.fillRect(
            disparo.x,
            disparo.y,
            CONFIG.DISPARO.ANCHO,
            CONFIG.DISPARO.ALTO
        );
    });

    // Dibujar explosiones activas
    estado.explosiones = estado.explosiones.filter(explosion => Date.now() - explosion.tiempo < 300);
    estado.explosiones.forEach(explosion => {
        ctx.drawImage(
            imgExplosion,
            explosion.x,
            explosion.y,
            CONFIG.LADRILLOS.ANCHO,
            CONFIG.LADRILLOS.ALTO
        );
    });

    // Dibujar contador de puntos
    ctx.fillStyle = 'white';
    ctx.font = "24px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Puntos: " + estado.puntos, 20, 40);

    if (estado.terminado) {
        ctx.fillStyle = estado.colorMensaje;
        ctx.font = "bold 80px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(estado.mensaje, canvas.width / 2, canvas.height / 2);
    }
}

function actualizar() {
    actualizarPosiciones();
    detectarColisiones();
    dibujar();
    if (!estado.terminado) requestAnimationFrame(actualizar);
}

function iniciarJuego() {
    inicializarLadrillos();
    configurarControles();
    actualizar();
}

iniciarJuego();
