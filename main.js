import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'


class World {
  constructor() {
    this.init();
  }

  init() {
    this.webgl = new THREE.WebGLRenderer({ antialias: true });
    this.webgl.outputEncoding = THREE.sRGBEncoding;
    this.webgl.shadowMap.enabled = true;
    this.webgl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.webgl.setPixelRatio(window.devicePixelRatio);
    this.webgl.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.webgl.domElement);

    //Add the resize event listener
    window.addEventListener('resize', () => {
      this.onWindowResize();
    }, false);

    //Set the camera
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.01;
    const far = 100.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(0, 1, 2);

    // Create the scene
    this.scene = new THREE.Scene();

    // Add a directional light
    let DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    DirectionalLight.position.set(2, 3, 2);
    DirectionalLight.target.position.set(0, 0, 0);
    DirectionalLight.castShadow = true;
    DirectionalLight.shadow.mapsize = new THREE.Vector2(2048, 2048);
    DirectionalLight.shadow.camera.near = 0.01;
    DirectionalLight.shadow.camera.far = 10.0;
    const shadowSize = 1.5;
    DirectionalLight.shadow.camera.left = shadowSize;
    DirectionalLight.shadow.camera.right = -shadowSize;
    DirectionalLight.shadow.camera.top = shadowSize;
    DirectionalLight.shadow.camera.bottom = -shadowSize;

    this.scene.add(DirectionalLight);

    // Add Light helper
    const helper = new THREE.DirectionalLightHelper(DirectionalLight, 1);
    this.scene.add(helper);

    // Add an ambient light    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add the OrbitControls
    this.orbitControls = new OrbitControls(this.camera, this.webgl.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.target.set(0, 1, 0);
    this.orbitControls.update();

    // Add the Skybox Texture
    const loader = new THREE.CubeTextureLoader();
    const envTexture = loader.load([
      './resources/textures/env/posx.jpg',
      './resources/textures/env/negx.jpg',
      './resources/textures/env/posy.jpg',
      './resources/textures/env/negy.jpg',
      './resources/textures/env/posz.jpg',
      './resources/textures/env/negz.jpg'
    ]);
    this.scene.background = envTexture;

    // Add ground plane
    const planeGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.0,
      metalness: 0.0,
      envMap: envTexture,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);


    this.clock = new THREE.Clock()
    this.lastElapsedTime = 0

    this.loadModel();
    this.animate();
  }

  loadModel() {

    const DiffuseTexture = new THREE.TextureLoader()
      .load('./resources/textures/Avatar_Diffuse.jpg', (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.needsUpdate = true;
        texture.flipY = false;
      });

    const NormalTexture = new THREE.TextureLoader()
      .load('./resources/textures/Avatar_Normal.jpg', (texture) => {
        texture.needsUpdate = true;
        texture.flipY = false;
      });

    // Draco loader
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('./decoder/')

    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)
    gltfLoader.load('./resources/models/Avatar.glb', (gltf) => {

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
      this.mixer.clipAction(this.animations[3]).play()
    },
      (xhr) => {
        console.log(/* (xhr.loaded / xhr.total * 100) + '% loaded' */);
      },
      (error) => {
        console.log(error);
      })
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.webgl.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => {
      this.webgl.render(this.scene, this.camera);
      this.orbitControls.update();

      const elapsedTime = this.clock.getElapsedTime()
      const deltaTime = elapsedTime - this.lastElapsedTime
      this.lastElapsedTime = elapsedTime

      if (this.mixer) {
        this.mixer.update(deltaTime);
      }
      this.animate();
    })
  }
}


let APP = null;

window.addEventListener('DOMContentLoaded', () => {
  APP = new World();
  console.log(APP);
});