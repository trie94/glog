import * as THREE from 'three';
import {WebGPURenderer} from "three/webgpu";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// TODO: make this class either generic or specific
export default class Scene {
    private timer: THREE.Timer = new THREE.Timer();
    private scene: THREE.Scene = new THREE.Scene();
    private directionalLight: THREE.DirectionalLight =
        new THREE.DirectionalLight( 0xfff9ea, 4 );
    private camera: THREE.PerspectiveCamera = this.createCamera();
    private renderer: WebGPURenderer = new WebGPURenderer({
        antialias: true,
        stencil: true,
    });
    private width: number = 1;
    private height: number = 1;
    // @ts-ignore
    private controls: OrbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    private meshes: THREE.Mesh[] = [];
    private readonly container: HTMLElement;
    private resizeObserver = new ResizeObserver(() => {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        console.log("container size changed. w: " + width + ", h: " + height);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    });

    constructor(container: HTMLElement) {
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        this.container = container;
        container.appendChild(this.renderer.domElement);
        this.resizeObserver.observe(this.container);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true
        this.renderer.toneMapping = THREE.NeutralToneMapping;
        this.scene.add(this.directionalLight);

        this.renderer.init().then(renderer => {
            this.start();
            renderer.setAnimationLoop(() => this.update());
        });
    }



    start() {
        console.log("start");
        this.directionalLight.position.set( 2, 5, 2 );

        // test geometry
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0xfcba03 });
        const mesh = new THREE.Mesh(geo, mat);

        this.meshes.push(mesh);

        this.scene.add(mesh);
    }

    private update() {
        if (!this.renderer.initialized) {
            console.log("web gpu renderer hasn't been initialized");
            return;
        }
        this.timer.update();
        const delta = this.timer.getDelta();
        this.meshes.forEach(m => {
            m.rotation.x += delta;
            m.rotation.y += delta;
        });

        this.renderer.render(this.scene, this.camera);
    }

    onMouseClick(e: Event) {
        console.log("mouse clicked: " + e);
    }

    private createCamera() {
        const aspectRatio = this.width / this.height;
        const fieldOfView = 75;
        const nearPlane = 0.1;
        const farPlane = 10000;
        const camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);

        camera.position.set(0, 0, 3);
        camera.lookAt(new THREE.Vector3(0., 0., 0.));

        return camera;
    }
}