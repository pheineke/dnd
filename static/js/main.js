import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { MapControls } from 'three/addons/controls/OrbitControls.js'; 
import { DragControls } from 'three/addons/controls/DragControls.js';


import { io } from 'socket.io-client';
const socket = io('http://localhost:5000'); // Replace with your server URL if needed



const canvas = document.getElementById('canvas');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });

renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);


//Playerinfo
let playerinfo = {
    // {
    //     name: 'Player 1',
    //     color: 'blue',
    //     size: 1,
    //     x: 0,
    //     y: 0,
    // },    
}
const draggableObjects = [];

//// CONTROLS

// Enable orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true; // Allows zooming
controls.zoomSpeed = 1.2; // Adjust zoom sensitivity
controls.enableRotate = false; // Disables rotation
controls.enablePan = true; // Allows panning
controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,    // Left button pans
    MIDDLE: THREE.MOUSE.DOLLY, // Middle button zooms (dollies)
    RIGHT: THREE.MOUSE.PAN     // Right button also pans, if you prefer
  };

// // Replace OrbitControls with MapControls
// const controls = new MapControls(camera, renderer.domElement);

// // Optionally adjust settings if needed:
// controls.enableRotate = false; // This is already the default in MapControls
// controls.zoomSpeed = 1.2;


// Create DragControls for the draggable objects
const dragControls = new DragControls(draggableObjects, camera, renderer.domElement);

// When dragging starts, disable orbit controls (optional but often recommended)
dragControls.addEventListener('dragstart', function (event) {
    controls.enabled = false;
});

// When dragging ends, re-enable orbit controls
dragControls.addEventListener('dragend', function (event) {
    controls.enabled = true;
});

// Optional: listen for drag events
dragControls.addEventListener('drag', function (event) {
    // You can do things here as the object is being dragged
    // For example, update the player's position or log the position:
    console.log(event.object.position);
    console.log(getPlayerNameByCubeIndex(draggableObjects.indexOf(event.object)));

    socket.emit('move_figure', {
        name: getPlayerNameByCubeIndex(draggableObjects.indexOf(event.object)),
        x: event.object.position.x,
        y: event.object.position.z,
    });
});


// CONTROLS END


//////


function getPlayerNameByCubeIndex(cubeIndex) {
    return Object.keys(playerinfo).find(name => playerinfo[name]['cube_index'] === cubeIndex) || null;
}


function makeCube(player) {
    const geometry = new THREE.BoxGeometry(player.size, player.size, player.size);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(player.color) });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(player.x, 0, player.y);
    scene.add(cube);

    draggableObjects.push(cube)
    
    return draggableObjects.length - 1;

}

function updatePlayer(player) {
    console.log('Updating player:', player);

    console.log(
        !(player.name in playerinfo)
    )

    if (!(player.name in playerinfo) || typeof playerinfo[player.name] !== 'object') {
        playerinfo[player.name] = {}; // Ensure it's an object
    }

    var cube_index = makeCube(player);
    playerinfo[player.name]['cube_index'] = cube_index;

    // Merge player data into the existing object
    Object.assign(playerinfo[player.name], player);
}


function movePlayer(player) {
    var i = playerinfo[player.name].cube_index;

    draggableObjects[i].position.x = player.x;
    draggableObjects[i].position.z = player.y;
}

function updatePlayers(players) {
    for (const player of players) {
        updatePlayer(player);
    }
}

function removePlayer(player) {
    const playerIndex = playerinfo.findIndex(p => p.name === player.name);
    playerinfo.splice(playerIndex, 1);
    // Remove cube from scene
    scene.remove(scene.children[playerIndex]);
}



// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

const textureLoader = new THREE.TextureLoader();
textureLoader.load('/static/imgs/bg_7.png', function (texture) {
    const image = texture.image;
    const aspectRatio = image.width / image.height;

    // Set plane dimensions to match image
    const geometry = new THREE.PlaneGeometry(image.width / 70, image.height / 70);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Rotate the plane to lie flat
    plane.rotation.x = -Math.PI / 2;

    // Adjust camera to fit image
    camera.position.set(0, Math.max(image.width, image.height) / 250, 0);
    camera.lookAt(0, 0, 0);
});

const animate = function () {
    requestAnimationFrame(animate);
    controls.update(); // Update orbit controls
    renderer.render(scene, camera);
};

animate();


// Listen for messages from the server
socket.on('update_player', (data) => {
    console.log(data);
    updatePlayer(data);
});

socket.on('moved_figure', (data) => {
    console.log('Moved FIGURE');
    movePlayer(data);
});

//get add_figure form

const addFigureForm = document.getElementById('add_figure_form');

addFigureForm.onsubmit = (e) => {
    e.preventDefault();
    let name = document.getElementById('name').value;
    let size = document.getElementById('size').value;
    let color = document.getElementById('color').value;

    // Emit message to server
    socket.emit('add_figure', { name, color, size });
}

setInterval(
    () => {
        console.log(playerinfo)
    }, 2000
)