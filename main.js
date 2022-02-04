import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class World {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    //Add the resize event listener
    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);
    
    //Set the camera
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.01;
    const far = 100.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(0, 1, 2);

    // Create the scene
    this._scene = new THREE.Scene();
    
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

    this._scene.add(DirectionalLight);

    // Add Light helper
    const helper = new THREE.DirectionalLightHelper(DirectionalLight, 1);
    this._scene.add(helper);
  
    // Add an ambient light    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this._scene.add(ambientLight);

    // Add the OrbitControls
    const controls = new OrbitControls(this._camera, this._threejs.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);
    controls.update();

    // Add the Skybox Texture
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './resources/textures/env/posx.jpg',
      './resources/textures/env/negx.jpg',
      './resources/textures/env/posy.jpg',
      './resources/textures/env/negy.jpg',
      './resources/textures/env/posz.jpg',
      './resources/textures/env/negz.jpg'      
    ]);
    this._scene.background = texture;

    // Add ground plane
    const planeGeometry = new THREE.PlaneGeometry(100 , 100, 1, 1);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 1.0,
      metalness: 0.0,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this._scene.add(plane);

    this._LoadModel();
    this._RAF();
  }

  _LoadModel() {
    
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

    const loader = new GLTFLoader();
    loader.load('./resources/models/Avatar.glb', (gltf) => {
      
      const model = gltf.scene;

      // Cast shadows
      model.traverse((child) => {
        if (child.isMesh) {
        
          child.castShadow = true;
          child.material.map = DiffuseTexture;
          child.material.normalMap = NormalTexture;
          child.material.envMap = this._scene.background;
          child.material.needsUpdate = true;
        }
      });

      // Add the model to the scene
      this._scene.add(gltf.scene);
    });
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame(() => {
      this._threejs.render(this._scene, this._camera);
      this._RAF();
    })
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new World();
});