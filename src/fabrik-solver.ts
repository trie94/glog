import Visualizer from "./visualizer.ts";
import * as THREE from "three";

export default class FabrikSolver extends Visualizer {

    private readonly LEN = 1;
    private readonly SIDE = 0.5;

    // fabrik is purely position based.
    private points: THREE.Mesh[] = [];

    private baseJointOriginalPos = new THREE.Vector3();
    private endEffectorTip = new THREE.Mesh();

    start() {
        super.setupArm(this.LEN, this.SIDE);

        // this is for keeping the base joint original position
        this.baseJointOriginalPos = this.baseJoint.position.clone();

        // this is for computing the end effector joint
        this.endEffectorTip.geometry = new THREE.SphereGeometry(this.SIDE * 0.5);
        this.endEffectorTip.name = "end effector tip";
        this.endEffectorTip.visible = false;
        this.endEffector.add(this.endEffectorTip);
        this.endEffectorTip.position.set(0, this.SIDE / 2, 0);

        this.points.push(this.endEffectorTip);
        this.points.push(this.wristJoint);
        this.points.push(this.midJoint);
        this.points.push(this.baseJoint);

        this.target.position.set(-1, 1., 0.);

        this.renderer.render(this.scene, this.camera);
    }

    update() {
        super.update();

        // 0. convert all the points in world space
        const currentWorldPositions: THREE.Vector3[] = [];
        this.points.forEach(p => {
            const pInWorld = new THREE.Vector3();
            p.getWorldPosition(pInWorld);
            currentWorldPositions.push(pInWorld);
        });

        // 1. backward pass, get the target positions
        let targetWorldPositions: THREE.Vector3[] = [];
        for (let i = 0; i < currentWorldPositions.length; i++) {
            if (i == 0) { // tip of the end effector
                targetWorldPositions.push(this.target.position.clone());
            } else {
                // the current joint pos in world, not yet updated.
                const currOldPos = currentWorldPositions[i];
                // the prev joint pos in world, that has already been updated.
                const prevNewPos = targetWorldPositions[i - 1];
                // get curr to next dir and find the new pos for the current joint.
                const dir = new THREE.Vector3().subVectors(currOldPos, prevNewPos).normalize();
                // check the length (wrist and end effector)
                const originalLen = i == 1 ? this.SIDE : this.LEN;
                const newPos = prevNewPos.clone().add(dir.multiplyScalar(originalLen));
                targetWorldPositions.push(newPos);
            }
        }

        // 2. forward pass, fix the target positions
        let finalWorldPositions: THREE.Vector3[] = new Array(targetWorldPositions.length);
        for (let i = targetWorldPositions.length - 1; i >= 0; i--) {
            if (i == targetWorldPositions.length - 1) { // base
                finalWorldPositions[i] = this.baseJointOriginalPos.clone();
            } else {
                const currOldTargetPos = targetWorldPositions[i];
                const prevNewTargetPos = finalWorldPositions[i + 1];
                // get curr to prev and find the new pos for the current joint.
                const dir = new THREE.Vector3().subVectors(currOldTargetPos, prevNewTargetPos).normalize();
                // check the length (wrist and end effector)
                const originalLen = i == 0 ? this.SIDE : this.LEN;
                finalWorldPositions[i] = prevNewTargetPos.clone().add(dir.multiplyScalar(originalLen));
            }
        }

        // 3. now that we know the target world positions, get the rotations, and apply the new rotations.
        // loop from the base to the end effector
        for (let i = finalWorldPositions.length - 1; i >= 1; i--) {
            const currTargetPos = finalWorldPositions[i];
            const nextTargetPos = finalWorldPositions[i-1];
            const newDir = new THREE.Vector3().subVectors(nextTargetPos, currTargetPos).normalize();

            const currOldPos = currentWorldPositions[i];
            const nextOldPos = currentWorldPositions[i-1];
            const oldDir = new THREE.Vector3().subVectors(nextOldPos, currOldPos).normalize();

            const deltaQuat = new THREE.Quaternion().setFromUnitVectors(
                oldDir, newDir
            );

            const currJointWorldQuat = new THREE.Quaternion();
            const currJoint = this.points[i];
            currJoint.getWorldQuaternion(currJointWorldQuat);

            // apply our current quaternion then new delta quaternion.
            let finalQuat = currJointWorldQuat.premultiply(deltaQuat);
            if (currJoint.parent) {
                const parentWorldQuat = new THREE.Quaternion();
                currJoint.parent.getWorldQuaternion(parentWorldQuat);
                // local quat of the curr joint = inverse of parent world rotation * new world quat
                finalQuat = parentWorldQuat.invert().multiply(finalQuat);
            }

            // alternative: manually calculate rotation mat
            // const m = new THREE.Matrix4();
            // const up = newDir;
            // const forward = new THREE.Vector3(0, 0, 1);
            // const right = new THREE.Vector3().crossVectors(up, forward).normalize();
            // forward.crossVectors(right, up).normalize();
            // m.makeBasis(right, up, forward);
            // const targetQuat = new THREE.Quaternion().setFromRotationMatrix(m);
            // let finalQuat = targetQuat.clone();
            //
            // const currJoint = this.points[i];
            //
            // if (currJoint.parent) {
            //     const parentWorldQuat = new THREE.Quaternion();
            //     currJoint.parent.getWorldQuaternion(parentWorldQuat);
            //     // local quat of the curr joint = inverse of parent world rotation * new world quat
            //     finalQuat = parentWorldQuat.invert().multiply(targetQuat);
            // }

            currJoint.quaternion.copy(finalQuat);
            currJoint.updateMatrixWorld(true);
        }

        this.renderer.render(this.scene, this.camera);
    }
}
