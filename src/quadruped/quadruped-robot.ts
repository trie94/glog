import * as THREE from 'three';
import { WebGPURenderer } from "three/webgpu";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import {RobotController} from "./robot-controller.ts";

export default class QuadrupedRobot {

    private timer: THREE.Timer = new THREE.Timer();
    private scene: THREE.Scene = new THREE.Scene();

    private camera: THREE.PerspectiveCamera = this.createCamera();
    private renderer: WebGPURenderer = new WebGPURenderer({
        antialias: true,
    });

    private directionalLight: THREE.DirectionalLight =
        new THREE.DirectionalLight( 0xfff9ea, 4 );

    private width: number = 1;
    private height: number = 1;

    private readonly container: HTMLElement;
    private resizeObserver = new ResizeObserver(() => {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        // ignore invalid dimension
        if (width == 0 || height == 0) {
            return;
        }
        console.log("container size changed. w: " + width + ", h: " + height);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    });

    // @ts-ignore
    private orbitControls: OrbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    private dragControls: DragControls = new DragControls([], this.camera, this.renderer.domElement);

    private robotController: RobotController = new RobotController();

    constructor(container: HTMLElement) {
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        this.container = container;
        container.appendChild(this.renderer.domElement);
        this.resizeObserver.observe(this.container);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        // this.renderer.shadowMap.enabled = true
        // this.renderer.toneMapping = THREE.NeutralToneMapping;
        this.scene.add(this.directionalLight);

        this.renderer.init().then(renderer => {
            this.start();
            renderer.setAnimationLoop(() => this.update());
        });

        this.dragControls.addEventListener('dragstart', () => { this.orbitControls.enabled = false; });
        this.dragControls.addEventListener('dragend', () => {
            this.orbitControls.enabled = true;
        });
        this.directionalLight.position.set( 2, 5, 2 );
    }

    start() {
        this.scene.add(this.robotController.setup());
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        if (!this.renderer.initialized) {
            console.log("web gpu renderer hasn't been initialized");
            return;
        }
        this.timer.update();
        this.renderer.render(this.scene, this.camera);
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
