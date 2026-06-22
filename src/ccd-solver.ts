import Visualizer from "./visualizer.ts";
import * as THREE from "three";

export default class CcdSolver extends Visualizer {
    private readonly MAX_ITER: number = 10;

    private jointToEndEffector = new THREE.Vector3();
    private jointToTarget = new THREE.Vector3();
    private jointWorldQuat = new THREE.Quaternion();

    private joints: THREE.Mesh[] = [];

    start() {
        super.setupArm(1, 0.5);

        this.joints.push(this.wristJoint);
        this.joints.push(this.midJoint);
        this.joints.push(this.baseJoint);
    }

    update() {
        super.update();
        for (let i = 0; i < this.MAX_ITER; i++) {
            const endEffectorWorldPos = new THREE.Vector3();
            this.endEffector.getWorldPosition(endEffectorWorldPos);
            // we are close enough!
            if (endEffectorWorldPos.distanceToSquared(this.target.position) < 0.001) {
                break;
            }

            for (let j = 0; j < this.joints.length; j++) {
                const currJoint = this.joints[j];
                this.endEffector.getWorldPosition(endEffectorWorldPos);
                const jointWorldPos = new THREE.Vector3();
                currJoint.getWorldPosition(jointWorldPos);

                this.jointToEndEffector =
                    new THREE.Vector3().subVectors(endEffectorWorldPos, jointWorldPos).normalize();
                this.jointToTarget =
                    new THREE.Vector3().subVectors(this.target.position, jointWorldPos).normalize();

                const deltaQuat = new THREE.Quaternion().setFromUnitVectors(
                    this.jointToEndEffector,
                    this.jointToTarget
                );

                // get the current world quaternion of the current joint
                currJoint.getWorldQuaternion(this.jointWorldQuat);
                // the new world rotation = world quat * current world rot
                // we need to apply the current world quat then the new delta rot.
                this.jointWorldQuat.premultiply(deltaQuat);

                let finalQuat = this.jointWorldQuat;

                if (currJoint.parent) {
                    const parentWorldQuat = new THREE.Quaternion();
                    currJoint.parent.getWorldQuaternion(parentWorldQuat);
                    // local quat of the curr joint = inverse of parent world rotation * new world quat
                    finalQuat = parentWorldQuat.invert().multiply(this.jointWorldQuat);
                    // currJoint.quaternion.copy(parentWorldQuat.invert().multiply(this.jointWorldQuat));
                }
                currJoint.quaternion.copy(finalQuat);

                // update the rotation immediately before the next iteration.
                currJoint.updateMatrixWorld(true);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}