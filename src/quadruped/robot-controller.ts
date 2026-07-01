import * as THREE from "three";
import {Limb, LimbType} from "./limb.ts";

export class RobotController {
    LEN = 1;
    SIDE  = 0.5;

    // threshold to update the limb target
    STEP_THRESHOLD = 0.2;
    STEP_MULTIPLIER = 0.5;

    private bodyWidth = 2;
    private bodyHeight = 0.5;
    private bodyDepth = 3;

    private velocity = new THREE.Vector3(0, 0, 0.5);

    private body: THREE.Mesh = new THREE.Mesh();
    private limbs: Limb[] = [];
    private limbTargets: THREE.Vector3[] = [];

    constructor() {
        const bodyGeo = new THREE.BoxGeometry(
            this.bodyWidth, this.bodyHeight, this.bodyDepth);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfcba03 });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
    }

    setup() {
        this.limbs.push(Limb.create(this.body, LimbType.FRONT_LEFT,
            this.bodyWidth, this.bodyHeight, this.bodyDepth,
            this.LEN, this.SIDE));
        this.limbs.push(Limb.create(this.body, LimbType.FRONT_RIGHT,
            this.bodyWidth, this.bodyHeight, this.bodyDepth,
            this.LEN, this.SIDE));
        this.limbs.push(Limb.create(this.body, LimbType.BACK_LEFT,
            this.bodyWidth, this.bodyHeight, this.bodyDepth,
            this.LEN, this.SIDE));
        this.limbs.push(Limb.create(this.body, LimbType.BACK_RIGHT,
           this.bodyWidth, this.bodyHeight, this.bodyDepth,
            this.LEN, this.SIDE));

       // update so that we get the correct limb pos
        this.body.updateMatrixWorld(true);

        // initialize to where each EE touches.
        for (let i = 0; i < this.limbs.length; i++) {
            const worldPos = new THREE.Vector3();
            this.limbs[i].endEffectorTip.getWorldPosition(worldPos);
            this.limbTargets.push(worldPos);
        }

        return this.body;
    }

    // TODO: movement should be controlled by some other input
    update(timer: THREE.Timer) {
        this.body.position.add(this.velocity.clone().multiplyScalar(timer.getDelta()));
        this.body.updateMatrixWorld(true);

        // update the limb targets..
        for (let i=0; i<this.limbs.length; i++) {
            const limb = this.limbs[i];
            const currentTarget = this.limbTargets[i];

            // TODO: move this to limb
            const limbBaseJointWorldPos = new THREE.Vector3();
            limb.baseJoint.getWorldPosition(limbBaseJointWorldPos);

            const distX = limbBaseJointWorldPos.x - currentTarget.x;
            const distZ = limbBaseJointWorldPos.z - currentTarget.z;
            const horizontalDist = distX * distX + distZ * distZ;

            if (horizontalDist > this.STEP_THRESHOLD) {
                const newTargetX = limbBaseJointWorldPos.x + (this.velocity.x * this.STEP_MULTIPLIER);
                const newTargetZ = limbBaseJointWorldPos.z + (this.velocity.z * this.STEP_MULTIPLIER);
                const newTargetY = currentTarget.y; // for now we assume the floor is flat

                currentTarget.set(newTargetX, newTargetY, newTargetZ);
            }
        }

        for (let i=0; i<this.limbs.length; i++) {
            this.limbs[i].update(this.limbTargets[i]);
        }
    }
}