// Variables de trabajo
const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');

let redAleatoria;
let nodoOrigen = 0, nodoDestino = 0;
let rutaMinimaConRetardos;

const nodeRadius = 40;
const numNodos = 5;
const nodeConnect = 2;
const nodeRandomDelay = 1000;
const pipeRandomWeight = 100;

let totalDelay = 0;
const nodeCountElement = document.getElementById('nodeCount');
const totalTimeElement = document.getElementById('totalTime');
const networkStatusElement = document.getElementById('networkStatus');

// Localizando elementos en el DOM
const btnCNet = document.getElementById("btnCNet");
const btnMinPath = document.getElementById("btnMinPath");

// Clase PriorityQueue para Dijkstra
class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift();
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

// Clase para representar un nodo en el grafo
class Nodo {
  constructor(id, x, y, delay) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.delay = delay;
    this.conexiones = [];
  }
  
  conectar(nodo, peso) {
    this.conexiones.push({ nodo, peso });
  }

  isconnected(idn) {
    return this.conexiones.some(con => con.nodo.id === idn);
  }

  node_distance(nx, ny) {
    const a = nx - this.x;
    const b = ny - this.y;    
    return Math.floor(Math.sqrt(a*a + b*b));
  }

  far_node(nodos) {
    let distn = 0;
    let cnode = this.id;
    let npos = 0;
    nodos.forEach((nodo, pos) => {
      const distaux = this.node_distance(nodo.x, nodo.y);
      if (distaux > distn && distaux !== 0) {
        distn = distaux;
        cnode = nodo.id;
        npos = pos;
      }
    });
    return {pos: npos, id: cnode, distance: distn};
  }

  close_node(nodos) {
    let distn = Infinity;
    let cnode = this.id;
    let npos = 0;
    nodos.forEach((nodo, pos) => {
      const distaux = this.node_distance(nodo.x, nodo.y);
      if (distaux < distn && distaux !== 0) {
        distn = distaux;
        cnode = nodo.id;
        npos = pos;
      }
    });
    return {pos: npos, id: cnode, distance: distn};
  }
}

// Función para generar una red aleatoria con nodos en diferentes estados de congestión
function crearRedAleatoriaConCongestion(numNodos, numConexiones) {
  const nodos = [];
  let x = 0, y = 0, delay = 0;
  let bSpace = false;

  const xs = Math.floor(canvas.width / numNodos);
  const ys = Math.floor(canvas.height / 2);
  const xr = canvas.width - nodeRadius;
  const yr = canvas.height - nodeRadius;
  let xp = nodeRadius;
  let yp = nodeRadius;
  let xsa = xs;
  let ysa = ys;

  // Generamos los nodos
  for (let i = 0; i < numNodos; i++) {
    if (Math.random() < 0.5) {
      yp = nodeRadius;
      ysa = ys;
    } else {
      yp = ys;
      ysa = yr;
    }

    x = Math.floor(Math.random() * (xsa - xp) + xp);
    y = Math.floor(Math.random() * (ysa - yp) + yp);

    xp = xsa;
    xsa = xsa + xs;

    if (xsa > xr) {
      xsa = xr;
    }

    if (xsa > xr && xsa < canvas.width) {
      xp = nodeRadius;
      xsa = xs;
    }

    delay = Math.random() * nodeRandomDelay;
    nodos.push(new Nodo(i, x, y, delay));
  }

  // Conectamos los nodos bidireccionalmente
  for (let nodo of nodos) {
    const clonedArray = [...nodos];
    for (let j = 0; j < numConexiones; j++) {
      let close_node = nodo.close_node(clonedArray);
      if (!nodo.isconnected(close_node.id) && !clonedArray[close_node.pos].isconnected(nodo.id)) {
        const distance = close_node.distance;
        nodo.conectar(clonedArray[close_node.pos], distance);
        clonedArray[close_node.pos].conectar(nodo, distance);
      }
      clonedArray.splice(close_node.pos, 1);
    }
  }
  return nodos;
}

// Algoritmo Dijkstra para encontrar la ruta más corta
function dijkstra(graph, startNode, endNode) {
  const distances = {};
  const previous = {};
  const queue = new PriorityQueue();

  graph.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });
  distances[startNode.id] = 0;
  queue.enqueue(startNode, 0);

  while (!queue.isEmpty()) {
    const current = queue.dequeue().element;
    if (current.id === endNode.id) break;

    current.conexiones.forEach(({ nodo, peso }) => {
      const alt = distances[current.id] + peso;
      if (alt < distances[nodo.id]) {
        distances[nodo.id] = alt;
        previous[nodo.id] = current.id;
        queue.enqueue(nodo, alt);
      }
    });
  }

  const path = [];
  let currentNodeId = endNode.id;
  if (distances[endNode.id] === Infinity) return [];
  while (currentNodeId !== null) {
    path.unshift(currentNodeId);
    currentNodeId = previous[currentNodeId];
  }
  return path;
}

// Dibujar la red en el canvas
function drawNet(nnodes, path = []) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Dibujar conexiones
  nnodes.forEach(nodo => {
    nodo.conexiones.forEach(({ nodo: conexion, peso }) => {
      ctx.beginPath();
      ctx.moveTo(nodo.x, nodo.y);
      ctx.lineTo(conexion.x, conexion.y);
      ctx.strokeStyle = 'black';
      ctx.stroke();

      // Dibujar peso de la conexión
      ctx.font = '12px Arial';
      ctx.fillStyle = 'black';
      const midX = Math.floor((nodo.x + conexion.x)/2);
      const midY = Math.floor((nodo.y + conexion.y)/2);
      ctx.fillText(peso, midX, midY);
    });
  });

  // Dibujar nodos
  nnodes.forEach(nodo => {
    ctx.beginPath();
    ctx.arc(nodo.x, nodo.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = path.includes(nodo.id) ? 'green' : 'black';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // Texto del nodo
    ctx.font = '12px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    const nodoDesc = `N${nodo.id}\ndelay: ${Math.floor(nodo.delay)}`;
    ctx.fillText(nodoDesc, nodo.x, nodo.y + 5);
  });
}

// Eventos
btnCNet.onclick = () => {
    redAleatoria = crearRedAleatoriaConCongestion(numNodos, nodeConnect);
    totalDelay = 0;
    updateUI();
    drawNet(redAleatoria);
};

btnMinPath.onclick = () => {
    if (!redAleatoria || redAleatoria.length < 5) {
        alert("Primero genera la red");
        return;
    }
    
    const startNode = redAleatoria[0];
    const endNode = redAleatoria[4];
    const shortestPath = dijkstra(redAleatoria, startNode, endNode);
    
    if (shortestPath.length === 0) {
        alert("No hay ruta disponible");
        return;
    }
    
    // Calcular delay total
    totalDelay = Math.floor(shortestPath.reduce((acc, nodeId) => {
        const node = redAleatoria.find(n => n.id === nodeId);
        return acc + node.delay;
    }, 0));
    
    updateUI();
    drawNet(redAleatoria, shortestPath);
};


function updateUI() {
    nodeCountElement.textContent = redAleatoria ? redAleatoria.length : 0;
    totalTimeElement.textContent = Math.floor(totalDelay); // <- Aquí el cambio
    networkStatusElement.textContent = redAleatoria ? 'Red generada' : 'La red no está generada aún. Por favor genere la red.';
}

updateUI();