import * as THREE from "three";
import {Limb, LimbType} from "./limb.ts";

export class RobotController {
    LEN = 1;
    SIDE  = 0.5;

    private bodyWidth = 1.5;
    private bodyHeight = 0.5;
    private bodyDepth = 2;

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
}