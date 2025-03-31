import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

class World {
  constructor() {
    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupLights();
    this.setupControls();
    this.setupSkybox();
    this.setupGround();
    this.setupClock();
    this.loadModel();
    this.animate();
  }

  setupRenderer() {
    this.webgl = new THREE.WebGLRenderer({ antialias: true });
    this.webgl.outputEncoding = THREE.sRGBEncoding;
    this.webgl.shadowMap.enabled = true;
    this.webgl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.webgl.setPixelRatio(window.devicePixelRatio);
    this.webgl.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.webgl.domElement);
    window.addEventListener("resize", () => this.onWindowResize(), false);
  }

  setupCamera() {
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.01;
    const far = 100.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(0, 1, 2);
  }

  setupScene() {
    this.scene = new THREE.Scene();
  }

  setupLights() {
    let directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(2, 3, 2);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapsize = new THREE.Vector2(2048, 2048);
    directionalLight.shadow.camera.near = 0.01;
    directionalLight.shadow.camera.far = 10.0;
    const shadowSize = 1.5;
    directionalLight.shadow.camera.left = shadowSize;
    directionalLight.shadow.camera.right = -shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    this.scene.add(directionalLight);

    const helper = new THREE.DirectionalLightHelper(directionalLight, 1);
    this.scene.add(helper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
  }

  setupControls() {
    this.orbitControls = new OrbitControls(this.camera, this.webgl.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.target.set(0, 1, 0);
    this.orbitControls.update();
  }

  setupSkybox() {
    if (!this.cubeTextureLoader) {
      this.cubeTextureLoader = new THREE.CubeTextureLoader();
    }
    const envTexture = this.cubeTextureLoader.load([
      "./resources/textures/env/posx.jpg",
      "./resources/textures/env/negx.jpg",
      "./resources/textures/env/posy.jpg",

      "./resources/textures/env/negy.jpg",
      "./resources/textures/env/posz.jpg",
      "./resources/textures/env/negz.jpg",
    ]);
    this.scene.background = envTexture;
  }

  setupGround() {
    const planeGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.0,
      metalness: 0.0,
      envMap: this.scene.background,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  setupClock() {
    this.clock = new THREE.Clock();
    this.lastElapsedTime = 0;
  }

  loadModel() {
    const DiffuseTexture = new THREE.TextureLoader().load(
      "./resources/textures/Avatar_Diffuse.jpg",
      (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.needsUpdate = true;
        texture.flipY = false;
      }
    );

    const NormalTexture = new THREE.TextureLoader().load(
      "./resources/textures/Avatar_Normal.jpg",
      (texture) => {
        texture.needsUpdate = true;
        texture.flipY = false;
      }
    );

    // Draco loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("./decoder/");

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load(
      "./resources/models/Avatar.glb",
      (gltf) => {
        const model = gltf.scene;

        // Cast shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.material.map = DiffuseTexture;
            child.material.normalMap = NormalTexture;
            child.material.envMap = this.scene.background;
            child.material.needsUpdate = true;
          }
        });

        // Add the model to the scene
        this.scene.add(gltf.scene);

        // Add Animations
        this.animations = gltf.animations;
        this.mixer = new THREE.AnimationMixer(model);
        this.mixer.clipAction(this.animations[3]).play();
      },
      (xhr) => {
        // Use a more robust logging system or progress indicator for production
        console.log((xhr.loaded / xhr.total) * 100);
      },
      (error) => {
        console.error("An error occurred while loading the model:", error);

        this.displayErrorMessage("Failed to load the 3D model. Please try again later.");
        // TODO: Implement fallback mechanism (e.g., load a simpler model or display a placeholder)
      }
    );
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.webgl.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    this.webgl.render(this.scene, this.camera);
    this.orbitControls.update();

    const elapsedTime = this.clock.getElapsedTime();
    const deltaTime = elapsedTime - this.lastElapsedTime;
    this.lastElapsedTime = elapsedTime;

    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    requestAnimationFrame(() => this.animate());
  }

  startAnimationLoop() {
    this.animate();
  }
}


let APP = null;

window.addEventListener("DOMContentLoaded", () => {
  APP = new World();
  APP.startAnimationLoop();
  console.log(APP);
});
