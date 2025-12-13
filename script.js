/**
 * 3D Photo Christmas Tree - Main Script
 * 
 * This script handles the 3D scene creation using Three.js.
 * It creates a Christmas tree structure decorated with photos, lights, and ornaments.
 * It also implements post-processing effects (Bloom) and gesture control using MediaPipe.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Configuration
const CONFIG = {
    treeHeight: 20,
    treeRadius: 8,
    spiralTurns: 6,
    particleCount: 1000, // Snow
    photoSize: 1.5
};

// Global variables
let scene, camera, renderer, composer, controls;
let photos = [];
let gestureRotationSpeed = 0.001; // Default auto-rotation
let isHandDetected = false;

init();
// initGestures(); // Moved to button click
setupUI();
animate();

/**
 * Initializes the 3D scene, camera, renderer, and objects.
 */
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.02);

    // Camera setup
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 25);
    camera.lookAt(0, 10, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2; // Don't go below ground
    controls.target.set(0, 10, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffaa00, 2, 50);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    // Create Tree
    createTrunk(); // Add Trunk
    createPhotoTree();
    createOrnaments(); // Add Ornaments
    createLights(); // Add Lights

    // Create Star
    createStar();

    // Create Snow
    createSnow();

    // Create Floor
    createFloor();

    // Post-processing (Bloom)
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 0.8;
    bloomPass.radius = 0.5;

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Event listeners
    window.addEventListener('resize', onWindowResize);
}

/**
 * Creates the main tree structure using photos as textures.
 * Photos are arranged in a spiral pattern on a cone shape.
 */
function createPhotoTree() {
    // Check if imageList exists (from images.js)
    const images = (typeof window.imageList !== 'undefined' && window.imageList.length > 0) 
        ? window.imageList 
        : []; // Empty array if no images

    // If no images, we can use colored placeholders or just a message
    const usePlaceholders = images.length === 0;
    const totalPhotos = usePlaceholders ? 50 : images.length;
    
    // We want to distribute photos along a spiral on a cone
    // If we have few photos, we might want to repeat them or just show few.
    // Let's aim for a nice density. If we have many photos, great.
    // If we have few, we can repeat them to fill the tree.
    
    const count = Math.max(totalPhotos, 40); // Minimum 40 items for a good tree shape
    
    const textureLoader = new THREE.TextureLoader();
    const geometry = new THREE.PlaneGeometry(CONFIG.photoSize, CONFIG.photoSize);

    for (let i = 0; i < count; i++) {
        const t = i / count; // 0 to 1
        const angle = t * CONFIG.spiralTurns * Math.PI * 2;
        const y = (1 - t) * CONFIG.treeHeight; // Bottom is 0, Top is treeHeight
        const radius = t * CONFIG.treeRadius; // Top is 0 radius (pointy), Bottom is wide? 
        // Wait, tree is wide at bottom (y=0) and pointy at top (y=height).
        // So at y=0, radius should be max. At y=height, radius should be 0.
        
        const currentRadius = (y / CONFIG.treeHeight) * CONFIG.treeRadius; 
        // Wait, if y=0, radius=0? No.
        // Let's flip y.
        // i=0 -> t=0 -> y=treeHeight (top) -> radius should be small
        // i=count -> t=1 -> y=0 (bottom) -> radius should be large
        
        // Let's recalculate
        // We want spiral from bottom to top? Or top to bottom?
        // Let's go bottom up.
        const h = i / count * CONFIG.treeHeight; // 0 to height
        const r = (1 - i / count) * CONFIG.treeRadius; // Max radius to 0
        const a = i * 0.5; // Angle increment
        
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;

        // Material
        let material;
        if (usePlaceholders) {
            material = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
                side: THREE.DoubleSide
            });
        } else {
            const imgPath = images[i % images.length];
            const texture = textureLoader.load(imgPath);
            texture.colorSpace = THREE.SRGBColorSpace;
            material = new THREE.MeshBasicMaterial({ 
                map: texture,
                side: THREE.DoubleSide
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, h + 2, z); // Lift up slightly
        mesh.lookAt(0, h + 2, 0); // Look at center
        // mesh.rotation.y += Math.PI; // Flip if needed
        
        // Add some random rotation for natural look
        mesh.rotation.z = (Math.random() - 0.5) * 0.2;
        mesh.rotation.x += (Math.random() - 0.5) * 0.2;

        scene.add(mesh);
        photos.push(mesh);
    }
}

/**
 * Creates a shining star at the top of the tree.
 */
function createStar() {
    const geometry = new THREE.OctahedronGeometry(1, 0);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const star = new THREE.Mesh(geometry, material);
    star.position.set(0, CONFIG.treeHeight + 2.5, 0);
    scene.add(star);
    
    // Add a point light at the star
    const light = new THREE.PointLight(0xffff00, 2, 20);
    light.position.copy(star.position);
    scene.add(light);
}

/**
 * Creates a particle system to simulate falling snow.
 */
function createSnow() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < CONFIG.particleCount; i++) {
        const x = Math.random() * 40 - 20;
        const y = Math.random() * 30;
        const z = Math.random() * 40 - 20;
        vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.8
    });

    const snow = new THREE.Points(geometry, material);
    scene.add(snow);
    
    // Animate snow in the loop
    snow.userData = { velocity: [] };
    for(let i=0; i<CONFIG.particleCount; i++) {
        snow.userData.velocity.push(Math.random() * 0.05 + 0.02);
    }
    
    scene.userData.snow = snow;
}

/**
 * Creates the floor/ground of the scene.
 */
function createFloor() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x111111,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
}

/**
 * Creates the tree trunk cylinder.
 */
function createTrunk() {
    const geometry = new THREE.CylinderGeometry(2, 3, 4, 8);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x4a2e19,
        roughness: 0.9,
    });
    const trunk = new THREE.Mesh(geometry, material);
    trunk.position.set(0, 2, 0);
    scene.add(trunk);
}

/**
 * Adds spherical ornaments to the tree.
 */
function createOrnaments() {
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    const colors = [0xff0000, 0xffd700, 0xc0c0c0, 0x00ff00]; // Red, Gold, Silver, Green
    
    const count = 60;
    for (let i = 0; i < count; i++) {
        const material = new THREE.MeshStandardMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            metalness: 0.9,
            roughness: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Random position within the cone volume
        const h = Math.random() * CONFIG.treeHeight;
        const r = (1 - h / CONFIG.treeHeight) * CONFIG.treeRadius * 0.8; // Slightly inside
        const angle = Math.random() * Math.PI * 2;
        
        mesh.position.set(
            Math.cos(angle) * r,
            h + 2,
            Math.sin(angle) * r
        );
        
        scene.add(mesh);
    }
}

/**
 * Adds blinking lights spiraling around the tree.
 */
function createLights() {
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const lights = [];
    const colors = [0xff0000, 0xffff00, 0x0000ff, 0x00ff00];
    
    const turns = CONFIG.spiralTurns * 1.5;
    const count = 150;
    
    for (let i = 0; i < count; i++) {
        const t = i / count;
        const h = t * CONFIG.treeHeight;
        const r = (1 - t) * (CONFIG.treeRadius + 0.5); // Slightly outside
        const angle = t * turns * Math.PI * 2 + Math.PI; // Offset from photos
        
        const material = new THREE.MeshBasicMaterial({
            color: colors[i % colors.length]
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            Math.cos(angle) * r,
            h + 2,
            Math.sin(angle) * r
        );
        
        // Store original color for blinking
        mesh.userData = { 
            originalColor: material.color.clone(),
            offset: Math.random() * 100
        };
        
        scene.add(mesh);
        lights.push(mesh);
    }
    scene.userData.lights = lights;
}

/**
 * Handles window resize events to update camera aspect ratio and renderer size.
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Main animation loop.
 * Updates controls, animations (snow, lights, rotation), and renders the scene.
 */
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Animate Snow
    const snow = scene.userData.snow;
    if (snow) {
        const positions = snow.geometry.attributes.position.array;
        for (let i = 0; i < CONFIG.particleCount; i++) {
            positions[i * 3 + 1] -= snow.userData.velocity[i]; // y position
            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 30; // Reset to top
            }
        }
        snow.geometry.attributes.position.needsUpdate = true;
    }

    // Rotate tree slightly
    if (!controls.enableRotate) { // If not manually rotating
         // Do nothing, handled by controls
    }
    // Auto rotation or Gesture rotation
    scene.rotation.y += gestureRotationSpeed;

    // Animate Lights
    if (scene.userData.lights) {
        const time = Date.now() * 0.002;
        scene.userData.lights.forEach(light => {
            const blink = Math.sin(time + light.userData.offset);
            if (blink > 0) {
                light.material.color.copy(light.userData.originalColor);
            } else {
                light.material.color.setHex(0x222222); // Dim
            }
        });
    }

    composer.render();
}

/**
 * Initializes MediaPipe Hands for gesture control.
 * Sets up the camera and hand tracking.
 */
function initGestures() {
    const videoElement = document.getElementById('webcam');
    const statusElement = document.getElementById('gesture-status');

    function onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            isHandDetected = true;
            statusElement.innerText = "检测到手势";
            statusElement.style.color = "#0f0";
            
            const landmarks = results.multiHandLandmarks[0];
            
            // Use Index Finger Tip (8) x-coordinate to control rotation
            // Landmarks are normalized [0, 1]
            const x = landmarks[8].x; 
            
            // Map x (0 to 1) to rotation speed (-0.05 to 0.05)
            // 0.5 is center (stop)
            // < 0.5 rotate left
            // > 0.5 rotate right
            
            // Invert x because webcam is mirrored usually, but we CSS mirrored it.
            // Let's assume 0 is left, 1 is right.
            
            const speed = (x - 0.5) * 0.1; 
            gestureRotationSpeed = speed;
            
            // Check for "Fist" (Stop)
            // Simple check: if finger tips are close to wrist or palm center
            // Let's just check if Index Finger Tip (8) is below Index Finger PIP (6) -> Folded?
            // Better: Check distance between Thumb Tip (4) and Index Tip (8) -> Pinch
            
            // Let's keep it simple: X position controls speed.
            
        } else {
            isHandDetected = false;
            statusElement.innerText = "未检测到手势";
            statusElement.style.color = "#f00";
            gestureRotationSpeed = 0.002; // Default slow rotation
        }
    }

    const hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults(onResults);

    // Use native getUserMedia for better compatibility and error handling
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
            .then(function(stream) {
                videoElement.srcObject = stream;
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    statusElement.innerText = "模型加载中...";
                    
                    // Start processing loop
                    async function frameLoop() {
                        if (!videoElement.paused && !videoElement.ended) {
                            await hands.send({image: videoElement});
                            requestAnimationFrame(frameLoop);
                        }
                    }
                    frameLoop();
                };
            })
            .catch(function(err) {
                console.error("Camera Error:", err);
                let msg = "摄像头启动失败";
                if (err.name === 'NotAllowedError') msg = "请允许摄像头权限";
                if (err.name === 'NotFoundError') msg = "未找到摄像头";
                if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    msg = "需要HTTPS或Localhost";
                }
                statusElement.innerText = msg;
                statusElement.style.color = "#f00";
                
                // Show button again
                const startBtn = document.getElementById('start-camera');
                if (startBtn) startBtn.style.display = 'block';
            });
    } else {
        statusElement.innerText = "浏览器不支持摄像头";
        statusElement.style.color = "#f00";
    }
}

/**
 * Sets up the UI event listeners, specifically the camera start button.
 */
function setupUI() {
    const startBtn = document.getElementById('start-camera');
    const statusElement = document.getElementById('gesture-status');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startBtn.style.display = 'none';
            statusElement.innerText = "正在启动摄像头...";
            initGestures();
        });
    }
}
