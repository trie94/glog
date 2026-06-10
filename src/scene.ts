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
    });
    private width: number = 1;
    private height: number = 1;
    // @ts-ignore
    private controls: OrbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    private readonly container: HTMLElement;
    private resizeObserver = new ResizeObserver(() => {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        console.log("container size changed. w: " + width + ", h: " + height);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    });

    private baseJoint: THREE.Mesh = new THREE.Mesh();
    private midJoint: THREE.Mesh = new THREE.Mesh();
    private wristJoint: THREE.Mesh = new THREE.Mesh();

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

        container.addEventListener("click", this.onMouseClick);
    }

    // TODO think about encapsulation?
    start() {
        console.log("start");
        this.directionalLight.position.set( 2, 5, 2 );

        const LEN = 1;
        const SIDE = 0.5;

        const boneGeo = new THREE.BoxGeometry(SIDE, LEN, SIDE);
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xfcba03 });
        const baseBone = new THREE.Mesh(boneGeo, boneMat);
        const midBone = new THREE.Mesh(boneGeo, boneMat);

        const endEffectorGeo = new THREE.BoxGeometry(SIDE, SIDE, SIDE);
        const endEffector = new THREE.Mesh(endEffectorGeo, boneMat);

        const jointGeo = new THREE.SphereGeometry(SIDE * 0.5);
        const jointMat = new THREE.MeshStandardMaterial({ color: 0x8132a8 });

        const baseJoint = new THREE.Mesh(jointGeo, jointMat);
        const midJoint = new THREE.Mesh(jointGeo, jointMat);
        const wristJoint = new THREE.Mesh(jointGeo, jointMat);

        // we are building the skeleton chain:
        // baseJoint -> baseBone -> midJoint -> midBone -> wristJoint -> endEffector
        baseJoint.add(baseBone);
        baseBone.add(midJoint);
        midJoint.add(midBone);
        midBone.add(wristJoint);
        wristJoint.add(endEffector);

        // then place them at (0, 0.5, 0) in their parents local space
        baseBone.position.set(0, LEN / 2, 0);
        midJoint.position.set(0, LEN / 2, 0);
        midBone.position.set(0, LEN / 2, 0);
        wristJoint.position.set(0, LEN / 2, 0);
        endEffector.position.set(0, SIDE / 2, 0);

        this.scene.add(baseJoint);

        baseJoint.position.set(0., -1, 0);

        this.baseJoint = baseJoint;
        this.midJoint = midJoint;
        this.wristJoint = wristJoint;
    }

    private update() {
        if (!this.renderer.initialized) {
            console.log("web gpu renderer hasn't been initialized");
            return;
        }
        this.timer.update();

        this.baseJoint.rotation.z += Math.cos(this.timer.getElapsed()) * 0.005;
        this.midJoint.rotation.x += Math.cos(this.timer.getElapsed() * 0.1) * 0.001;
        this.wristJoint.rotation.z += Math.cos(this.timer.getElapsed() * 1.2) * 0.005;

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