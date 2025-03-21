document.addEventListener("DOMContentLoaded", () => {
    
    const claveElemento = document.getElementById("clave");
    const intentosElemento = document.getElementById("intentos");
    const cronoElemento = document.getElementById("cronometro");
    const container = document.querySelector(".container");

    const botonesNumeros = document.querySelectorAll(".numeros button");
    const startBtn = document.getElementById("start");
    const stopBtn = document.getElementById("stop");
    const resetBtn = document.getElementById("reset");

    const sonidoGanar = document.getElementById("sonidoGanar");
    const sonidoPerder = document.getElementById("sonidoPerder");

    let claveSecreta = [];
    let intentosRestantes = 10;
    let descubiertos = [];
    let cronoInterval;
    let tiempo = { min: 0, seg: 0, decimas: 0 };
    let enMarcha = false;

    function generarClave() {
        claveSecreta = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
        descubiertos = [false, false, false, false];
        claveElemento.innerHTML = claveSecreta.map(() => `<span class="secreto">*</span>`).join("");
    }

    function actualizarIntentos() {
        intentosElemento.textContent = `Intentos restantes: ${intentosRestantes}`;
    }

    function iniciarCrono() {
        if (!enMarcha) {
            enMarcha = true;

            cronoInterval = setInterval(() => {
                tiempo.decimas++;

                if (tiempo.decimas === 10) {
                    tiempo.decimas = 0;
                    tiempo.seg++;
                }

                if (tiempo.seg === 60) {
                    tiempo.seg = 0;
                    tiempo.min++;
                }

                cronoElemento.textContent = `Tiempo: ${formatearTiempo(tiempo)}`;

            }, 100);
        }
    }

    function detenerCrono() {
        clearInterval(cronoInterval);

        enMarcha = false;
    }

    function resetearJuego() {
        detenerCrono();
        tiempo = { min: 0, seg: 0, decimas: 0};
        cronoElemento.textContent = "Tiempo: 00:00.0";
        intentosRestantes = 10;

        actualizarIntentos();
        generarClave();

        enMarcha = false;
        container.style.backgroundColor = "#1e1e1e";
    }

    function formatearTiempo(t) {
        return `${String(t.min).padStart(2, "0")}:${String(t.seg).padStart(2, "0")}.${t.decimas}`;
    }

    function reproducirSonido(tipo, callback) {

        if (tipo === "ganar") {
            sonidoGanar.play();
            sonidoGanar.onended = callback; 

        } 
        
        else if (tipo === "perder") {
            sonidoPerder.play();
            sonidoPerder.onended = callback;
        }
    }

    botonesNumeros.forEach(boton => {
        boton.addEventListener("click", () => {

            if (intentosRestantes > 0) {
                
                if (!enMarcha) iniciarCrono();
                
                    let numero = parseInt(boton.textContent);
                    let acierto = false;

                    claveSecreta.forEach((valor, index) => {
                        if (valor === numero && !descubiertos[index]) {
                            descubiertos[index] = true;
                            document.querySelectorAll(".secreto")[index].textContent = numero;
                            document.querySelectorAll(".secreto")[index].style.color = "lime";
                            acierto = true;
                        }
                });

                intentosRestantes--;
                actualizarIntentos();

                setTimeout(() => {
                    
                    if (descubiertos.every(d => d)) {
                        detenerCrono();
                        // color de fondo a rojo antes de la notificación de victoria
                        container.style.backgroundColor = "green";
                        reproducirSonido("ganar", () => {
                            alert(`¡Felicidades! Has adivinado la clave en ${formatearTiempo(tiempo)}.`);
                            resetearJuego();
                        });
                    } 
                    
                    else if (intentosRestantes === 0) {
                        // color de fondo a rojo antes de la notificación de derrota
                        container.style.backgroundColor = "red";
                        reproducirSonido("perder", () => {
                            alert(`¡Has perdido! La clave era ${claveSecreta.join("")}.`);
                            resetearJuego();
                        });
                    }

                }, 100);
            }
        });
    });

    startBtn.addEventListener("click", iniciarCrono);
    stopBtn.addEventListener("click", detenerCrono);
    resetBtn.addEventListener("click", resetearJuego);

    resetearJuego();
});
