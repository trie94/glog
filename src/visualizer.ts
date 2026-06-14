import * as THREE from 'three';
import { WebGPURenderer } from "three/webgpu";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

// TODO: make this class either generic or specific
export default class Visualizer {
    protected timer: THREE.Timer = new THREE.Timer();
    protected scene: THREE.Scene = new THREE.Scene();

    protected camera: THREE.PerspectiveCamera = this.createCamera();
    protected renderer: WebGPURenderer = new WebGPURenderer({
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
        console.log("container size changed. w: " + width + ", h: " + height);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    });

    protected baseJoint: THREE.Mesh = new THREE.Mesh();
    protected midJoint: THREE.Mesh = new THREE.Mesh();
    protected wristJoint: THREE.Mesh = new THREE.Mesh();

    protected baseBone: THREE.Mesh = new THREE.Mesh();
    protected midBone: THREE.Mesh = new THREE.Mesh();
    protected endEffector: THREE.Mesh = new THREE.Mesh();

    protected target: THREE.Mesh = new THREE.Mesh();

    // @ts-ignore
    private orbitControls: OrbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    private dragControls: DragControls = new DragControls([], this.camera, this.renderer.domElement);

    protected jointToEndEffector = new THREE.Vector3();
    protected jointToTarget = new THREE.Vector3();
    protected jointWorldQuat = new THREE.Quaternion();

    protected joints: THREE.Mesh[] = [];

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

        // this.container.addEventListener('pointerdown', (e: PointerEvent) => { this.onPointerDown(e); });
    }

    setupArm() {
        const LEN = 1;
        const SIDE = 0.5;

        const boneGeo = new THREE.BoxGeometry(SIDE, LEN, SIDE);
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xfcba03 });
        this.baseBone = new THREE.Mesh(boneGeo, boneMat);
        this.baseBone.name = "base bone";
        this.midBone = new THREE.Mesh(boneGeo, boneMat);
        this.midBone.name = "mid bone";

        const endEffectorGeo = new THREE.BoxGeometry(SIDE, SIDE, SIDE);
        this.endEffector = new THREE.Mesh(endEffectorGeo, boneMat);
        this.endEffector.name = "end effector";

        const jointGeo = new THREE.SphereGeometry(SIDE * 0.5);
        const jointMat = new THREE.MeshStandardMaterial({ color: 0x8132a8 });

        this.baseJoint = new THREE.Mesh(jointGeo, jointMat);
        this.baseJoint.name = "base joint";
        this.midJoint = new THREE.Mesh(jointGeo, jointMat);
        this.midJoint.name = "mid joint";
        this.wristJoint = new THREE.Mesh(jointGeo, jointMat);
        this.wristJoint.name = "wrist joint";

        // we are building the skeleton chain:
        // baseJoint -> baseBone -> midJoint -> midBone -> wristJoint -> endEffector
        this.baseJoint.add(this.baseBone);
        this.baseBone.add(this.midJoint);
        this.midJoint.add(this.midBone);
        this.midBone.add(this.wristJoint);
        this.wristJoint.add(this.endEffector);

        // then place them at (0, 0.5, 0) in their parents local space
        this.baseBone.position.set(0, LEN / 2, 0);
        this.midJoint.position.set(0, LEN / 2, 0);
        this.midBone.position.set(0, LEN / 2, 0);
        this.wristJoint.position.set(0, LEN / 2, 0);
        this.endEffector.position.set(0, SIDE / 2, 0);

        this.scene.add(this.baseJoint);

        this.baseJoint.position.set(0., -1, 0);

        // target
        const targetGeo = new THREE.BoxGeometry(SIDE, SIDE, SIDE);
        const targetMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.target = new THREE.Mesh(targetGeo, targetMat);

        // TODO: set a different location.
        this.target.position.set(-2.5, 1., 0.);

        this.dragControls.objects.push(this.target);
        this.scene.add(this.target);

        this.joints.push(this.wristJoint);
        this.joints.push(this.midJoint);
        this.joints.push(this.baseJoint);
    }

    // TODO think about encapsulation?
    start() {
        console.log("start");
        this.setupArm();
    }

    update() {
        if (!this.renderer.initialized) {
            console.log("web gpu renderer hasn't been initialized");
            return;
        }
        this.timer.update();
    }
    // onPointerDown(e: PointerEvent) {
    //     console.log("mouse clicked: " + e);
    // }

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