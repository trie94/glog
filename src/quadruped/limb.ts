import * as THREE from "three";

export enum LimbType {
    FRONT_LEFT,
    FRONT_RIGHT,
    BACK_LEFT,
    BACK_RIGHT
}

export class Limb {
    constructor(
        limbType: LimbType, len: number, side: number,
        baseJoint: THREE.Mesh, midJoint: THREE.Mesh, wristJoint: THREE.Mesh,
        baseBone: THREE.Mesh, midBone: THREE.Mesh, endEffector: THREE.Mesh) {
        this.limbType = limbType;
        this.len = len;
        this.side = side;

        this.baseJoint = baseJoint;
        this.midJoint = midJoint;
        this.wristJoint = wristJoint;

        this.baseBone = baseBone;
        this.midBone = midBone;
        this.endEffector = endEffector;

        // this is for computing the end effector joint
        this.endEffectorTip.geometry = new THREE.SphereGeometry(side * 0.5);
        this.endEffectorTip.name = "end effector tip";
        this.endEffectorTip.visible = false;
        this.endEffector.add(this.endEffectorTip);
        this.endEffectorTip.position.set(0, -side / 2, 0);

        this.points.push(this.endEffectorTip);
        this.points.push(this.wristJoint);
        this.points.push(this.midJoint);
        this.points.push(this.baseJoint);
    }

    private len: number = 1;
    private side: number = 1;

    // fabrik is purely position based.
    private points: THREE.Mesh[] = [];

    private limbType: LimbType = LimbType.FRONT_LEFT;

    public baseJoint: THREE.Mesh = new THREE.Mesh();
    private midJoint: THREE.Mesh = new THREE.Mesh();
    private wristJoint: THREE.Mesh = new THREE.Mesh();

    private baseBone: THREE.Mesh = new THREE.Mesh();
    private midBone: THREE.Mesh = new THREE.Mesh();
    private endEffector: THREE.Mesh = new THREE.Mesh();

    public endEffectorTip = new THREE.Mesh();

    static create(body: THREE.Mesh, limbType: LimbType,
                  bodyWidth: number, bodyHeight: number, bodyDepth: number,
                  len: number, side: number) {
        const boneGeo = new THREE.BoxGeometry(side, len, side);
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xfcba03 });
        const baseBone = new THREE.Mesh(boneGeo, boneMat);
        baseBone.name = "base bone";
        const midBone = new THREE.Mesh(boneGeo, boneMat);
        midBone.name = "mid bone";

        const endEffectorGeo = new THREE.BoxGeometry(side, side, side);
        const endEffector = new THREE.Mesh(endEffectorGeo, boneMat);
        endEffector.name = "end effector";

        const jointGeo = new THREE.SphereGeometry(side * 0.5);
        const jointMat = new THREE.MeshStandardMaterial({ color: 0x8132a8 });

        const baseJoint = new THREE.Mesh(jointGeo, jointMat);
        baseJoint.name = "base joint";
        const midJoint = new THREE.Mesh(jointGeo, jointMat);
        midJoint.name = "mid joint";
        const wristJoint = new THREE.Mesh(jointGeo, jointMat);
        wristJoint.name = "wrist joint";

        // we are building the skeleton chain:
        // body -> baseJoint -> baseBone -> midJoint -> midBone -> wristJoint -> endEffector
        body.add(baseJoint);
        baseJoint.add(baseBone);
        baseBone.add(midJoint);
        midJoint.add(midBone);
        midBone.add(wristJoint);
        wristJoint.add(endEffector);

        // 1. mount the base joints directly onto the body corners
        switch (limbType) {
            case LimbType.FRONT_LEFT:
                baseJoint.position.set(bodyWidth / 2, -bodyHeight / 2, bodyDepth / 2);
                break;

            case LimbType.FRONT_RIGHT:
                baseJoint.position.set(-bodyWidth / 2, -bodyHeight / 2, bodyDepth / 2);
                break;

            case LimbType.BACK_LEFT:
                baseJoint.position.set(bodyWidth / 2, -bodyHeight / 2, -bodyDepth / 2);
                break;

            case LimbType.BACK_RIGHT:
                baseJoint.position.set(-bodyWidth / 2, -bodyHeight / 2, -bodyDepth / 2);
                break;
        }

        // 2. local seg chain
        // upper Leg segment
        baseBone.position.set(0, -len / 2, 0);
        midJoint.position.set(0, -len / 2, 0);

        // lower Leg segment
        midBone.position.set(0, -len / 2, 0);
        wristJoint.position.set(0, -len / 2, 0);

        // foot segment
        endEffector.position.set(0, -side / 2, 0);

        return new Limb(limbType, len, side,
            baseJoint, midJoint, wristJoint,
            baseBone, midBone, endEffector);
    }

    update(target: THREE.Vector3) {
        // get the current base joint pos from FK.
        const currentBaseJointWorldPos = new THREE.Vector3();
        this.baseJoint.getWorldPosition(currentBaseJointWorldPos);

        // convert all the points in world space
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
                targetWorldPositions.push(target.clone());
            } else {
                // the current joint pos in world, not yet updated.
                const currOldPos = currentWorldPositions[i];
                // the prev joint pos in world, that has already been updated.
                const prevNewPos = targetWorldPositions[i - 1];
                // get curr to next dir and find the new pos for the current joint.
                const dir = new THREE.Vector3().subVectors(currOldPos, prevNewPos).normalize();
                // check the length (wrist and end effector)
                const originalLen = i == 1 ? this.side : this.len;
                const newPos = prevNewPos.clone().add(dir.multiplyScalar(originalLen));
                targetWorldPositions.push(newPos);
            }
        }

        // 2. forward pass, fix the target positions
        let finalWorldPositions: THREE.Vector3[] = new Array(targetWorldPositions.length);
        for (let i = targetWorldPositions.length - 1; i >= 0; i--) {
            if (i == targetWorldPositions.length - 1) { // base
                finalWorldPositions[i] = currentBaseJointWorldPos.clone();
            } else {
                const currOldTargetPos = targetWorldPositions[i];
                const prevNewTargetPos = finalWorldPositions[i + 1];
                // get curr to prev and find the new pos for the current joint.
                const dir = new THREE.Vector3().subVectors(currOldTargetPos, prevNewTargetPos).normalize();
                // check the length (wrist and end effector)
                const originalLen = i == 0 ? this.side : this.len;
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

            currJoint.quaternion.copy(finalQuat);
            currJoint.updateMatrixWorld(true);
        }
    }
}