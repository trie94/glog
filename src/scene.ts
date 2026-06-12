import * as THREE from 'three';
import {WebGPURenderer} from "three/webgpu";
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';

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

    private baseBone: THREE.Mesh = new THREE.Mesh();
    private midBone: THREE.Mesh = new THREE.Mesh();
    private endEffector: THREE.Mesh = new THREE.Mesh();

    private target: THREE.Mesh = new THREE.Mesh();
    // private pointer: THREE.Vector2 = new THREE.Vector2();
    // private raycaster: THREE.Raycaster = new THREE.Raycaster();

    // @ts-ignore
    private orbitControls: OrbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    private dragControls: DragControls = new DragControls([], this.camera, this.renderer.domElement);

    // debug
    private arrowHelper1: THREE.ArrowHelper = new THREE.ArrowHelper();
    private arrowHelper2: THREE.ArrowHelper = new THREE.ArrowHelper();

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
        this.dragControls.addEventListener('dragend', () => { this.orbitControls.enabled = true; });
    }

    // TODO think about encapsulation?
    start() {
        console.log("start");
        this.directionalLight.position.set( 2, 5, 2 );

        const LEN = 1;
        const SIDE = 0.5;

        const boneGeo = new THREE.BoxGeometry(SIDE, LEN, SIDE);
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xfcba03 });
        this.baseBone = new THREE.Mesh(boneGeo, boneMat);
        this.midBone = new THREE.Mesh(boneGeo, boneMat);

        const endEffectorGeo = new THREE.BoxGeometry(SIDE, SIDE, SIDE);
        this.endEffector = new THREE.Mesh(endEffectorGeo, boneMat);

        const jointGeo = new THREE.SphereGeometry(SIDE * 0.5);
        const jointMat = new THREE.MeshStandardMaterial({ color: 0x8132a8 });

        this.baseJoint = new THREE.Mesh(jointGeo, jointMat);
        this.midJoint = new THREE.Mesh(jointGeo, jointMat);
        this.wristJoint = new THREE.Mesh(jointGeo, jointMat);

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
        this.target.position.set(-2., 1., 0.);

        this.dragControls.objects.push(this.target);
        this.scene.add(this.target);

        // TODO: move this to ccd solver class
        const endEffectorWorldPos = new THREE.Vector3();
        this.endEffector.getWorldPosition(endEffectorWorldPos);
        console.log("end effector local pos: " + JSON.stringify(this.endEffector.position));
        console.log("end effector world pos: " + JSON.stringify(endEffectorWorldPos));
        const wristJointWorldPos = new THREE.Vector3();
        this.wristJoint.getWorldPosition(wristJointWorldPos);
        console.log("wrist joint local pos: " + JSON.stringify(this.wristJoint.position));
        console.log("wrist joint world pos: " + JSON.stringify(wristJointWorldPos));

        const jointToEndEffector =
            new THREE.Vector3().subVectors(endEffectorWorldPos, wristJointWorldPos);
        const jointToTarget =
            new THREE.Vector3().subVectors(this.target.position, wristJointWorldPos);

        this.arrowHelper1 = new THREE.ArrowHelper(
            jointToEndEffector.clone().normalize(), wristJointWorldPos, jointToEndEffector.length() < 1 ? 1: jointToEndEffector.length());
        this.arrowHelper2 = new THREE.ArrowHelper(
            jointToTarget.clone().normalize(), wristJointWorldPos, jointToTarget.length() < 1 ? 1 : jointToTarget.length());
        this.scene.add(this.arrowHelper1);
        this.scene.add(this.arrowHelper2);
    }

    private update() {
        if (!this.renderer.initialized) {
            console.log("web gpu renderer hasn't been initialized");
            return;
        }
        this.timer.update();

        // this.baseJoint.rotation.z += Math.cos(this.timer.getElapsed()) * 0.005;
        // this.midJoint.rotation.x += Math.cos(this.timer.getElapsed() * 0.1) * 0.001;
        // this.wristJoint.rotation.z += Math.cos(this.timer.getElapsed() * 1.2) * 0.005;

        // // TODO: move this to ccd solver class
        // const jointToEndEffector =
        //     new THREE.Vector3().subVectors(this.endEffector.position, this.wristJoint.position);
        // const jointToTarget =
        //     new THREE.Vector3().subVectors(this.target.position, this.wristJoint.position);
        //
        // const hexColor = 0xff0000; // Red
        // const arrowHelper1 = new THREE.ArrowHelper(jointToEndEffector, this.wristJoint.position, jointToEndEffector.length(), hexColor);
        // const arrowHelper2 = new THREE.ArrowHelper(jointToTarget, this.wristJoint.position, jointToTarget.length(), hexColor);
        // this.scene.add(arrowHelper1);
        // this.scene.add(arrowHelper2);

        const endEffectorWorldPos = new THREE.Vector3();
        this.endEffector.getWorldPosition(endEffectorWorldPos);
        const wristJointWorldPos = new THREE.Vector3();
        this.wristJoint.getWorldPosition(wristJointWorldPos);

        const jointToEndEffector =
            new THREE.Vector3().subVectors(endEffectorWorldPos, wristJointWorldPos);
        const jointToTarget =
            new THREE.Vector3().subVectors(this.target.position, wristJointWorldPos);

        this.arrowHelper1.setLength(jointToEndEffector.length() < 1 ? 1 : jointToEndEffector.length());
        this.arrowHelper1.setDirection(jointToEndEffector.clone().normalize());
        this.arrowHelper2.setLength(jointToTarget.length() < 1 ? 1: jointToTarget.length());
        this.arrowHelper2.setDirection(jointToTarget.clone().normalize());

        this.renderer.render(this.scene, this.camera);
    }

    // onPointerDown(e: PointerEvent) {
    //     // console.log("mouse clicked: " + e.clientY);
    //     const bound = this.container.getBoundingClientRect();
    //
    //     this.pointer.x = ((e.clientX - bound.left) / bound.width) * 2 - 1;
    //     this.pointer.y = -((e.clientY - bound.top) / bound.height) * 2 + 1;
    //
    //     console.log("x: " + this.pointer.x + ", y: " + this.pointer.y);
    //
    //     this.raycaster.setFromCamera(this.pointer, this.camera);
    //     const intersects = this.raycaster.intersectObject(this.target);
    //
    //     if (intersects.length > 0) {
    //         const hit = intersects[0].point;
    //         console.log("hit! " + JSON.stringify(hit));
    //         this.target.position.set(hit.x, hit.y, hit.z);
    //     }
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