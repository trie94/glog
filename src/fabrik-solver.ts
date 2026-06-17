import Visualizer from "./visualizer.ts";
import * as THREE from "three";

export default class FabrikSolver extends Visualizer {

    private readonly LEN = 1;
    private readonly SIDE = 0.5;

    private currJointIndex = 0;

    start() {
        this.container.addEventListener('pointerdown', (e: PointerEvent) => { this.onPointerDown(e); });

        super.setupArm(this.LEN, this.SIDE);
        this.target.position.set(-1, 1., 0.);

        this.renderer.render(this.scene, this.camera);
    }

    onPointerDown(e: PointerEvent) {
        console.log("mouse clicked: " + e);

        let baseWorldPos = new THREE.Vector3();
        this.baseJoint.getWorldPosition(baseWorldPos);

        const baseToTargetDist = baseWorldPos.distanceTo(this.target.position);
        if (this.joints.length * this.LEN < baseToTargetDist) {
            // can't reach... change to break once we implement the for loop
            console.log("give up");
            return;
        }


        const currJoint = this.joints[this.currJointIndex];
        let currJointWorldPos = new THREE.Vector3();
        currJoint.getWorldPosition(currJointWorldPos);

        // FIXME
        const targetPos = this.target;
        let targetPosWorldPos = new THREE.Vector3();
        targetPos.getWorldPosition(targetPosWorldPos);

        // move the currJoint to the
        if (currJoint.parent) {
            const inverseParentMatrix = new THREE.Matrix4();
            inverseParentMatrix.copy(currJoint.parent.matrixWorld).invert();
            targetPosWorldPos.applyMatrix4(inverseParentMatrix);

            currJoint.position.copy(targetPosWorldPos);
        } else {
            currJoint.position.copy(targetPosWorldPos);
        }

        // if (this.currJointIndex < this.joints.length - 1) {
        //     const nextJoint = this.joints[this.currJointIndex + 1];
        //     let nextJointWorldPos = new THREE.Vector3();
        //     nextJoint.getWorldPosition(nextJointWorldPos);
        //
        //     // at this point curr joint moved to the new position.
        // }

        // this.currJointIndex++;
    }

    update() {
        super.update();
        this.renderer.render(this.scene, this.camera);
    }
}
